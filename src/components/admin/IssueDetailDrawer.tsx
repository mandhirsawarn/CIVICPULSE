import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Issue, FieldTeam } from '../../types';
import { X, MapPin, AlertTriangle, ShieldCheck, Clock, User, CheckCircle2, ChevronRight, Activity } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';
import { Link } from 'react-router-dom';

interface IssueDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  issue: Issue | null;
  onFocusMap: () => void;
  fieldTeams: FieldTeam[];
}

export function IssueDetailDrawer({ isOpen, onClose, issue, onFocusMap, fieldTeams }: IssueDetailDrawerProps) {
  if (!issue) return null;

  const assignedTeam = fieldTeams.find(t => t.id === issue.assignedTeamId);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 z-[9998] md:hidden backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: '100%', opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0.5 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-[64px] right-0 h-[calc(100vh-64px)] w-full md:w-[400px] bg-white border-l border-civic-border shadow-2xl z-[9999] overflow-y-auto flex flex-col"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-civic-border p-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-civic-muted uppercase tracking-wider">{issue.id}</span>
                <Badge variant={
                  issue.priority === 'CRITICAL' ? 'danger' :
                  issue.priority === 'HIGH' ? 'warning' : 'outline'
                } className="text-[10px] px-1.5 py-0">
                  {issue.priority} PRIORITY
                </Badge>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-brand-50 rounded-full text-civic-muted transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 flex-1 flex flex-col gap-6">
              
              {/* Title & Location */}
              <div>
                <h2 className="text-xl font-bold text-civic-text mb-3 leading-tight">{issue.title}</h2>
                <div className="flex items-start gap-2 text-sm text-civic-muted mb-2">
                  <MapPin size={16} className="mt-0.5 text-civic-primary flex-shrink-0" />
                  <span>{issue.location.address}, {issue.location.ward}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-civic-muted">
                  <Clock size={14} />
                  <span>Reported: {new Date(issue.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* AI Priority */}
              {issue.aiAnalysis && (
                <div className="bg-brand-50 border border-brand-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Activity size={16} className="text-civic-primary" />
                      <h3 className="text-sm font-bold text-civic-text uppercase tracking-wider">AI Priority</h3>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg font-black text-civic-primary">{issue.aiAnalysis.priorityScore}</span>
                      <span className="text-xs text-civic-muted">/ 100</span>
                    </div>
                  </div>
                  <ul className="space-y-1.5 text-xs text-civic-muted">
                    {issue.aiAnalysis.priorityReasoning.map((reason, idx) => (
                      <li key={idx} className="flex justify-between items-center">
                        <div className="flex items-start gap-2">
                          <span className="w-1 h-1 rounded-full bg-civic-primary mt-1.5 flex-shrink-0" />
                          <span className="truncate">{reason.factor}</span>
                        </div>
                        <span className="font-bold text-civic-text">+{reason.score}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Status Tracker */}
              <div>
                <h3 className="text-xs font-bold text-civic-muted uppercase tracking-wider mb-4">Status: {issue.status.replace('_', ' ')}</h3>
                <div className="relative pl-4 space-y-4">
                  <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-brand-100" />
                  
                  {['REPORTED', 'AI_VERIFIED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'].map((s, idx) => {
                    const isCompleted = issue.timeline.some(t => t.status === s);
                    const isCurrent = issue.status === s;
                    return (
                      <div key={s} className={cn("relative flex items-center gap-3", !isCompleted && !isCurrent && "opacity-40")}>
                        <div className={cn(
                          "w-4 h-4 rounded-full flex items-center justify-center z-10 border-2",
                          isCompleted ? "bg-civic-success border-civic-success" : 
                          isCurrent ? "bg-white border-civic-primary" : "bg-white border-brand-200"
                        )}>
                          {isCompleted && <CheckCircle2 size={10} className="text-white" />}
                        </div>
                        <span className={cn(
                          "text-sm font-medium",
                          isCurrent ? "text-civic-text font-bold" : "text-civic-muted"
                        )}>
                          {s.replace('_', ' ')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Department & Team */}
              <div className="border-t border-civic-border pt-6">
                <div className="flex flex-col gap-4">
                  <div>
                    <h3 className="text-xs font-bold text-civic-muted uppercase tracking-wider mb-1">Department</h3>
                    <p className="text-sm font-semibold text-civic-text">{issue.assignedDepartmentId ? issue.assignedDepartmentId.replace('dept-', '').toUpperCase() : 'Unassigned'}</p>
                  </div>
                  
                  {assignedTeam && (
                    <div className="bg-white border border-civic-border rounded-lg p-3">
                      <h3 className="text-xs font-bold text-civic-muted uppercase tracking-wider mb-2">Field Team</h3>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-civic-primary">
                            <User size={16} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-civic-text">{assignedTeam.name}</p>
                            <p className="text-xs text-civic-muted">{assignedTeam.members} members</p>
                          </div>
                        </div>
                        <Badge variant={assignedTeam.status === 'WORKING' ? 'warning' : 'success'} className="text-[10px]">
                          {assignedTeam.status}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-civic-border bg-brand-50 flex flex-col gap-2">
              <Button onClick={onFocusMap} variant="outline" className="w-full">
                Focus on Map
              </Button>
              <Link to={`/admin/issues/${issue.id}`} className="block w-full">
                <Button className="w-full">
                  View Full Issue
                </Button>
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
