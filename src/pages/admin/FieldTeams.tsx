import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Navigation, Wrench, PowerOff, CheckCircle2, MapPin, Truck } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { cn } from '../../utils/cn';
import type { FieldTeam } from '../../types';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';

const STATUS_META: Record<FieldTeam['status'], { label: string; color: string; icon: React.ElementType; dot: string; variant: 'success' | 'info' | 'warning' | 'default' }> = {
  AVAILABLE: { label: 'Available', color: 'text-civic-accent', icon: CheckCircle2, dot: 'bg-civic-accent', variant: 'success' },
  EN_ROUTE: { label: 'En Route', color: 'text-civic-primary', icon: Navigation, dot: 'bg-civic-primary', variant: 'info' },
  WORKING: { label: 'Working', color: 'text-civic-warning', icon: Wrench, dot: 'bg-civic-warning', variant: 'warning' },
  OFFLINE: { label: 'Offline', color: 'text-civic-muted', icon: PowerOff, dot: 'bg-civic-muted', variant: 'default' },
};

const FILTERS: (FieldTeam['status'] | 'ALL')[] = ['ALL', 'AVAILABLE', 'EN_ROUTE', 'WORKING', 'OFFLINE'];

const FieldTeams = () => {
  const { fieldTeams, departments, issues } = useStore();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('ALL');

  const filtered = filter === 'ALL' ? fieldTeams : fieldTeams.filter((t) => t.status === filter);

  const summary = FILTERS.slice(1).map((status) => ({
    status,
    count: fieldTeams.filter((t) => t.status === status).length,
  }));

  return (
    <div className="animate-fade-in space-y-6 max-w-7xl mx-auto">
      <PageHeader 
        title="Field Operations" 
        description="Live status and workload across every deployed municipal team."
      />

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {summary.map(({ status, count }) => {
          const meta = STATUS_META[status as FieldTeam['status']];
          const Icon = meta.icon;
          return (
            <Card key={status} className="flex flex-col items-center justify-center text-center py-6 hover:shadow-md transition-shadow">
              <div className={cn('mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 border border-brand-100', meta.color)}>
                <Icon size={24} />
              </div>
              <p className="text-3xl font-bold text-civic-text mb-1">{count}</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-civic-muted">{meta.label}</p>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 bg-white p-2 rounded-xl border border-civic-border w-fit shadow-sm">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-semibold transition-all',
              filter === f
                ? 'bg-civic-primary text-white shadow-sm'
                : 'text-civic-muted hover:bg-brand-50 hover:text-civic-text'
            )}
          >
            {f === 'ALL' ? 'All Teams' : STATUS_META[f].label}
          </button>
        ))}
      </div>

      {/* Team grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((team, i) => {
          const dept = departments.find((d) => d.id === team.departmentId);
          const issue = issues.find((iss) => iss.id === team.currentIssueId);
          const meta = STATUS_META[team.status];
          const Icon = meta.icon;

          return (
            <Card key={team.id} className="hover:border-civic-primary/50 hover:shadow-md transition-all flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 border border-brand-200">
                    <Truck size={24} className="text-civic-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-civic-text text-lg">{team.name}</p>
                    <p className="text-xs text-brand-500 font-medium">{dept?.name ?? 'Unassigned department'}</p>
                  </div>
                </div>
                <Badge variant={meta.variant} className="flex items-center gap-1.5 px-2.5 py-1">
                  <span className={cn('h-2 w-2 rounded-full', meta.dot, team.status !== 'OFFLINE' && 'animate-pulse')} />
                  {meta.label}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-brand-100 pt-4 mt-auto">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-civic-muted mb-1">Members</p>
                  <p className="text-sm font-bold text-civic-text">{team.members}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-civic-muted mb-1">Current Task</p>
                  <p className="text-sm font-bold text-civic-text truncate">{issue ? issue.id : '—'}</p>
                </div>
              </div>

              {issue && (
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-brand-50 border border-brand-200 px-3 py-2 text-xs text-civic-text">
                  <MapPin size={14} className="shrink-0 text-civic-primary" /> 
                  <span className="truncate">{issue.location.address}</span>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default FieldTeams;
