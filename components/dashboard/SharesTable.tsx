'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, BadgeProps } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Share } from '@/types/database';
import { revokeShareAction, deleteShareAction } from '@/lib/actions/share-actions';
import { calculateTimeRemaining } from '@/lib/security/sanitizer';
import {
  Search,
  Copy,
  Check,
  ExternalLink,
  Ban,
  Trash2,
  FileText,
  UploadCloud,
  Flame,
  Lock,
} from 'lucide-react';

export interface SharesTableProps {
  shares: Share[];
  onRefresh: () => void;
}

export function SharesTable({ shares, onRefresh }: SharesTableProps) {
  const [now] = useState(() => Date.now());
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'expired' | 'revoked' | 'file' | 'text'>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Revoke / Delete state
  const [selectedShare, setSelectedShare] = useState<Share | null>(null);
  const [actionType, setActionType] = useState<'revoke' | 'delete' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      // Fallback
    }
  };

  const handleConfirmAction = async () => {
    if (!selectedShare || !actionType) return;
    setIsProcessing(true);
    setActionError(null);

    try {
      if (actionType === 'revoke') {
        const res = await revokeShareAction(selectedShare.id);
        if (!res.success) {
          setActionError(res.error || 'Failed to revoke share.');
          setIsProcessing(false);
          return;
        }
      } else if (actionType === 'delete') {
        const res = await deleteShareAction(selectedShare.id);
        if (!res.success) {
          setActionError(res.error || 'Failed to delete share.');
          setIsProcessing(false);
          return;
        }
      }

      setIsProcessing(false);
      setSelectedShare(null);
      setActionType(null);
      onRefresh();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Action failed.');
      setIsProcessing(false);
    }
  };

  // Filter & Search logic
  const filteredShares = shares.filter((s) => {
    const isExpired = new Date(s.expires_at).getTime() <= now;

    // Filter type check
    if (filter === 'active' && (s.revoked || s.consumed || isExpired)) return false;
    if (filter === 'expired' && !isExpired && !s.consumed) return false;
    if (filter === 'revoked' && !s.revoked) return false;
    if (filter === 'file' && s.type !== 'file') return false;
    if (filter === 'text' && s.type !== 'text') return false;

    // Search query check
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const codeMatch = s.share_code.includes(q);
      const titleMatch = s.title?.toLowerCase().includes(q);
      const fileMatch = s.file_name?.toLowerCase().includes(q);
      if (!codeMatch && !titleMatch && !fileMatch) return false;
    }

    return true;
  });

  return (
    <div className="space-y-4">
      {/* Controls: Search and Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="w-full sm:w-72">
          <Input
            placeholder="Search by 6-digit code or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'active', label: 'Active' },
              { id: 'expired', label: 'Expired' },
              { id: 'revoked', label: 'Revoked' },
              { id: 'file', label: 'Files' },
              { id: 'text', label: 'Text' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                filter === tab.id
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table Card */}
      <Card className="p-0 overflow-hidden border-slate-200 bg-white shadow-sm">
        {filteredShares.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 border border-slate-200 mx-auto text-slate-400">
              <FileText className="h-6 w-6" />
            </div>
            <h4 className="text-base font-semibold text-slate-900">No shares found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {search || filter !== 'all'
                ? 'Try adjusting your search or filters to locate your share.'
                : 'You have not created any shares yet.'}
            </p>
            {!search && filter === 'all' && (
              <Link href="/share" className="inline-block mt-2">
                <Button variant="glow" size="sm" leftIcon={<UploadCloud className="w-4 h-4" />}>
                  Create your first share
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-3.5">Code</th>
                  <th className="px-4 py-3.5">Name / Title</th>
                  <th className="px-4 py-3.5">Type</th>
                  <th className="px-4 py-3.5">Created</th>
                  <th className="px-4 py-3.5">Expires</th>
                  <th className="px-4 py-3.5 text-center">Views</th>
                  <th className="px-4 py-3.5 text-center">Downloads</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredShares.map((s) => {
                  const isExpired = new Date(s.expires_at).getTime() <= now;
                  const time = calculateTimeRemaining(s.expires_at);

                  let statusVariant: BadgeProps['variant'] = 'success';
                  let statusText = 'Active';

                  if (s.revoked) {
                    statusVariant = 'danger';
                    statusText = 'Revoked';
                  } else if (s.consumed) {
                    statusVariant = 'purple';
                    statusText = 'Consumed';
                  } else if (isExpired) {
                    statusVariant = 'default';
                    statusText = 'Expired';
                  }

                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-blue-50/30 transition-colors group"
                    >
                      {/* Code */}
                      <td className="px-4 py-3 font-mono font-bold text-blue-600">
                        <button
                          onClick={() => handleCopyCode(s.share_code)}
                          className="flex items-center gap-1.5 hover:text-blue-800 transition-colors cursor-pointer"
                          title="Click to copy 6-digit code"
                        >
                          <span>{s.share_code}</span>
                          {copiedCode === s.share_code ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </button>
                      </td>

                      {/* Title */}
                      <td className="px-4 py-3 font-medium text-slate-900 max-w-[200px] truncate">
                        <div className="flex items-center gap-1.5">
                          {s.password_hash && (
                            <Lock className="w-3 h-3 text-indigo-600 shrink-0" />
                          )}
                          {s.burn_after_download && (
                            <Flame className="w-3 h-3 text-amber-600 shrink-0" />
                          )}
                          <span className="truncate">{s.title || s.file_name || 'Untitled'}</span>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-4 py-3">
                        <Badge
                          variant={s.type === 'file' ? 'info' : 'purple'}
                          size="sm"
                        >
                          {s.type === 'file' ? 'File' : 'Text'}
                        </Badge>
                      </td>

                      {/* Created */}
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {new Date(s.created_at).toLocaleDateString()}
                      </td>

                      {/* Expires */}
                      <td className="px-4 py-3 text-xs">
                        <span
                          className={
                            time.isExpired ? 'text-slate-400' : 'text-slate-700'
                          }
                        >
                          {time.formatted}
                        </span>
                      </td>

                      {/* Views */}
                      <td className="px-4 py-3 text-xs text-center font-mono text-slate-700">
                        {s.view_count || 0}
                      </td>

                      {/* Downloads */}
                      <td className="px-4 py-3 text-xs text-center font-mono text-slate-700">
                        {s.download_count || 0}
                        {s.max_downloads ? ` / ${s.max_downloads}` : ''}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <Badge variant={statusVariant} size="sm">
                          {statusText}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/access?code=${s.share_code}`} target="_blank">
                            <button
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Open public access page"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          </Link>

                          {!s.revoked && !isExpired && !s.consumed && (
                            <button
                              onClick={() => {
                                setSelectedShare(s);
                                setActionType('revoke');
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                              title="Revoke access"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setSelectedShare(s);
                              setActionType('delete');
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
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
        )}
      </Card>

      {/* Confirmation Modal */}
      <Modal
        isOpen={Boolean(selectedShare && actionType)}
        onClose={() => {
          setSelectedShare(null);
          setActionType(null);
          setActionError(null);
        }}
        maxWidth="sm"
        title={actionType === 'revoke' ? 'Revoke Share Access?' : 'Delete Share Permanently?'}
        description={
          actionType === 'revoke'
            ? `Are you sure you want to revoke code ${selectedShare?.share_code}? Recipients will no longer be able to access it.`
            : `Are you sure you want to delete share ${selectedShare?.share_code}? The record and encrypted storage file will be deleted permanently.`
        }
      >
        <div className="space-y-4 pt-2">
          {actionError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
              {actionError}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              variant="ghost"
              onClick={() => {
                setSelectedShare(null);
                setActionType(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant={actionType === 'revoke' ? 'secondary' : 'destructive'}
              isLoading={isProcessing}
              onClick={handleConfirmAction}
            >
              {actionType === 'revoke' ? 'Revoke Now' : 'Delete Permanently'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
