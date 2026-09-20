import React, { useState, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { 
  ShieldAlert, AlertTriangle, Activity, MapPin, Users, CheckCircle2, 
  ChevronRight, X, Clock, BrainCircuit, ArrowRight, Flame, Layers, 
  RefreshCw, Search, Filter, Calendar, User, Phone, Mail, Mic, 
  Check, RotateCcw, AlertCircle, FileText, Send, Building2, UserCheck,
  ExternalLink, Sparkles, SlidersHorizontal, ArrowUpDown
} from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { cn } from '../../utils/cn';
import { Issue, FieldTeam, IssueStatus, Severity, IssueCategory } from '../../types';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PriorityBadge } from '../../components/ui/PriorityBadge';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { formatExactDateTime, formatFullDate, formatTimeOnly } from '../../utils/dateFormat';

export const ALL_STATUSES: { id: IssueStatus; label: string; color: string }[] = [
  { id: 'REPORTED', label: 'New / Reported', color: 'bg-slate-100 text-slate-700 border-slate-300' },
  { id: 'UNDER_REVIEW', label: 'Under Review', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'AI_VERIFIED', label: 'Verified', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { id: 'ASSIGNED', label: 'Assigned', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: 'bg-amber-50 text-amber-800 border-amber-300' },
  { id: 'ON_HOLD', label: 'On Hold', color: 'bg-orange-50 text-orange-800 border-orange-300' },
  { id: 'RESOLVED', label: 'Resolved', color: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
  { id: 'REOPENED', label: 'Reopened', color: 'bg-rose-50 text-rose-800 border-rose-300' },
  { id: 'REJECTED', label: 'Rejected', color: 'bg-red-50 text-red-800 border-red-300' },
  { id: 'DUPLICATE', label: 'Duplicate', color: 'bg-yellow-50 text-yellow-800 border-yellow-300' },
];

export const getStatusBadge = (status: IssueStatus) => {
  const match = ALL_STATUSES.find(s => s.id === status);
  if (!match) return <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-slate-100 text-slate-700">{status}</span>;
  return (
    <span className={cn("px-2 py-0.5 text-[10.5px] font-extrabold uppercase tracking-wider rounded-md border inline-block whitespace-nowrap", match.color)}>
      {match.label}
    </span>
  );
};

const IssueIntelligence = () => {
  const { 
    issues, departments, fieldTeams, 
    updateIssueOperationalFields, addInternalNote, 
    resolveIssueWithProof, reopenIssue, overrideDuplicateStatus,
    syncIssuesFromServer, isSyncing, lastSyncTime,
    unreadIncomingCount, latestIncomingAlert, clearIncomingAlert
  } = useStore();

  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [filterDepartment, setFilterDepartment] = useState<string>('ALL');
  const [filterSla, setFilterSla] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'priority' | 'support' | 'sla'>('newest');

  // Operational Edit States in Drawer
  const [editStatus, setEditStatus] = useState<IssueStatus | ''>('');
  const [editPriority, setEditPriority] = useState<Severity | ''>('');
  const [editDeptId, setEditDeptId] = useState<string>('');
  const [editTeamId, setEditTeamId] = useState<string>('');
  const [editOfficer, setEditOfficer] = useState<string>('');
  const [editEtaDate, setEditEtaDate] = useState<string>('');
  const [newNoteText, setNewNoteText] = useState('');
  const [isSavingOps, setIsSavingOps] = useState(false);

  // Resolution Modal State
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [resolutionNoteInput, setResolutionNoteInput] = useState('');
  const [resolutionPhotoInput, setResolutionPhotoInput] = useState('');

  // Reopen Modal State
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenReasonInput, setReopenReasonInput] = useState('');

  // Find active selected issue
  const selectedIssue = useMemo(() => {
    return issues.find(i => i.id === selectedIssueId) || null;
  }, [issues, selectedIssueId]);

  // When selected issue changes, populate local draft edit inputs
  const handleOpenDrawer = (issue: Issue) => {
    setSelectedIssueId(issue.id);
    setEditStatus(issue.status);
    setEditPriority(issue.authorityPriority || issue.priority || 'MEDIUM');
    setEditDeptId(issue.assignedDepartmentId || issue.aiAnalysis?.suggestedDepartment || '');
    setEditTeamId(issue.assignedTeamId || '');
    setEditOfficer(issue.assignedOfficer || '');
    setEditEtaDate(issue.slaTarget ? issue.slaTarget.slice(0, 10) : '');
    setNewNoteText('');
  };

  // Filter and sort issues
  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = issue.id.toLowerCase().includes(q);
        const matchTitle = issue.title.toLowerCase().includes(q);
        const matchAddr = issue.location.address.toLowerCase().includes(q);
        const matchEmail = issue.contactEmail?.toLowerCase().includes(q);
        if (!matchId && !matchTitle && !matchAddr && !matchEmail) return false;
      }

      // Status Filter
      if (filterStatus !== 'ALL') {
        if (filterStatus === 'RESOLVED') {
          if (issue.status !== 'RESOLVED' && issue.status !== 'CITIZEN_VERIFIED') return false;
        } else if (issue.status !== filterStatus) {
          return false;
        }
      }

      // Category
      if (filterCategory !== 'ALL' && issue.category !== filterCategory) {
        return false;
      }

      // Priority
      if (filterPriority !== 'ALL') {
        const effPriority = issue.authorityPriority || issue.priority;
        if (effPriority !== filterPriority) return false;
      }

      // Department
      if (filterDepartment !== 'ALL') {
        const dept = issue.assignedDepartmentId || issue.aiAnalysis?.suggestedDepartment;
        if (dept !== filterDepartment) return false;
      }

      // SLA Filter
      if (filterSla === 'BREACHED') {
        if (!issue.slaTarget || new Date(issue.slaTarget).getTime() >= Date.now() || issue.status === 'RESOLVED') return false;
      } else if (filterSla === 'DUE_SOON') {
        if (!issue.slaTarget) return false;
        const diffHours = (new Date(issue.slaTarget).getTime() - Date.now()) / (1000 * 60 * 60);
        if (diffHours < 0 || diffHours > 24 || issue.status === 'RESOLVED') return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === 'priority') return (b.aiAnalysis?.priorityScore || b.priorityScore || 0) - (a.aiAnalysis?.priorityScore || a.priorityScore || 0);
      if (sortBy === 'support') return (b.upvotes || 0) - (a.upvotes || 0);
      if (sortBy === 'sla') {
        const slaA = a.slaTarget ? new Date(a.slaTarget).getTime() : Infinity;
        const slaB = b.slaTarget ? new Date(b.slaTarget).getTime() : Infinity;
        return slaA - slaB;
      }
      return 0;
    });
  }, [issues, searchQuery, filterStatus, filterCategory, filterPriority, filterDepartment, filterSla, sortBy]);

  // Handle Save Operational Changes
  const handleSaveOperationalChanges = async () => {
    if (!selectedIssue) return;
    setIsSavingOps(true);
    try {
      const updates: Partial<Issue> = {};
      const changes: string[] = [];
      const nowIso = new Date().toISOString();

      if (editStatus && editStatus !== selectedIssue.status) {
        updates.status = editStatus;
        if (editStatus === 'RESOLVED') {
          updates.resolvedAt = nowIso;
          updates.resolutionDate = nowIso;
          updates.resolutionNote = resolutionNoteInput.trim() || selectedIssue.resolutionNote || 'Issue inspected and marked resolved by municipal authority.';
          if (resolutionPhotoInput.trim()) {
            updates.resolutionEvidence = [resolutionPhotoInput.trim()];
          }
          changes.push(`Status changed to RESOLVED. ${updates.resolutionNote}`);
        } else if (editStatus === 'REOPENED') {
          updates.reopenedAt = nowIso;
          changes.push(`Status changed to REOPENED`);
        } else {
          changes.push(`Status changed to ${editStatus.replace('_', ' ')}`);
        }
      } else if (editStatus === 'RESOLVED') {
        // Status was already RESOLVED, but authority may have updated resolution note or photo
        if (resolutionNoteInput.trim() && resolutionNoteInput.trim() !== selectedIssue.resolutionNote) {
          updates.resolutionNote = resolutionNoteInput.trim();
          changes.push(`Resolution note updated`);
        }
        if (resolutionPhotoInput.trim()) {
          updates.resolutionEvidence = [resolutionPhotoInput.trim()];
          changes.push(`Resolution photo updated`);
        }
      }

      if (editPriority && editPriority !== (selectedIssue.authorityPriority || selectedIssue.priority)) {
        updates.authorityPriority = editPriority;
        updates.priority = editPriority;
        changes.push(`Priority adjusted to ${editPriority}`);
      }

      if (editDeptId && editDeptId !== selectedIssue.assignedDepartmentId) {
        updates.assignedDepartmentId = editDeptId;
        changes.push(`Department assigned to ${editDeptId}`);
      }

      if (editTeamId && editTeamId !== selectedIssue.assignedTeamId) {
        updates.assignedTeamId = editTeamId;
        const teamName = fieldTeams.find(t => t.id === editTeamId)?.name || editTeamId;
        changes.push(`Team assigned to ${teamName}`);
      }

      if (editOfficer !== (selectedIssue.assignedOfficer || '')) {
        updates.assignedOfficer = editOfficer.trim() || undefined;
        changes.push(`Officer assigned: ${editOfficer.trim()}`);
      }

      if (editEtaDate) {
        const newTarget = new Date(`${editEtaDate}T18:00:00.000Z`).toISOString();
        if (newTarget !== selectedIssue.slaTarget) {
          updates.slaTarget = newTarget;
          updates.estimatedResolutionTime = new Date(newTarget).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
          changes.push(`Resolution ETA revised to ${updates.estimatedResolutionTime}`);
        }
      }

      if (changes.length > 0 || Object.keys(updates).length > 0) {
        await updateIssueOperationalFields(
          selectedIssue.id, 
          updates, 
          changes.join('; ')
        );
      }
    } finally {
      setIsSavingOps(false);
    }
  };

  // Handle Add Internal Note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue || !newNoteText.trim()) return;
    await addInternalNote(selectedIssue.id, newNoteText.trim(), 'Authority Command');
    setNewNoteText('');
  };

  // Handle Submit Resolution
  const handleConfirmResolution = async () => {
    if (!selectedIssue || !resolutionNoteInput.trim()) return;
    const photos = resolutionPhotoInput.trim() ? [resolutionPhotoInput.trim()] : [];
    await resolveIssueWithProof(selectedIssue.id, resolutionNoteInput.trim(), photos, editOfficer || 'Authority Official');
    setShowResolutionModal(false);
    setResolutionNoteInput('');
    setResolutionPhotoInput('');
    setEditStatus('RESOLVED');
  };

  // Handle Confirm Reopen
  const handleConfirmReopen = async () => {
    if (!selectedIssue || !reopenReasonInput.trim()) return;
    await reopenIssue(selectedIssue.id, reopenReasonInput.trim());
    setShowReopenModal(false);
    setReopenReasonInput('');
    setEditStatus('REOPENED');
  };

  // SLA Calculation helper
  const getSlaDisplay = (issue: Issue) => {
    if (issue.status === 'RESOLVED' || issue.status === 'CITIZEN_VERIFIED') {
      return <span className="text-emerald-700 text-xs font-bold">✓ Completed</span>;
    }
    if (!issue.slaTarget) {
      return <span className="text-slate-400 text-xs">Standard SLA</span>;
    }
    const diffMs = new Date(issue.slaTarget).getTime() - Date.now();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    if (diffMs < 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
          <AlertCircle size={12} /> SLA Breached ({Math.abs(diffHours)}h ago)
        </span>
      );
    }
    if (diffHours <= 24) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
          <Clock size={12} /> Due in {diffHours}h
        </span>
      );
    }
    return (
      <span className="text-[11px] font-semibold text-slate-600">
        Due {new Date(issue.slaTarget).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* REAL-TIME INCOMING ALERT BANNER */}
      {latestIncomingAlert && unreadIncomingCount > 0 && (
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between gap-4 animate-bounce-short">
          <div className="flex items-center gap-3 min-w-0">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
            <div className="min-w-0">
              <div className="font-black text-sm flex items-center gap-2">
                <span>🔴 {unreadIncomingCount} New Report Received from Citizen!</span>
                <span className="font-mono text-xs bg-white/20 px-2 py-0.5 rounded">{latestIncomingAlert.issueId}</span>
              </div>
              <p className="text-xs text-white/90 truncate mt-0.5">
                {latestIncomingAlert.category}: {latestIncomingAlert.title} at {latestIncomingAlert.location}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button 
              size="sm" 
              variant="secondary"
              className="bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 shadow-xs"
              onClick={() => {
                clearIncomingAlert();
                const found = issues.find(i => i.id === latestIncomingAlert.issueId);
                if (found) handleOpenDrawer(found);
              }}
            >
              Inspect Report →
            </Button>
            <button 
              onClick={clearIncomingAlert} 
              className="p-1 hover:bg-white/20 rounded-lg text-white/80 hover:text-white"
              title="Dismiss alert"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Header with Live Sync Status */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <SectionHeader 
            eyebrow="OPERATIONAL QUEUE"
            title="Authority Command Queue" 
            description="Live, bi-directional civic operations queue. Every citizen report appears here in real time with operational controls." 
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Shared Persistence</div>
            <div className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5 justify-end">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Sync Active
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => syncIssuesFromServer()} 
            disabled={isSyncing}
            className="flex items-center gap-1.5 text-xs font-bold bg-white"
          >
            <RefreshCw size={13} className={cn(isSyncing ? "animate-spin text-blue-600" : "")} />
            {isSyncing ? 'Syncing...' : 'Refresh Queue'}
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 rounded-2xl bg-white border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Input */}
          <div className="flex-1 flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 focus-within:bg-white focus-within:border-blue-600 transition-all">
            <Search size={16} className="text-slate-400 mr-2 shrink-0" />
            <input 
              type="text"
              placeholder="Search by Report ID (CP-...), Title, Location, Citizen email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-xs sm:text-sm w-full text-slate-900 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Quick Sort */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-600 cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="priority">Highest Priority</option>
              <option value="support">Most Community Support</option>
              <option value="sla">SLA Deadline</option>
            </select>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 items-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
            <Filter size={12} /> Filters:
          </span>

          {/* Status Filter */}
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium"
          >
            <option value="ALL">All Statuses ({issues.length})</option>
            {ALL_STATUSES.map(s => (
              <option key={s.id} value={s.id}>
                {s.label} ({issues.filter(i => i.status === s.id).length})
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select 
            value={filterCategory} 
            onChange={(e) => setFilterCategory(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium"
          >
            <option value="ALL">All Categories</option>
            {['Pothole', 'Waterlogging', 'Streetlight', 'Garbage', 'Road Damage', 'Traffic Sign', 'Public Safety'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Priority Filter */}
          <select 
            value={filterPriority} 
            onChange={(e) => setFilterPriority(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Department Filter */}
          <select 
            value={filterDepartment} 
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium"
          >
            <option value="ALL">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          {/* SLA Filter */}
          <select 
            value={filterSla} 
            onChange={(e) => setFilterSla(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium"
          >
            <option value="ALL">All SLA States</option>
            <option value="BREACHED">⚠ SLA Breached</option>
            <option value="DUE_SOON">⚡ Due within 24h</option>
          </select>

          {(filterStatus !== 'ALL' || filterCategory !== 'ALL' || filterPriority !== 'ALL' || filterDepartment !== 'ALL' || filterSla !== 'ALL' || searchQuery) && (
            <button 
              onClick={() => {
                setFilterStatus('ALL');
                setFilterCategory('ALL');
                setFilterPriority('ALL');
                setFilterDepartment('ALL');
                setFilterSla('ALL');
                setSearchQuery('');
              }}
              className="text-xs font-bold text-red-600 hover:text-red-800 ml-auto hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </Card>

      {/* OPERATIONS QUEUE TABLE */}
      <Card className="p-0 border border-slate-200/80 rounded-2xl shadow-xs bg-white overflow-hidden">
        <div className="p-4 bg-slate-50/70 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs sm:text-sm text-slate-900">Incoming & Active Reports Queue</span>
            <span className="bg-slate-200 text-slate-700 text-xs px-2 py-0.5 rounded-full font-bold">
              {filteredIssues.length}
            </span>
          </div>
          <span className="text-[11px] text-slate-400">Click any row to open full operational controls</span>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm text-slate-800">
            <thead className="text-[11px] uppercase bg-slate-50 text-slate-500 border-b border-slate-200/80 tracking-wider font-bold">
              <tr>
                <th className="px-4 py-3.5">Issue ID</th>
                <th className="px-4 py-3.5">Report / Title</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Location</th>
                <th className="px-4 py-3.5">Reported By</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Reported</th>
                <th className="px-4 py-3.5">Priority</th>
                <th className="px-4 py-3.5">Support</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Assigned Officer</th>
                <th className="px-4 py-3.5">SLA / ETA</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredIssues.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center py-12 text-slate-400 text-sm">
                    No reports match your selected filters or search query.
                  </td>
                </tr>
              ) : (
                filteredIssues.map((issue) => {
                  const isSelected = selectedIssueId === issue.id;
                  const isDup = issue.isDuplicate || issue.aiAnalysis?.possibleDuplicate;
                  const effPriority = issue.authorityPriority || issue.priority || 'MEDIUM';

                  return (
                    <tr 
                      key={issue.id}
                      onClick={() => handleOpenDrawer(issue)}
                      className={cn(
                        "hover:bg-blue-50/50 transition-colors cursor-pointer group",
                        isSelected ? "bg-blue-50/80 ring-1 ring-inset ring-blue-500" : ""
                      )}
                    >
                      {/* ID */}
                      <td className="px-4 py-3.5 font-mono font-bold text-xs text-blue-700 whitespace-nowrap">
                        {issue.id}
                      </td>

                      {/* Title & Photo */}
                      <td className="px-4 py-3.5 max-w-[240px]">
                        <div className="flex items-center gap-2.5">
                          {issue.photos && issue.photos[0] ? (
                            <img src={issue.photos[0]} alt="" className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 text-[10px] font-bold">
                              NO IMG
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-xs text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                              {issue.title}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                              {issue.voiceRecording && <Mic size={11} className="text-blue-600 shrink-0" />}
                              <span>{issue.description.slice(0, 45)}...</span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5 sm:hidden">
                              Reported: {formatExactDateTime(issue.createdAt)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-slate-800">{issue.category}</span>
                          {isDup && (
                            <span className="bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.2 rounded text-[9px] font-bold">
                              DUPLICATE
                            </span>
                          )}
                          {(issue.duplicateCount || 0) > 0 && (
                            <span className="bg-blue-100 text-blue-900 border border-blue-200 px-1.5 py-0.2 rounded text-[9px] font-bold">
                              +{issue.duplicateCount} LINKED
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Location */}
                      <td className="px-4 py-3.5 max-w-[180px]">
                        <div className="text-xs font-semibold text-slate-900 truncate">{issue.location.address}</div>
                        <div className="text-[11px] text-slate-400 truncate">{issue.location.ward}</div>
                      </td>

                      {/* Reported By */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="text-xs font-medium text-slate-800 font-mono">
                          {issue.reporterId === 'user-1' ? 'Rohan S. (Citizen)' : issue.reporterId}
                        </div>
                        {issue.contactPhone && (
                          <div className="text-[10px] text-slate-400 font-mono">📞 {issue.contactPhone}</div>
                        )}
                      </td>

                      {/* Reported */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                          <Clock size={12} className="text-slate-400 shrink-0" />
                          <span>{formatExactDateTime(issue.createdAt)}</span>
                        </div>
                      </td>

                      {/* Priority */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <PriorityBadge priority={effPriority} size="sm" />
                          {issue.aiAnalysis && (
                            <span className="text-[10px] font-mono text-slate-400" title={`AI Score: ${issue.aiAnalysis.priorityScore}/100`}>
                              ({issue.aiAnalysis.priorityScore})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Support */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs font-bold text-slate-700">
                        👍 {issue.upvotes || 0}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {getStatusBadge(issue.status)}
                      </td>

                      {/* Assigned Officer */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs">
                        {issue.assignedOfficer ? (
                          <span className="font-semibold text-slate-800 flex items-center gap-1">
                            <UserCheck size={13} className="text-emerald-600" />
                            {issue.assignedOfficer}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Unassigned</span>
                        )}
                      </td>

                      {/* SLA / ETA */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {getSlaDisplay(issue)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <Button size="sm" variant="outline" className="text-xs font-bold h-7 px-2.5">
                          Manage →
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* AUTHORITY REPORT MANAGEMENT DRAWER */}
      {/* ========================================================================= */}
      {selectedIssue && (
        <>
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 transition-opacity" onClick={() => setSelectedIssueId(null)}></div>
          <div className="fixed right-0 top-0 bottom-0 w-[640px] max-w-[95%] bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col overflow-y-auto custom-scrollbar animate-slide-in-right">
            
            {/* Drawer Header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-200 p-5 flex items-center justify-between z-10">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono font-bold text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                    {selectedIssue.id}
                  </span>
                  {getStatusBadge(selectedIssue.status)}
                  <PriorityBadge priority={selectedIssue.authorityPriority || selectedIssue.priority} size="sm" />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                  {selectedIssue.title}
                </h2>
              </div>
              <button 
                onClick={() => setSelectedIssueId(null)} 
                className="p-2 text-slate-400 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6 flex-1">

              {/* ----------------------------------------------------------------- */}
              {/* SECTION: REPORT TIMELINE & IMMUTABLE SUBMISSION INFO */}
              {/* ----------------------------------------------------------------- */}
              <Card className="p-4 border border-slate-200/80 bg-white rounded-2xl shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-blue-600" />
                    <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
                      Report Timeline / Information
                    </h3>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    ID: {selectedIssue.id}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {/* Reported */}
                  <div className="bg-slate-50/90 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Reported
                    </span>
                    <div className="text-xs font-bold text-slate-900 leading-snug">
                      {formatFullDate(selectedIssue.createdAt)}
                    </div>
                    <div className="text-[11px] font-mono font-medium text-slate-600 mt-0.5">
                      {formatTimeOnly(selectedIssue.createdAt)}
                    </div>
                  </div>

                  {/* Last Updated */}
                  <div className="bg-slate-50/90 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Last Updated
                    </span>
                    <div className="text-xs font-bold text-slate-900 leading-snug">
                      {formatFullDate(selectedIssue.lastUpdatedAt || selectedIssue.updatedAt || selectedIssue.createdAt)}
                    </div>
                    <div className="text-[11px] font-mono font-medium text-slate-600 mt-0.5">
                      {formatTimeOnly(selectedIssue.lastUpdatedAt || selectedIssue.updatedAt || selectedIssue.createdAt)}
                    </div>
                  </div>

                  {/* Resolved (Only shown if report is resolved) */}
                  {(selectedIssue.status === 'RESOLVED' || selectedIssue.status === 'CITIZEN_VERIFIED') && (
                    <div className="bg-emerald-50/90 p-3 rounded-xl border border-emerald-200/80">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block mb-1">
                        ✓ Resolved
                      </span>
                      <div className="text-xs font-bold text-emerald-950 leading-snug">
                        {formatFullDate(selectedIssue.resolvedAt || selectedIssue.resolutionDate || selectedIssue.updatedAt)}
                      </div>
                      <div className="text-[11px] font-mono font-medium text-emerald-700 mt-0.5">
                        {formatTimeOnly(selectedIssue.resolvedAt || selectedIssue.resolutionDate || selectedIssue.updatedAt)}
                      </div>
                    </div>
                  )}

                  {/* Reopened (Only shown if report is reopened) */}
                  {selectedIssue.status === 'REOPENED' && (
                    <div className="bg-rose-50/90 p-3 rounded-xl border border-rose-200/80">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 block mb-1">
                        ⚠️ Reopened
                      </span>
                      <div className="text-xs font-bold text-rose-950 leading-snug">
                        {formatFullDate(selectedIssue.reopenedAt || selectedIssue.updatedAt)}
                      </div>
                      <div className="text-[11px] font-mono font-medium text-rose-700 mt-0.5">
                        {formatTimeOnly(selectedIssue.reopenedAt || selectedIssue.updatedAt)}
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* ----------------------------------------------------------------- */}
              {/* SECTION D: AUTHORITY OPERATIONAL CONTROLS PANEL */}
              {/* ----------------------------------------------------------------- */}
              <Card className="p-5 border-2 border-blue-600/30 bg-gradient-to-br from-blue-50/40 via-white to-slate-50/50 rounded-2xl shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-blue-100 pb-3">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal size={17} className="text-blue-600" />
                    <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                      Authority Operational Controls
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full">
                    Official Override
                  </span>
                </div>

                {/* 1. Status Selection */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Operational Status *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {ALL_STATUSES.map(st => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setEditStatus(st.id)}
                        className={cn(
                          "px-2.5 py-2 rounded-xl text-xs font-bold transition-all text-left border cursor-pointer",
                          editStatus === st.id 
                            ? "bg-slate-900 text-white border-slate-900 shadow-xs ring-1 ring-slate-900" 
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        )}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>

                  {/* Inline Resolution Details if RESOLVED */}
                  {editStatus === 'RESOLVED' && (
                    <div className="mt-3 p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 size={13} className="text-emerald-700" /> Resolution Note & Ground Summary
                        </label>
                        <span className="text-[10px] text-emerald-700 font-medium">Visible to Citizen</span>
                      </div>
                      <textarea
                        value={resolutionNoteInput}
                        onChange={(e) => setResolutionNoteInput(e.target.value)}
                        placeholder="e.g. Pothole asphalted and road leveled with thermoplastic markings applied..."
                        className="w-full text-xs p-2.5 rounded-lg border border-emerald-300 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600 min-h-[60px]"
                      />
                      <input
                        type="url"
                        value={resolutionPhotoInput}
                        onChange={(e) => setResolutionPhotoInput(e.target.value)}
                        placeholder="Optional resolution evidence photo URL..."
                        className="w-full text-xs p-2 rounded-lg border border-emerald-300 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                      />
                    </div>
                  )}
                </div>

                {/* 2. Authority Priority vs AI Recommended */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Authority Priority *
                    </label>
                    <select
                      value={editPriority}
                      onChange={(e: any) => setEditPriority(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    >
                      <option value="CRITICAL">🚨 Critical</option>
                      <option value="HIGH">⚠️ High</option>
                      <option value="MEDIUM">⚡ Medium</option>
                      <option value="LOW">🌱 Low</option>
                    </select>
                    <div className="text-[10px] text-slate-400 mt-1">
                      AI Recommended: <span className="font-bold text-slate-600">{selectedIssue.aiAnalysis?.severity || 'MEDIUM'} ({selectedIssue.aiAnalysis?.priorityScore || 50}/100)</span>
                    </div>
                  </div>

                  {/* 3. Estimated Resolution Date */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Estimated Resolution (ETA)
                    </label>
                    <input 
                      type="date"
                      value={editEtaDate}
                      onChange={(e) => setEditEtaDate(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                    <div className="text-[10px] text-slate-400 mt-1">
                      Changes immediately notify the citizen in My Reports.
                    </div>
                  </div>
                </div>

                {/* 4. Department & Officer Assignment */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Department Assignment
                    </label>
                    <select
                      value={editDeptId}
                      onChange={(e) => setEditDeptId(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    >
                      <option value="">Unassigned</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Assigned Officer Name
                    </label>
                    <input 
                      type="text"
                      placeholder="e.g. Officer Vikram Singh"
                      value={editOfficer}
                      onChange={(e) => setEditOfficer(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  </div>
                </div>

                {/* 5. Field Team Selector */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Field Response Team Dispatch
                  </label>
                  <select
                    value={editTeamId}
                    onChange={(e) => setEditTeamId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="">No field team dispatched</option>
                    {fieldTeams.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.status}) • {t.members} members
                      </option>
                    ))}
                  </select>
                </div>

                {/* Save Changes Button */}
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    All changes write to shared storage & notify citizen.
                  </span>
                  <Button
                    onClick={handleSaveOperationalChanges}
                    disabled={isSavingOps}
                    className="font-bold text-xs px-5 shadow-xs"
                  >
                    {isSavingOps ? 'Saving...' : 'Save Operational Changes'}
                  </Button>
                </div>

                {/* Quick Action Buttons */}
                <div className="pt-3 border-t border-slate-200/80 flex flex-wrap gap-2">
                  {selectedIssue.status !== 'RESOLVED' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setShowResolutionModal(true)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                    >
                      ✓ Mark as Resolved with Evidence
                    </Button>
                  )}

                  {(selectedIssue.status === 'RESOLVED' || selectedIssue.status === 'CITIZEN_VERIFIED') && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowReopenModal(true)}
                      className="text-rose-700 border-rose-300 hover:bg-rose-50 font-bold text-xs"
                    >
                      <RotateCcw size={13} className="mr-1" /> Reopen Report
                    </Button>
                  )}

                  {selectedIssue.isDuplicate && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => overrideDuplicateStatus(selectedIssue.id, 'SEPARATE')}
                      className="text-blue-700 border-blue-300 hover:bg-blue-50 font-bold text-xs"
                    >
                      Unlink Duplicate (Mark Separate)
                    </Button>
                  )}
                </div>
              </Card>

              {/* ----------------------------------------------------------------- */}
              {/* SECTION A: REPORT INFORMATION & LOCATION */}
              {/* ----------------------------------------------------------------- */}
              <div className="space-y-3">
                <h3 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider">
                  Citizen Incident Details
                </h3>

                {/* Photo & Description */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {selectedIssue.photos[0] ? (
                    <div className="sm:col-span-1 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-square">
                      <img src={selectedIssue.photos[0]} alt="Report evidence" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="sm:col-span-1 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 aspect-square flex flex-col items-center justify-center text-slate-400 text-xs">
                      <span>No Photo Attached</span>
                    </div>
                  )}

                  <div className="sm:col-span-2 bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Description</span>
                      <p className="text-xs text-slate-800 leading-relaxed font-normal">
                        {selectedIssue.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-200/70 text-[11px] text-slate-500 space-y-0.5">
                      <div>Submitted: <span className="font-medium text-slate-700">{new Date(selectedIssue.createdAt).toLocaleString('en-IN')}</span></div>
                      {selectedIssue.contactPhone && <div>Phone: <span className="font-medium text-slate-700 font-mono">{selectedIssue.contactPhone}</span></div>}
                      {selectedIssue.contactEmail && <div>Email: <span className="font-medium text-slate-700 font-mono">{selectedIssue.contactEmail}</span></div>}
                    </div>
                  </div>
                </div>

                {/* Location Box & Interactive Leaflet Map */}
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 flex items-center gap-1">
                      <MapPin size={14} className="text-blue-600" /> {selectedIssue.location.address}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      {selectedIssue.location.lat.toFixed(5)}, {selectedIssue.location.lng.toFixed(5)}
                    </span>
                  </div>

                  <div className="h-44 rounded-lg overflow-hidden border border-slate-200 relative">
                    <MapContainer
                      center={[selectedIssue.location.lat, selectedIssue.location.lng]}
                      zoom={16}
                      style={{ height: '100%', width: '100%' }}
                      zoomControl={false}
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <Marker position={[selectedIssue.location.lat, selectedIssue.location.lng]} />
                    </MapContainer>
                  </div>
                </div>
              </div>

              {/* ----------------------------------------------------------------- */}
              {/* SECTION B: AI ANALYSIS BREAKDOWN */}
              {/* ----------------------------------------------------------------- */}
              {selectedIssue.aiAnalysis && (
                <Card className="p-4 border border-slate-200/80 bg-white rounded-xl shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <BrainCircuit size={16} className="text-blue-600" />
                      <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">AI Classification & Triage</h4>
                    </div>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {selectedIssue.aiAnalysis.confidence}% Confidence
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/70">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Detected Category</div>
                      <div className="font-bold text-slate-900 mt-0.5">{selectedIssue.aiAnalysis.detectedCategory}</div>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/70">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Severity</div>
                      <div className="font-bold text-red-700 mt-0.5">{selectedIssue.aiAnalysis.severity}</div>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/70">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Priority Index</div>
                      <div className="font-bold text-blue-700 mt-0.5">{selectedIssue.aiAnalysis.priorityScore}/100</div>
                    </div>
                  </div>

                  {selectedIssue.aiAnalysis.priorityReasoning && selectedIssue.aiAnalysis.priorityReasoning.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AI Priority Factors:</div>
                      {selectedIssue.aiAnalysis.priorityReasoning.map((r, i) => (
                        <div key={i} className="flex items-center justify-between text-xs text-slate-600">
                          <span>• {r.factor}</span>
                          <span className="font-mono font-bold text-slate-900">+{r.score}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              )}

              {/* ----------------------------------------------------------------- */}
              {/* SECTION C: COMMUNITY SIGNALS & CLUSTER */}
              {/* ----------------------------------------------------------------- */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Flame size={14} className="text-amber-500" />
                    Community Pulse Signals
                  </h4>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <span>👍 {selectedIssue.upvotes || 0} Upvotes</span>
                    <span>•</span>
                    <span>👎 {selectedIssue.downvotes || 0} Downvotes</span>
                  </div>
                </div>

                {/* Corroborating Cluster Reports */}
                {((selectedIssue.duplicateCount || 0) > 0 || selectedIssue.isDuplicate || (selectedIssue.relatedReportIds && selectedIssue.relatedReportIds.length > 0)) && (() => {
                  const relatedList = issues.filter(i => 
                    i.id !== selectedIssue.id && (
                      (selectedIssue.relatedReportIds && selectedIssue.relatedReportIds.includes(i.id)) ||
                      i.duplicateOf === selectedIssue.id ||
                      (selectedIssue.duplicateOf && (i.id === selectedIssue.duplicateOf || i.duplicateOf === selectedIssue.duplicateOf))
                    )
                  );

                  return (
                    <div className="pt-2 border-t border-slate-200/70 space-y-2">
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                        <Layers size={13} className="text-blue-600" />
                        Linked Corroborating Reports ({relatedList.length})
                      </div>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto">
                        {relatedList.map(rel => (
                          <div 
                            key={rel.id}
                            onClick={() => handleOpenDrawer(rel)}
                            className="bg-white border border-slate-200 p-2 rounded-lg text-xs flex items-center justify-between hover:border-blue-300 cursor-pointer shadow-2xs"
                          >
                            <span className="font-mono font-bold text-blue-700">{rel.id}</span>
                            <span className="truncate max-w-[200px] text-slate-600">{rel.title}</span>
                            <span className="text-[10px] text-slate-400">{new Date(rel.createdAt).toLocaleDateString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* ----------------------------------------------------------------- */}
              {/* SECTION E: RESOLUTION EVIDENCE (IF RESOLVED) */}
              {/* ----------------------------------------------------------------- */}
              {(selectedIssue.status === 'RESOLVED' || selectedIssue.status === 'CITIZEN_VERIFIED' || selectedIssue.resolutionNote) && (
                <div className="bg-emerald-50/70 border border-emerald-300/80 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                    <CheckCircle2 size={16} /> Official Resolution Proof
                  </div>
                  {selectedIssue.resolutionNote && (
                    <p className="text-xs text-emerald-950 font-medium bg-white/70 p-2.5 rounded-lg border border-emerald-200">
                      "{selectedIssue.resolutionNote}"
                    </p>
                  )}
                  {selectedIssue.resolutionEvidence && selectedIssue.resolutionEvidence[0] && (
                    <div className="h-36 rounded-lg overflow-hidden border border-emerald-200 bg-white">
                      <img src={selectedIssue.resolutionEvidence[0]} alt="Resolution Proof" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              )}

              {/* ----------------------------------------------------------------- */}
              {/* SECTION F: INTERNAL NOTES LOG */}
              {/* ----------------------------------------------------------------- */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText size={13} /> Internal Authority Notes
                </h4>

                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {selectedIssue.internalNotes && selectedIssue.internalNotes.length > 0 ? (
                    selectedIssue.internalNotes.map(note => (
                      <div key={note.id} className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                          <span className="font-bold text-slate-700">{note.author}</span>
                          <span>{new Date(note.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-slate-800">{note.text}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">No internal notes logged yet.</p>
                  )}
                </div>

                <form onSubmit={handleAddNote} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add an internal note (e.g. Inspector Sharma visited site)..."
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-slate-900"
                  />
                  <Button type="submit" size="sm" disabled={!newNoteText.trim()} className="font-bold text-xs">
                    Add Note
                  </Button>
                </form>
              </div>

              {/* ----------------------------------------------------------------- */}
              {/* SECTION G: AUDIT TIMELINE */}
              {/* ----------------------------------------------------------------- */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">
                  Audit History & Lifecycle
                </h4>
                <div className="space-y-2">
                  {selectedIssue.timeline.map((event, idx) => (
                    <div key={event.id || idx} className="text-xs flex items-start gap-2.5 border-l-2 border-blue-500 pl-3 py-1">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-900">{event.description}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{new Date(event.timestamp).toLocaleString()}</span>
                          <span>•</span>
                          <span className="font-medium text-slate-600">Actor: {event.actor}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* RESOLUTION CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {showResolutionModal && selectedIssue && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-600" />
                Confirm Issue Resolution
              </h3>
              <button onClick={() => setShowResolutionModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Marking <span className="font-mono font-bold text-slate-900">{selectedIssue.id}</span> as resolved will notify the citizen and allow them to review the completion evidence.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Resolution Note *
                </label>
                <textarea
                  placeholder="e.g. Pothole filled and road surface restored with hot-mix asphalt."
                  value={resolutionNoteInput}
                  onChange={(e) => setResolutionNoteInput(e.target.value)}
                  className="w-full p-2.5 text-xs text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-600 resize-none h-20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Resolution Proof Photo URL (Optional)
                </label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/... or image data"
                  value={resolutionPhotoInput}
                  onChange={(e) => setResolutionPhotoInput(e.target.value)}
                  className="w-full p-2.5 text-xs text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setShowResolutionModal(false)}>
                Cancel
              </Button>
              <Button 
                size="sm" 
                disabled={!resolutionNoteInput.trim()} 
                onClick={handleConfirmResolution}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                Mark as Resolved
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REOPEN CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {showReopenModal && selectedIssue && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <RotateCcw size={18} className="text-rose-600" />
                Reopen Issue for Review
              </h3>
              <button onClick={() => setShowReopenModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Moving <span className="font-mono font-bold text-slate-900">{selectedIssue.id}</span> back to REOPENED state. Previous resolution history will be preserved.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Reason for Reopening *
              </label>
              <textarea
                placeholder="e.g. Ground inspection found patch uneven / citizen feedback received."
                value={reopenReasonInput}
                onChange={(e) => setReopenReasonInput(e.target.value)}
                className="w-full p-2.5 text-xs text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-600 resize-none h-20"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setShowReopenModal(false)}>
                Cancel
              </Button>
              <Button 
                size="sm" 
                disabled={!reopenReasonInput.trim()} 
                onClick={handleConfirmReopen}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                Reopen Issue
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IssueIntelligence;
