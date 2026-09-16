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
 * Generate a guaranteed cryptographically strong 6-digit code.
 * Collisions are handled optimistically by the database unique constraint and automatic retry.
 */
export async function generateUniqueShareCode(): Promise<string> {
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
