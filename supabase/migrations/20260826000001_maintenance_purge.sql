-- ==============================================================================
-- DeploShare — Automated Maintenance & Storage Purge Migration
-- ==============================================================================

-- 1. Create cleanup_logs table to track purge history & reclaimed storage
CREATE TABLE IF NOT EXISTS public.cleanup_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  triggered_by TEXT NOT NULL DEFAULT 'cron', -- 'cron', 'admin_manual', 'webhook'
  shares_deleted INT NOT NULL DEFAULT 0,
  files_removed INT NOT NULL DEFAULT 0,
  bytes_reclaimed BIGINT NOT NULL DEFAULT 0,
  duration_ms INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on cleanup_logs
ALTER TABLE public.cleanup_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view cleanup logs"
  ON public.cleanup_logs FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Service role can insert cleanup logs"
  ON public.cleanup_logs FOR INSERT
  WITH CHECK (true);

-- 2. Stored Procedure: Fetch and delete expired shares atomically, returning storage paths
CREATE OR REPLACE FUNCTION public.purge_expired_shares(p_batch_size INT DEFAULT 200)
RETURNS TABLE (
  purged_id UUID,
  purged_storage_path TEXT,
  purged_file_size BIGINT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  WITH target_shares AS (
    SELECT id, storage_path, COALESCE(file_size, 0)::BIGINT AS f_size
    FROM public.shares
    WHERE expires_at <= NOW()
       OR revoked = TRUE
       OR consumed = TRUE
       OR (max_downloads IS NOT NULL AND download_count >= max_downloads)
    LIMIT p_batch_size
    FOR UPDATE SKIP LOCKED
  ),
  deleted_rows AS (
    DELETE FROM public.shares
    WHERE id IN (SELECT id FROM target_shares)
    RETURNING id
  )
  SELECT t.id, t.storage_path, t.f_size
  FROM target_shares t;
END;
$$;
