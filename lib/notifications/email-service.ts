import { createAdminClient } from '@/lib/supabase/admin';

export interface DownloadNotificationParams {
  shareId: string;
  shareCode: string;
  fileName: string;
  ownerId: string | null;
  clientIp: string;
  downloadCount: number;
  maxDownloads: number | null;
}

/**
 * Sends a transactional email notification to the share creator upon successful download.
 */
export async function sendCreatorDownloadAlert(params: DownloadNotificationParams): Promise<boolean> {
  if (!params.ownerId || params.ownerId === 'anon') {
    return false; // Anonymous share, no owner email
  }

  try {
    const adminSupabase = createAdminClient();

    // 1. Fetch owner email via Supabase Auth Admin API
    const { data: userData, error: userError } = await adminSupabase.auth.admin.getUserById(
      params.ownerId
    );

    if (userError || !userData?.user?.email) {
      return false;
    }

    const ownerEmail = userData.user.email;
    const nowFormatted = new Date().toLocaleString();

    // Log the notification event
    await adminSupabase.from('share_events').insert({
      share_id: params.shareId,
      event_type: 'download',
    });

    const resendApiKey = process.env.RESEND_API_KEY;

    if (resendApiKey) {
      // Send real email via Resend API if configured
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'DeploShare Alerts <notifications@deploshare.com>',
          to: [ownerEmail],
          subject: `📥 [DeploShare] Your share "${params.fileName}" was downloaded`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
              <h2 style="color: #0f172a; margin-top: 0; font-size: 20px;">Share Downloaded Successfully</h2>
              <p style="color: #475569; font-size: 14px; line-height: 1.5;">
                Someone just accessed and downloaded your ephemeral file using your 6-digit PIN.
              </p>
              <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 16px; margin: 20px 0;">
                <p style="margin: 4px 0; font-size: 13px; color: #334155;"><strong>File / Title:</strong> ${params.fileName}</p>
                <p style="margin: 4px 0; font-size: 13px; color: #334155;"><strong>6-Digit PIN:</strong> <span style="font-family: monospace; font-weight: bold; color: #2563eb;">${params.shareCode}</span></p>
                <p style="margin: 4px 0; font-size: 13px; color: #334155;"><strong>Timestamp:</strong> ${nowFormatted}</p>
                <p style="margin: 4px 0; font-size: 13px; color: #334155;"><strong>Recipient IP:</strong> ${params.clientIp}</p>
                <p style="margin: 4px 0; font-size: 13px; color: #334155;"><strong>Total Downloads:</strong> ${params.downloadCount} ${params.maxDownloads ? `/ ${params.maxDownloads}` : ''}</p>
              </div>
              <p style="color: #94a3b8; font-size: 12px; margin-bottom: 0;">
                Sent automatically by DeploShare Zero-Log Protocol.
              </p>
            </div>
          `,
        }),
      });
    }

    return true;
  } catch (err) {
    console.error('Failed to dispatch creator download alert:', err);
    return false;
  }
}
