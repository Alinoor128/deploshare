import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

/**
 * Hash a plain text password using bcrypt with high work factor.
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  if (!plainPassword || plainPassword.trim().length === 0) {
    throw new Error('Password cannot be empty');
  }
  return bcrypt.hash(plainPassword.trim(), SALT_ROUNDS);
}

/**
 * Verify a plain text password against a stored bcrypt hash.
 */
export async function verifyPassword(
  plainPassword: string,
  storedHash: string
): Promise<boolean> {
  if (!plainPassword || !storedHash) {
    return false;
  }
  try {
    return await bcrypt.compare(plainPassword.trim(), storedHash);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}
