import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/security/api-key';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateUniqueShareCode } from '@/lib/security/code-generator';
import { hashPassword } from '@/lib/security/passwords';
import { validateAndSanitizeFile } from '@/lib/security/file-guard';
import { escapeHtml } from '@/lib/security/sanitizer';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * POST /api/v1/shares
 * Creates a new temporary file or text share and returns a 6-digit numeric PIN.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate Developer API Key
    const { user, error: authError } = await authenticateApiKey(req.headers);
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: authError || 'Unauthorized' },
        { status: 401 }
      );
    }

    const contentType = req.headers.get('content-type') || '';
    const adminSupabase = createAdminClient();

    let shareType: 'file' | 'text' = 'text';
    let textContent: string | null = null;
    let title: string | null = null;
    let fileName: string | null = null;
    let fileSize: number | null = null;
    let mimeType: string | null = null;
    let storagePath: string | null = null;
    let expirySeconds = 86400; // 24h default
    let password: string | null = null;
    let maxDownloads: number | null = null;
    let burnAfterDownload = false;
    let allowDownload = true;

    // Handle Multipart Form Data (File Upload)
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      title = (formData.get('title') as string) || null;
      textContent = (formData.get('textContent') as string) || null;
      const expiryStr = formData.get('expirySeconds') as string;
      if (expiryStr) expirySeconds = parseInt(expiryStr, 10);
      password = (formData.get('password') as string) || null;
      const maxDlStr = formData.get('maxDownloads') as string;
      if (maxDlStr) maxDownloads = parseInt(maxDlStr, 10);
      burnAfterDownload = formData.get('burnAfterDownload') === 'true';
      if (formData.has('allowDownload')) {
        allowDownload = formData.get('allowDownload') !== 'false';
      }

      if (file && file.size > 0) {
        shareType = 'file';
        fileName = file.name;
        fileSize = file.size;
        mimeType = file.type || 'application/octet-stream';

        // Check file validity & dangerous extensions
        const validation = validateAndSanitizeFile(file.name, file.size, mimeType);
        if (!validation.valid) {
          return NextResponse.json(
            { success: false, error: validation.error || 'Invalid file uploaded.' },
            { status: 400 }
          );
        }

        // Upload file to Supabase Storage
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        storagePath = `${user.userId}/${validation.storageFileName}`;

        const { error: uploadError } = await adminSupabase.storage
          .from('shares')
          .upload(storagePath, fileBuffer, {
            contentType: mimeType,
            upsert: true,
          });

        if (uploadError) {
          return NextResponse.json(
            { success: false, error: `Storage upload failed: ${uploadError.message}` },
            { status: 500 }
          );
        }
      } else if (textContent) {
        shareType = 'text';
        textContent = escapeHtml(textContent);
      } else {
        return NextResponse.json(
          { success: false, error: 'Either "file" or "textContent" must be provided.' },
          { status: 400 }
        );
      }
    } else {
      // JSON Payload (Text Share)
      const body = await req.json();
      shareType = 'text';
      title = body.title || null;
      textContent = escapeHtml(body.textContent || body.text || '');
      if (body.expirySeconds) expirySeconds = parseInt(body.expirySeconds, 10);
      password = body.password || null;
      if (body.maxDownloads) maxDownloads = parseInt(body.maxDownloads, 10);
      burnAfterDownload = Boolean(body.burnAfterDownload);
      if (typeof body.allowDownload === 'boolean') allowDownload = body.allowDownload;

      if (!textContent) {
        return NextResponse.json(
          { success: false, error: '"textContent" cannot be empty.' },
          { status: 400 }
        );
      }
    }

    // 2. Hash Password if provided
    let passwordHash: string | null = null;
    if (password && password.trim().length > 0) {
      passwordHash = await hashPassword(password.trim());
    }

    // 3. Generate Unique 6-Digit Code
    const shareCode = await generateUniqueShareCode();
    const expiresAt = new Date(Date.now() + expirySeconds * 1000).toISOString();

    // 4. Save Share record
    const { data: newShare, error: insertError } = await adminSupabase
      .from('shares')
      .insert({
        owner_id: user.userId,
        share_code: shareCode,
        title: title || (fileName ? fileName : 'API Text Share'),
        type: shareType,
        storage_path: storagePath,
        text_content: textContent,
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

    if (insertError || !newShare) {
      return NextResponse.json(
        { success: false, error: insertError?.message || 'Failed to create share.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Share created successfully.',
        data: {
          shareCode: newShare.share_code,
          shareId: newShare.id,
          type: newShare.type,
          title: newShare.title,
          fileName: newShare.file_name,
          fileSize: newShare.file_size,
          expiresAt: newShare.expires_at,
          maxDownloads: newShare.max_downloads,
          burnAfterDownload: newShare.burn_after_download,
          isPasswordProtected: Boolean(passwordHash),
          accessUrl: `https://deploshare.com/access/${newShare.share_code}`,
        },
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'API creation failed.';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

/**
 * GET /api/v1/shares
 * Lists shares created by the authenticated API key user.
 */
export async function GET(req: NextRequest) {
  try {
    const { user, error: authError } = await authenticateApiKey(req.headers);
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: authError || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const offset = (page - 1) * limit;

    const adminSupabase = createAdminClient();
    const { data: shares, count, error } = await adminSupabase
      .from('shares')
      .select('*', { count: 'exact' })
      .eq('owner_id', user.userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: shares || [],
      pagination: {
        page,
        limit,
        total: count || 0,
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to list shares.';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
