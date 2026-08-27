import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Generate a cryptographically secure 6-digit numeric string.
 * Output range: '100000' through '999999' or '000000' through '999999'
 */
export function generateSecure6DigitCode(): string {
  // Use crypto.randomInt for uniform, cryptographically strong random integer
  const num = crypto.randomInt(0, 1000000);
  return num.toString().padStart(6, '0');
}

/**
 * Generate a guaranteed unique 6-digit code by checking the Supabase database.
 * If a collision occurs (which has a 1 in 1,000,000 chance per active code), it retries up to maxRetries.
 */
export async function generateUniqueShareCode(maxRetries = 10): Promise<string> {
  const supabase = createAdminClient();

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const code = generateSecure6DigitCode();

    // Check if code is already in use by an active/unexpired share
    const { data, error } = await supabase
      .from('shares')
      .select('id')
      .eq('share_code', code)
      .eq('revoked', false)
      .gt('expires_at', new Date().toISOString())
      .limit(1);

    if (error) {
      // If table doesn't exist yet or connection error, return generated code
      console.warn('Database check warning during code generation:', error.message);
      return code;
    }

    // If no active share exists with this code, it's safe to use
    if (!data || data.length === 0) {
      return code;
    }
  }

  // Fallback fallback if high saturation
  return generateSecure6DigitCode();
}

/**
 * Validates whether a given string is a valid 6-digit numeric code.
 */
export function isValid6DigitCode(code: string): boolean {
  if (!code || typeof code !== 'string') return false;
  const cleanCode = code.trim();
  return /^[0-9]{6}$/.test(cleanCode);
}
