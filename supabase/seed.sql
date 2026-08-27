-- ==============================================================================
-- DeploShare — Seed & Utility Queries
-- ==============================================================================

-- Example: Promote a specific user to Admin role
-- Replace 'your-user-email@domain.com' with your actual Supabase Auth email
/*
UPDATE public.profiles
SET role = 'admin'
WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'admin@deploshare.com'
);
*/

-- Example: Check active shares and storage statistics
SELECT 
    COUNT(*) as total_shares,
    COUNT(*) FILTER (WHERE NOT revoked AND NOT consumed AND expires_at > now()) as active_shares,
    COUNT(*) FILTER (WHERE expires_at <= now()) as expired_shares,
    COALESCE(SUM(download_count), 0) as total_downloads,
    COALESCE(SUM(view_count), 0) as total_views,
    COALESCE(SUM(file_size), 0) as total_bytes_stored
FROM public.shares;
