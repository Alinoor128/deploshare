'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ApiResponse, ReportReason } from '@/types/database';

/**
 * Server Action: Submit a report for a share code.
 */
export async function reportShareAction(
  shareCode: string,
  reason: ReportReason,
  description?: string
): Promise<ApiResponse> {
  try {
    const cleanCode = shareCode ? shareCode.trim() : '';
    if (!cleanCode) {
      return { success: false, error: 'Share code is required.' };
    }

    const adminSupabase = createAdminClient();
    const serverSupabase = await createClient();

    // Check if user is logged in
    const {
      data: { user },
    } = await serverSupabase.auth.getUser();

    // Find share id
    const { data: share } = await adminSupabase
      .from('shares')
      .select('id')
      .eq('share_code', cleanCode)
      .single();

    if (!share) {
      return { success: false, error: 'Share not found or unavailable.' };
    }

    const { error } = await adminSupabase.from('reports').insert({
      share_id: share.id,
      reporter_id: user ? user.id : null,
      reason,
      description: description ? description.slice(0, 1000) : null,
      status: 'pending',
    });

    if (error) {
      return { success: false, error: 'Failed to submit report.' };
    }

    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to submit report.' };
  }
}
