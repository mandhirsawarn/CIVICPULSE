import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, MapPin, Clock, ArrowRight, Inbox } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { cn } from '../../utils/cn';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';

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
    case 'AI_VERIFIED': return 'info';
    case 'ASSIGNED': return 'info';
    case 'IN_PROGRESS': return 'warning';
    case 'RESOLVED': return 'success';
    case 'CITIZEN_VERIFIED': return 'success';
    default: return 'default';
  }
};

const MyReports = () => {
  const { issues, currentUser } = useStore();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const userIssues = issues.filter((i) => i.reporterId === currentUser?.id);
  
  const activeCount = userIssues.filter(i => i.status !== 'RESOLVED' && i.status !== 'CITIZEN_VERIFIED').length;
  const resolvedCount = userIssues.filter(i => i.status === 'RESOLVED' || i.status === 'CITIZEN_VERIFIED').length;

  const filtered = userIssues.filter((i) => {
    // Filter
    if (filter === 'Active' && (i.status === 'RESOLVED' || i.status === 'CITIZEN_VERIFIED')) return false;
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
        <PageHeader title="My Reports" description="Track the status of issues you've reported in the city." />
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-3 gap-4">
        <StatCard title="Total Reports" value={userIssues.length} icon={Inbox} />
        <StatCard title="Active" value={activeCount} icon={Clock} />
        <StatCard title="Resolved" value={resolvedCount} icon={MapPin} />
      </motion.div>

      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-civic-border shadow-sm">
        <div className="flex bg-brand-50 rounded-lg px-3 py-2 border border-brand-200 w-full sm:w-80 focus-within:border-civic-primary transition-colors">
          <Search size={18} className="text-brand-400 mr-2" />
          <input 
            type="text" 
            placeholder="Search by ID or title..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-sm w-full text-civic-text placeholder:text-brand-400"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-semibold transition-all whitespace-nowrap',
                filter === f
                  ? 'bg-civic-primary text-white shadow-sm'
                  : 'bg-brand-50 text-brand-500 hover:bg-brand-100'
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </motion.div>

      {filtered.length === 0 ? (
        <motion.div variants={itemVariants}>
          <Card className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-brand-50 flex items-center justify-center text-brand-300 mb-4">
              <Inbox size={32} />
            </div>
            <h3 className="text-xl font-bold text-civic-text mb-2">No reports found</h3>
            <p className="text-civic-muted mb-6 max-w-sm text-sm">
              {searchQuery ? "Try adjusting your search query or filters." : "You haven't reported any civic issues yet."}
            </p>
            <Link to="/report" className="text-sm font-semibold text-civic-primary hover:underline">
              Submit a new report
            </Link>
          </Card>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((issue) => (
            <motion.div key={issue.id} variants={itemVariants}>
              <Link to={`/issue/${issue.id}`}>
                <Card noPadding className="flex items-center gap-4 p-4 hover:border-civic-primary hover:shadow-md transition-all group h-full">
                  <div className="h-full w-28 shrink-0 rounded-l-lg overflow-hidden bg-brand-50 border-r border-brand-100 flex items-center justify-center">
                    {issue.photos[0] ? (
                      <img src={issue.photos[0]} alt="" className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <MapPin className="text-brand-300" size={24} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 py-3 pr-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-brand-500 uppercase tracking-wider">{issue.id}</span>
                        <Badge variant={getStatusVariant(issue.status)} className="text-[10px] px-1.5 py-0">
                          {issue.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <span className="text-[10px] text-civic-muted flex items-center gap-1">
                        <Clock size={10} /> {new Date(issue.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <p className="truncate font-semibold text-civic-text text-sm mb-1">{issue.title}</p>
                    
                    <div className="flex items-center gap-1 text-xs text-civic-muted mb-2">
                      <MapPin size={12} className="flex-shrink-0" />
                      <span className="truncate">{issue.location.address}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 mb-2">
                      <div className="flex flex-col">
                        <span className="text-[9px] uppercase font-bold text-civic-muted tracking-wider">Category</span>
                        <span className="text-xs font-semibold text-civic-text">{issue.category}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] uppercase font-bold text-civic-muted tracking-wider">Department</span>
                        <span className="text-xs font-semibold text-civic-primary truncate">{issue.assignedDepartmentId || 'Pending Routing'}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 p-2 bg-brand-50 rounded-md">
                      <div className="flex flex-col">
                        <span className="text-[9px] uppercase font-bold text-civic-muted tracking-wider">Priority / Urgency</span>
                        <div className="flex items-center gap-1 text-xs font-semibold">
                          <span className={cn(issue.priorityScore > 75 ? "text-civic-danger" : "text-civic-warning")}>{issue.priorityScore}/100</span>
                          <span className="text-civic-muted">•</span>
                          <span className={cn(issue.citizenUrgency === 'URGENT' ? "text-civic-danger" : "text-civic-text")}>{issue.citizenUrgency || 'MEDIUM'}</span>
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] uppercase font-bold text-civic-muted tracking-wider">Est. Resolution</span>
                        <span className="text-xs font-bold text-civic-text">{issue.estimatedResolutionTime || '2-5 days'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="px-3">
                    <ArrowRight className="text-brand-300 group-hover:text-civic-primary transition-colors" size={20} />
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
