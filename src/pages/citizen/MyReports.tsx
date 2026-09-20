import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, MapPin, Clock, ArrowRight, Inbox, AlertTriangle, Layers, Building2, UserCheck, CheckCircle2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { cn } from '../../utils/cn';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatCard } from '../../components/ui/StatCard';
import { PriorityBadge } from '../../components/ui/PriorityBadge';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { formatExactDateTime, formatDateOnly } from '../../utils/dateFormat';

const FILTERS = ['All', 'Active', 'Resolved'] as const;

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'REPORTED': return 'outline';
    case 'UNDER_REVIEW': return 'info';
    case 'AI_VERIFIED': return 'info';
    case 'ASSIGNED': return 'info';
    case 'IN_PROGRESS': return 'warning';
    case 'ON_HOLD': return 'warning';
    case 'RESOLVED': return 'success';
    case 'REOPENED': return 'danger';
    case 'REJECTED': return 'danger';
    case 'DUPLICATE': return 'outline';
    case 'CITIZEN_VERIFIED': return 'success';
    default: return 'default';
  }
};

const MyReports = () => {
  const { issues, currentUser } = useStore();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const effectiveUserId = currentUser?.id || 'user-1';
  const userIssues = issues.filter((i) => i.reporterId === effectiveUserId || (!i.reporterId && effectiveUserId === 'user-1'));
  
  const activeCount = userIssues.filter(i => i.status !== 'RESOLVED' && i.status !== 'CITIZEN_VERIFIED' && i.status !== 'REJECTED').length;
  const resolvedCount = userIssues.filter(i => i.status === 'RESOLVED' || i.status === 'CITIZEN_VERIFIED').length;

  const filtered = userIssues.filter((i) => {
    // Filter
    if (filter === 'Active' && (i.status === 'RESOLVED' || i.status === 'CITIZEN_VERIFIED' || i.status === 'REJECTED')) return false;
    if (filter === 'Resolved' && (i.status !== 'RESOLVED' && i.status !== 'CITIZEN_VERIFIED')) return false;
    
    // Search
    if (searchQuery && !i.title.toLowerCase().includes(searchQuery.toLowerCase()) && !i.id.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  return (
    <motion.div className="space-y-8" variants={containerVariants} initial="hidden" animate="show">
      <motion.div variants={itemVariants}>
        <SectionHeader 
          eyebrow="CITIZEN REPORTS"
          title="My Reported Issues" 
          description="Track official department assignment, resolution status, and SLA timeline for issues you've reported." 
          action={
            <Link to="/report">
              <Button size="sm" className="font-bold shadow-xs">
                + Report New Issue
              </Button>
            </Link>
          }
        />
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Reports" value={userIssues.length} icon={Inbox} />
        <StatCard title="Active In Progress" value={activeCount} icon={Clock} valueColor="text-amber-700" />
        <StatCard title="Resolved Issues" value={resolvedCount} icon={MapPin} valueColor="text-emerald-700" />
      </motion.div>

      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(15,23,42,0.03)]">
        <div className="flex bg-slate-50 rounded-xl px-3.5 py-2 border border-slate-200/80 w-full sm:w-80 focus-within:border-blue-600 focus-within:bg-white transition-colors">
          <Search size={17} className="text-slate-400 mr-2 shrink-0 self-center" />
          <input 
            type="text" 
            placeholder="Search by ID or title..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-xs sm:text-sm w-full text-slate-900 placeholder:text-slate-400"
          />
        </div>

        <div className="flex gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-150 whitespace-nowrap cursor-pointer',
                filter === f
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </motion.div>

      {filtered.length === 0 ? (
        <motion.div variants={itemVariants}>
          <Card className="flex flex-col items-center justify-center py-16 text-center border-dashed border-slate-300">
            <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
              <Inbox size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-1">No reports found</h3>
            <p className="text-slate-500 mb-6 max-w-sm text-sm">
              {searchQuery ? "Try adjusting your search query or filters." : "You haven't reported any civic issues yet."}
            </p>
            <Link to="/report">
              <Button variant="outline" className="font-bold">
                Submit a new report
              </Button>
            </Link>
          </Card>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((issue) => (
            <motion.div key={issue.id} variants={itemVariants}>
              <Link to={`/issue/${issue.id}`}>
                <Card noPadding className="flex items-center gap-4 p-4 hover:border-slate-300 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition-all duration-200 group h-full bg-white border-slate-200/80">
                  <div className="h-28 w-28 shrink-0 rounded-xl overflow-hidden bg-slate-100 border border-slate-100 flex items-center justify-center relative">
                    {issue.photos[0] ? (
                      <img src={issue.photos[0]} alt="" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200" />
                    ) : (
                      <MapPin className="text-slate-400" size={24} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{issue.category}</span>
                        {issue.status === 'RESOLVED' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                            <CheckCircle2 size={11} className="text-emerald-700" /> ✓ Resolved
                          </span>
                        ) : (
                          <Badge variant={getStatusVariant(issue.status)} className="text-[9.5px] px-1.5 py-0 uppercase font-bold">
                            {issue.status.replace('_', ' ')}
                          </Badge>
                        )}
                        {issue.isDuplicate && (
                          <span className="inline-flex items-center gap-1 text-[9.5px] font-bold bg-amber-50 text-amber-800 border border-amber-300 px-1.5 py-0 rounded">
                            <AlertTriangle size={10} className="text-amber-600" /> Duplicate Report
                          </span>
                        )}
                        {(issue.duplicateCount || 0) > 0 && (
                          <span className="inline-flex items-center gap-1 text-[9.5px] font-bold bg-blue-50 text-blue-800 border border-blue-200 px-1.5 py-0 rounded">
                            <Layers size={10} className="text-blue-600" /> {issue.duplicateCount} Corroborations
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 shrink-0" title={`Reported on ${formatExactDateTime(issue.createdAt)}`}>
                        <Clock size={10} /> {formatExactDateTime(issue.createdAt)}
                      </span>
                    </div>

                    {issue.isDuplicate && issue.duplicateOf && (
                      <div className="text-[10.5px] font-bold text-amber-700 bg-amber-50/70 border border-amber-200/60 px-2 py-0.5 rounded-md mb-1.5 flex items-center justify-between">
                        <span>Similar to <span className="font-mono">{issue.duplicateOf}</span></span>
                        <span className="text-blue-600 hover:underline">View Original →</span>
                      </div>
                    )}
                    
                    <h4 className="truncate font-bold text-slate-900 text-sm mb-1 group-hover:text-blue-600 transition-colors">
                      {issue.title}
                    </h4>
                    
                    <div className="space-y-1.5 mb-2.5">
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <MapPin size={11} className="text-blue-600 shrink-0" />
                        <span className="truncate">{issue.location.address}</span>
                      </div>
                      
                      {(issue.assignedOfficer || issue.assignedDepartmentId) && (
                        <div className="flex items-center gap-2 text-[11px] text-slate-600">
                          {issue.assignedDepartmentId && (
                            <span className="inline-flex items-center gap-1 font-semibold text-slate-700 truncate">
                              <Building2 size={11} className="text-blue-600 shrink-0" />
                              {issue.assignedDepartmentId}
                            </span>
                          )}
                          {issue.assignedOfficer && (
                            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.2 rounded font-medium truncate">
                              <UserCheck size={11} className="text-emerald-600 shrink-0" />
                              {issue.assignedOfficer}
                            </span>
                          )}
                        </div>
                      )}

                      {/* RESOLVED DETAILS BOX */}
                      {issue.status === 'RESOLVED' && (
                        <div className="bg-emerald-50 border border-emerald-300/90 rounded-xl p-3 text-xs space-y-1 my-1.5 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                              <CheckCircle2 size={13} className="text-emerald-700" />
                              ✓ Resolved
                            </span>
                            {(issue.resolvedAt || issue.resolutionDate) && (
                              <span className="text-[10.5px] font-semibold text-emerald-800">
                                Resolved on: {formatDateOnly(issue.resolvedAt || issue.resolutionDate)}
                              </span>
                            )}
                          </div>
                          {issue.resolutionNote && (
                            <div className="text-[11.5px] text-slate-700 font-normal">
                              <span className="font-bold text-slate-900">Resolution:</span> "{issue.resolutionNote}"
                            </div>
                          )}
                          <div className="text-[10.5px] font-semibold text-emerald-700 pt-0.5">
                            Click to view ground proof & verify on site →
                          </div>
                        </div>
                      )}

                      {issue.status === 'REOPENED' && (
                        <div className="inline-flex items-center gap-1 text-[10.5px] font-bold text-rose-800 bg-rose-50 border border-rose-300/80 px-2 py-0.5 rounded-md">
                          <AlertTriangle size={12} className="text-rose-600" />
                          Reopened for Re-inspection
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 font-medium">Priority:</span>
                        <PriorityBadge priority={issue.authorityPriority || issue.priority || issue.citizenUrgency} score={issue.priorityScore} size="sm" />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400">ETA:</span>
                        <span className="font-bold text-slate-700">{issue.estimatedResolutionTime || '2-5 days'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="pr-2">
                    <ArrowRight className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all duration-150" size={18} />
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default MyReports;
