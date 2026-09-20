import React, { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { AlertTriangle, Clock, CheckCircle2, TrendingUp, Activity, Users, ShieldAlert, ArrowRight, BrainCircuit, BarChart3, Database } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { PageHeader } from '../../components/ui/PageHeader';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Badge } from '../../components/ui/Badge';

const Counter = ({ end, suffix = '' }: { end: number, suffix?: string }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 1500;
    const increment = end / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [end]);
  
  return <span>{count}{suffix}</span>;
}

const AdminOverview = () => {
  const { issues } = useStore();
  
  const activeIssues = issues.filter(i => i.status !== 'RESOLVED' && i.status !== 'CITIZEN_VERIFIED');
  const criticalIssues = activeIssues.filter(i => i.aiAnalysis?.severity === 'CRITICAL' || i.aiAnalysis?.severity === 'HIGH');
  const inProgress = activeIssues.filter(i => i.status === 'IN_PROGRESS');
  
  const [feed] = useState([
    { id: 1, type: 'CRITICAL', text: 'Critical waterlogging detected at Connaught Place', time: '2 mins ago', icon: ShieldAlert, variant: 'danger' },
    { id: 2, type: 'WARNING', text: '5 duplicate pothole reports clustered in Sector 14', time: '8 mins ago', icon: AlertTriangle, variant: 'warning' },
    { id: 3, type: 'SUCCESS', text: 'Streetlight issue resolved in Ward 12', time: '12 mins ago', icon: CheckCircle2, variant: 'success' },
    { id: 4, type: 'INFO', text: 'Field team Road Alpha dispatched to CP-2026-1047', time: '18 mins ago', icon: Users, variant: 'info' },
  ]);

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-[10px] font-bold text-amber-700 bg-amber-50 border-amber-200">
              Prototype / Demo Environment • Simulated Data
            </Badge>
          </div>
          <SectionHeader 
            eyebrow="OPERATIONAL COMMAND"
            title="City Operations Center" 
            description="Real-time civic intelligence, deterministic AI triage, and municipal response orchestration."
          />
        </div>
        <div className="text-left sm:text-right bg-white border border-slate-200/80 rounded-2xl px-4 py-2.5 shadow-xs relative self-start sm:self-auto">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Municipal Dispatch Status</div>
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs sm:text-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
            </span>
            ALL SYSTEMS ACTIVE • 100% OPERATIONAL
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard title="Active Issues" value={activeIssues.length} icon={Activity} trend="+12% weekly" trendUp={false} />
        <StatCard title="Critical Priority" value={criticalIssues.length} icon={AlertTriangle} trend="-2% vs avg" trendUp={true} valueColor="text-red-600" />
        <StatCard title="In Progress" value={inProgress.length} icon={Users} trend="+5% resolved" trendUp={true} valueColor="text-blue-600" />
        <StatCard title="SLA At Risk" value={1} icon={Clock} trend="1 expiring" trendUp={false} valueColor="text-amber-600" />
        <StatCard title="Avg Resolution" value={<Counter end={8.4} suffix="h" />} icon={TrendingUp} trend="-0.5h SLA target" trendUp={true} valueColor="text-emerald-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - AI Insights */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-2xl border-slate-200/80 bg-white shadow-[0_4px_20px_rgba(15,23,42,0.03)] h-full p-6">
            <div className="flex items-center justify-between gap-2 mb-6 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 border border-blue-200/60 rounded-xl">
                  <BrainCircuit size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 leading-tight">AI Civic Intelligence Engine</h2>
                  <p className="text-xs text-slate-400">Automated spatial clustering & priority dispatch recommendations</p>
                </div>
              </div>
              <Badge variant="outline" className="border-slate-200 text-slate-500 bg-slate-50 text-[10px] hidden sm:flex">
                Real-Time Analysis
              </Badge>
            </div>
            
            <div className="space-y-4">
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 hover:border-slate-300 transition-colors">
                <div className="flex justify-between items-start mb-2.5">
                  <div className="flex items-center gap-2 text-red-600">
                    <BarChart3 size={18} />
                    <h3 className="font-bold text-slate-900 text-sm">Emerging Hotspot Detected</h3>
                  </div>
                  <Badge variant="danger">High Priority</Badge>
                </div>
                <p className="text-slate-600 text-xs sm:text-sm mb-4 leading-relaxed">
                  Waterlogging reports have surged by 43% in Zone 4 (Chandni Chowk / Ward 12) over the last 48 hours compared to baseline municipal averages.
                </p>
                <div className="flex items-center justify-between border-t border-slate-200/60 pt-3">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Suggested Operational Action</span>
                  <button className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer">
                    Dispatch Drainage Team <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 hover:border-slate-300 transition-colors">
                <div className="flex justify-between items-start mb-2.5">
                  <div className="flex items-center gap-2 text-amber-600">
                    <Database size={18} />
                    <h3 className="font-bold text-slate-900 text-sm">Duplicate Cluster Identified</h3>
                  </div>
                  <Badge variant="warning">Moderate</Badge>
                </div>
                <p className="text-slate-600 text-xs sm:text-sm mb-4 leading-relaxed">
                  17 distinct citizen reports map to the exact same pothole segment on Sector 14 Main Road. The system automatically merged these into a single master work order.
                </p>
                <div className="flex items-center justify-between border-t border-slate-200/60 pt-3">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Estimated Workload Avoided</span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-full">
                    16 redundant dispatches prevented
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Live Feed */}
        <div className="space-y-6 flex flex-col h-full">
          <Card className="rounded-2xl border-slate-200/80 bg-white shadow-[0_4px_20px_rgba(15,23,42,0.03)] p-6 flex-1 flex flex-col">
            <h2 className="text-base font-bold text-slate-900 mb-4 border-b border-slate-100 pb-3 flex items-center justify-between">
              <span>Live Operations Feed</span>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">Live</span>
            </h2>
            
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar max-h-[500px]">
              {feed.map(item => (
                <div key={item.id} className="flex gap-3 items-start">
                  <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border",
                    item.variant === 'danger' ? 'bg-red-50 text-red-600 border-red-200/60' :
                    item.variant === 'warning' ? 'bg-amber-50 text-amber-600 border-amber-200/60' :
                    item.variant === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-200/60' :
                    'bg-blue-50 text-blue-600 border-blue-200/60'
                  )}>
                    <item.icon size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-slate-900 font-semibold leading-snug">{item.text}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{item.time}</p>
                  </div>
                </div>
              ))}
              
              <div className="my-4 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white px-2 relative z-10">Earlier Activity</span>
                <div className="border-t border-slate-100 -mt-2"></div>
              </div>
              
              {issues.slice(0, 3).map(issue => (
                <div key={issue.id} className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200/70 flex items-center justify-center shrink-0 mt-0.5 text-slate-600 text-[10px] font-bold">
                    {issue.category.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-600 leading-snug">
                      Citizen reported <span className="text-slate-900 font-semibold">{issue.title}</span>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(issue.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
