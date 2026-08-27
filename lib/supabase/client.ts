import { createBrowserClient } from '@supabase/ssr';
import { getNormalizedSupabaseUrl } from '@/lib/supabase/normalize-url';

export function createClient() {
  const supabaseUrl = getNormalizedSupabaseUrl();
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseAnonKey) {
    return createBrowserClient(
      supabaseUrl || 'https://placeholder.supabase.co',
      supabaseAnonKey || 'placeholder-anon-key'
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
