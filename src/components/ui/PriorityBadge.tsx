import React from 'react';
import { cn } from '../../utils/cn';
import { Severity, Urgency } from '../../types';

interface PriorityBadgeProps {
  priority?: Severity | Urgency | string;
  score?: number;
  showScore?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority = 'LOW',
  score,
  showScore = false,
  className,
  size = 'sm'
}) => {
  const norm = String(priority).toUpperCase();

  let colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let label = 'Low';

  if (norm === 'CRITICAL' || norm === 'URGENT' || (typeof score === 'number' && score >= 80)) {
    colorClasses = 'bg-red-50 text-red-700 border-red-200 shadow-sm';
    label = 'Urgent';
  } else if (norm === 'HIGH' || (typeof score === 'number' && score >= 60)) {
    colorClasses = 'bg-orange-50 text-orange-700 border-orange-200';
    label = 'High';
  } else if (norm === 'MEDIUM' || norm === 'MODERATE' || (typeof score === 'number' && score >= 40)) {
    colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
    label = 'Moderate';
  } else {
    colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    label = 'Low';
  }

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5 font-semibold'
  }[size];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-bold rounded-full border uppercase tracking-wide",
        sizeClasses,
        colorClasses,
        className
      )}
    >
      <span className={cn(
        "rounded-full shrink-0",
        size === 'sm' ? "h-1.5 w-1.5" : "h-2 w-2",
        label === 'Urgent' ? "bg-red-600 animate-pulse" :
        label === 'High' ? "bg-orange-600" :
        label === 'Moderate' ? "bg-amber-600" : "bg-emerald-600"
      )} />
      <span>{label}</span>
      {showScore && typeof score === 'number' && (
        <span className="opacity-75 font-mono ml-0.5">({score})</span>
      )}
    </span>
  );
};
