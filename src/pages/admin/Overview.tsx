import React, { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { AlertTriangle, Clock, CheckCircle2, TrendingUp, Activity, Users, ShieldAlert, ArrowRight, BrainCircuit, BarChart3, Database } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { PageHeader } from '../../components/ui/PageHeader';
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
        <div className="flex items-center gap-3">
          <PageHeader 
            title="Command Center" 
            description="Real-time civic intelligence and municipal response management."
            className="mb-0"
          />
          <Badge variant="outline" className="border-brand-300 text-brand-500 bg-brand-50 mb-6 hidden sm:flex">
            Demo Environment
          </Badge>
        </div>
        <div className="text-left sm:text-right bg-white border border-civic-border rounded-lg px-4 py-2 shadow-sm relative">
          <div className="absolute -top-3 -right-3">
            <Badge variant="warning" className="text-[10px] shadow-sm">Prototype Dataset</Badge>
          </div>
          <div className="text-xs font-semibold text-civic-muted uppercase tracking-wider mb-1">System Status</div>
          <div className="flex items-center gap-2 text-civic-accent font-bold text-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-civic-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-civic-accent"></span>
            </span>
            ALL SYSTEMS NOMINAL
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard title="Active Issues" value={activeIssues.length} icon={Activity} trend="+12%" trendUp={false} />
        <StatCard title="Critical" value={criticalIssues.length} icon={AlertTriangle} trend="-2%" trendUp={true} valueColor="text-civic-danger" />
        <StatCard title="In Progress" value={inProgress.length} icon={Users} trend="+5%" trendUp={true} />
        <StatCard title="SLA At Risk" value={1} icon={Clock} trend="-1%" trendUp={true} valueColor="text-civic-warning" />
        <StatCard title="Avg Resolution" value={<Counter end={8.4} suffix="h" />} icon={TrendingUp} trend="-0.5h" trendUp={true} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - AI Insights */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-t-4 border-t-civic-primary h-full">
            <div className="flex items-center gap-2 mb-6 border-b border-brand-100 pb-4">
              <div className="p-2 bg-civic-primary/10 text-civic-primary rounded-lg">
                <BrainCircuit size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-civic-text leading-tight">AI Intelligence Engine</h2>
                <p className="text-xs text-civic-muted">Deterministic insights based on real-time data</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="bg-brand-50 border border-brand-200 rounded-xl p-5 hover:border-civic-danger/50 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2 text-civic-danger">
                    <BarChart3 size={18} />
                    <h3 className="font-bold text-civic-text">Emerging Hotspot Detected</h3>
                  </div>
                  <Badge variant="danger">High Priority</Badge>
                </div>
                <p className="text-civic-muted text-sm mb-4 leading-relaxed">
                  Waterlogging reports have increased by 43% in Zone 4 (Chandni Chowk) over the last 48 hours compared to the 30-day baseline.
                </p>
                <div className="flex items-center justify-between border-t border-brand-200 pt-3">
                  <span className="text-xs font-semibold text-civic-muted uppercase tracking-wider">Recommended Action</span>
                  <button className="text-xs font-semibold text-civic-primary hover:text-civic-primary/80 flex items-center gap-1">
                    Deploy inspection team <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              <div className="bg-brand-50 border border-brand-200 rounded-xl p-5 hover:border-civic-warning/50 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2 text-civic-warning">
                    <Database size={18} />
                    <h3 className="font-bold text-civic-text">Duplicate Cluster Identified</h3>
                  </div>
                  <Badge variant="warning">Moderate</Badge>
                </div>
                <p className="text-civic-muted text-sm mb-4 leading-relaxed">
                  17 distinct citizen reports map to the exact same pothole segment on Sector 14 Main Road. The system has automatically clustered these into a single master ticket.
                </p>
                <div className="flex items-center justify-between border-t border-brand-200 pt-3">
                  <span className="text-xs font-semibold text-civic-muted uppercase tracking-wider">Estimated workload avoided</span>
                  <span className="text-xs font-bold text-civic-accent bg-civic-accent/10 px-2 py-1 rounded">16 redundant dispatches</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Live Feed */}
        <div className="space-y-6 flex flex-col h-full">
          <Card className="flex-1 flex flex-col">
            <h2 className="text-lg font-bold text-civic-text mb-4 border-b border-brand-100 pb-3">Live Operations Feed</h2>
            
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar max-h-[500px]">
              {feed.map(item => (
                <div key={item.id} className="flex gap-3 items-start">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                    item.variant === 'danger' ? 'bg-civic-danger/10 text-civic-danger' :
                    item.variant === 'warning' ? 'bg-civic-warning/10 text-civic-warning' :
                    item.variant === 'success' ? 'bg-civic-accent/10 text-civic-accent' :
                    'bg-brand-100 text-brand-500'
                  )}>
                    <item.icon size={14} />
                  </div>
                  <div>
                    <p className="text-sm text-civic-text font-medium leading-snug">{item.text}</p>
                    <p className="text-xs text-civic-muted mt-1">{item.time}</p>
                  </div>
                </div>
              ))}
              
              <div className="my-4 text-center">
                <span className="text-xs font-semibold text-brand-300 uppercase tracking-widest bg-white px-2 relative z-10">Earlier</span>
                <div className="border-t border-brand-100 -mt-2"></div>
              </div>
              
              {issues.slice(0, 3).map(issue => (
                <div key={issue.id} className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-brand-50 border border-brand-200 flex items-center justify-center flex-shrink-0 mt-0.5 text-civic-muted text-xs font-bold">
                    {issue.category.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm text-civic-muted leading-snug">Citizen reported <span className="text-civic-text font-semibold">{issue.title}</span></p>
                    <p className="text-xs text-brand-400 mt-1">{new Date(issue.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
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
