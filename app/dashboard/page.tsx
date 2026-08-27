'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import { SharesTable } from '@/components/dashboard/SharesTable';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Share } from '@/types/database';
import { User } from '@supabase/supabase-js';
import { getUserSharesAction } from '@/lib/actions/share-actions';
import { getCurrentUserAction } from '@/lib/actions/auth-actions';
import {
  UploadCloud,
  LayoutDashboard,
  RefreshCw,
  Loader2,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [shares, setShares] = useState<Share[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setUser] = useState<User | null>(null);

  const fetchDashboardData = async () => {
    try {
      const { user: currentUser } = await getCurrentUserAction();
      if (!currentUser) {
        router.push('/login?redirect=/dashboard');
        return;
      }
      setUser(currentUser);

      const res = await getUserSharesAction();
      if (res.success && res.data) {
        setShares(res.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const { user: currentUser } = await getCurrentUserAction();
        if (!active) return;
        if (!currentUser) {
          router.push('/login?redirect=/dashboard');
          return;
        }
        setUser(currentUser);

        const res = await getUserSharesAction();
        if (!active) return;
        if (res.success && res.data) {
          setShares(res.data);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm text-slate-500">Loading your secure share vault...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="info" size="sm">
              <LayoutDashboard className="w-3.5 h-3.5" />
              User Dashboard
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Your Active & Past Shares
          </h1>
          <p className="text-xs text-slate-500">
            Track analytics, copy 6-digit access codes, manage expiration, and revoke shares.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboardData}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
          <Link href="/share">
            <Button
              variant="glow"
              size="sm"
              leftIcon={<UploadCloud className="w-4 h-4" />}
            >
              New Share
            </Button>
          </Link>
        </div>
      </div>

      {/* Analytics Overview Cards */}
      <DashboardOverview shares={shares} />

      {/* Shares Table Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Managed Shares ({shares.length})
          </h2>
        </div>

        <SharesTable shares={shares} onRefresh={fetchDashboardData} />
      </div>
    </div>
  );
}
