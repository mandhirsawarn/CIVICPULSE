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
    <Card className={cn(
      "flex flex-col justify-between group hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition-all duration-180 bg-white border-slate-200/80 p-5",
      className
    )}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        <div className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 group-hover:text-blue-600 group-hover:bg-blue-50/60 transition-colors">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3">
        <div className={cn("text-3xl font-extrabold tracking-tight text-slate-900 tabular-nums", valueColor)}>
          {value}
        </div>
        {trend && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <span
              className={cn(
                "inline-flex items-center text-[11px] font-semibold px-1.5 py-0.5 rounded",
                trendUp ? "text-emerald-700 bg-emerald-50" : "text-red-700 bg-red-50"
              )}
            >
              {trend}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
