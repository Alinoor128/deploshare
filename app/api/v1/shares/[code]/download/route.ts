import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyPassword } from '@/lib/security/passwords';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/shares/[code]/download
 * Securely downloads file associated with 6-digit code.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const cleanCode = (code || '').trim();

    const adminSupabase = createAdminClient();
    const { data: share, error } = await adminSupabase
      .from('shares')
      .select('*')
      .eq('share_code', cleanCode)
      .maybeSingle();

    if (error || !share || !share.storage_path) {
      return NextResponse.json(
        { success: false, error: 'File share not found or no file attached.' },
        { status: 404 }
      );
    }

    if (new Date(share.expires_at).getTime() <= Date.now() || share.revoked || share.consumed) {
      return NextResponse.json(
        { success: false, error: 'Share has expired or been burned.' },
        { status: 410 }
      );
    }

    if (!share.allow_download) {
      return NextResponse.json(
        { success: false, error: 'Downloads have been disabled for this share.' },
        { status: 403 }
      );
    }

    // Password validation
    if (share.password_hash) {
      const password =
        req.headers.get('x-share-password') || req.nextUrl.searchParams.get('password');
      if (!password) {
        return NextResponse.json(
          { success: false, error: 'Password required to download this file.' },
          { status: 401 }
        );
      }

      const valid = await verifyPassword(password, share.password_hash);
      if (!valid) {
        return NextResponse.json(
          { success: false, error: 'Incorrect password.' },
          { status: 403 }
        );
      }
    }

    // Generate ephemeral signed URL valid for 60 seconds
    const { data: signedData, error: signError } = await adminSupabase.storage
      .from('shares')
      .createSignedUrl(share.storage_path, 60, {
        download: share.file_name || 'download',
      });

    if (signError || !signedData?.signedUrl) {
      return NextResponse.json(
        { success: false, error: 'Failed to generate secure download stream.' },
        { status: 500 }
      );
    }

    // Increment download count and handle burn mode
    const newDownloadCount = share.download_count + 1;
    const shouldBurn =
      share.burn_after_download ||
      (share.max_downloads && newDownloadCount >= share.max_downloads);

    await adminSupabase
      .from('shares')
      .update({
        download_count: newDownloadCount,
        consumed: Boolean(shouldBurn),
      })
      .eq('id', share.id);

    // If client requested JSON download URL
    if (req.headers.get('accept')?.includes('application/json')) {
      return NextResponse.json({
        success: true,
        downloadUrl: signedData.signedUrl,
        fileName: share.file_name,
        fileSize: share.file_size,
        expiresInSeconds: 60,
      });
    }

    // Otherwise redirect browser to download stream directly
    return NextResponse.redirect(signedData.signedUrl);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Download failed.';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
