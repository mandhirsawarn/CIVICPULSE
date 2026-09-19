import React from 'react';
import { TimelineEvent } from '../../types';
import { cn } from './Button';
import { CheckCircle2, Circle, Clock } from 'lucide-react';

interface TimelineProps {
  events: TimelineEvent[];
  className?: string;
  horizontal?: boolean;
}

export function Timeline({ events, className, horizontal = false }: TimelineProps) {
  const getTimelineLabel = (status: string) => {
    switch (status) {
      case 'REPORTED': return 'REPORT SUBMITTED';
      case 'AI_VERIFIED': return 'AI ANALYSIS COMPLETED';
      case 'ASSIGNED': return 'ROUTED TO DEPARTMENT';
      case 'ACKNOWLEDGED': return 'DEPARTMENT ACKNOWLEDGED';
      case 'INSPECTION': return 'FIELD INSPECTION';
      case 'IN_PROGRESS': return 'WORK IN PROGRESS';
      case 'RESOLVED': return 'RESOLUTION SUBMITTED';
      case 'CITIZEN_VERIFIED': return 'RESOLVED';
      default: return status.replace('_', ' ').toUpperCase();
    }
  };
  // Sort events chronologically just in case
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
                <span className="text-[10px] font-bold text-civic-text tracking-wider uppercase">{getTimelineLabel(event.status)}</span>
                <span className="mt-1 text-xs text-civic-muted">
                  {new Date(event.timestamp).toLocaleDateString()}
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
    <div className={cn("relative border-l border-brand-200 ml-3", className)}>
      {sortedEvents.map((event, index) => (
        <div key={event.id} className="mb-6 ml-6 last:mb-0">
          <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-brand-50 ring-4 ring-white">
            <CheckCircle2 className="h-4 w-4 text-civic-secondary" />
          </span>
          <h3 className="mb-1 text-xs font-bold text-civic-text tracking-wider uppercase">{getTimelineLabel(event.status)}</h3>
          <time className="mb-2 block text-[10px] font-medium leading-none text-civic-muted">
            {new Date(event.timestamp).toLocaleString()} - {event.actor}
          </time>
          <p className="text-sm text-civic-muted">{event.description}</p>
        </div>
      ))}
    </div>
  );
}
