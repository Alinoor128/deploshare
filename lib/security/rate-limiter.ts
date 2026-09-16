import { createAdminClient } from '@/lib/supabase/admin';
import { BRAND_CONFIG } from '@/lib/config/brand';

interface RateLimitRecord {
  count: number;
  lockedUntil: number | null;
  lastAttempt: number;
}

// In-memory quick cache for fast lookups and edge resilience
const memoryStore = new Map<string, RateLimitRecord>();

/**
 * Check if the current identifier (e.g. IP + Action) is rate limited.
 * Returns { allowed: boolean, remainingAttempts: number, lockedUntilMs?: number, delayMs?: number }
 */
export async function checkRateLimit(
  identifier: string,
  maxAttempts: number = BRAND_CONFIG.maxCodeAttempts,
  windowMs: number = BRAND_CONFIG.rateLimitWindowMs
): Promise<{
  allowed: boolean;
  remainingAttempts: number;
  lockedUntil?: Date;
  progressiveDelayMs: number;
}> {
  const now = Date.now();
  const record = memoryStore.get(identifier);

  // Check in-memory record first
  if (record) {
    // If locked out
    if (record.lockedUntil && record.lockedUntil > now) {
      return {
        allowed: false,
        remainingAttempts: 0,
        lockedUntil: new Date(record.lockedUntil),
        progressiveDelayMs: 1000,
      };
    }

    // If window expired, reset
    if (now - record.lastAttempt > windowMs) {
      memoryStore.delete(identifier);
    }
  } else {
    // Fast-path for clean callers: no previous attempts recorded, allow immediately with zero network delay
    return {
      allowed: true,
      remainingAttempts: maxAttempts,
      progressiveDelayMs: 0,
    };
  }

  // Also check database rate_limits table for persistent enforcement across serverless instances
  try {
    const supabase = createAdminClient();
    const { data: dbLimit } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('identifier', identifier)
      .single();

    if (dbLimit) {
      const dbLockedUntil = dbLimit.locked_until
        ? new Date(dbLimit.locked_until).getTime()
        : null;

      if (dbLockedUntil && dbLockedUntil > now) {
        // Sync to memory
        memoryStore.set(identifier, {
          count: dbLimit.attempts,
          lockedUntil: dbLockedUntil,
          lastAttempt: new Date(dbLimit.last_attempt_at).getTime(),
        });

        return {
          allowed: false,
          remainingAttempts: 0,
          lockedUntil: new Date(dbLockedUntil),
          progressiveDelayMs: 1000,
        };
      }
    }
  } catch {
    // Graceful fallback to memory store if DB is unconfigured or unreachable
  }

  const currentAttempts = record ? record.count : 0;
  const remaining = Math.max(0, maxAttempts - currentAttempts);
  
  // Calculate progressive artificial delay (e.g., 200ms per previous attempt) to thwart automated scripts
  const progressiveDelayMs = Math.min(2000, currentAttempts * 250);

  return {
    allowed: true,
    remainingAttempts: remaining,
    progressiveDelayMs,
  };
}

/**
 * Record a failed attempt for an identifier (e.g. incorrect 6-digit code or password).
 */
export async function recordFailedAttempt(
  identifier: string,
  maxAttempts: number = BRAND_CONFIG.maxCodeAttempts,
  lockoutDurationMs: number = BRAND_CONFIG.rateLimitWindowMs
): Promise<void> {
  const now = Date.now();
  const existing = memoryStore.get(identifier);
  const newCount = (existing ? existing.count : 0) + 1;
  const isLocked = newCount >= maxAttempts;
  const lockedUntil = isLocked ? now + lockoutDurationMs : null;

  // Update in-memory
  memoryStore.set(identifier, {
    count: newCount,
    lockedUntil,
    lastAttempt: now,
  });

  // Update in database for cluster-wide enforcement
  try {
    const supabase = createAdminClient();
    await supabase.from('rate_limits').upsert(
      {
        identifier,
        attempts: newCount,
        locked_until: lockedUntil ? new Date(lockedUntil).toISOString() : null,
        last_attempt_at: new Date(now).toISOString(),
      },
      { onConflict: 'identifier' }
    );
  } catch {
    // Non-fatal if DB is in mock mode
  }
}

/**
 * Reset failed attempts upon successful authentication/access.
 */
export async function resetRateLimit(identifier: string): Promise<void> {
  memoryStore.delete(identifier);
  try {
    const supabase = createAdminClient();
    await supabase.from('rate_limits').delete().eq('identifier', identifier);
  } catch {
    // Ignore error
  }
}

/**
 * Strict Auth Rate Limiter (Prevents brute-force, password guessing, and bot signup spam).
 */
export async function checkAuthRateLimit(
  ip: string,
  action: 'login' | 'signup'
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  const identifier = `auth_${action}_${ip}`;
  const maxAttempts = action === 'login' ? 5 : 3; // 5 logins / 15m, 3 signups / 1h
  const windowMs = action === 'login' ? 15 * 60 * 1000 : 60 * 60 * 1000;

  const result = await checkRateLimit(identifier, maxAttempts, windowMs);
  if (!result.allowed) {
    const retryAfter = result.lockedUntil
      ? Math.max(1, Math.ceil((result.lockedUntil.getTime() - Date.now()) / 1000))
      : 60;
    return { allowed: false, retryAfterSeconds: retryAfter };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

/**
 * Share Creation DDoS & Spam Limiter (Prevents automated loop scripts filling bucket/DB).
 */
export async function checkShareCreationRateLimit(
  ip: string
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  const identifier = `create_share_${ip}`;
  const maxShares = 15; // 15 shares per 10 minutes per IP
  const windowMs = 10 * 60 * 1000;

  const result = await checkRateLimit(identifier, maxShares, windowMs);
  if (!result.allowed) {
    const retryAfter = result.lockedUntil
      ? Math.max(1, Math.ceil((result.lockedUntil.getTime() - Date.now()) / 1000))
      : 60;
    return { allowed: false, retryAfterSeconds: retryAfter };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}
