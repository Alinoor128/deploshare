'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { BRAND_CONFIG } from '@/lib/config/brand';
import {
  Copy,
  Check,
  Share2,
  QrCode,
  ExternalLink,
  PlusCircle,
  ShieldAlert,
  Clock,
  Lock,
  Download,
  Flame,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import QRCodeLib from 'qrcode';

export interface ShareResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareCode: string;
  shareId: string;
  expiresAt: string;
  shareType: 'file' | 'text';
  fileName?: string | null;
  fileSize?: number | null;
  isPasswordProtected?: boolean;
  maxDownloads?: number | null;
  burnAfterDownload?: boolean;
  onReset: () => void;
}

export function ShareResultModal({
  isOpen,
  onClose,
  shareCode,
  expiresAt,
  shareType,
  isPasswordProtected = false,
  maxDownloads,
  burnAfterDownload = false,
  onReset,
}: ShareResultModalProps) {
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  // Trigger confetti burst on open
  useEffect(() => {
    if (isOpen) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#6366f1', '#06b6d4', '#22c55e'],
      });
    }
  }, [isOpen]);

  // Generate QR Code
  useEffect(() => {
    if (isOpen && shareCode) {
      const accessUrl = `${typeof window !== 'undefined' ? window.location.origin : BRAND_CONFIG.url}/access?code=${shareCode}`;
      QRCodeLib.toDataURL(accessUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('QR code generation failed:', err));
    }
  }, [isOpen, shareCode]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(shareCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${BRAND_CONFIG.name} Share: ${shareCode}`,
          text: `Access this temporary ${shareType} share with 6-digit code: ${shareCode}`,
          url: `${window.location.origin}/access?code=${shareCode}`,
        });
      } catch {
        handleCopyCode();
      }
    } else {
      handleCopyCode();
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="lg"
      showCloseButton={true}
      title="Your file is ready"
    >
      <div className="space-y-6 text-center py-2">
        {/* Success Icon & Subtitle */}
        <div className="space-y-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 shadow-xs mx-auto">
            <Check className="w-7 h-7 stroke-[2.5]" />
          </div>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Your file has been secured and assigned a unique 6-digit access code.
          </p>
        </div>

        {/* 6-DIGIT SHARE CODE PRESENTATION */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-blue-50/70 via-white to-blue-50/40 border-2 border-blue-200 p-6 sm:p-8 shadow-sm">
          <span className="text-xs uppercase font-extrabold tracking-widest text-slate-500 block mb-3">
            YOUR SHARE CODE
          </span>

          <div className="flex items-center justify-center gap-2 sm:gap-3.5 my-3">
            {shareCode.split('').map((digit, index) => (
              <span
                key={index}
                className="flex h-14 w-11 sm:h-16 sm:w-14 items-center justify-center rounded-2xl bg-white border-2 border-blue-200 font-mono text-3xl sm:text-4xl font-black text-blue-700 shadow-xs select-all hover:scale-105 transition-transform"
              >
                {digit}
              </span>
            ))}
          </div>

          <p className="text-xs text-slate-500 mt-3 font-mono">
            Enter this code at{' '}
            <span className="text-blue-600 font-bold underline underline-offset-2">
              {typeof window !== 'undefined' ? window.location.host : BRAND_CONFIG.domain}/access
            </span>
          </p>
        </div>

        {/* Metadata Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-left">
          <div className="rounded-xl bg-white border border-slate-200 p-2.5 shadow-2xs">
            <span className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-blue-600" />
              Expires
            </span>
            <span className="text-xs font-semibold text-slate-800 block truncate mt-1">
              {new Date(expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(expiresAt).toLocaleDateString()})
            </span>
          </div>

          <div className="rounded-xl bg-white border border-slate-200 p-2.5 shadow-2xs">
            <span className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1">
              <Lock className="w-3 h-3 text-indigo-600" />
              Password
            </span>
            <span className="text-xs font-semibold text-slate-800 block mt-1">
              {isPasswordProtected ? 'Protected' : 'None'}
            </span>
          </div>

          <div className="rounded-xl bg-white border border-slate-200 p-2.5 shadow-2xs">
            <span className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1">
              <Download className="w-3 h-3 text-emerald-600" />
              Downloads
            </span>
            <span className="text-xs font-semibold text-slate-800 block mt-1">
              {maxDownloads ? `${maxDownloads} Max` : 'Unlimited'}
            </span>
          </div>

          <div className="rounded-xl bg-white border border-slate-200 p-2.5 shadow-2xs">
            <span className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-600" />
              Burn Mode
            </span>
            <span className="text-xs font-semibold text-slate-800 block mt-1">
              {burnAfterDownload ? 'Active' : 'Off'}
            </span>
          </div>
        </div>

        {/* Primary Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <Button
            variant={copied ? 'secondary' : 'glow'}
            size="lg"
            onClick={handleCopyCode}
            leftIcon={copied ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
          >
            {copied ? 'Copied ✓' : 'Copy Share Code'}
          </Button>

          <Button
            variant="secondary"
            size="lg"
            onClick={() => setQrOpen(true)}
            leftIcon={<QrCode className="w-5 h-5 text-slate-600" />}
          >
            Show QR
          </Button>
        </div>

        {/* Secondary Navigation */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNativeShare}
            leftIcon={<Share2 className="w-4 h-4 text-indigo-600" />}
          >
            Share Link
          </Button>

          <Link href={`/access?code=${shareCode}`} target="_blank">
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<ExternalLink className="w-4 h-4 text-blue-600" />}
            >
              Open Access Page
            </Button>
          </Link>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onClose();
              onReset();
            }}
            leftIcon={<PlusCircle className="w-4 h-4 text-emerald-600" />}
          >
            Create Another Share
          </Button>
        </div>

        {/* Security Advisory */}
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-left flex items-start gap-2.5 text-xs text-amber-900">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
          <p>
            <strong>Security Notice:</strong> Anyone with this 6-digit code may be able to access the share. Only share it with people you trust.
          </p>
        </div>
      </div>

      {/* QR Code Sub-Modal */}
      <Modal
        isOpen={qrOpen}
        onClose={() => setQrOpen(false)}
        maxWidth="sm"
        title="Scan Access QR Code"
        description="Scanning this QR code opens the access portal with your 6-digit code prefilled."
      >
        <div className="flex flex-col items-center justify-center p-4 space-y-4">
          <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-md flex items-center justify-center">
            {qrDataUrl ? (
              <Image
                src={qrDataUrl}
                alt={`QR code for ${shareCode}`}
                width={224}
                height={224}
                className="w-56 h-56 rounded-lg"
                unoptimized
              />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center text-slate-400 text-sm">
                Generating QR...
              </div>
            )}
          </div>
          <div className="text-center">
            <span className="font-mono text-xl font-black tracking-widest text-blue-600">
              {shareCode}
            </span>
          </div>
          <Button variant="secondary" className="w-full" onClick={() => setQrOpen(false)}>
            Close
          </Button>
        </div>
      </Modal>
    </Modal>
  );
}
