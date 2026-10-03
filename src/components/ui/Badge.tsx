import React from 'react';
import { cn } from '@/src/lib/utils';
import { CheckCircle2, Clock } from 'lucide-react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'teal' | 'amber' | 'emerald' | 'blue' | 'purple' | 'slate' | 'rose' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export function Badge({
  children,
  variant = 'teal',
  size = 'md',
  className,
  ...props
}: BadgeProps) {
  const variants = {
    teal: 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/40',
    amber: 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40',
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40',
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40',
    purple: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40',
    rose: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/40',
    slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
    outline: 'border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 bg-white/50 dark:bg-slate-900/50',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 rounded-md gap-1',
    md: 'text-xs px-2.5 py-1 rounded-lg gap-1.5',
    lg: 'text-sm px-3 py-1.5 rounded-xl gap-2',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium leading-none tracking-wide select-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <Badge
      variant="emerald"
      size="sm"
      className={cn('bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold', className)}
    >
      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500/20" />
      Verified
    </Badge>
  );
}

export function OpenNowBadge({
  isOpen,
  statusText,
  className,
}: {
  isOpen: boolean;
  statusText?: string;
  className?: string;
}) {
  return (
    <Badge
      variant={isOpen ? 'emerald' : 'slate'}
      size="sm"
      className={cn(
        'font-medium backdrop-blur-sm',
        isOpen
          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
          : 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/20',
        className
      )}
    >
      <span className="relative flex h-2 w-2">
        {isOpen && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        )}
        <span
          className={cn(
            'relative inline-flex rounded-full h-2 w-2',
            isOpen ? 'bg-emerald-500' : 'bg-slate-400'
          )}
        />
      </span>
      <span>{statusText || (isOpen ? 'Open Now' : 'Closed')}</span>
    </Badge>
  );
}
