'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { executeStoragePurge } from '@/lib/maintenance/purge-service';
import { ApiResponse, PurgeResult, CleanupLog } from '@/types/database';

/**
 * Verify that current user is an Admin before running maintenance actions.
 */
async function verifyAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return false;

    const adminSupabase = createAdminClient();
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('role, status')
      .eq('id', user.id)
      .single();

    return profile?.role === 'admin' && profile?.status === 'active';
  } catch {
    return false;
  }
}

/**
 * Server Action: On-demand manual storage purge triggered by Admin.
 */
export async function runStorageCleanupAction(): Promise<ApiResponse<PurgeResult>> {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return { success: false, error: 'Unauthorized: Admin privileges required.' };
  }

  try {
    const result = await executeStoragePurge('admin_manual');
    return {
      success: true,
      data: result,
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Purge action failed.',
    };
  }
}

/**
 * Server Action: Get pending purge statistics (expired & revoked shares waiting to be purged).
 */
export async function getPendingPurgeStatsAction(): Promise<
  ApiResponse<{ pendingSharesCount: number; pendingEstimatedBytes: number }>
> {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return { success: false, error: 'Unauthorized.', data: { pendingSharesCount: 0, pendingEstimatedBytes: 0 } };
  }

  try {
    const adminSupabase = createAdminClient();
    const nowIso = new Date().toISOString();

    const { data: pendingShares, error } = await adminSupabase
      .from('shares')
      .select('file_size')
      .or(`expires_at.lte.${nowIso},revoked.eq.true,consumed.eq.true`);

    if (error) {
      return { success: false, error: error.message, data: { pendingSharesCount: 0, pendingEstimatedBytes: 0 } };
    }

    const count = pendingShares?.length || 0;
    const bytes = (pendingShares || []).reduce((acc, s) => acc + (s.file_size || 0), 0);

    return {
      success: true,
      data: {
        pendingSharesCount: count,
        pendingEstimatedBytes: bytes,
      },
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch pending stats.',
      data: { pendingSharesCount: 0, pendingEstimatedBytes: 0 },
    };
  }
}

/**
 * Server Action: Fetch maintenance history logs.
 */
export async function getMaintenanceLogsAction(): Promise<ApiResponse<CleanupLog[]>> {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return { success: false, error: 'Unauthorized.', data: [] };
  }

  try {
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
      .from('cleanup_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) {
      // Table might not exist yet if migration hasn't run
      return { success: true, data: [] };
    }

    return { success: true, data: data || [] };
  } catch {
    return { success: true, data: [] };
  }
}
