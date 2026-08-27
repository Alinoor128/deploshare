'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Share, Report, CleanupLog, PurgeResult } from '@/types/database';
import { formatBytes } from '@/lib/security/sanitizer';
import {
  getAdminStatsAction,
  getAdminUsersAction,
  AdminUserItem,
  toggleUserSuspensionAction,
  getAdminSharesAction,
  adminRevokeShareAction,
  adminDeleteShareAction,
  getAdminReportsAction,
  resolveReportAction,
} from '@/lib/actions/admin-actions';
import {
  runStorageCleanupAction,
  getPendingPurgeStatsAction,
  getMaintenanceLogsAction,
} from '@/lib/actions/maintenance-actions';
import {
  ShieldCheck,
  Users,
  Share2,
  AlertTriangle,
  Search,
  Ban,
  Trash2,
  Flag,
  FileText,
  RotateCcw,
  CheckCircle2,
  Clock,
  Zap,
  Terminal,
  Activity,
} from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  totalShares: number;
  activeShares: number;
  expiredShares: number;
  totalDownloads: number;
  totalViews: number;
  totalStorageBytes: number;
  pendingReports: number;
  suspendedUsers: number;
}

export function AdminDashboard() {
  const [now] = useState(() => Date.now());
  const [activeTab, setActiveTab] = useState<'metrics' | 'users' | 'shares' | 'reports' | 'maintenance'>('metrics');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [shares, setShares] = useState<Share[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [cleanupLogs, setCleanupLogs] = useState<CleanupLog[]>([]);
  const [pendingPurge, setPendingPurge] = useState<{ pendingSharesCount: number; pendingEstimatedBytes: number }>({
    pendingSharesCount: 0,
    pendingEstimatedBytes: 0,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [purging, setPurging] = useState(false);
  const [purgeSuccess, setPurgeSuccess] = useState<PurgeResult | null>(null);
  const [purgeError, setPurgeError] = useState<string | null>(null);

  // Searches & Filters
  const [userSearch, setUserSearch] = useState('');
  const [shareSearch, setShareSearch] = useState('');

  const loadData = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const [statsRes, usersRes, sharesRes, reportsRes, pendingRes, logsRes] = await Promise.all([
        getAdminStatsAction(),
        getAdminUsersAction(),
        getAdminSharesAction(),
        getAdminReportsAction(),
        getPendingPurgeStatsAction(),
        getMaintenanceLogsAction(),
      ]);

      if (statsRes.success && statsRes.data) setStats(statsRes.data);
      if (usersRes.success) setUsers(usersRes.data || []);
      if (sharesRes.success) setShares(sharesRes.data || []);
      if (reportsRes.success) setReports(reportsRes.data || []);
      if (pendingRes.success && pendingRes.data) setPendingPurge(pendingRes.data);
      if (logsRes.success && logsRes.data) setCleanupLogs(logsRes.data);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      if (isManual) setIsRefreshing(false);
    }
  }, []);

  // Initial load and Real-time background sync (every 4 seconds)
  useEffect(() => {
    let mounted = true;

    async function initialFetch() {
      if (!mounted) return;
      await loadData(false);
    }

    initialFetch();

    const interval = setInterval(() => {
      if (mounted) {
        loadData(false);
      }
    }, 4000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [loadData]);

  const handleToggleUserSuspension = async (userId: string, currentStatus: string) => {
    const isSuspended = currentStatus === 'suspended';
    await toggleUserSuspensionAction(userId, !isSuspended);
    await loadData(false);
  };

  const handleAdminRevoke = async (shareId: string) => {
    await adminRevokeShareAction(shareId);
    await loadData(false);
  };

  const handleAdminDelete = async (shareId: string) => {
    await adminDeleteShareAction(shareId);
    await loadData(false);
  };

  const handleResolveReport = async (reportId: string, status: 'resolved' | 'rejected', deleteContent = false) => {
    await resolveReportAction(reportId, status, deleteContent);
    await loadData(false);
  };

  const handleRunStoragePurge = async () => {
    setPurging(true);
    setPurgeSuccess(null);
    setPurgeError(null);

    try {
      const res = await runStorageCleanupAction();
      if (res.success && res.data) {
        setPurgeSuccess(res.data);
        await loadData(false);
      } else {
        setPurgeError(res.error || 'Failed to execute storage purge.');
      }
    } catch (err: unknown) {
      setPurgeError(err instanceof Error ? err.message : 'Purge failed.');
    } finally {
      setPurging(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="warning" size="sm">
              <ShieldCheck className="w-3.5 h-3.5" />
              Administrative Portal
            </Badge>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Real-Time Sync Active</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Platform Administration & Maintenance
          </h1>
          <p className="text-xs text-slate-500">
            Real-time analytics, user access controls, abuse moderation, and storage purge automation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData(true)}
            isLoading={isRefreshing}
            leftIcon={<RotateCcw className="w-3.5 h-3.5 text-blue-600" />}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh Now'}
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 overflow-x-auto">
        {(
          [
            { id: 'metrics', label: 'Platform Overview', icon: <Share2 className="w-4 h-4" /> },
            { id: 'users', label: `Users (${users.length})`, icon: <Users className="w-4 h-4" /> },
            { id: 'shares', label: `Shares Audit (${shares.length})`, icon: <FileText className="w-4 h-4" /> },
            { id: 'reports', label: `Reports (${reports.filter((r) => r.status === 'pending').length} pending)`, icon: <Flag className="w-4 h-4" /> },
            { id: 'maintenance', label: 'Storage Purge & Cron', icon: <Trash2 className="w-4 h-4 text-blue-600" /> },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === t.id
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: METRICS OVERVIEW */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5 space-y-1 bg-white border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500">Total Registered Users</span>
              <p className="text-2xl font-black text-slate-900">{stats?.totalUsers ?? 0}</p>
              <span className="text-[11px] text-slate-400">{stats?.suspendedUsers ?? 0} suspended</span>
            </Card>

            <Card className="p-5 space-y-1 bg-white border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500">Active Shares</span>
              <p className="text-2xl font-black text-emerald-600">{stats?.activeShares ?? 0}</p>
              <span className="text-[11px] text-slate-400">{stats?.totalShares ?? 0} total created</span>
            </Card>

            <Card className="p-5 space-y-1 bg-white border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500">Total Downloads</span>
              <p className="text-2xl font-black text-blue-600">{stats?.totalDownloads ?? 0}</p>
              <span className="text-[11px] text-slate-400">{stats?.totalViews ?? 0} views</span>
            </Card>

            <Card className="p-5 space-y-1 bg-white border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500">Storage Consumption</span>
              <p className="text-2xl font-black text-purple-600">
                {formatBytes(stats?.totalStorageBytes ?? 0)}
              </p>
              <span className="text-[11px] text-slate-400">Encrypted in bucket</span>
            </Card>
          </div>

          {/* Quick Abuse Alert Box */}
          {Boolean(stats && stats.pendingReports > 0) && (
            <div className="flex items-center justify-between p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold">Action Required: Pending Content Reports</h4>
                  <p className="text-xs text-amber-700">
                    There are {stats?.pendingReports} unreviewed user abuse reports awaiting moderation.
                  </p>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setActiveTab('reports')}
              >
                Review Reports
              </Button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="w-full sm:w-80">
            <Input
              placeholder="Search by name or email..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <Card className="p-0 overflow-hidden bg-white border-slate-200 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider font-semibold text-slate-600">
                  <tr>
                    <th className="px-4 py-3.5">User / Email</th>
                    <th className="px-4 py-3.5">Role</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5">Joined</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users
                    .filter((u) => {
                      if (!userSearch) return true;
                      const q = userSearch.toLowerCase();
                      return (
                        u.full_name?.toLowerCase().includes(q) ||
                        u.email?.toLowerCase().includes(q)
                      );
                    })
                    .map((u) => (
                      <tr key={u.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">
                            {u.full_name || 'Anonymous User'}
                          </div>
                          <div className="text-xs font-mono text-slate-500">
                            {u.email}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={u.role === 'admin' ? 'warning' : 'default'} size="sm">
                            {u.role}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={u.status === 'active' ? 'success' : 'danger'} size="sm">
                            {u.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant={u.status === 'suspended' ? 'outline' : 'destructive'}
                            size="sm"
                            onClick={() => handleToggleUserSuspension(u.id, u.status)}
                          >
                            {u.status === 'suspended' ? 'Unsuspend' : 'Suspend'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: SHARES MODERATION */}
      {activeTab === 'shares' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-80">
              <Input
                placeholder="Search by code or title..."
                value={shareSearch}
                onChange={(e) => setShareSearch(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
          </div>

          <Card className="p-0 overflow-hidden bg-white border-slate-200 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider font-semibold text-slate-600">
                  <tr>
                    <th className="px-4 py-3.5">Code</th>
                    <th className="px-4 py-3.5">Title / File</th>
                    <th className="px-4 py-3.5">Type</th>
                    <th className="px-4 py-3.5">Size</th>
                    <th className="px-4 py-3.5">Downloads</th>
                    <th className="px-4 py-3.5">Expires</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5 text-right">Moderation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {shares
                    .filter((s) => {
                      if (!shareSearch) return true;
                      const q = shareSearch.toLowerCase();
                      return (
                        s.share_code.includes(q) ||
                        s.title?.toLowerCase().includes(q) ||
                        s.file_name?.toLowerCase().includes(q)
                      );
                    })
                    .map((s) => {
                      const isExpired = new Date(s.expires_at).getTime() <= now;
                      return (
                        <tr key={s.id} className="hover:bg-blue-50/30 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-blue-600">
                            {s.share_code}
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-900 max-w-[200px] truncate">
                            {s.title || s.file_name || 'Snippet'}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={s.type === 'file' ? 'info' : 'purple'} size="sm">
                              {s.type}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500">
                            {s.file_size ? formatBytes(s.file_size) : `${s.text_content?.length || 0} chars`}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-700 font-mono">
                            {s.download_count} {s.max_downloads ? `/ ${s.max_downloads}` : ''}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500">
                            {new Date(s.expires_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant={s.revoked ? 'danger' : isExpired ? 'default' : 'success'}
                              size="sm"
                            >
                              {s.revoked ? 'Revoked' : isExpired ? 'Expired' : 'Active'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {!s.revoked && (
                                <button
                                  onClick={() => handleAdminRevoke(s.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 cursor-pointer"
                                  title="Revoke access"
                                >
                                  <Ban className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleAdminDelete(s.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                                title="Delete permanently"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 4: ABUSE REPORTS RESOLUTION */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <Card className="p-0 overflow-hidden bg-white border-slate-200 shadow-sm">
            {reports.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                No user reports have been filed.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider font-semibold text-slate-600">
                    <tr>
                      <th className="px-4 py-3.5">Report Reason</th>
                      <th className="px-4 py-3.5">Details</th>
                      <th className="px-4 py-3.5">Date</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reports.map((r) => (
                      <tr key={r.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-4 py-3">
                          <Badge variant="danger" size="sm">
                            {r.reason}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-700 max-w-md">
                          <p className="line-clamp-2">{r.description || 'No description provided.'}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {new Date(r.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              r.status === 'resolved'
                                ? 'success'
                                : r.status === 'rejected'
                                ? 'default'
                                : 'warning'
                            }
                            size="sm"
                          >
                            {r.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {r.status === 'pending' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleResolveReport(r.id, 'resolved', true)}
                              >
                                Ban & Delete
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleResolveReport(r.id, 'rejected', false)}
                              >
                                Dismiss
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">Processed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 5: STORAGE PURGE & AUTOMATED MAINTENANCE */}
      {activeTab === 'maintenance' && (
        <div className="space-y-6">
          {/* Top Control Panel */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card glow className="p-6 space-y-3 bg-white border-blue-200 shadow-md">
              <div className="flex items-center gap-2.5 text-blue-600">
                <Trash2 className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900">Manual Storage Purge</h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Permanently purge all expired, revoked, and burned shares from database & Supabase Storage.
              </p>
              <Button
                variant="glow"
                size="md"
                shakeOnHover={true}
                className="w-full mt-2"
                isLoading={purging}
                onClick={handleRunStoragePurge}
                leftIcon={<Zap className="w-4 h-4" />}
              >
                {purging ? 'Purging Storage...' : 'Run Storage Purge Now'}
              </Button>
            </Card>

            <Card className="p-6 space-y-2 bg-white border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 text-amber-600">
                <Clock className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900">Pending Purge Queue</h3>
              </div>
              <p className="text-2xl font-black text-amber-600">
                {pendingPurge.pendingSharesCount} shares
              </p>
              <p className="text-xs text-slate-500">
                Estimated {formatBytes(pendingPurge.pendingEstimatedBytes)} space awaiting garbage collection.
              </p>
            </Card>

            <Card className="p-6 space-y-2 bg-white border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 text-emerald-600">
                <Activity className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900">Automated Schedule</h3>
              </div>
              <p className="text-2xl font-black text-emerald-600">Daily Cron</p>
              <p className="text-xs text-slate-500">
                Configured via <code className="text-blue-600 font-mono">vercel.json</code>.
              </p>
            </Card>
          </div>

          {/* Purge Feedback Alerts */}
          {purgeSuccess && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <strong className="block text-slate-900 text-sm font-bold">Storage Purge Successful!</strong>
                <span>
                  Deleted {purgeSuccess.sharesDeleted} share records, removed {purgeSuccess.filesRemoved} files, and reclaimed {formatBytes(purgeSuccess.bytesReclaimed)} in {purgeSuccess.durationMs}ms.
                </span>
              </div>
            </div>
          )}

          {purgeError && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
              <div>
                <strong className="block text-slate-900 text-sm font-bold">Purge Execution Failed</strong>
                <span>{purgeError}</span>
              </div>
            </div>
          )}

          {/* Cron Trigger Documentation / Webhook Instructions */}
          <Card className="p-6 space-y-4 bg-white border-slate-200 shadow-sm">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <Terminal className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-bold text-slate-900">Automated Cron API Webhook</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              You can trigger the automated storage purge endpoint remotely via cron services (e.g. cron-job.org, EasyCron, Supabase pg_cron, or AWS CloudWatch):
            </p>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-blue-300 overflow-x-auto select-all">
              curl -X POST https://deploshare-livesecure.vercel.app/api/cron/cleanup -H &quot;Authorization: Bearer YOUR_CRON_SECRET&quot;
            </div>
          </Card>

          {/* Past Cleanup Logs Table */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Maintenance Sweep History
            </h3>

            <Card className="p-0 overflow-hidden bg-white border-slate-200 shadow-sm">
              {cleanupLogs.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No automated cleanup logs recorded yet. Run a manual purge or wait for scheduled cron.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider font-semibold text-slate-600">
                      <tr>
                        <th className="px-4 py-3">Timestamp</th>
                        <th className="px-4 py-3">Triggered By</th>
                        <th className="px-4 py-3 text-center">Shares Purged</th>
                        <th className="px-4 py-3 text-center">Files Removed</th>
                        <th className="px-4 py-3 text-center">Reclaimed Space</th>
                        <th className="px-4 py-3 text-right">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {cleanupLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-blue-50/30 transition-colors">
                          <td className="px-4 py-3 text-slate-700 font-mono">
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={log.triggered_by === 'cron' ? 'info' : 'purple'} size="sm">
                              {log.triggered_by}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-center text-slate-900 font-semibold">
                            {log.shares_deleted}
                          </td>
                          <td className="px-4 py-3 text-center text-slate-900 font-semibold">
                            {log.files_removed}
                          </td>
                          <td className="px-4 py-3 text-center text-emerald-600 font-semibold">
                            {formatBytes(log.bytes_reclaimed)}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-500 font-mono">
                            {log.duration_ms}ms
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
