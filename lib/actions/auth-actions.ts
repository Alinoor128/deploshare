'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ApiResponse, Profile } from '@/types/database';
import { User, Session } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

import { headers } from 'next/headers';
import { checkAuthRateLimit, recordFailedAttempt, resetRateLimit } from '@/lib/security/rate-limiter';

/**
 * Extract client IP from headers.
 */
async function getClientIp(): Promise<string> {
  try {
    const h = await headers();
    const forwarded = h.get('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0].trim();
    return h.get('x-real-ip') || '127.0.0.1';
  } catch {
    return '127.0.0.1';
  }
}

/**
 * Sign up with Email and Password.
 */
export async function signUpAction(
  formData: FormData
): Promise<ApiResponse<{ user: User | null; session: Session | null }>> {
  try {
    const clientIp = await getClientIp();
    const rateCheck = await checkAuthRateLimit(clientIp, 'signup');
    if (!rateCheck.allowed) {
      return {
        success: false,
        error: `Too many signup attempts. Please try again in ${rateCheck.retryAfterSeconds} seconds.`,
      };
    }

    const email = (formData.get('email') as string)?.trim();
    const password = (formData.get('password') as string)?.trim();
    const fullName = (formData.get('fullName') as string)?.trim();

    if (!email || !password) {
      return { success: false, error: 'Email and password are required.' };
    }

    if (email.length > 120 || (fullName && fullName.length > 80)) {
      return { success: false, error: 'Input exceeds maximum allowed length.' };
    }

    if (password.length < 6 || password.length > 72) {
      return { success: false, error: 'Password must be between 6 and 72 characters.' };
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || splitEmail(email),
        },
      },
    });

    if (error) {
      await recordFailedAttempt(`auth_signup_${clientIp}`);
      return { success: false, error: error.message };
    }

    await resetRateLimit(`auth_signup_${clientIp}`);

    return {
      success: true,
      data: {
        user: data.user,
        session: data.session,
      },
    };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Signup failed.' };
  }
}

/**
 * Sign in with Email and Password.
 */
export async function signInAction(
  formData: FormData
): Promise<ApiResponse<{ user: User | null; session: Session | null }>> {
  try {
    const clientIp = await getClientIp();
    const rateCheck = await checkAuthRateLimit(clientIp, 'login');
    if (!rateCheck.allowed) {
      return {
        success: false,
        error: `Too many failed login attempts. Please wait ${rateCheck.retryAfterSeconds} seconds before retrying.`,
      };
    }

    const email = (formData.get('email') as string)?.trim();
    const password = (formData.get('password') as string)?.trim();

    if (!email || !password) {
      return { success: false, error: 'Email and password are required.' };
    }

    if (email.length > 120 || password.length > 72) {
      return { success: false, error: 'Invalid email or password length.' };
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      await recordFailedAttempt(`auth_login_${clientIp}`);
      return { success: false, error: error.message };
    }

    await resetRateLimit(`auth_login_${clientIp}`);

    return {
      success: true,
      data: {
        user: data.user,
        session: data.session,
      },
    };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Login failed.' };
  }
}

/**
 * Send Magic Link to Email.
 */
export async function sendMagicLinkAction(email: string): Promise<ApiResponse> {
  try {
    if (!email || !email.includes('@')) {
      return { success: false, error: 'Please provide a valid email address.' };
    }

    const supabase = await createClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${appUrl}/dashboard`,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send magic link.' };
  }
}

/**
 * Sign Out.
 */
export async function signOutAction(): Promise<ApiResponse> {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to sign out.' };
  }
}

/**
 * Get Current Authenticated User & Profile.
 */
export async function getCurrentUserAction(): Promise<{
  user: User | null;
  profile: Profile | null;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { user: null, profile: null };
    }

    const adminSupabase = createAdminClient();
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return {
      user,
      profile: profile || {
        id: user.id,
        full_name: user.user_metadata?.full_name || splitEmail(user.email || ''),
        avatar_url: user.user_metadata?.avatar_url || null,
        role: 'user',
        status: 'active',
        created_at: user.created_at,
        updated_at: user.created_at,
      },
    };
  } catch {
    return { user: null, profile: null };
  }
}

/**
 * Update Profile Information.
 */
export async function updateProfileAction(fullName: string): Promise<ApiResponse> {
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
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update profile.' };
  }
}

/**
 * Change Account Password.
 */
export async function changePasswordAction(newPassword: string): Promise<ApiResponse> {
  try {
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to change password.' };
  }
}

/**
 * Delete User Account.
 */
export async function deleteAccountAction(): Promise<ApiResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Authentication required.' };
    }

    const adminSupabase = createAdminClient();

    // Delete user storage folders
    const { data: userShares } = await adminSupabase
      .from('shares')
      .select('storage_path')
      .eq('owner_id', user.id);

    if (userShares && userShares.length > 0) {
      const paths = userShares
        .map((s) => s.storage_path)
        .filter((p): p is string => Boolean(p));
      if (paths.length > 0) {
        await adminSupabase.storage.from('shares').remove(paths);
      }
    }

    // Delete auth user (cascades to profile, shares, subscriptions)
    const { error } = await adminSupabase.auth.admin.deleteUser(user.id);
    if (error) {
      return { success: false, error: error.message };
    }

    await supabase.auth.signOut();
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete account.' };
  }
}

function splitEmail(email: string): string {
  return email ? email.split('@')[0] : 'User';
}
