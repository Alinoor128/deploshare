'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { ReportModal } from '@/components/access/ReportModal';
import { BurnShredderModal } from '@/components/access/BurnShredderModal';
import { SharePublicView } from '@/types/database';
import { formatBytes, calculateTimeRemaining } from '@/lib/security/sanitizer';
import { getSecureDownloadUrlAction, accessShareByCodeAction } from '@/lib/actions/access-actions';
import { decryptText } from '@/lib/crypto/e2ee';
import { playDownloadSound } from '@/lib/audio/sound-effects';
import {
  FileIcon,
  Download,
  Copy,
  Check,
  Clock,
  Lock,
  Flame,
  Flag,
  FileText,
  AlertCircle,
  Eye,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
  Key,
} from 'lucide-react';

export interface PublicShareViewerProps {
  share: SharePublicView;
  onRefresh?: () => void;
}

export function PublicShareViewer({ share: initialShare }: PublicShareViewerProps) {
  const [share, setShare] = useState<SharePublicView>(initialShare);
  const [copiedText, setCopiedText] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [burnModalOpen, setBurnModalOpen] = useState(false);

  // Password unlock state
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);

  // E2EE Decryption state
  const [e2eeDecryptedText, setE2eeDecryptedText] = useState<string | null>(null);
  const [e2eeKeyInput, setE2eeKeyInput] = useState('');
  const [e2eeError, setE2eeError] = useState<string | null>(null);

  // Download state
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Countdown timer state
  const [timeRemaining, setTimeRemaining] = useState(
    calculateTimeRemaining(share.expires_at)
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining(share.expires_at));
    }, 1000);
    return () => clearInterval(timer);
  }, [share.expires_at]);

  const isE2ee = Boolean(
    share.text_content && share.text_content.startsWith('[DPS_E2EE_V1_PAYLOAD]:')
  );

  // Attempt automatic client-side E2EE decryption for text shares
  useEffect(() => {
    if (!isE2ee || !share.text_content) return;
    const payload = share.text_content.replace('[DPS_E2EE_V1_PAYLOAD]:', '');
    const keyCandidate = passwordInput || share.share_code;

    decryptText(payload, keyCandidate)
      .then((plain) => {
        setE2eeDecryptedText(plain);
        setE2eeError(null);
      })
      .catch(() => {
        setE2eeError('Encrypted with Zero-Knowledge E2EE. Enter decryption passphrase below.');
      });
  }, [isE2ee, share.text_content, share.share_code, passwordInput]);

  const handleManualE2eeDecrypt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!e2eeKeyInput.trim() || !share.text_content) return;

    try {
      const payload = share.text_content.replace('[DPS_E2EE_V1_PAYLOAD]:', '');
      const plain = await decryptText(payload, e2eeKeyInput.trim());
      setE2eeDecryptedText(plain);
      setE2eeError(null);
    } catch {
      setE2eeError('Incorrect decryption key phrase.');
    }
  };

  // Handle password unlock for password-protected shares
  const handleUnlockWithPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) {
      setPasswordError('Please enter the password.');
      return;
    }

    setIsUnlocking(true);
    setPasswordError(null);

    try {
      const res = await accessShareByCodeAction(share.share_code, passwordInput);
      if (res.success && res.data) {
        setShare(res.data);
      } else {
        setPasswordError(res.error || 'Incorrect password.');
      }
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : 'Unlock failed.');
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleCopyText = async () => {
    const textToCopy = isE2ee ? e2eeDecryptedText : share.text_content;
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownload = async () => {
    if (!share.allow_download) return;
    setIsDownloading(true);
    setDownloadError(null);

    try {
      const res = await getSecureDownloadUrlAction(
        share.share_code,
        passwordInput || undefined
      );

      if (!res.success || !res.data) {
        setDownloadError(res.error || 'Failed to download file.');
        setIsDownloading(false);
        return;
      }

      // Play download chime sound
      playDownloadSound();

      // Trigger browser download via ephemeral signed URL
      const link = document.createElement('a');
      link.href = res.data.downloadUrl;
      link.download = share.file_name || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadSuccess(true);
      // Update local download count
      setShare((prev) => ({
        ...prev,
        download_count: prev.download_count + 1,
      }));

      // Trigger Burn Destruction Modal if share was burned
      if (res.data.burned || share.burn_after_download) {
        setTimeout(() => {
          setBurnModalOpen(true);
        }, 1200);
      }
    } catch (err: unknown) {
      setDownloadError(err instanceof Error ? err.message : 'Download error.');
    } finally {
      setIsDownloading(false);
    }
  };

  // If password protected and content not yet unlocked
  const needsPasswordPrompt = share.is_password_protected && !share.text_content && !share.preview_url && share.type === 'text';

  const isImage = share.mime_type?.startsWith('image/');
  const isPdf = share.mime_type === 'application/pdf';

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Top Banner & Expiry */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-bold text-slate-900 tracking-widest">
                CODE: {share.share_code}
              </span>
              {share.is_password_protected && (
                <Badge variant="purple" size="sm">
                  <Lock className="w-3 h-3" /> Password Protected
                </Badge>
              )}
              {share.burn_after_download && (
                <Badge variant="warning" size="sm">
                  <Flame className="w-3 h-3" /> Burn On Download
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified Ephemeral Share • DeploShare Zero-Log Protocol
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <Clock className={`w-3.5 h-3.5 ${timeRemaining.isExpired ? 'text-red-500' : 'text-amber-600'}`} />
            <span className={timeRemaining.isExpired ? 'text-red-600 font-semibold' : 'text-slate-700 font-medium'}>
              {timeRemaining.formatted}
            </span>
          </div>

          <button
            onClick={() => setReportModalOpen(true)}
            className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Report abuse or malicious content"
          >
            <Flag className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* PASSWORD REQUIRED PROMPT CARD */}
      {needsPasswordPrompt ? (
        <Card glow className="p-8 max-w-md mx-auto text-center space-y-6 bg-white border-slate-200 shadow-xl shadow-blue-500/5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mx-auto border border-blue-200 shadow-sm">
            <Lock className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900">
              Password Protected Share
            </h2>
            <p className="text-xs text-slate-500">
              The sender encrypted this content with an extra password. Enter it below to unlock.
            </p>
          </div>

          <form onSubmit={handleUnlockWithPassword} className="space-y-4 text-left">
            <Input
              label="Share Password"
              type="password"
              placeholder="Enter password..."
              value={passwordInput}
              onChange={(e) => {
                setPasswordInput(e.target.value);
                setPasswordError(null);
              }}
              autoFocus
              required
            />

            {passwordError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{passwordError}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="glow"
              size="lg"
              className="w-full"
              isLoading={isUnlocking}
            >
              Unlock Share Content
            </Button>
          </form>
        </Card>
      ) : (
        /* MAIN SHARE CONTENT VIEWER */
        <div className="space-y-6">
          {/* TEXT SHARE VIEW */}
          {share.type === 'text' && (
            <Card glow className="p-6 sm:p-8 space-y-6 bg-white border-slate-200 shadow-xl shadow-blue-500/5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      {share.title || 'Shared Text Snippet'}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Created on {new Date(share.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyText}
                  leftIcon={copiedText ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                >
                  {copiedText ? 'Copied Content' : 'Copy All Text'}
                </Button>
              </div>

              {/* Zero-Knowledge Decryption Form if locked */}
              {e2eeError && (
                <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-blue-900">
                    <Key className="w-4 h-4 text-blue-600" />
                    <span>{e2eeError}</span>
                  </div>
                  <form onSubmit={handleManualE2eeDecrypt} className="flex gap-2">
                    <Input
                      type="password"
                      placeholder="Enter decryption key..."
                      value={e2eeKeyInput}
                      onChange={(e) => setE2eeKeyInput(e.target.value)}
                    />
                    <Button type="submit" variant="glow" size="md">
                      Decrypt
                    </Button>
                  </form>
                </div>
              )}

              {/* Monospace Safe Render */}
              <div className="relative rounded-xl bg-slate-50 border border-slate-200 p-4 font-mono text-sm text-slate-900 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[500px] select-text shadow-inner">
                {(isE2ee ? e2eeDecryptedText : share.text_content) || 'Decrypted content will appear here...'}
              </div>

              {/* Text Metrics Footer */}
              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span>
                  {((isE2ee ? e2eeDecryptedText : share.text_content) || '').length} characters •{' '}
                  {((isE2ee ? e2eeDecryptedText : share.text_content) || '').trim() ? ((isE2ee ? e2eeDecryptedText : share.text_content) || '').trim().split(/\s+/).length : 0} words
                </span>
                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Sanitized & Safe
                </span>
              </div>
            </Card>
          )}

          {/* FILE SHARE VIEW */}
          {share.type === 'file' && (
            <div className="space-y-6">
              {/* File Info Card */}
              <Card glow className="p-6 sm:p-8 space-y-6 bg-white border-slate-200 shadow-xl shadow-blue-500/5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-200">
                      <FileIcon className="h-7 w-7" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-slate-900 truncate max-w-md">
                        {share.file_name || share.title || 'Shared File'}
                      </h2>
                      <p className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                        <span>{formatBytes(share.file_size || 0)}</span>
                        <span>•</span>
                        <span className="uppercase">{share.mime_type || 'Unknown Type'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Download Action Button */}
                  {share.allow_download ? (
                    <Button
                      variant="glow"
                      size="lg"
                      shakeOnHover={true}
                      shimmer={true}
                      onClick={handleDownload}
                      isLoading={isDownloading}
                      leftIcon={<Download className="w-5 h-5 text-white" />}
                    >
                      Download File Securely
                    </Button>
                  ) : (
                    <Badge variant="warning" size="md">
                      View Only (Downloads Disabled)
                    </Badge>
                  )}
                </div>

                {/* Constraints & Notice Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                    <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                      Downloads Count
                    </span>
                    <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                      {share.download_count} {share.max_downloads ? `/ ${share.max_downloads}` : 'times'}
                    </span>
                  </div>

                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                    <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                      Burn Mode
                    </span>
                    <span className="text-sm font-bold text-slate-900 mt-0.5 block flex items-center gap-1">
                      <Flame className={`w-3.5 h-3.5 ${share.burn_after_download ? 'text-amber-600' : 'text-slate-400'}`} />
                      {share.burn_after_download ? 'Burn on Download' : 'Standard'}
                    </span>
                  </div>

                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 col-span-2 sm:col-span-1">
                    <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                      Status
                    </span>
                    <span className="text-sm font-bold text-emerald-600 mt-0.5 block flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Active & Verified
                    </span>
                  </div>
                </div>

                {downloadError && (
                  <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{downloadError}</span>
                  </div>
                )}

                {downloadSuccess && (
                  <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>Download initiated successfully.</span>
                  </div>
                )}
              </Card>

              {/* INLINE SAFE PREVIEW SECTION */}
              <Card className="p-6 space-y-4 bg-white border-slate-200 shadow-md">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-600" />
                  File Preview
                </h3>

                {share.preview_url && isImage && (
                  <div className="flex justify-center bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <Image
                      src={share.preview_url}
                      alt={share.file_name || 'Preview'}
                      width={800}
                      height={500}
                      className="max-h-[500px] w-auto rounded-lg object-contain"
                      unoptimized
                    />
                  </div>
                )}

                {share.preview_url && isPdf && (
                  <div className="w-full h-[600px] rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                    <iframe
                      src={`${share.preview_url}#toolbar=0`}
                      className="w-full h-full"
                      title="PDF Preview"
                    />
                  </div>
                )}

                {!isImage && !isPdf && (
                  <div className="flex flex-col items-center justify-center p-8 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-2">
                    <FileIcon className="h-10 w-10 text-slate-400" />
                    <h4 className="text-sm font-semibold text-slate-700">
                      Preview unavailable for this format
                    </h4>
                    <p className="text-xs text-slate-500 max-w-sm">
                      This file format cannot be rendered safely in browser preview. Please download the file to inspect its content.
                    </p>
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Burn Shredder Destruct Modal */}
      <BurnShredderModal
        isOpen={burnModalOpen}
        onClose={() => setBurnModalOpen(false)}
        shareCode={share.share_code}
        fileName={share.file_name || share.title}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        shareCode={share.share_code}
      />
    </div>
  );
}
