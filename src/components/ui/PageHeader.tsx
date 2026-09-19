import React from 'react';
import { cn } from './Button';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8", className)}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-civic-text sm:text-3xl">{title}</h1>
        {description && (
          <p className="mt-2 text-sm text-civic-muted">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
