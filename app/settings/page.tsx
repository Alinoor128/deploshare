'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  getCurrentUserAction,
  updateProfileAction,
  changePasswordAction,
  deleteAccountAction,
} from '@/lib/actions/auth-actions';
import { getUserSharesAction } from '@/lib/actions/share-actions';
import {
  getUserApiKeysAction,
  createApiKeyAction,
  revokeApiKeyAction,
  NewApiKeyResponse,
} from '@/lib/actions/api-key-actions';
import { formatBytes } from '@/lib/security/sanitizer';
import { User } from '@supabase/supabase-js';
import { Profile, ApiKey } from '@/types/database';
import {
  User as UserIcon,
  Lock,
  HardDrive,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Key,
  Copy,
  Check,
  Code2,
  Plus,
  Ban,
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [, setProfile] = useState<Profile | null>(null);

  // Profile Form
  const [fullName, setFullName] = useState('');
  const [profileUpdating, setProfileUpdating] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password Form
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordUpdating, setPasswordUpdating] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Storage Stats
  const [storageUsedBytes, setStorageUsedBytes] = useState(0);

  // API Keys
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [creatingKey, setCreatingKey] = useState(false);
  const [newKeyData, setNewKeyData] = useState<NewApiKeyResponse | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);

  // Delete Account Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Stripe Checkout
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const handleUpgrade = async (plan: 'PRO' | 'BUSINESS') => {
    setCheckoutLoading(plan);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to initialize Stripe checkout.');
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Checkout error');
    } finally {
      setCheckoutLoading(null);
    }
  };

  const loadData = async () => {
    try {
      const [userRes, sharesRes, keysRes] = await Promise.all([
        getCurrentUserAction(),
        getUserSharesAction(),
        getUserApiKeysAction(),
      ]);

      if (!userRes.user) {
        router.push('/login');
        return;
      }

      setUser(userRes.user);
      if (userRes.profile) {
        setProfile(userRes.profile);
        setFullName(userRes.profile.full_name || '');
      }

      if (sharesRes.success && sharesRes.data) {
        const total = sharesRes.data.reduce((acc, s) => acc + (s.file_size || 0), 0);
        setStorageUsedBytes(total);
      }

      if (keysRes.success && keysRes.data) {
        setApiKeys(keysRes.data);
      }
    } catch {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    async function init() {
      try {
        const [userRes, sharesRes, keysRes] = await Promise.all([
          getCurrentUserAction(),
          getUserSharesAction(),
          getUserApiKeysAction(),
        ]);

        if (!active) return;
        if (!userRes.user) {
          router.push('/login');
          return;
        }

        setUser(userRes.user);
        if (userRes.profile) {
          setProfile(userRes.profile);
          setFullName(userRes.profile.full_name || '');
        }

        if (sharesRes.success && sharesRes.data) {
          const total = sharesRes.data.reduce((acc, s) => acc + (s.file_size || 0), 0);
          setStorageUsedBytes(total);
        }

        if (keysRes.success && keysRes.data) {
          setApiKeys(keysRes.data);
        }
      } catch {
        if (active) router.push('/login');
      } finally {
        if (active) setLoading(false);
      }
    }
    init();
    return () => {
      active = false;
    };
  }, [router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileUpdating(true);
    setProfileSuccess(false);
    setProfileError(null);

    try {
      const res = await updateProfileAction(fullName);
      if (res.success) {
        setProfileSuccess(true);
        setTimeout(() => setProfileSuccess(false), 3000);
      } else {
        setProfileError(res.error || 'Failed to update profile.');
      }
    } catch (err: unknown) {
      setProfileError(err instanceof Error ? err.message : 'Update failed.');
    } finally {
      setProfileUpdating(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordUpdating(true);
    setPasswordSuccess(false);
    setPasswordError(null);

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      setPasswordUpdating(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      setPasswordUpdating(false);
      return;
    }

    try {
      const res = await changePasswordAction(newPassword);
      if (res.success) {
        setPasswordSuccess(true);
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccess(false), 3000);
      } else {
        setPasswordError(res.error || 'Failed to change password.');
      }
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : 'Change password failed.');
    } finally {
      setPasswordUpdating(false);
    }
  };

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingKey(true);
    setApiKeyError(null);

    try {
      const res = await createApiKeyAction(newKeyName || 'Production API Key');
      if (res.success && res.data) {
        setNewKeyData(res.data);
        setNewKeyName('');
        await loadData();
      } else {
        setApiKeyError(res.error || 'Failed to create API key.');
      }
    } catch (err: unknown) {
      setApiKeyError(err instanceof Error ? err.message : 'Failed to create API key.');
    } finally {
      setCreatingKey(false);
    }
  };

  const handleRevokeApiKey = async (keyId: string) => {
    await revokeApiKeyAction(keyId);
    await loadData();
  };

  const handleCopyNewKey = async () => {
    if (!newKeyData?.rawKey) return;
    await navigator.clipboard.writeText(newKeyData.rawKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setDeleteError('Type DELETE in all caps to confirm.');
      return;
    }

    setDeletingAccount(true);
    setDeleteError(null);

    try {
      const res = await deleteAccountAction();
      if (res.success) {
        router.push('/');
        router.refresh();
      } else {
        setDeleteError(res.error || 'Failed to delete account.');
        setDeletingAccount(false);
      }
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Deletion failed.');
      setDeletingAccount(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Account & Developer Settings
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your personal security preferences, storage quotas, and REST API access.
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Details */}
        <Card className="p-6 space-y-4 bg-white border-slate-200 shadow-sm">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <UserIcon className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">Profile Information</h2>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4 text-left">
            <Input
              label="Email Address"
              value={user?.email || ''}
              disabled
              helperText="Your account email address cannot be changed."
            />

            <Input
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
            />

            {profileSuccess && (
              <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                <span>Profile details updated successfully.</span>
              </div>
            )}

            {profileError && (
              <div className="flex items-center gap-2 text-xs text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span>{profileError}</span>
              </div>
            )}

            <Button type="submit" variant="primary" size="sm" isLoading={profileUpdating}>
              Save Profile Changes
            </Button>
          </form>
        </Card>

        {/* SUBSCRIPTION & BILLING */}
        <Card className="p-6 space-y-5 bg-white border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <HardDrive className="w-5 h-5 text-blue-600" />
              <div>
                <h2 className="text-base font-bold text-slate-900">Subscription & Storage Quota</h2>
                <p className="text-xs text-slate-500">
                  Manage your subscription tier, billing, and file size allowances.
                </p>
              </div>
            </div>
            <Badge variant="info" size="md">
              Current Plan: Free Tier (25 MB)
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Pro Tier Upgrade */}
            <div className="p-5 rounded-2xl border border-blue-200 bg-blue-50/40 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-900">DeploShare Pro</h3>
                <span className="text-base font-black text-blue-600">$9 / mo</span>
              </div>
              <ul className="text-xs text-slate-600 space-y-1.5">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>2 GB per upload file limit</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>30-day retention policies</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Unlimited active shares</span>
                </li>
              </ul>
              <Button
                variant="glow"
                size="sm"
                className="w-full"
                isLoading={checkoutLoading === 'PRO'}
                onClick={() => handleUpgrade('PRO')}
              >
                Upgrade to Pro ($9)
              </Button>
            </div>

            {/* Business Tier Upgrade */}
            <div className="p-5 rounded-2xl border border-purple-200 bg-purple-50/40 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-900">DeploShare Business</h3>
                <span className="text-base font-black text-purple-600">$29 / mo</span>
              </div>
              <ul className="text-xs text-slate-600 space-y-1.5">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                  <span>10 GB per upload file limit</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                  <span>90-day retention policies</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                  <span>REST API priority rate limits</span>
                </li>
              </ul>
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                isLoading={checkoutLoading === 'BUSINESS'}
                onClick={() => handleUpgrade('BUSINESS')}
              >
                Upgrade to Business ($29)
              </Button>
            </div>
          </div>
        </Card>

        {/* DEVELOPER REST API KEYS */}
        <Card glow className="p-6 space-y-5 bg-white border-blue-200 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <Key className="w-5 h-5 text-blue-600" />
              <div>
                <h2 className="text-base font-bold text-slate-900">Developer REST API Keys</h2>
                <p className="text-xs text-slate-500">
                  Authenticate programmatic file & text transfers via the DeploShare v1 API.
                </p>
              </div>
            </div>
            <Link href="/api-docs">
              <Button variant="outline" size="sm" leftIcon={<Code2 className="w-4 h-4 text-blue-600" />}>
                View API Docs
              </Button>
            </Link>
          </div>

          {/* Create New Key Form */}
          <form onSubmit={handleCreateApiKey} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Key Name (e.g. CI/CD Pipeline, Mobile App)"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              variant="glow"
              size="md"
              isLoading={creatingKey}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Generate Key
            </Button>
          </form>

          {apiKeyError && (
            <div className="flex items-center gap-2 text-xs text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span>{apiKeyError}</span>
            </div>
          )}

          {/* Active API Keys List */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Active API Keys ({apiKeys.length})
            </h3>

            {apiKeys.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center">
                No API keys created yet. Generate one above to start using the REST API.
              </div>
            ) : (
              <div className="space-y-2">
                {apiKeys.map((k) => (
                  <div
                    key={k.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{k.name}</span>
                        <Badge variant={k.revoked ? 'danger' : 'success'} size="sm">
                          {k.revoked ? 'Revoked' : 'Active'}
                        </Badge>
                      </div>
                      <p className="text-xs font-mono text-blue-700 font-semibold">
                        {k.key_prefix}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Created: {new Date(k.created_at).toLocaleDateString()} • Last used:{' '}
                        {k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : 'Never'}
                      </p>
                    </div>

                    {!k.revoked && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRevokeApiKey(k.id)}
                        leftIcon={<Ban className="w-3.5 h-3.5" />}
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Change Password */}
        <Card className="p-6 space-y-4 bg-white border-slate-200 shadow-sm">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Lock className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">Change Password</h2>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4 text-left">
            <Input
              label="New Password"
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            {passwordSuccess && (
              <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                <span>Password updated successfully.</span>
              </div>
            )}

            {passwordError && (
              <div className="flex items-center gap-2 text-xs text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span>{passwordError}</span>
              </div>
            )}

            <Button type="submit" variant="primary" size="sm" isLoading={passwordUpdating}>
              Update Password
            </Button>
          </form>
        </Card>

        {/* Storage Stats */}
        <Card className="p-6 space-y-4 bg-white border-slate-200 shadow-sm">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <HardDrive className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">Storage & Usage Quota</h2>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Total Active File Storage</span>
              <span className="text-slate-900 font-mono font-bold">
                {formatBytes(storageUsedBytes)} / 5.0 GB (Free Plan)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-blue-600"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(2, (storageUsedBytes / (5 * 1024 * 1024 * 1024)) * 100)
                  )}%`,
                }}
              />
            </div>
          </div>
        </Card>

        {/* Danger Zone: Delete Account */}
        <Card className="p-6 space-y-4 border-red-200 bg-red-50/40">
          <div className="flex items-center gap-2.5 pb-3 border-b border-red-200">
            <Trash2 className="w-5 h-5 text-red-600" />
            <h2 className="text-base font-bold text-red-700">Danger Zone</h2>
          </div>

          <p className="text-xs text-slate-600">
            Deleting your account will permanently purge all your active shares, uploaded files, analytics records, and API keys. This action cannot be undone.
          </p>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteModalOpen(true)}
          >
            Delete Account Permanently
          </Button>
        </Card>
      </div>

      {/* NEW API KEY MODAL (SHOWN ONCE) */}
      <Modal
        isOpen={Boolean(newKeyData)}
        onClose={() => setNewKeyData(null)}
        title="API Key Created Successfully"
        description="Please copy your secret API key now. For security reasons, you will not be able to see it again."
        maxWidth="md"
      >
        <div className="space-y-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Secret Key ({newKeyData?.name})
            </span>
            <div className="flex items-center justify-between gap-2 font-mono text-xs text-blue-800 select-all break-all font-bold">
              <span>{newKeyData?.rawKey}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyNewKey}
                leftIcon={copiedKey ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              >
                {copiedKey ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
            Keep this key safe! Anyone with this key can create and manage shares on your behalf.
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="glow" size="sm" onClick={() => setNewKeyData(null)}>
              Done
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Permanent Account Deletion"
        description="This action cannot be undone. All your files, text shares, access codes, and API keys will be immediately deleted."
        maxWidth="sm"
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-slate-600">
            Type <strong className="text-slate-900 font-mono">DELETE</strong> below to confirm.
          </p>

          <Input
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="DELETE"
          />

          {deleteError && (
            <div className="flex items-center gap-2 text-xs text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span>{deleteError}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              isLoading={deletingAccount}
              onClick={handleDeleteAccount}
            >
              Delete Account
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
