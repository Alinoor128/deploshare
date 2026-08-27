import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { ApiKey, Profile } from '@/types/database';

export interface AuthenticatedApiUser {
  userId: string;
  apiKey: ApiKey;
  profile: Profile;
}

/**
 * Generate a new cryptographically secure API key.
 * Format: dps_live_<32 random hex characters>
 */
export function generateApiKeyPair(name: string = 'Default API Key') {
  const randomBytes = crypto.randomBytes(24).toString('hex');
  const rawKey = `dps_live_${randomBytes}`;
  const keyPrefix = `dps_live_${randomBytes.slice(0, 6)}...`;
  const keyHash = hashApiKey(rawKey);

  return {
    rawKey,
    keyPrefix,
    keyHash,
    name,
  };
}

/**
 * Hash raw API key using SHA-256
 */
export function hashApiKey(rawKey: string): string {
  return crypto.createHash('sha256').update(rawKey.trim()).digest('hex');
}

/**
 * Extract and authenticate API key from HTTP Request headers
 */
export async function authenticateApiKey(
  headers: Headers
): Promise<{ user: AuthenticatedApiUser | null; error: string | null }> {
  try {
    let rawKey = headers.get('x-api-key');

    if (!rawKey) {
      const authHeader = headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        rawKey = authHeader.replace('Bearer ', '').trim();
      }
    }

    if (!rawKey) {
      return { user: null, error: 'Missing API Key. Provide via Authorization: Bearer <key> or x-api-key header.' };
    }

    if (!rawKey.startsWith('dps_live_')) {
      return { user: null, error: 'Invalid API key format. Must start with dps_live_' };
    }

    const keyHash = hashApiKey(rawKey);
    const adminSupabase = createAdminClient();

    // Query API key
    const { data: keyRecord, error: keyError } = await adminSupabase
      .from('api_keys')
      .select('*')
      .eq('key_hash', keyHash)
      .eq('revoked', false)
      .maybeSingle();

    if (keyError || !keyRecord) {
      return { user: null, error: 'Invalid or revoked API key.' };
    }

    // Check expiration if set
    if (keyRecord.expires_at && new Date(keyRecord.expires_at).getTime() <= Date.now()) {
      return { user: null, error: 'API key has expired.' };
    }

    // Query user profile
    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', keyRecord.user_id)
      .single();

    if (profileError || !profile) {
      return { user: null, error: 'Associated user account not found.' };
    }

    if (profile.status === 'suspended') {
      return { user: null, error: 'Your account has been suspended by administration.' };
    }

    // Asynchronously update last_used_at
    adminSupabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', keyRecord.id)
      .then(() => {});

    return {
      user: {
        userId: profile.id,
        apiKey: keyRecord as ApiKey,
        profile: profile as Profile,
      },
      error: null,
    };
  } catch (err: unknown) {
    return {
      user: null,
      error: err instanceof Error ? err.message : 'API key authentication failed.',
    };
  }
}
