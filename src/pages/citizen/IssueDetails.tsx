import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, MapPin, Clock, ShieldAlert, CheckCircle2, XCircle, ArrowRight, Camera, User, Check } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { cn } from '../../utils/cn';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Timeline } from '../../components/ui/Timeline';

const IssueDetails = () => {
  const { id } = useParams();
  const { issues, updateIssueStatus } = useStore();
  const issue = issues.find(i => i.id === id);

  const [hasVerified, setHasVerified] = useState(false);

  if (!issue) return (
    <div className="flex flex-col items-center justify-center py-20 text-civic-muted">
      <ShieldAlert size={48} className="mb-4 text-brand-300" />
      <h2 className="text-xl font-semibold text-civic-text mb-2">Issue not found</h2>
      <Link to="/"><Button variant="outline">Return to Dashboard</Button></Link>
    </div>
  );

  const isResolved = issue.status === 'RESOLVED';
  const isCitizenVerified = issue.status === 'CITIZEN_VERIFIED';

  const handleVerify = (isFixed: boolean) => {
    if (isFixed) {
      updateIssueStatus(issue.id, 'CITIZEN_VERIFIED');
    } else {
      updateIssueStatus(issue.id, 'IN_PROGRESS'); // Reopen
    }
    setHasVerified(true);
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

  return (
    <div className="max-w-4xl mx-auto py-4 md:py-8 animate-fade-in">
      <Link to="/my-reports" className="inline-flex items-center text-sm font-medium text-civic-muted mb-6 hover:text-civic-primary transition-colors">
        <ChevronLeft size={16} className="mr-1" /> Back to My Reports
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content: Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-mono font-semibold text-brand-500 bg-brand-100 px-2 py-0.5 rounded">{issue.id}</span>
                <Badge variant={getStatusVariant(issue.status)}>{issue.status.replace('_', ' ')}</Badge>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-civic-text">{issue.title}</h1>
            </div>
          </div>

          {issue.photos[0] && (
            <div className="rounded-xl overflow-hidden border border-brand-200 bg-brand-50 aspect-video relative">
              <img src={issue.photos[0]} alt="Issue Evidence" className="w-full h-full object-cover" />
            </div>
          )}
          
          {!issue.photos[0] && (
            <div className="rounded-xl border-2 border-dashed border-brand-200 bg-brand-50 aspect-video flex flex-col items-center justify-center text-brand-400">
              <Camera size={32} className="mb-2" />
              <span className="text-sm font-medium">No photo provided</span>
            </div>
          )}

          <Card className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <MapPin size={20} className="text-civic-primary flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-civic-text mb-1">Location</h3>
                <p className="text-sm text-civic-muted">{issue.location.address}</p>
                <p className="text-xs text-brand-500 mt-1">{issue.location.ward}, {issue.location.zone} Zone</p>
              </div>
            </div>
            
            {issue.description && (
              <div className="pt-4 border-t border-brand-100">
                <h3 className="text-sm font-semibold text-civic-text mb-2">Description</h3>
                <p className="text-sm text-civic-muted">{issue.description}</p>
              </div>
            )}
          </Card>

          {/* Verification UI if Resolved */}
          {isResolved && !hasVerified && !isCitizenVerified && (
            <Card className="bg-civic-primary text-white border-none shadow-md overflow-hidden relative">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
              
              <h2 className="text-xl font-bold mb-2">Is this issue actually fixed?</h2>
              <p className="text-brand-100 text-sm mb-6 max-w-lg">
                The authority has marked this as resolved. Please verify the resolution to help us maintain accountability and earn civic points.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-brand-200 uppercase tracking-wider block">Before (Your Report)</span>
                  <div className="h-32 rounded-lg bg-black/20 border border-white/20 overflow-hidden relative">
                    {issue.photos[0] ? (
                      <img src={issue.photos[0]} alt="Before" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Camera size={24} className="text-brand-300" /></div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-brand-200 uppercase tracking-wider block flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-civic-accent" /> After (Authority Evidence)
                  </span>
                  <div className="h-32 rounded-lg bg-black/20 border border-civic-accent/50 overflow-hidden relative">
                    {issue.resolutionEvidence?.[0] ? (
                      <img src={issue.resolutionEvidence[0]} alt="After" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-brand-300 text-sm font-medium">Image processing...</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={() => handleVerify(true)} className="flex-1 bg-civic-accent text-white hover:bg-civic-accent/90">
                  <CheckCircle2 size={18} className="mr-2" /> Yes, it's fixed
                </Button>
                <Button onClick={() => handleVerify(false)} className="flex-1 bg-white/10 text-white hover:bg-white/20 border border-white/20">
                  <XCircle size={18} className="mr-2" /> No, still broken
                </Button>
              </div>
            </Card>
          )}

          {isCitizenVerified && (
            <Card className="bg-civic-accent/10 border-civic-accent/20 flex items-start gap-4">
              <div className="bg-civic-accent text-white p-2 rounded-full mt-1">
                <Check size={24} />
              </div>
              <div>
                <h3 className="font-bold text-civic-text text-lg">Resolution Verified</h3>
                <p className="text-sm text-civic-muted mt-1">
                  Thank you for confirming the fix! You've earned 
                  <span className="inline-block mx-1 font-bold text-civic-accent bg-civic-accent/10 px-2 py-0.5 rounded">
                    +10 Civic Points
                  </span>
                </p>
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar: Right Column */}
        <div className="space-y-6">
          <Card>
            <h3 className="font-bold text-civic-text mb-4">AI Assessment</h3>
            {issue.aiAnalysis ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-brand-100">
                  <span className="text-sm text-civic-muted">Priority</span>
                  <Badge variant={issue.aiAnalysis.severity === 'HIGH' ? 'danger' : 'warning'}>
                    {issue.aiAnalysis.severity}
                  </Badge>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-brand-100">
                  <span className="text-sm text-civic-muted">Score</span>
                  <span className="font-bold text-civic-text">{issue.aiAnalysis.priorityScore}/100</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-civic-muted">Category</span>
                  <span className="font-medium text-sm text-civic-text">{issue.aiAnalysis.detectedCategory}</span>
                </div>
                
                {issue.slaTarget && issue.status === 'IN_PROGRESS' && (
                  <div className="mt-4 bg-civic-warning/10 border border-civic-warning/20 p-3 rounded-lg flex items-start gap-3">
                    <Clock size={18} className="text-civic-warning flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-civic-warning uppercase tracking-wider block mb-1">Target SLA</span>
                      <span className="text-sm font-medium text-civic-text">
                        {new Date(issue.slaTarget).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-civic-muted">No AI assessment available for this issue.</p>
            )}
          </Card>

          <Card>
            <h3 className="font-bold text-civic-text mb-6">Activity Timeline</h3>
            <Timeline events={issue.timeline} />
          </Card>
        </div>

      </div>
    </div>
  );
};

export default IssueDetails;
