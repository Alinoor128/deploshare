'use client';

import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { calculateTimeRemaining } from '@/lib/security/sanitizer';

interface CountdownClockProps {
  expiresAt: string;
  onExpire?: () => void;
}

export function CountdownClock({ expiresAt, onExpire }: CountdownClockProps) {
  const [time, setTime] = useState(() => calculateTimeRemaining(expiresAt));

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = calculateTimeRemaining(expiresAt);
      setTime(remaining);
      if (remaining.isExpired && onExpire) {
        onExpire();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, onExpire]);

  const isUrgent = time.hours === 0 && time.minutes < 30 && !time.isExpired;

  return (
    <div
      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-semibold shadow-2xs transition-all ${
        time.isExpired
          ? 'bg-red-50 border-red-200 text-red-700'
          : isUrgent
          ? 'bg-amber-50 border-amber-300 text-amber-900 animate-pulse'
          : 'bg-blue-50 border-blue-200 text-blue-700'
      }`}
    >
      {time.isExpired ? (
        <AlertTriangle className="w-4 h-4 text-red-600" />
      ) : (
        <Clock className={`w-4 h-4 ${isUrgent ? 'text-amber-600' : 'text-blue-600'}`} />
      )}
      <span className="font-mono">
        {time.isExpired
          ? 'EXPIRED & PURGED'
          : `${String(time.hours).padStart(2, '0')}h : ${String(time.minutes).padStart(2, '0')}m : ${String(time.seconds).padStart(2, '0')}s remaining`}
      </span>
    </div>
  );
}
