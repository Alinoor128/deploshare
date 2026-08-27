import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'destructive' | 'ghost' | 'glow' | 'cyber';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  shakeOnHover?: boolean;
  shimmer?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      leftIcon,
      rightIcon,
      shakeOnHover = false,
      shimmer = false,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'relative inline-flex items-center justify-center font-medium transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white disabled:opacity-50 disabled:cursor-not-allowed select-none rounded-xl cursor-pointer active:scale-95 overflow-hidden';

    const variants = {
      primary:
        'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 focus:ring-blue-500 shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/35 hover:scale-[1.02] border border-blue-500/20',
      secondary:
        'bg-white text-slate-800 hover:bg-slate-50 active:bg-slate-100 border border-slate-200/90 hover:border-slate-300 focus:ring-blue-500 shadow-xs hover:scale-[1.01]',
      outline:
        'bg-white/80 border border-blue-200 text-blue-600 hover:bg-blue-50/80 hover:border-blue-400 focus:ring-blue-400 shadow-2xs',
      destructive:
        'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus:ring-red-500 shadow-md shadow-red-500/20 hover:scale-[1.02] border border-red-500/20',
      ghost:
        'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 focus:ring-slate-400',
      glow:
        'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 text-white hover:from-blue-700 hover:via-indigo-700 hover:to-blue-700 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/45 hover:scale-[1.02] border border-blue-400/30 animate-btn-attention',
      cyber:
        'bg-blue-50 text-blue-700 border border-blue-200 hover:border-blue-400 hover:bg-blue-100/70 shadow-xs hover:scale-[1.02]',
    };

    const sizes = {
      sm: 'text-xs px-3.5 py-1.5 gap-1.5',
      md: 'text-sm px-4.5 py-2.5 gap-2',
      lg: 'text-base px-7 py-3.5 gap-2.5 font-semibold tracking-wide',
      icon: 'p-2.5 text-sm',
    };

    const isWobbleActive = shakeOnHover || variant === 'glow' || variant === 'primary';
    const isShimmerActive = shimmer || variant === 'glow';

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={twMerge(
          clsx(
            baseStyles,
            variants[variant],
            sizes[size],
            isWobbleActive && 'animate-btn-wobble',
            isShimmerActive && 'shimmer-overlay',
            className
          )
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          leftIcon && <span className="inline-flex shrink-0 transition-transform duration-200 group-hover:scale-110">{leftIcon}</span>
        )}
        <span className="relative z-10">{children}</span>
        {!isLoading && rightIcon && (
          <span className="inline-flex shrink-0 transition-transform duration-200 group-hover:translate-x-0.5">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
