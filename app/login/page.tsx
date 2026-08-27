'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DeploShareLogo } from '@/components/ui/DeploShareLogo';
import { signInAction, sendMagicLinkAction } from '@/lib/actions/auth-actions';
import {
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/dashboard';

  const [authMode, setAuthMode] = useState<'password' | 'magic-link'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (authMode === 'password') {
        const formData = new FormData();
        formData.append('email', email);
        formData.append('password', password);

        const res = await signInAction(formData);
        if (res.success) {
          router.push(redirectUrl);
          router.refresh();
        } else {
          setError(res.error || 'Invalid email or password.');
          setLoading(false);
        }
      } else {
        // Magic link mode
        const res = await sendMagicLinkAction(email);
        if (res.success) {
          setMagicLinkSent(true);
          setLoading(false);
        } else {
          setError(res.error || 'Failed to send magic link.');
          setLoading(false);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication error.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-3">
          <Link href="/" className="inline-block mb-1">
            <DeploShareLogo size="md" showText={true} />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Sign In to Your Account
          </h1>
          <p className="text-xs text-slate-500">
            Access your managed shares, analytics, and encryption settings.
          </p>
        </div>

        <Card glow floating className="p-6 sm:p-8 space-y-6 bg-white border-slate-200 shadow-xl shadow-blue-500/5">
          {magicLinkSent ? (
            <div className="text-center py-4 space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mx-auto border border-emerald-200">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Magic Link Sent</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                We sent a secure login link to <strong className="text-slate-900">{email}</strong>. Check your inbox to sign in instantly.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => setMagicLinkSent(false)}
              >
                Back to Sign In
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              {/* Mode switch */}
              <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('password');
                    setError(null);
                  }}
                  className={`flex-1 py-2 rounded-lg font-semibold transition-colors cursor-pointer ${
                    authMode === 'password'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Password
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('magic-link');
                    setError(null);
                  }}
                  className={`flex-1 py-2 rounded-lg font-semibold transition-colors cursor-pointer ${
                    authMode === 'magic-link'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Magic Link
                </button>
              </div>

              <Input
                label="Email Address"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                required
                autoFocus
              />

              {authMode === 'password' && (
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4" />}
                  required
                />
              )}

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                variant="glow"
                size="lg"
                shakeOnHover={true}
                shimmer={true}
                className="w-full"
                isLoading={loading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {authMode === 'password' ? 'Sign In' : 'Send Magic Link'}
              </Button>
            </form>
          )}

          <div className="text-center pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Do not have an account?{' '}
              <Link href="/signup" className="text-blue-600 hover:underline font-bold">
                Sign up free
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
