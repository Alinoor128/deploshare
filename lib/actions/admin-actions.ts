'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ApiResponse, Profile, Share, Report } from '@/types/database';

/**
 * Verify that the current session belongs to an authorized Admin.
 */
async function verifyAdminAccess(): Promise<{ isAdmin: boolean; userId?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { isAdmin: false };

    const adminSupabase = createAdminClient();
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('role, status')
      .eq('id', user.id)
      .single();

    if (profile?.role === 'admin' && profile?.status === 'active') {
      return { isAdmin: true, userId: user.id };
    }

    return { isAdmin: false, userId: user.id };
  } catch {
    return { isAdmin: false };
  }
}

/**
 * Server Action: Get Admin Dashboard Statistics.
 */
export async function getAdminStatsAction(): Promise<
  ApiResponse<{
    totalUsers: number;
    totalShares: number;
    activeShares: number;
    expiredShares: number;
    totalDownloads: number;
    totalViews: number;
    totalStorageBytes: number;
    pendingReports: number;
    suspendedUsers: number;
  }>
> {
  const { isAdmin } = await verifyAdminAccess();
  if (!isAdmin) {
    return { success: false, error: 'Unauthorized: Admin access required.' };
  }

  try {
    const adminSupabase = createAdminClient();

    // 1. Users count
    const { count: totalUsers } = await adminSupabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // 2. Suspended users count
    const { count: suspendedUsers } = await adminSupabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'suspended');

    // 3. Shares stats
    const { data: shares } = await adminSupabase
      .from('shares')
      .select('id, file_size, download_count, view_count, expires_at, revoked, consumed');

    let totalShares = 0;
    let activeShares = 0;
    let expiredShares = 0;
    let totalDownloads = 0;
    let totalViews = 0;
    let totalStorageBytes = 0;

    if (shares) {
      totalShares = shares.length;
      for (const s of shares) {
        totalDownloads += s.download_count || 0;
        totalViews += s.view_count || 0;
        totalStorageBytes += s.file_size || 0;

        const isExpired = new Date(s.expires_at).getTime() <= Date.now();
        if (isExpired) {
          expiredShares++;
        } else if (!s.revoked && !s.consumed) {
          activeShares++;
        }
      }
    }

    // 4. Pending reports count
    const { count: pendingReports } = await adminSupabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    return {
      success: true,
      data: {
        totalUsers: totalUsers || 0,
        totalShares,
        activeShares,
        expiredShares,
        totalDownloads,
        totalViews,
        totalStorageBytes,
        pendingReports: pendingReports || 0,
        suspendedUsers: suspendedUsers || 0,
      },
    };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch admin stats.' };
  }
}

/**
 * Server Action: Get Users for Admin User Management.
 */
export async function getAdminUsersAction(
  searchQuery?: string
): Promise<ApiResponse<Profile[]>> {
  const { isAdmin } = await verifyAdminAccess();
  if (!isAdmin) {
    return { success: false, error: 'Unauthorized.', data: [] };
  }

  try {
    const adminSupabase = createAdminClient();
    let query = adminSupabase.from('profiles').select('*').order('created_at', { ascending: false });

    if (searchQuery && searchQuery.trim().length > 0) {
      query = query.ilike('full_name', `%${searchQuery.trim()}%`);
    }

    const { data, error } = await query;
    if (error) return { success: false, error: error.message, data: [] };

    return { success: true, data: data || [] };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch users', data: [] };
  }
}

/**
 * Server Action: Suspend or Unsuspend a User.
 */
export async function toggleUserSuspensionAction(
  userId: string,
  suspend: boolean
): Promise<ApiResponse> {
  const { isAdmin } = await verifyAdminAccess();
  if (!isAdmin) {
    return { success: false, error: 'Unauthorized.' };
  }

  try {
    const adminSupabase = createAdminClient();
    const newStatus = suspend ? 'suspended' : 'active';

    const { error } = await adminSupabase
      .from('profiles')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) return { success: false, error: error.message };

    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to toggle suspension' };
  }
}

/**
 * Server Action: Get Shares for Admin Moderation.
 */
export async function getAdminSharesAction(
  searchQuery?: string,
  filter?: string
): Promise<ApiResponse<Share[]>> {
  const { isAdmin } = await verifyAdminAccess();
  if (!isAdmin) {
    return { success: false, error: 'Unauthorized.', data: [] };
  }

  try {
    const adminSupabase = createAdminClient();
    let query = adminSupabase
      .from('shares')
      .select('*')
      .order('created_at', { ascending: false });

    if (searchQuery && searchQuery.trim().length > 0) {
      query = query.or(
        `share_code.ilike.%${searchQuery.trim()}%,title.ilike.%${searchQuery.trim()}%,file_name.ilike.%${searchQuery.trim()}%`
      );
    }

    if (filter === 'file') query = query.eq('type', 'file');
    if (filter === 'text') query = query.eq('type', 'text');
    if (filter === 'revoked') query = query.eq('revoked', true);
    if (filter === 'active') {
      query = query
        .eq('revoked', false)
        .eq('consumed', false)
        .gt('expires_at', new Date().toISOString());
    }
    if (filter === 'expired') {
      query = query.lte('expires_at', new Date().toISOString());
    }

    const { data, error } = await query.limit(100);
    if (error) return { success: false, error: error.message, data: [] };

    return { success: true, data: data || [] };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch shares', data: [] };
  }
}

/**
 * Server Action: Admin Revoke Share.
 */
export async function adminRevokeShareAction(shareId: string): Promise<ApiResponse> {
  const { isAdmin } = await verifyAdminAccess();
  if (!isAdmin) return { success: false, error: 'Unauthorized.' };

  try {
    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase
      .from('shares')
      .update({ revoked: true, updated_at: new Date().toISOString() })
      .eq('id', shareId);

    if (error) return { success: false, error: error.message };

    await adminSupabase.from('share_events').insert({
      share_id: shareId,
      event_type: 'revoke',
    });

    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to revoke share' };
  }
}

/**
 * Server Action: Admin Delete Share (Abusive content removal).
 */
export async function adminDeleteShareAction(shareId: string): Promise<ApiResponse> {
  const { isAdmin } = await verifyAdminAccess();
  if (!isAdmin) return { success: false, error: 'Unauthorized.' };

  try {
    const adminSupabase = createAdminClient();
    const { data: share } = await adminSupabase
      .from('shares')
      .select('storage_path')
      .eq('id', shareId)
      .single();

    if (share?.storage_path) {
      await adminSupabase.storage.from('shares').remove([share.storage_path]);
    }

    const { error } = await adminSupabase.from('shares').delete().eq('id', shareId);
    if (error) return { success: false, error: error.message };

    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete share' };
  }
}

/**
 * Server Action: Get Reports for Admin.
 */
export async function getAdminReportsAction(): Promise<ApiResponse<Report[]>> {
  const { isAdmin } = await verifyAdminAccess();
  if (!isAdmin) return { success: false, error: 'Unauthorized.', data: [] };

  try {
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
      .from('reports')
      .select('*, shares (*)')
      .order('created_at', { ascending: false });

    if (error) return { success: false, error: error.message, data: [] };

    return { success: true, data: data || [] };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch reports', data: [] };
  }
}

/**
 * Server Action: Resolve or Reject Report.
 */
export async function resolveReportAction(
  reportId: string,
  status: 'resolved' | 'rejected',
  deleteContent: boolean = false
): Promise<ApiResponse> {
  const { isAdmin } = await verifyAdminAccess();
  if (!isAdmin) return { success: false, error: 'Unauthorized.' };

  try {
    const adminSupabase = createAdminClient();

    if (deleteContent) {
      const { data: report } = await adminSupabase
        .from('reports')
        .select('share_id')
        .eq('id', reportId)
        .single();

      if (report?.share_id) {
        await adminDeleteShareAction(report.share_id);
      }
    }

    const { error } = await adminSupabase
      .from('reports')
      .update({
        status,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', reportId);

    if (error) return { success: false, error: error.message };

    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to resolve report' };
  }
}
