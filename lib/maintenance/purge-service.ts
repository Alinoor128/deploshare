import { createAdminClient } from '@/lib/supabase/admin';
import { PurgeResult } from '@/types/database';

/**
 * Executes a full database and private storage maintenance sweep.
 * Permanently removes expired, revoked, and consumed shares and their physical files from Supabase Storage.
 */
export async function executeStoragePurge(
  triggeredBy: 'cron' | 'admin_manual' | 'api' = 'cron',
  batchSize: number = 200
): Promise<PurgeResult> {
  const startTime = Date.now();
  const adminSupabase = createAdminClient();

  let sharesDeleted = 0;
  let filesRemoved = 0;
  let bytesReclaimed = 0;

  try {
    const nowIso = new Date().toISOString();

    // 1. Query expired, revoked, or consumed shares
    const { data: expiredShares, error: queryError } = await adminSupabase
      .from('shares')
      .select('id, storage_path, file_size')
      .or(`expires_at.lte.${nowIso},revoked.eq.true,consumed.eq.true`)
      .limit(batchSize);

    if (queryError) {
      console.error('Purge query error:', queryError);
      throw new Error(`Failed to query expired shares: ${queryError.message}`);
    }

    if (expiredShares && expiredShares.length > 0) {
      sharesDeleted = expiredShares.length;

      // Extract storage paths to delete
      const pathsToDelete = expiredShares
        .map((s) => s.storage_path)
        .filter((p): p is string => Boolean(p && p.trim().length > 0));

      // Calculate bytes reclaimed
      bytesReclaimed = expiredShares.reduce(
        (acc, s) => acc + (s.file_size || 0),
        0
      );

      // 2. Physically remove files from Supabase Storage
      if (pathsToDelete.length > 0) {
        const { error: storageRemoveError } = await adminSupabase.storage
          .from('shares')
          .remove(pathsToDelete);

        if (storageRemoveError) {
          console.warn('Storage purge warning:', storageRemoveError);
        } else {
          filesRemoved = pathsToDelete.length;
        }
      }

      // 3. Delete database records
      const shareIds = expiredShares.map((s) => s.id);
      const { error: deleteDbError } = await adminSupabase
        .from('shares')
        .delete()
        .in('id', shareIds);

      if (deleteDbError) {
        console.error('DB record deletion error during purge:', deleteDbError);
      }
    }

    const durationMs = Date.now() - startTime;

    // 4. Record entry in cleanup_logs (gracefully catch if table is not yet created)
    try {
      await adminSupabase.from('cleanup_logs').insert({
        triggered_by: triggeredBy,
        shares_deleted: sharesDeleted,
        files_removed: filesRemoved,
        bytes_reclaimed: bytesReclaimed,
        duration_ms: durationMs,
      });
    } catch {
      // Table might not exist yet if migration hasn't been run
    }

    return {
      sharesDeleted,
      filesRemoved,
      bytesReclaimed,
      durationMs,
    };
  } catch (error: unknown) {
    console.error('Storage purge execution exception:', error);
    throw error;
  }
}
