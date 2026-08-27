'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateApiKeyPair } from '@/lib/security/api-key';
import { ApiResponse, ApiKey } from '@/types/database';

export interface NewApiKeyResponse {
  id: string;
  name: string;
  keyPrefix: string;
  rawKey: string;
  createdAt: string;
}

/**
 * Server Action: Create a new developer API key for the current user.
 */
export async function createApiKeyAction(
  name: string = 'Default API Key'
): Promise<ApiResponse<NewApiKeyResponse>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Authentication required.' };
    }

    const { rawKey, keyPrefix, keyHash } = generateApiKeyPair(name.trim() || 'API Key');
    const adminSupabase = createAdminClient();

    const { data: newKey, error } = await adminSupabase
      .from('api_keys')
      .insert({
        user_id: user.id,
        name: name.trim() || 'API Key',
        key_prefix: keyPrefix,
        key_hash: keyHash,
        rate_limit_per_minute: 120,
      })
      .select()
      .single();

    if (error || !newKey) {
      return { success: false, error: error?.message || 'Failed to create API key.' };
    }

    return {
      success: true,
      data: {
        id: newKey.id,
        name: newKey.name,
        keyPrefix: newKey.key_prefix,
        rawKey, // Only returned once on creation!
        createdAt: newKey.created_at,
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'API key generation failed.',
    };
  }
}

/**
 * Server Action: Get all API keys for the current logged-in user.
 */
export async function getUserApiKeysAction(): Promise<ApiResponse<ApiKey[]>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Authentication required.', data: [] };
    }

    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
      .from('api_keys')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      // Return empty array if table doesn't exist yet
      return { success: true, data: [] };
    }

    return { success: true, data: (data as ApiKey[]) || [] };
  } catch {
    return { success: true, data: [] };
  }
}

/**
 * Server Action: Revoke an API key.
 */
export async function revokeApiKeyAction(keyId: string): Promise<ApiResponse<void>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Authentication required.' };
    }

    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase
      .from('api_keys')
      .update({ revoked: true })
      .eq('id', keyId)
      .eq('user_id', user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to revoke API key.',
    };
  }
}
