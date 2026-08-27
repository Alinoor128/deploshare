'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Share } from '@/types/database';
import { formatBytes } from '@/lib/security/sanitizer';
import {
  Share2,
  CheckCircle2,
  Clock,
  Eye,
  Download,
  HardDrive,
} from 'lucide-react';

export interface DashboardOverviewProps {
  shares: Share[];
}

export function DashboardOverview({ shares }: DashboardOverviewProps) {
  const [now] = React.useState(() => Date.now());

  const totalShares = shares.length;
  let activeShares = 0;
  let expiredShares = 0;
  let totalViews = 0;
  let totalDownloads = 0;
  let totalStorageBytes = 0;

  for (const s of shares) {
    totalViews += s.view_count || 0;
    totalDownloads += s.download_count || 0;
    totalStorageBytes += s.file_size || 0;

    const isExpired = new Date(s.expires_at).getTime() <= now;
    if (isExpired) {
      expiredShares++;
    } else if (!s.revoked && !s.consumed) {
      activeShares++;
    }
  }

  const statCards = [
    {
      title: 'Total Shares',
      value: totalShares,
      icon: <Share2 className="w-5 h-5 text-blue-600" />,
      bg: 'bg-blue-50 border-blue-100',
      description: 'All-time created items',
    },
    {
      title: 'Active Shares',
      value: activeShares,
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
      bg: 'bg-emerald-50 border-emerald-100',
      description: 'Currently accessible',
    },
    {
      title: 'Expired / Consumed',
      value: expiredShares,
      icon: <Clock className="w-5 h-5 text-amber-600" />,
      bg: 'bg-amber-50 border-amber-100',
      description: 'Cleaned or burned',
    },
    {
      title: 'Total Views',
      value: totalViews,
      icon: <Eye className="w-5 h-5 text-indigo-600" />,
      bg: 'bg-indigo-50 border-indigo-100',
      description: 'Access attempts',
    },
    {
      title: 'Total Downloads',
      value: totalDownloads,
      icon: <Download className="w-5 h-5 text-cyan-600" />,
      bg: 'bg-cyan-50 border-cyan-100',
      description: 'Files downloaded',
    },
    {
      title: 'Storage Used',
      value: formatBytes(totalStorageBytes),
      icon: <HardDrive className="w-5 h-5 text-purple-600" />,
      bg: 'bg-purple-50 border-purple-100',
      description: 'Encrypted storage',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
      {statCards.map((stat, i) => (
        <Card key={i} className="p-4 sm:p-5 space-y-2 bg-white border-slate-200 shadow-2xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 truncate">
              {stat.title}
            </span>
            <div className={`p-2 rounded-xl border ${stat.bg}`}>
              {stat.icon}
            </div>
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {stat.value}
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">{stat.description}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
