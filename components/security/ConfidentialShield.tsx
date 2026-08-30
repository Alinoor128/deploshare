'use client';

import React, { useState, useEffect } from 'react';
import { EyeOff } from 'lucide-react';

interface ConfidentialShieldProps {
  children: React.ReactNode;
  shareCode?: string;
  enabled?: boolean;
  watermarkText?: string;
}

export function ConfidentialShield({
  children,
  shareCode,
  enabled = true,
  watermarkText,
}: ConfidentialShieldProps) {
  const [isWindowBlurred, setIsWindowBlurred] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const handleBlur = () => {
      setIsWindowBlurred(true);
    };

    const handleFocus = () => {
      setIsWindowBlurred(false);
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [enabled]);

  if (!enabled) {
    return <>{children}</>;
  }

  const watermarkString =
    watermarkText ||
    `CONFIDENTIAL • DEPLOSHARE SECURE • PIN ${shareCode || '------'}`;

  return (
    <div
      className="relative select-none confidential-protected-root overflow-hidden rounded-xl"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Print Prevention Global Style */}
      <style jsx global>{`
        @media print {
          .confidential-protected-root,
          .confidential-protected-content {
            display: none !important;
            visibility: hidden !important;
          }
          body::after {
            content: "CONFIDENTIAL CONTENT — PRINTING & SCREEN EXTRACTION STRICTLY PROHIBITED BY DEPLOSHARE";
            font-size: 20pt;
            font-weight: bold;
            color: #dc2626;
            display: block;
            text-align: center;
            padding: 50px 20px;
          }
        }
      `}</style>

      {/* Repeating Diagonal Security Watermark */}
      <div
        className="pointer-events-none absolute inset-0 z-10 flex flex-wrap items-center justify-around gap-12 overflow-hidden opacity-[0.04] select-none text-slate-900 font-mono text-xs font-black tracking-widest uppercase rotate-[-25deg] scale-125"
        aria-hidden="true"
      >
        {Array.from({ length: 30 }).map((_, i) => (
          <span key={i} className="whitespace-nowrap">
            {watermarkString}
          </span>
        ))}
      </div>

      {/* Screen Snip / Blur Protection Overlay */}
      {isWindowBlurred && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 bg-slate-900/80 backdrop-blur-xl text-center text-white transition-all animate-fadeIn">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 mb-3 shadow-lg shadow-amber-500/10">
            <EyeOff className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold tracking-tight">Confidential Shield Active</h3>
          <p className="text-xs text-slate-300 max-w-sm mt-1 leading-relaxed">
            Window focus was lost or a screen capture utility was detected. Content is hidden to protect privacy.
          </p>
          <button
            onClick={() => setIsWindowBlurred(false)}
            className="mt-4 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer shadow-md transition-colors"
          >
            Click to Resume Viewing
          </button>
        </div>
      )}

      {/* Actual Protected Content */}
      <div
        className={`confidential-protected-content transition-all duration-200 ${
          isWindowBlurred ? 'filter blur-xl pointer-events-none' : ''
        }`}
      >
        {children}
      </div>
    </div>
  );
}
