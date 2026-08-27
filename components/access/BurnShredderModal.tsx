'use client';

import React, { useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { playBurnDestructSound } from '@/lib/audio/sound-effects';
import { Flame, ShieldCheck, CheckCircle2 } from 'lucide-react';

export interface BurnShredderModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareCode: string;
  fileName?: string | null;
}

export function BurnShredderModal({
  isOpen,
  onClose,
  shareCode,
  fileName,
}: BurnShredderModalProps) {
  useEffect(() => {
    if (isOpen) {
      playBurnDestructSound();
    }
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="sm"
      title="Share Permanently Shredded"
      description="Burn-on-download protocol was triggered. This content is now completely destroyed."
    >
      <div className="space-y-6 pt-2 text-center">
        {/* Animated Shredder Graphic */}
        <div className="relative py-6 flex flex-col items-center justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 shadow-lg shadow-amber-500/10 animate-pulse">
            <Flame className="w-10 h-10 text-amber-600 animate-bounce" />
          </div>

          <div className="mt-4 space-y-1">
            <span className="font-mono text-lg font-black text-amber-700">
              CODE: {shareCode}
            </span>
            <p className="text-xs text-slate-500 truncate max-w-xs">
              {fileName || 'Confidential Share'}
            </p>
          </div>
        </div>

        {/* Destruction Guarantee Box */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-left space-y-2">
          <div className="flex items-center gap-2 text-emerald-600 font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Zero-Footprint Purge Complete</span>
          </div>
          <p className="text-slate-600 text-[11px] leading-relaxed">
            The file payload and encryption records have been permanently expunged from private cloud storage. Any future access attempt to code <strong className="text-slate-900 font-mono">{shareCode}</strong> will return 404/410.
          </p>
        </div>

        <div className="flex justify-center pt-2">
          <Button
            variant="glow"
            size="md"
            onClick={onClose}
            className="w-full"
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
          >
            I Understand
          </Button>
        </div>
      </div>
    </Modal>
  );
}
