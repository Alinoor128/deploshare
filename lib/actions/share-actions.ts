'use server';

import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateUniqueShareCode } from '@/lib/security/code-generator';
import { hashPassword } from '@/lib/security/passwords';
import { validateAndSanitizeFile } from '@/lib/security/file-guard';
import { BRAND_CONFIG } from '@/lib/config/brand';
import { Share, ApiResponse } from '@/types/database';
import crypto from 'crypto';

export interface CreateShareInput {
  type: 'file' | 'text';
  title?: string;
  textContent?: string;
  password?: string;
  expirySeconds: number;
  maxDownloads?: number | null;
  burnAfterDownload?: boolean;
  allowDownload?: boolean;
}

/**
 * Server Action: Create a new Share (File or Text) with guaranteed unique 6-digit code.
 */
export async function createShareAction(
  formData: FormData
): Promise<ApiResponse<{ shareCode: string; shareId: string; expiresAt: string }>> {
  try {
    const supabaseServer = await createServerSupabase();
    const adminSupabase = createAdminClient();

    // Check if user is logged in
    const {
      data: { user },
    } = await supabaseServer.auth.getUser();

    const type = (formData.get('type') as 'file' | 'text') || 'file';
    const title = (formData.get('title') as string) || null;
    const textContent = (formData.get('textContent') as string) || null;
    const password = (formData.get('password') as string) || null;
    const expirySeconds = parseInt(
      (formData.get('expirySeconds') as string) || '86400',
      10
    );
    const maxDownloadsRaw = formData.get('maxDownloads') as string;
    const maxDownloads =
      maxDownloadsRaw && maxDownloadsRaw !== 'unlimited'
        ? parseInt(maxDownloadsRaw, 10)
        : null;
    const burnAfterDownload = formData.get('burnAfterDownload') === 'true';
    const allowDownload = formData.get('allowDownload') !== 'false';

    // Calculate expiry timestamp
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expirySeconds * 1000).toISOString();

    // Generate unique 6-digit code
    const shareCode = await generateUniqueShareCode();

    // Hash password if provided
    let passwordHash: string | null = null;
    if (password && password.trim().length > 0) {
      passwordHash = await hashPassword(password);
    }

    let storagePath: string | null = null;
    let fileName: string | null = null;
    let fileSize: number | null = null;
    let mimeType: string | null = null;

    if (type === 'file') {
      const file = formData.get('file') as File | null;
      if (!file || file.size === 0) {
        return { success: false, error: 'Please select a file to upload.' };
      }

      // Max size check based on user status
      const maxLimitBytes = user
        ? BRAND_CONFIG.maxFreeUserFileSizeMB * 1024 * 1024
        : BRAND_CONFIG.maxAnonymousFileSizeMB * 1024 * 1024;

      const fileValidation = validateAndSanitizeFile(
        file.name,
        file.size,
        file.type,
        maxLimitBytes
      );

      if (!fileValidation.valid) {
        return { success: false, error: fileValidation.error || 'Invalid file.' };
      }

      fileName = fileValidation.sanitizedFileName;
      fileSize = file.size;
      mimeType = fileValidation.mimeType;

      const shareId = crypto.randomUUID();
      const ownerFolder = user ? user.id : 'anon';
      storagePath = `${ownerFolder}/${shareId}/${fileValidation.storageFileName}`;

      // Upload file buffer to Supabase private storage
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      let { error: uploadError } = await adminSupabase.storage
        .from('shares')
        .upload(storagePath, buffer, {
          contentType: mimeType,
          upsert: true,
        });

      // If bucket doesn't exist, auto-create private bucket 'shares' and retry
      if (uploadError && (uploadError.message?.toLowerCase().includes('bucket not found') || uploadError.message?.toLowerCase().includes('does not exist'))) {
        try {
          await adminSupabase.storage.createBucket('shares', {
            public: false,
            fileSizeLimit: 2147483648, // 2GB
          });

          const retryResult = await adminSupabase.storage
            .from('shares')
            .upload(storagePath, buffer, {
              contentType: mimeType,
              upsert: true,
            });
          uploadError = retryResult.error;
        } catch (createErr) {
          console.warn('Auto bucket creation attempt failed:', createErr);
        }
      }

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        return {
          success: false,
          error: `Storage upload failed: ${uploadError.message || 'Bucket error'}. Please ensure the 'shares' bucket exists in Supabase Storage.`,
        };
      }

      // Insert record in shares table
      const { data: insertedShare, error: dbError } = await adminSupabase
        .from('shares')
        .insert({
          id: shareId,
          owner_id: user ? user.id : null,
          share_code: shareCode,
          title: title || fileName,
          type: 'file',
          storage_path: storagePath,
          file_name: fileName,
          file_size: fileSize,
          mime_type: mimeType,
          password_hash: passwordHash,
          expires_at: expiresAt,
          max_downloads: maxDownloads,
          burn_after_download: burnAfterDownload,
          allow_download: allowDownload,
        })
        .select()
        .single();

      if (dbError) {
        console.error('DB share insertion error:', dbError);
        return {
          success: false,
          error: 'Failed to create share record. Please try again.',
        };
      }

      return {
        success: true,
        data: {
          shareCode,
          shareId: insertedShare.id,
          expiresAt,
        },
      };
    } else {
      // Text Share
      if (!textContent || textContent.trim().length === 0) {
        return { success: false, error: 'Please enter text content to share.' };
      }

      const shareId = crypto.randomUUID();

      const { data: insertedShare, error: dbError } = await adminSupabase
        .from('shares')
        .insert({
          id: shareId,
          owner_id: user ? user.id : null,
          share_code: shareCode,
          title: title || 'Text Snippet',
          type: 'text',
          text_content: textContent,
          password_hash: passwordHash,
          expires_at: expiresAt,
          max_downloads: maxDownloads,
          burn_after_download: burnAfterDownload,
          allow_download: true,
        })
        .select()
        .single();

      if (dbError) {
        console.error('DB text share insertion error:', dbError);
        return {
          success: false,
          error: 'Failed to create text share record. Please try again.',
        };
      }

      return {
        success: true,
        data: {
          shareCode,
          shareId: insertedShare.id,
          expiresAt,
        },
      };
    }
  } catch (error: unknown) {
    console.error('Create share action exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred while creating share.',
    };
  }
}

/**
 * Server Action: Revoke an active share immediately.
 */
export async function revokeShareAction(shareId: string): Promise<ApiResponse> {
  try {
    const supabase = await createServerSupabase();
    const adminSupabase = createAdminClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Authentication required.' };
    }

    // Verify ownership or admin
    const { data: share } = await adminSupabase
      .from('shares')
      .select('owner_id')
      .eq('id', shareId)
      .single();

    if (!share) {
      return { success: false, error: 'Share not found.' };
    }

    // Check admin role
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin';
    if (share.owner_id !== user.id && !isAdmin) {
      return { success: false, error: 'Permission denied.' };
    }

    const { error } = await adminSupabase
      .from('shares')
      .update({ revoked: true, updated_at: new Date().toISOString() })
      .eq('id', shareId);

    if (error) {
      return { success: false, error: 'Failed to revoke share.' };
    }

    // Record revoke event
    await adminSupabase.from('share_events').insert({
      share_id: shareId,
      event_type: 'revoke',
    });

    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to revoke share.' };
  }
}

/**
 * Server Action: Delete a share and its storage file permanently.
 */
export async function deleteShareAction(shareId: string): Promise<ApiResponse> {
  try {
    const supabase = await createServerSupabase();
    const adminSupabase = createAdminClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Authentication required.' };
    }

    const { data: share } = await adminSupabase
      .from('shares')
      .select('*')
      .eq('id', shareId)
      .single();

    if (!share) {
      return { success: false, error: 'Share not found.' };
    }

    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin';
    if (share.owner_id !== user.id && !isAdmin) {
      return { success: false, error: 'Permission denied.' };
    }

    // Delete storage file if exists
    if (share.storage_path) {
      await adminSupabase.storage.from('shares').remove([share.storage_path]);
    }

    // Delete DB record
    const { error } = await adminSupabase.from('shares').delete().eq('id', shareId);

    if (error) {
      return { success: false, error: 'Failed to delete share.' };
    }

    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete share.' };
  }
}

/**
 * Server Action: Fetch user's own shares for Dashboard.
 */
export async function getUserSharesAction(): Promise<ApiResponse<Share[]>> {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Authentication required.', data: [] };
    }

    const { data: shares, error } = await supabase
      .from('shares')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message, data: [] };
    }

    return { success: true, data: shares || [] };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to retrieve shares.', data: [] };
  }
}
