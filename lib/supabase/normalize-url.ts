/**
 * Normalize Supabase URL.
 * Automatically fixes dashboard URLs if pasted by mistake (e.g. https://supabase.com/dashboard/project/xyz -> https://xyz.supabase.co).
 */
export function getNormalizedSupabaseUrl(): string {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  if (!rawUrl) return '';

  const clean = rawUrl.trim();

  // If dashboard URL format was pasted: https://supabase.com/dashboard/project/abcdefgh
  const match = clean.match(/supabase\.com\/dashboard\/project\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return `https://${match[1]}.supabase.co`;
  }

  // If only project ref was pasted: abcdefgh
  if (/^[a-zA-Z0-9_-]{20}$/.test(clean)) {
    return `https://${clean}.supabase.co`;
  }

  return clean;
}
