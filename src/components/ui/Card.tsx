import React from 'react';
import { cn } from './Button';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  noPadding?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, noPadding = false, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-2xl border border-slate-200/80 bg-white text-slate-900 shadow-[0_4px_20px_rgba(15,23,42,0.03)] transition-all duration-200',
        !noPadding && 'p-5 sm:p-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
Card.displayName = 'Card';
