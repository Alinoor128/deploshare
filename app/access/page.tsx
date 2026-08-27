'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SixDigitInput } from '@/components/access/SixDigitInput';
import { PublicShareViewer } from '@/components/access/PublicShareViewer';
import { accessShareByCodeAction } from '@/lib/actions/access-actions';
import { SharePublicView } from '@/types/database';
import { KeyRound, ShieldAlert, ArrowRight, Loader2 } from 'lucide-react';

function AccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryCode = searchParams.get('code') || '';

  const [code, setCode] = useState(queryCode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareData, setShareData] = useState<SharePublicView | null>(null);

  const handleValidateCode = useCallback(async (targetCode: string) => {
    const cleanCode = targetCode.trim();
    if (cleanCode.length !== 6) {
      setError('Please enter all 6 digits.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await accessShareByCodeAction(cleanCode);
      if (res.success && res.data) {
        setShareData(res.data);
      } else {
        setError(res.error || 'Invalid or unavailable share code.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to connect to access service.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fetch if code parameter is present in URL
  useEffect(() => {
    let active = true;
    async function loadQueryCode() {
      if (queryCode && queryCode.length === 6) {
        try {
          const res = await accessShareByCodeAction(queryCode);
          if (!active) return;
          if (res.success && res.data) {
            setShareData(res.data);
          } else {
            setError(res.error || 'Invalid or unavailable share code.');
          }
        } catch (err: unknown) {
          if (active) {
            setError(err instanceof Error ? err.message : 'Failed to connect to access service.');
          }
        }
      }
    }
    loadQueryCode();
    return () => {
      active = false;
    };
  }, [queryCode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleValidateCode(code);
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
      {/* If share is loaded, show viewer */}
      {shareData ? (
        <div className="space-y-4">
          <button
            onClick={() => {
              setShareData(null);
              setCode('');
              router.push('/access');
            }}
            className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            ← Enter a different 6-digit code
          </button>
          <PublicShareViewer share={shareData} />
        </div>
      ) : (
        /* CODE ENTRY HERO CARD */
        <div className="max-w-xl mx-auto space-y-6 text-center">
          <div className="space-y-2">
            <Badge variant="info" size="md">
              <KeyRound className="w-3.5 h-3.5" />
              Secure 6-Digit Gateway
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Enter Your Share Code
            </h1>
            <p className="text-sm text-slate-500">
              Enter the 6-digit numeric PIN you received to decrypt and access content.
            </p>
          </div>

          <Card glow className="p-6 sm:p-10 space-y-8 bg-white border-slate-200 shadow-xl shadow-blue-500/5">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 6-Digit Box Input */}
              <div className="space-y-3">
                <SixDigitInput
                  value={code}
                  onChange={(val) => {
                    setCode(val);
                    setError(null);
                  }}
                  onComplete={(completedCode) => handleValidateCode(completedCode)}
                  disabled={loading}
                  hasError={Boolean(error)}
                  autoFocus={true}
                />

                {error && (
                  <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                    <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="glow"
                size="lg"
                className="w-full"
                isLoading={loading}
                disabled={code.length !== 6 || loading}
                rightIcon={<ArrowRight className="w-5 h-5" />}
              >
                {loading ? 'Validating Code...' : 'Access Share'}
              </Button>
            </form>

            <div className="border-t border-slate-100 pt-6 text-left space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 block">
                Access Security Guarantee
              </span>
              <ul className="text-xs text-slate-500 space-y-1.5 list-disc list-inside">
                <li>Rate-limited to thwart automated brute-force attacks</li>
                <li>Content verified server-side before decryption</li>
                <li>Burn-after-download and expiry policies strictly enforced</li>
              </ul>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function AccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <AccessContent />
    </Suspense>
  );
}
