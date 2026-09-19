import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Timer, CheckCircle2, AlertTriangle, XOctagon, Activity, Clock } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { cn } from '../../utils/cn';
import type { Issue } from '../../types';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

function useNow(intervalMs = 30000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function classify(issue: Issue, now: number): 'ON_TRACK' | 'AT_RISK' | 'BREACHED' | 'DONE' {
  if (issue.status === 'RESOLVED' || issue.status === 'CITIZEN_VERIFIED') return 'DONE';
  if (!issue.slaTarget) return 'ON_TRACK';
  const remaining = new Date(issue.slaTarget).getTime() - now;
  if (remaining < 0) return 'BREACHED';
  if (remaining < 2 * 60 * 60 * 1000) return 'AT_RISK';
  return 'ON_TRACK';
}

function formatRemaining(target: string, now: number) {
  const diff = new Date(target).getTime() - now;
  const overdue = diff < 0;
  const abs = Math.abs(diff);
  const h = Math.floor(abs / 3.6e6);
  const m = Math.floor((abs % 3.6e6) / 60000);
  return `${overdue ? '\u2212' : ''}${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m`;
}

const SlaMonitor = () => {
  const { issues } = useStore();
  const now = useNow();

  const active = issues.filter((i) => i.status !== 'RESOLVED' && i.status !== 'CITIZEN_VERIFIED' && i.slaTarget);
  const onTrack = active.filter((i) => classify(i, now) === 'ON_TRACK').length;
  const atRisk = active.filter((i) => classify(i, now) === 'AT_RISK').length;
  const breached = active.filter((i) => classify(i, now) === 'BREACHED').length;
  const compliance = active.length ? Math.round((onTrack / active.length) * 100) : 100;

  const cards = [
    { 
      label: 'On Track', 
      value: onTrack, 
      icon: CheckCircle2, 
      desc: 'Within expected timeframe',
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50', 
      border: 'border-emerald-200/80',
      badge: 'bg-emerald-100/60 text-emerald-800'
    },
    { 
      label: 'At Risk', 
      value: atRisk, 
      icon: AlertTriangle, 
      desc: 'Expiring in < 2 hours',
      color: 'text-amber-600', 
      bg: 'bg-amber-50', 
      border: 'border-amber-200/80',
      badge: 'bg-amber-100/60 text-amber-800'
    },
    { 
      label: 'Breached', 
      value: breached, 
      icon: XOctagon, 
      desc: 'Target resolution passed',
      color: 'text-rose-600', 
      bg: 'bg-rose-50', 
      border: 'border-rose-200/80',
      badge: 'bg-rose-100/60 text-rose-800'
    },
  ];

  return (
    <div className="animate-fade-in space-y-6 max-w-7xl mx-auto pb-8">
      <SectionHeader 
        eyebrow="SLA COMPLIANCE"
        title="Service-Level Agreement Tracking" 
        description="Real-time municipal SLA compliance and proactive escalation alerts across active civic reports."
        action={
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Live SLA Engine (30s sync)
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.label} className={cn("p-5 border bg-white rounded-2xl shadow-[0_4px_20px_rgba(15,23,42,0.03)] hover:shadow-md transition-all", c.border)}>
            <div className="flex items-start justify-between mb-3">
              <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', c.bg, c.color)}>
                <c.icon size={22} />
              </div>
              <span className={cn('text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider', c.badge)}>
                {c.label}
              </span>
            </div>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">{c.value}</p>
            <p className="text-xs text-slate-500 mt-1 font-medium">{c.desc}</p>
          </Card>
        ))}
      </div>

      <Card className="p-6 border border-slate-200/80 bg-white rounded-2xl shadow-[0_4px_20px_rgba(15,23,42,0.03)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Activity size={18} className="text-blue-600" />
              <h3 className="text-lg font-bold text-slate-900">Overall SLA Performance Rate</h3>
            </div>
            <p className="text-sm text-slate-500">
              Average citywide resolution cycle: <span className="font-semibold text-slate-800">8.4 hours</span> across {active.length} active work orders.
            </p>
          </div>
          
          <div className="flex-1 max-w-md w-full">
            <div className="flex justify-between items-end mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Target Compliance</span>
              <span className="text-3xl font-black text-blue-600 leading-none tabular-nums">{compliance}%</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 p-0.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${compliance}%` }}
                transition={{ duration: 0.8 }}
                className={cn(
                  "h-full rounded-full transition-all",
                  compliance >= 80 ? "bg-emerald-500" : compliance >= 60 ? "bg-amber-500" : "bg-rose-500"
                )}
              />
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden border border-slate-200/80 bg-white rounded-2xl shadow-[0_4px_20px_rgba(15,23,42,0.03)]">
        <div className="border-b border-slate-100 px-6 py-4 bg-slate-50/70 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Issues Approaching Deadline</h3>
            <p className="text-xs text-slate-500 mt-0.5">Prioritized by earliest SLA expiration timestamp</p>
          </div>
          <Badge variant="outline" className="text-xs font-semibold text-slate-600 border-slate-200">
            {active.length} Active Targets
          </Badge>
        </div>

        <div className="custom-scrollbar overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-100 font-bold">
              <tr>
                <th className="px-6 py-3.5 font-bold">Report ID</th>
                <th className="px-6 py-3.5 font-bold">Issue Title</th>
                <th className="px-6 py-3.5 font-bold">Ward / Zone</th>
                <th className="px-6 py-3.5 font-bold">SLA Remaining</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {active
                .slice()
                .sort((a, b) => new Date(a.slaTarget!).getTime() - new Date(b.slaTarget!).getTime())
                .slice(0, 10)
                .map((issue) => {
                  const state = classify(issue, now);
                  const stateStyle = {
                    ON_TRACK: 'text-emerald-700 bg-emerald-50 border border-emerald-200',
                    AT_RISK: 'text-amber-700 bg-amber-50 border border-amber-200',
                    BREACHED: 'text-rose-700 bg-rose-50 border border-rose-200',
                    DONE: 'text-slate-500 bg-slate-100 border border-slate-200',
                  }[state];
                  return (
                    <tr key={issue.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs font-bold text-blue-600">{issue.id}</td>
                      <td className="px-6 py-4 font-semibold text-slate-900">{issue.title}</td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        <span className="font-medium text-slate-700">{issue.location.ward}</span>
                        <span className="text-slate-400 ml-1.5">• {issue.location.zone}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-bold">
                        <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-xs', stateStyle)}>
                          <Clock size={13} /> {formatRemaining(issue.slaTarget!, now)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
          {active.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-sm">
              <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-400 opacity-60" />
              All active reports are currently within SLA benchmarks.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default SlaMonitor;
