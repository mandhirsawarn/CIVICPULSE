import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Timer, CheckCircle2, AlertTriangle, XOctagon } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { cn } from '../../utils/cn';
import type { Issue } from '../../types';
import { PageHeader } from '../../components/ui/PageHeader';
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
    { label: 'On Track', value: onTrack, icon: CheckCircle2, color: 'text-civic-accent', bg: 'bg-civic-accent/10', border: 'border-civic-accent/20' },
    { label: 'At Risk', value: atRisk, icon: AlertTriangle, color: 'text-civic-warning', bg: 'bg-civic-warning/10', border: 'border-civic-warning/20' },
    { label: 'Breached', value: breached, icon: XOctagon, color: 'text-civic-danger', bg: 'bg-civic-danger/10', border: 'border-civic-danger/20' },
  ];

  return (
    <div className="animate-fade-in space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <PageHeader 
          title="SLA Compliance" 
          description="Service-level tracking across every active civic issue."
          className="mb-0"
        />
        <Badge variant="outline" className="border-brand-300 text-brand-500 bg-brand-50 mb-6 hidden sm:flex">
          Demo Environment
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((c, i) => (
          <Card key={c.label} className={cn("flex items-center gap-4 py-6 border transition-colors", c.border)}>
            <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', c.bg, c.color)}>
              <c.icon size={24} />
            </div>
            <div>
              <p className="text-3xl font-bold text-civic-text">{c.value}</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-civic-muted mt-1">{c.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="flex flex-col md:flex-row md:items-center justify-between gap-6 py-8">
        <div>
          <p className="text-lg font-bold text-civic-text">Overall SLA Performance</p>
          <p className="text-sm text-civic-muted mt-1">Average resolution time: 8.4 hours</p>
        </div>
        
        <div className="flex-1 max-w-md w-full">
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-semibold text-civic-text">Compliance Rate</span>
            <span className="text-3xl font-black text-civic-accent leading-none">{compliance}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-brand-100">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${compliance}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full rounded-full bg-civic-accent"
            />
          </div>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden border-civic-border">
        <div className="border-b border-brand-200 px-6 py-4 bg-brand-50">
          <h3 className="text-sm font-bold text-civic-text">Issues Approaching Deadline</h3>
        </div>
        <div className="custom-scrollbar overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-white text-xs uppercase text-civic-muted border-b border-brand-100">
              <tr>
                <th className="px-6 py-3 font-semibold">ID</th>
                <th className="px-6 py-3 font-semibold">Title</th>
                <th className="px-6 py-3 font-semibold">Ward</th>
                <th className="px-6 py-3 font-semibold">SLA Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-100">
              {active
                .slice()
                .sort((a, b) => new Date(a.slaTarget!).getTime() - new Date(b.slaTarget!).getTime())
                .slice(0, 10)
                .map((issue) => {
                  const state = classify(issue, now);
                  const stateStyle = {
                    ON_TRACK: 'text-civic-accent bg-civic-accent/10 px-2 py-1 rounded',
                    AT_RISK: 'text-civic-warning bg-civic-warning/10 px-2 py-1 rounded',
                    BREACHED: 'text-civic-danger bg-civic-danger/10 px-2 py-1 rounded',
                    DONE: 'text-civic-muted',
                  }[state];
                  return (
                    <tr key={issue.id} className="hover:bg-brand-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-brand-500">{issue.id}</td>
                      <td className="px-6 py-4 font-medium text-civic-text">{issue.title}</td>
                      <td className="px-6 py-4 text-xs text-civic-muted">{issue.location.ward}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-bold">
                        <span className={cn('inline-flex items-center gap-1.5', stateStyle)}>
                          <Timer size={14} /> {formatRemaining(issue.slaTarget!, now)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
          {active.length === 0 && (
            <div className="text-center py-8 text-civic-muted text-sm">
              No active issues with an SLA target.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default SlaMonitor;
