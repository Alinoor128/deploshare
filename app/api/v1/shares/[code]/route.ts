import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { authenticateApiKey } from '@/lib/security/api-key';
import { verifyPassword } from '@/lib/security/passwords';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/shares/[code]
 * Retrieve share metadata and content by 6-digit numeric PIN.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const cleanCode = (code || '').trim();

    if (!/^[0-9]{6}$/.test(cleanCode)) {
      return NextResponse.json(
        { success: false, error: 'Invalid share code. Must be exactly 6 digits.' },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();
    const { data: share, error } = await adminSupabase
      .from('shares')
      .select('*')
      .eq('share_code', cleanCode)
      .maybeSingle();

    if (error || !share) {
      return NextResponse.json(
        { success: false, error: 'Share not found or has expired.' },
        { status: 404 }
      );
    }

    // Check expiration
    if (new Date(share.expires_at).getTime() <= Date.now() || share.revoked || share.consumed) {
      return NextResponse.json(
        { success: false, error: 'This share has expired or been revoked.' },
        { status: 410 }
      );
    }

    // Check download limit
    if (share.max_downloads && share.download_count >= share.max_downloads) {
      return NextResponse.json(
        { success: false, error: 'Maximum download limit reached for this share.' },
        { status: 410 }
      );
    }

    // Check password if protected
    if (share.password_hash) {
      const passwordHeader = req.headers.get('x-share-password') || req.nextUrl.searchParams.get('password');
      if (!passwordHeader) {
        return NextResponse.json(
          {
            success: false,
            requiresPassword: true,
            message: 'This share is protected by password. Provide via x-share-password header or ?password= parameter.',
            data: {
              shareCode: share.share_code,
              type: share.type,
              title: share.title,
              expiresAt: share.expires_at,
              isPasswordProtected: true,
            },
          },
          { status: 401 }
        );
      }

      const isValidPassword = await verifyPassword(passwordHeader, share.password_hash);
      if (!isValidPassword) {
        return NextResponse.json(
          { success: false, requiresPassword: true, error: 'Incorrect share password.' },
          { status: 403 }
        );
      }
    }

    // Increment view count asynchronously
    adminSupabase
      .from('shares')
      .update({ view_count: share.view_count + 1 })
      .eq('id', share.id)
      .then(() => {});

    return NextResponse.json({
      success: true,
      data: {
        shareCode: share.share_code,
        type: share.type,
        title: share.title,
        textContent: share.type === 'text' ? share.text_content : null,
        fileName: share.file_name,
        fileSize: share.file_size,
        mimeType: share.mime_type,
        allowDownload: share.allow_download,
        burnAfterDownload: share.burn_after_download,
        downloadCount: share.download_count,
        maxDownloads: share.max_downloads,
        expiresAt: share.expires_at,
        isPasswordProtected: Boolean(share.password_hash),
        downloadUrl: share.type === 'file' && share.allow_download
          ? `https://deploshare.com/api/v1/shares/${share.share_code}/download`
          : null,
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to retrieve share.';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

/**
 * DELETE /api/v1/shares/[code]
 * Revoke/delete a share by 6-digit code (must be owner).
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { user, error: authError } = await authenticateApiKey(req.headers);
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: authError || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { code } = await params;
    const cleanCode = (code || '').trim();
    const adminSupabase = createAdminClient();

    const { data: share, error } = await adminSupabase
      .from('shares')
      .select('*')
      .eq('share_code', cleanCode)
      .maybeSingle();

    if (error || !share) {
      return NextResponse.json({ success: false, error: 'Share not found.' }, { status: 404 });
    }

    // Verify ownership or admin role
    if (share.owner_id !== user.userId && user.profile.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You do not own this share.' },
        { status: 403 }
      );
    }

    // If storage file exists, remove it
    if (share.storage_path) {
      await adminSupabase.storage.from('shares').remove([share.storage_path]);
    }

    // Mark revoked or delete
    await adminSupabase
      .from('shares')
      .update({ revoked: true })
      .eq('id', share.id);

    return NextResponse.json({
      success: true,
      message: `Share code ${cleanCode} has been successfully revoked.`,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to revoke share.';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
