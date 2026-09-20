import React from 'react';
import { TimelineEvent } from '../../types';
import { cn } from './Button';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { formatExactDateTime } from '../../utils/dateFormat';

interface TimelineProps {
  events: TimelineEvent[];
  className?: string;
  horizontal?: boolean;
}

export function Timeline({ events, className, horizontal = false }: TimelineProps) {
  const getTimelineLabel = (status: string) => {
    switch (status) {
      case 'REPORTED': return 'Report Submitted';
      case 'UNDER_REVIEW': return 'Under Review';
      case 'AI_VERIFIED': return 'Verified';
      case 'ASSIGNED': return 'Assigned';
      case 'ACKNOWLEDGED': return 'Department Acknowledged';
      case 'INSPECTION': return 'Field Inspection';
      case 'IN_PROGRESS': return 'In Progress';
      case 'ON_HOLD': return 'On Hold';
      case 'RESOLVED': return 'Resolved';
      case 'CITIZEN_VERIFIED': return 'Citizen Verified';
      case 'REOPENED': return 'Reopened';
      case 'REJECTED': return 'Rejected';
      default: return status.replace('_', ' ');
    }
  };

  // Sort events chronologically
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  if (horizontal) {
    return (
      <div className={cn("w-full overflow-x-auto hide-scrollbar py-4", className)}>
        <div className="flex min-w-max items-start">
          {sortedEvents.map((event, index) => (
            <div key={event.id} className="relative flex min-w-[160px] flex-col items-center group">
              {/* Connector line */}
              {index < sortedEvents.length - 1 && (
                <div className="absolute left-1/2 top-3 w-full border-t-2 border-brand-200" />
              )}
              {/* Node */}
              <div className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-brand-50 border-2 border-brand-200">
                <CheckCircle2 className="h-4 w-4 text-civic-secondary" />
              </div>
              <div className="mt-3 flex flex-col items-center text-center">
                <span className="text-[10.5px] font-bold text-slate-800 tracking-wider uppercase">
                  ✓ {getTimelineLabel(event.status)}
                </span>
                <span className="mt-1 text-xs text-slate-500 font-mono">
                  {formatExactDateTime(event.timestamp)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Vertical timeline
  return (
    <div className={cn("relative border-l-2 border-blue-100 ml-3.5 space-y-6 py-2", className)}>
      {sortedEvents.map((event) => (
        <div key={event.id} className="relative pl-6">
          <span className="absolute -left-[9px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 ring-4 ring-white">
            <CheckCircle2 className="h-3.5 w-3.5 text-white" />
          </span>
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              ✓ {getTimelineLabel(event.status)}
            </h4>
          </div>
          <time className="block text-[11px] font-semibold text-slate-500 mt-0.5 font-mono">
            {formatExactDateTime(event.timestamp)} • {event.actor}
          </time>
          {event.description && (
            <p className="text-xs text-slate-600 mt-1 leading-relaxed bg-slate-50/70 p-2 rounded-lg border border-slate-100">
              {event.description}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
