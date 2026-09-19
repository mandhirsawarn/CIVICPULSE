import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Navigation, Wrench, PowerOff, CheckCircle2, MapPin, Truck, Shield } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { cn } from '../../utils/cn';
import type { FieldTeam } from '../../types';
import { Card } from '../../components/ui/Card';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Badge } from '../../components/ui/Badge';

const STATUS_META: Record<FieldTeam['status'], { label: string; color: string; icon: React.ElementType; dot: string; variant: 'success' | 'info' | 'warning' | 'default'; bg: string; border: string }> = {
  AVAILABLE: { label: 'Available', color: 'text-emerald-600', icon: CheckCircle2, dot: 'bg-emerald-500', variant: 'success', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  EN_ROUTE: { label: 'En Route', color: 'text-blue-600', icon: Navigation, dot: 'bg-blue-500', variant: 'info', bg: 'bg-blue-50', border: 'border-blue-200' },
  WORKING: { label: 'Working', color: 'text-amber-600', icon: Wrench, dot: 'bg-amber-500', variant: 'warning', bg: 'bg-amber-50', border: 'border-amber-200' },
  OFFLINE: { label: 'Offline', color: 'text-slate-400', icon: PowerOff, dot: 'bg-slate-400', variant: 'default', bg: 'bg-slate-100', border: 'border-slate-200' },
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

  const totalCrew = fieldTeams.reduce((acc, t) => acc + t.members, 0);

  return (
    <div className="animate-fade-in space-y-6 max-w-7xl mx-auto pb-8">
      <SectionHeader 
        eyebrow="FIELD OPERATIONS"
        title="Municipal Response Fleet" 
        description="Live crew status, telemetry dispatch, and ground resolution tracking across all city wards."
        action={
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold">
            <Users size={14} className="text-blue-600" />
            <span>Total Active Personnel: <strong className="text-slate-900">{totalCrew}</strong></span>
          </div>
        }
      />

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {summary.map(({ status, count }) => {
          const meta = STATUS_META[status as FieldTeam['status']];
          const Icon = meta.icon;
          return (
            <Card key={status} className="flex flex-col items-center justify-center text-center p-5 rounded-2xl border border-slate-200/80 bg-white shadow-[0_4px_20px_rgba(15,23,42,0.03)] hover:shadow-md transition-shadow">
              <div className={cn('mb-3 flex h-11 w-11 items-center justify-center rounded-xl border', meta.bg, meta.border, meta.color)}>
                <Icon size={22} />
              </div>
              <p className="text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums mb-0.5">{count}</p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{meta.label}</p>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-1.5 bg-slate-100/70 p-1.5 rounded-xl border border-slate-200/80 w-fit">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all',
              filter === f
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
            )}
          >
            {f === 'ALL' ? 'All Teams' : STATUS_META[f].label}
          </button>
        ))}
      </div>

      {/* Team grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((team) => {
          const dept = departments.find((d) => d.id === team.departmentId);
          const issue = issues.find((iss) => iss.id === team.currentIssueId);
          const meta = STATUS_META[team.status];

          return (
            <Card key={team.id} className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-[0_4px_20px_rgba(15,23,42,0.03)] hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 border border-blue-100 text-blue-600 shrink-0">
                      <Truck size={22} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-base">{team.name}</p>
                      <p className="text-xs text-blue-600 font-semibold">{dept?.name ?? 'Unassigned Department'}</p>
                    </div>
                  </div>
                  <Badge variant={meta.variant} className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold">
                    <span className={cn('h-2 w-2 rounded-full', meta.dot, team.status !== 'OFFLINE' && 'animate-pulse')} />
                    {meta.label}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 py-3 border-t border-slate-100 mt-2">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Crew Strength</p>
                    <p className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <Users size={12} className="text-slate-500" />
                      {team.members} Officers
                    </p>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Active Assignment</p>
                    <p className="text-xs font-mono font-bold text-blue-600 truncate">{issue ? issue.id : 'Standby'}</p>
                  </div>
                </div>
              </div>

              {issue && (
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200/80 px-3 py-2 text-xs text-slate-700">
                  <MapPin size={14} className="shrink-0 text-blue-600" /> 
                  <span className="truncate font-medium">{issue.location.address}</span>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-slate-400 text-sm bg-white rounded-2xl border border-slate-200/80">
          No field teams found for the selected status.
        </div>
      )}
    </div>
  );
};

export default FieldTeams;
