'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { reportShareAction } from '@/lib/actions/report-actions';
import { ReportReason } from '@/types/database';
import { Flag, CheckCircle2, AlertCircle } from 'lucide-react';

export interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareCode: string;
}

export function ReportModal({ isOpen, onClose, shareCode }: ReportModalProps) {
  const [reason, setReason] = useState<ReportReason>('spam');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await reportShareAction(shareCode, reason, description);
      if (result.success) {
        setSubmitted(true);
      } else {
        setError(result.error || 'Failed to submit report.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSubmitted(false);
    setDescription('');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      maxWidth="md"
      title="Report Inappropriate Content"
      description="Help us maintain platform security by reporting content that violates terms."
    >
      {submitted ? (
        <div className="text-center py-6 space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mx-auto border border-emerald-200">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h4 className="text-base font-semibold text-slate-900">Report Submitted</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Thank you. Our moderation team will audit this share code immediately.
          </p>
          <Button variant="secondary" onClick={handleClose} className="mt-2">
            Close
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 pt-2 text-left">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Reason for Report
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as ReportReason)}
              className="w-full rounded-xl bg-white border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 cursor-pointer shadow-2xs"
            >
              <option value="spam">Spam / Phishing</option>
              <option value="malware">Malware / Malicious Code</option>
              <option value="copyright">Copyright Infringement</option>
              <option value="abuse">Abuse / Harassment</option>
              <option value="other">Other Violation</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Additional Details (Optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide context on why this content violates platform policies..."
              className="w-full rounded-xl bg-white border border-slate-200 p-3 text-sm text-slate-900 placeholder-slate-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 shadow-2xs"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              isLoading={isSubmitting}
              leftIcon={<Flag className="w-4 h-4" />}
            >
              Submit Report
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
