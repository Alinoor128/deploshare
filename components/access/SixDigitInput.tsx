'use client';

import React, { useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { playKeyPressSound } from '@/lib/audio/sound-effects';

export interface SixDigitInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (code: string) => void;
  disabled?: boolean;
  hasError?: boolean;
  autoFocus?: boolean;
}

export function SixDigitInput({
  value,
  onChange,
  onComplete,
  disabled = false,
  hasError = false,
  autoFocus = true,
}: SixDigitInputProps) {
  const digits = (value || '').padEnd(6, ' ').slice(0, 6).split('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0] && !disabled) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus, disabled]);

  const handleInputChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    // Extract only digits
    const cleaned = rawVal.replace(/\D/g, '');

    if (!cleaned) {
      // Empty / Deleted
      const newDigits = [...digits];
      newDigits[index] = '';
      const newCode = newDigits.join('').trim();
      onChange(newCode);
      return;
    }

    if (cleaned.length === 1) {
      playKeyPressSound(index);
      const newDigits = [...digits];
      newDigits[index] = cleaned;
      const newCode = newDigits.map((d) => (d === ' ' ? '' : d)).join('');
      onChange(newCode);

      // Focus next input
      if (index < 5 && inputRefs.current[index + 1]) {
        inputRefs.current[index + 1]?.focus();
      }

      if (newCode.length === 6 && onComplete) {
        onComplete(newCode);
      }
    } else {
      // Multiple digits entered (paste or autocomplete)
      handlePasteString(cleaned);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] || digits[index] === ' ') {
        // Move to previous box if current is empty
        if (index > 0 && inputRefs.current[index - 1]) {
          inputRefs.current[index - 1]?.focus();
        }
      } else {
        const newDigits = [...digits];
        newDigits[index] = '';
        const newCode = newDigits.map((d) => (d === ' ' ? '' : d)).join('');
        onChange(newCode);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const cleaned = pastedData.replace(/\D/g, '').slice(0, 6);
    if (cleaned) {
      handlePasteString(cleaned);
    }
  };

  const handlePasteString = (cleanNumbers: string) => {
    const padded = cleanNumbers.slice(0, 6);
    onChange(padded);

    // Focus appropriate box
    const nextIdx = Math.min(padded.length, 5);
    inputRefs.current[nextIdx]?.focus();

    if (padded.length === 6 && onComplete) {
      onComplete(padded);
    }
  };

  return (
    <div
      className={twMerge(
        clsx(
          'flex items-center justify-center gap-2 sm:gap-3 transition-all duration-200',
          hasError && 'animate-shake'
        )
      )}
      onPaste={handlePaste}
    >
      {[0, 1, 2, 3, 4, 5].map((index) => {
        const char = digits[index] && digits[index] !== ' ' ? digits[index] : '';

        return (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={char}
            disabled={disabled}
            onChange={(e) => handleInputChange(index, e)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            className={twMerge(
              clsx(
                'h-14 w-11 sm:h-16 sm:w-14 rounded-2xl bg-white border text-center font-mono text-2xl sm:text-3xl font-extrabold text-slate-900 transition-all duration-200 focus:outline-none focus:ring-2 select-none shadow-xs',
                hasError
                  ? 'border-red-500 bg-red-50/50 text-red-600 focus:border-red-500 focus:ring-red-500/20'
                  : char
                  ? 'border-blue-500 bg-blue-50/40 text-blue-700 shadow-md shadow-blue-500/10'
                  : 'border-slate-200 focus:border-blue-600 focus:ring-blue-500/20 text-slate-900',
                disabled && 'opacity-50 cursor-not-allowed'
              )
            )}
          />
        );
      })}
    </div>
  );
}
