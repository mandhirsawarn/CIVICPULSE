import React from 'react';
import { cn } from './Button';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-brand-100 text-brand-800',
    success: 'bg-civic-accent/10 text-civic-accent',
    warning: 'bg-civic-warning/10 text-civic-warning',
    danger: 'bg-civic-danger/10 text-civic-danger',
    info: 'bg-civic-secondary/10 text-civic-secondary',
    outline: 'border border-brand-200 text-brand-700',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
