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
          'relative rounded-2xl p-6 text-slate-900 transition-all duration-300',
          glass
            ? 'bg-white/90 border border-slate-200/90 backdrop-blur-xl shadow-sm'
            : 'bg-white border border-slate-200 shadow-xs',
          glow && 'ring-1 ring-blue-500/30 shadow-xl shadow-blue-500/10 border-blue-200',
          hoverEffect &&
            'hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-0.5',
          floating && 'animate-float',
          className
        )
      )}
      {...props}
    >
      {glow && (
        <div className="absolute -top-px left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent pointer-events-none" />
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
