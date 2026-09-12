'use client';

import React, { useState, useEffect } from 'react';
import { X, Heart, ExternalLink } from 'lucide-react';
import { InstagramIcon } from '@/components/ui/InstagramIcon';

export function DeveloperFollowBanner() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    // Check if user previously dismissed banner
    const isDismissed = localStorage.getItem('deploshare_insta_dismissed');
    if (!isDismissed) {
      const timer = setTimeout(() => {
        setVisible(true);
        setDismissed(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
    localStorage.setItem('deploshare_insta_dismissed', 'true');
  };

  if (dismissed && !visible) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-5 right-5 z-50 transition-all duration-500 ease-out transform ${
        visible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95 pointer-events-none'
      }`}
    >
      <div className="relative flex items-center gap-3.5 p-4 pr-10 rounded-2xl bg-white/95 backdrop-blur-xl border border-pink-200/80 shadow-[0_10px_35px_-5px_rgba(236,72,153,0.25)] text-slate-900 max-w-sm sm:max-w-md animate-float">
        {/* Instagram Gradient Icon Container */}
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shadow-md shadow-pink-500/30">
          <InstagramIcon className="w-6 h-6" />
        </div>

        {/* Content */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-900">Developer Profile</span>
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-pink-50 text-pink-700 text-[10px] font-semibold border border-pink-200">
              <Heart className="w-2.5 h-2.5 fill-pink-600 text-pink-600" />
              Creator
            </span>
          </div>
          <p className="text-[11px] text-slate-500 leading-snug">
            Built by <strong className="text-slate-800 font-semibold">Ali Noor</strong>. Follow on Instagram for updates & dev tips!
          </p>
          <a
            href="https://www.instagram.com/__alinoor__001/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-bold text-pink-600 hover:text-pink-700 hover:underline pt-0.5"
          >
            <span>Follow @__alinoor__001</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Dismiss Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-2.5 right-2.5 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          aria-label="Dismiss banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
