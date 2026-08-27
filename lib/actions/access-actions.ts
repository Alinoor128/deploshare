'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from '@/lib/security/rate-limiter';
import { isValid6DigitCode } from '@/lib/security/code-generator';
import { verifyPassword } from '@/lib/security/passwords';
import { isSafePreviewableMime } from '@/lib/security/file-guard';
import { SharePublicView, ApiResponse } from '@/types/database';
import { headers } from 'next/headers';

const GENERIC_ERROR_MESSAGE = 'Invalid or unavailable share code.';

/**
 * Helper to get client IP for brute force protection.
 */
async function getClientIp(): Promise<string> {
  try {
    const headersList = await headers();
    const forwardedFor = headersList.get('x-forwarded-for');
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }
    return headersList.get('x-real-ip') || '127.0.0.1';
  } catch {
    return '127.0.0.1';
  }
}

/**
 * Server Action: Access a share by its 6-digit numeric code.
 */
export async function accessShareByCodeAction(
  code: string,
  password?: string
): Promise<ApiResponse<SharePublicView>> {
  try {
    const ip = await getClientIp();
    const rateLimitKey = `code_access_${ip}`;

    // 1. Rate Limit & Brute-Force Check
    const rateLimit = await checkRateLimit(rateLimitKey);
    if (!rateLimit.allowed) {
      const minutesRemaining = rateLimit.lockedUntil
        ? Math.ceil((rateLimit.lockedUntil.getTime() - Date.now()) / (60 * 1000))
        : 15;
      return {
        success: false,
        error: `Too many failed attempts. Please try again in ${minutesRemaining} minutes.`,
      };
    }

    // Apply progressive delay to thwart automated brute-force attacks
    if (rateLimit.progressiveDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, rateLimit.progressiveDelayMs));
    }

    // 2. Validate Code Format (must be strictly 6 digits)
    const cleanCode = code ? code.trim() : '';
    if (!isValid6DigitCode(cleanCode)) {
      await recordFailedAttempt(rateLimitKey);
      return { success: false, error: GENERIC_ERROR_MESSAGE };
    }

    const adminSupabase = createAdminClient();

    // 3. Query Database
    const { data: share, error } = await adminSupabase
      .from('shares')
      .select('*')
      .eq('share_code', cleanCode)
      .single();

    if (error || !share) {
      await recordFailedAttempt(rateLimitKey);
      return { success: false, error: GENERIC_ERROR_MESSAGE };
    }

    // 4. Check Status (Revoked, Consumed, Expired, Max Downloads)
    const now = new Date();
    const isExpired = new Date(share.expires_at).getTime() <= now.getTime();
    const isMaxDownloadsReached =
      share.max_downloads !== null && share.download_count >= share.max_downloads;

    if (share.revoked || share.consumed || isExpired || isMaxDownloadsReached) {
      await recordFailedAttempt(rateLimitKey);
      return { success: false, error: GENERIC_ERROR_MESSAGE };
    }

    // 5. Password Protection Handling
    const isPasswordProtected = Boolean(
      share.password_hash && share.password_hash.length > 0
    );

    if (isPasswordProtected) {
      if (!password || password.trim().length === 0) {
        // Return prompt for password without exposing content or password hash
        return {
          success: true,
          requiresPassword: true,
          data: {
            id: share.id,
            share_code: share.share_code,
            title: share.title,
            type: share.type,
            file_name: share.file_name,
            file_size: share.file_size,
            mime_type: share.mime_type,
            text_content: null,
            expires_at: share.expires_at,
            max_downloads: share.max_downloads,
            download_count: share.download_count,
            burn_after_download: share.burn_after_download,
            allow_download: share.allow_download,
            created_at: share.created_at,
            is_password_protected: true,
          },
        };
      }

      // Verify Password
      const isValidPass = await verifyPassword(password, share.password_hash!);
      if (!isValidPass) {
        await recordFailedAttempt(rateLimitKey);
        await adminSupabase.from('share_events').insert({
          share_id: share.id,
          event_type: 'password_failure',
        });
        return { success: false, error: 'Incorrect password entered.' };
      }

      await adminSupabase.from('share_events').insert({
        share_id: share.id,
        event_type: 'password_success',
      });
    }

    // Reset rate limit upon successful access
    await resetRateLimit(rateLimitKey);

    // 6. Increment View Count
    await adminSupabase.rpc('increment_share_view', { p_share_id: share.id });

    // 7. Generate safe preview URL if applicable (images, pdfs)
    let previewUrl: string | null = null;
    if (share.type === 'file' && share.storage_path) {
      const isPreviewable = isSafePreviewableMime(share.mime_type);
      if (isPreviewable) {
        const { data: signedData } = await adminSupabase.storage
          .from('shares')
          .createSignedUrl(share.storage_path, 300); // 5 min preview window
        previewUrl = signedData?.signedUrl || null;
      }
    }

    const publicView: SharePublicView = {
      id: share.id,
      share_code: share.share_code,
      title: share.title,
      type: share.type,
      file_name: share.file_name,
      file_size: share.file_size,
      mime_type: share.mime_type,
      text_content: share.text_content,
      expires_at: share.expires_at,
      max_downloads: share.max_downloads,
      download_count: share.download_count,
      burn_after_download: share.burn_after_download,
      allow_download: share.allow_download,
      created_at: share.created_at,
      is_password_protected: isPasswordProtected,
      preview_url: previewUrl,
    };

    return {
      success: true,
      data: publicView,
    };
  } catch (error: unknown) {
    console.error('Access share action error:', error);
    return { success: false, error: GENERIC_ERROR_MESSAGE };
  }
}

/**
 * Server Action: Secure Download Dispenser.
 * Verifies constraints, atomically increments download count / burns share, and dispenses short-lived signed URL.
 */
export async function getSecureDownloadUrlAction(
  code: string,
  password?: string
): Promise<ApiResponse<{ downloadUrl: string; remainingDownloads: number | null; burned: boolean }>> {
  try {
    const cleanCode = code ? code.trim() : '';
    if (!isValid6DigitCode(cleanCode)) {
      return { success: false, error: GENERIC_ERROR_MESSAGE };
    }

    const adminSupabase = createAdminClient();

    // Query share
    const { data: share, error } = await adminSupabase
      .from('shares')
      .select('*')
      .eq('share_code', cleanCode)
      .single();

    if (error || !share || !share.storage_path) {
      return { success: false, error: GENERIC_ERROR_MESSAGE };
    }

    // Check allow download option
    if (!share.allow_download) {
      return { success: false, error: 'Downloads are disabled for this share.' };
    }

    // Check active constraints
    const now = new Date();
    if (
      share.revoked ||
      share.consumed ||
      new Date(share.expires_at).getTime() <= now.getTime()
    ) {
      return { success: false, error: GENERIC_ERROR_MESSAGE };
    }

    // Check password if required
    if (share.password_hash) {
      if (!password || !(await verifyPassword(password, share.password_hash))) {
        return { success: false, error: 'Password required to download this file.' };
      }
    }

    // Call atomic download consumption
    const { data: atomicResult, error: rpcError } = await adminSupabase.rpc(
      'atomic_consume_download',
      { p_share_id: share.id }
    );

    if (rpcError || (atomicResult && !atomicResult.success)) {
      return {
        success: false,
        error: atomicResult?.error || 'Download limit reached or unavailable.',
      };
    }

    // Generate short-lived signed download URL (valid for 60 seconds) with Content-Disposition
    const { data: signedData, error: signedError } = await adminSupabase.storage
      .from('shares')
      .createSignedUrl(share.storage_path, 60, {
        download: share.file_name || 'download',
      });

    if (signedError || !signedData?.signedUrl) {
      return { success: false, error: 'Failed to generate secure download link.' };
    }

    const remaining =
      share.max_downloads !== null
        ? Math.max(0, share.max_downloads - (share.download_count + 1))
        : null;

    return {
      success: true,
      data: {
        downloadUrl: signedData.signedUrl,
        remainingDownloads: remaining,
        burned: share.burn_after_download || remaining === 0,
      },
    };
  } catch (error: unknown) {
    console.error('Download dispenser exception:', error);
    return { success: false, error: 'Failed to process download request.' };
  }
}
