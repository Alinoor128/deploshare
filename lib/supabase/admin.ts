import { createClient } from '@supabase/supabase-js';
import { getNormalizedSupabaseUrl } from '@/lib/supabase/normalize-url';

/**
 * Service Role Supabase Client
 * ⚠️ NEVER USE IN CLIENT-SIDE CODE. This client bypasses Row Level Security (RLS).
 * Used strictly in secure server-side actions for code verification, rate limiting, and admin moderation.
 */
export function createAdminClient() {
  const supabaseUrl = getNormalizedSupabaseUrl();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl || !serviceRoleKey) {
    return createClient(
      supabaseUrl || 'https://placeholder.supabase.co',
      serviceRoleKey || 'placeholder-service-role-key',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
