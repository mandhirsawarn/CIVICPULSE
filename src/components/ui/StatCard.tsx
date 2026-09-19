import React from 'react';
import { Card } from './Card';
import { cn } from './Button';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: React.ReactNode;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  valueColor?: string;
  className?: string;
}

export function StatCard({ title, value, icon: Icon, trend, trendUp, valueColor, className }: StatCardProps) {
  return (
    <Card className={cn("flex flex-col", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-civic-muted">{title}</h3>
        <Icon className="h-4 w-4 text-civic-muted" />
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className={cn("text-3xl font-bold text-civic-text", valueColor)}>{value}</span>
        {trend && (
          <span
            className={cn(
              "text-xs font-medium",
              trendUp ? "text-civic-accent" : "text-civic-danger"
            )}
          >
            {trend}
          </span>
        )}
      </div>
    </Card>
  );
}
