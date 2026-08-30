import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
  hoverEffect?: boolean;
  floating?: boolean;
  glass?: boolean;
}

export function Card({
  className,
  children,
  glow = false,
  hoverEffect = false,
  floating = false,
  glass = true,
  ...props
}: CardProps) {
  return (
    <div
      className={twMerge(
        clsx(
          'relative rounded-3xl p-6 sm:p-7 text-slate-900 transition-all duration-300 ease-out',
          glass
            ? 'bg-gradient-to-b from-white via-white to-slate-50/70 border border-slate-200/90 backdrop-blur-xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04),0_2px_8px_-2px_rgba(0,0,0,0.02)]'
            : 'bg-white border border-slate-200/90 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)]',
          glow && 'ring-2 ring-blue-500/20 shadow-[0_20px_50px_-10px_rgba(37,99,235,0.18)] border-blue-300',
          hoverEffect &&
            'hover:border-blue-400/80 hover:shadow-[0_24px_50px_-12px_rgba(37,99,235,0.14),0_0_0_1px_rgba(37,99,235,0.15)] hover:-translate-y-1.5',
          floating && 'animate-float',
          className
        )
      )}
      {...props}
    >
      {/* Subtle Top Edge Gradient Reflection */}
      <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent pointer-events-none" />
      {glow && (
        <div className="absolute -top-px left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-transparent via-blue-600 to-transparent pointer-events-none" />
      )}
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={twMerge(clsx('flex flex-col space-y-1.5 pb-4', className))} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={twMerge(
        clsx('text-xl font-bold tracking-tight text-slate-900', className)
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={twMerge(clsx('text-sm text-slate-500', className))} {...props}>
      {children}
    </p>
  );
}

export function CardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={twMerge(clsx('pt-0', className))} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={twMerge(clsx('flex items-center pt-4 border-t border-slate-100', className))}
      {...props}
    >
      {children}
    </div>
  );
}
