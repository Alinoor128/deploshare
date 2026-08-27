import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface DeploShareLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  animated?: boolean;
  className?: string;
}

export function DeploShareLogo({
  size = 'md',
  showText = true,
  animated = true,
  className,
}: DeploShareLogoProps) {
  const sizeMap = {
    sm: { icon: 28, text: 'text-lg', subtext: 'text-[9px]' },
    md: { icon: 34, text: 'text-xl', subtext: 'text-[10px]' },
    lg: { icon: 42, text: 'text-2xl', subtext: 'text-xs' },
    xl: { icon: 54, text: 'text-3xl', subtext: 'text-sm' },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={twMerge(clsx('inline-flex items-center gap-3 select-none group', className))}>
      {/* Sleek SVG Geometric Shield/Vault Logo with Share Nodes */}
      <div
        className={clsx(
          'relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50/50 to-cyan-50/50 border border-blue-200 p-2 shadow-sm shadow-blue-500/10 transition-all duration-300',
          animated && 'group-hover:scale-105 group-hover:border-blue-400 group-hover:shadow-md group-hover:shadow-blue-500/20'
        )}
        style={{ width: currentSize.icon + 12, height: currentSize.icon + 12 }}
      >
        <svg
          width={currentSize.icon}
          height={currentSize.icon}
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10"
        >
          <defs>
            <linearGradient id="deploGradPrimary" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="50%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#1D4ED8" />
            </linearGradient>
            <linearGradient id="deploGradCyan" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0EA5E9" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>
            <linearGradient id="deploGradCore" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#1E40AF" />
            </linearGradient>
          </defs>

          {/* Hexagonal Outer Shield / Vault Path */}
          <path
            d="M20 3L35 11.5V28.5L20 37L5 28.5V11.5L20 3Z"
            stroke="url(#deploGradPrimary)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Isometric Sharing Data Nodes & Connector Channels */}
          <path
            d="M20 3V20M35 11.5L20 20M5 11.5L20 20"
            stroke="url(#deploGradCyan)"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.85"
          />

          {/* Central Security Core / Code Prism */}
          <circle cx="20" cy="20" r="4.5" fill="url(#deploGradCore)" />
          <circle cx="20" cy="20" r="2" fill="#FFFFFF" />

          {/* Dynamic 6-Digit Transmission Beacons */}
          <circle cx="20" cy="3" r="2" fill="#2563EB" />
          <circle cx="35" cy="11.5" r="2" fill="#0EA5E9" />
          <circle cx="35" cy="28.5" r="2" fill="#6366F1" />
          <circle cx="20" cy="37" r="2" fill="#2563EB" />
          <circle cx="5" cy="28.5" r="2" fill="#6366F1" />
          <circle cx="5" cy="11.5" r="2" fill="#0EA5E9" />
        </svg>
      </div>

      {/* Typography */}
      {showText && (
        <div className="flex flex-col text-left">
          <span
            className={clsx(
              'font-black tracking-tight leading-none text-slate-900',
              currentSize.text
            )}
          >
            Deplo<span className="text-blue-600 font-extrabold">Share</span>
          </span>
          <span
            className={clsx(
              'font-mono tracking-widest text-slate-400 uppercase font-semibold mt-0.5',
              currentSize.subtext
            )}
          >
            Code-Only Sharing
          </span>
        </div>
      )}
    </div>
  );
}
