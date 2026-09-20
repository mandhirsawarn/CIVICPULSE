import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, MapPin, Clock, ShieldAlert, CheckCircle2, XCircle, Camera, Check, ThumbsUp, ThumbsDown, Users, Flame, MessageSquare, Send, Sparkles, Building2, AlertTriangle, Layers, UserCheck } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { cn } from '../../utils/cn';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { PriorityBadge } from '../../components/ui/PriorityBadge';
import { Timeline } from '../../components/ui/Timeline';
import { getCategoryEmoji, getStatusVariant } from '../../components/ui/ReportCard';
import { formatExactDateTime, formatFullDate } from '../../utils/dateFormat';

const IssueDetails = () => {
  const { id } = useParams();
  const { issues, updateIssueStatus, voteIssue, addCommunityComment, requestCommunityRecheck, reopenIssue, currentUser } = useStore();
  const issue = issues.find(i => i.id === id);

  const [hasVerified, setHasVerified] = useState(false);
  const [isReopening, setIsReopening] = useState(false);
  const [reopenReasonText, setReopenReasonText] = useState('');
  const [recheckMessage, setRecheckMessage] = useState('');
  const [commentText, setCommentText] = useState('');
  const userId = currentUser?.id || 'demo-user-1';

  if (!issue) return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-500">
      <ShieldAlert size={48} className="mb-4 text-slate-300" />
      <h2 className="text-xl font-bold text-slate-900 mb-2">Issue not found</h2>
      <Link to="/"><Button variant="outline" className="rounded-xl">Return to Dashboard</Button></Link>
    </div>
  );

  const isResolved = issue.status === 'RESOLVED';
  const isCitizenVerified = issue.status === 'CITIZEN_VERIFIED';
  const isReopened = issue.status === 'REOPENED';
  const hasRecheck = (issue.communityRecheckRequests || 0) > 0;

  const handleVerify = async (isFixed: boolean) => {
    if (isFixed) {
      await updateIssueStatus(issue.id, 'CITIZEN_VERIFIED');
      setRecheckMessage('');
      setHasVerified(true);
    } else {
      setIsReopening(true);
    }
  };

  const handleConfirmReopen = async () => {
    const reason = reopenReasonText.trim() || 'Citizen reported that this issue remains unresolved on the ground.';
    await reopenIssue(issue.id, reason);
    requestCommunityRecheck(issue.id);
    setRecheckMessage(`Reopened: "${reason}"`);
    setIsReopening(false);
    setHasVerified(true);
  };

  const upvotes = issue.upvotes || 0;
  const downvotes = issue.downvotes || 0;
  const totalVotes = upvotes + downvotes;
  const supportPercent = totalVotes > 0 ? Math.round((upvotes / totalVotes) * 100) : 0;
  const userVote = issue.userVotes?.[userId];

  // Find related corroborating reports
  const relatedReports = issues.filter(i => 
    i.id !== issue.id && (
      (issue.relatedReportIds && issue.relatedReportIds.includes(i.id)) ||
      i.duplicateOf === issue.id ||
      (issue.duplicateOf && (i.id === issue.duplicateOf || (i.duplicateOf && i.duplicateOf === issue.duplicateOf)))
    )
  );

  return (
    <div className="max-w-6xl mx-auto py-4 md:py-6 animate-fade-in space-y-6 pb-12">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <Link to="/my-reports" className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors">
          <ChevronLeft size={16} className="mr-1" /> Back to My Reports
        </Link>
        <Link to="/community" className="text-xs font-bold text-blue-600 hover:underline">
          View in Community Feed →
        </Link>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Content: Left Column */}
        <div className="lg:col-span-2 space-y-6">

          {/* DUPLICATE REPORT NOTICE BANNER */}
          {issue.isDuplicate && issue.duplicateOf && (
            <div className="bg-amber-50 border border-amber-300/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-slate-900">Duplicate Report • Citizen Corroboration</h3>
                    <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                      {issue.duplicateConfidence || 'HIGH'} ({issue.duplicateSimilarityScore || 85}% match)
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    This issue was identified as a duplicate of original report <span className="font-mono font-bold text-slate-900">{issue.duplicateOf}</span>. It is preserved in your history and provides corroborating data to field teams.
                  </p>
                </div>
              </div>
              <Link
                to={`/issue/${issue.duplicateOf}`}
                className="shrink-0 text-xs font-bold text-blue-700 bg-white border border-blue-200 px-3.5 py-2 rounded-xl hover:bg-blue-50 transition-colors shadow-2xs"
              >
                View Original ({issue.duplicateOf}) →
              </Link>
            </div>
          )}
          
          {/* Section 1: Report Overview Header */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(15,23,42,0.03)] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-2.5 py-1 rounded-lg">
                  {issue.id}
                </span>
                {issue.status === 'RESOLVED' ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-lg shadow-2xs">
                    <CheckCircle2 size={13} className="text-emerald-700" /> ✓ RESOLVED
                  </span>
                ) : (
                  <Badge variant={getStatusVariant(issue.status)} className="text-[11px] font-bold uppercase tracking-wider">
                    {issue.status.replace('_', ' ')}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <PriorityBadge priority={issue.priority || issue.citizenUrgency} score={issue.priorityScore} size="md" />
              </div>
            </div>

            <div className="flex items-start gap-3.5 pt-1">
              <span className="text-3xl mt-0.5" title={issue.category}>{getCategoryEmoji(issue.category)}</span>
              <div>
                <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 leading-tight">{issue.title}</h1>
                <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1.5 font-medium">
                  <Clock size={13} className="text-slate-400" /> Reported on {formatExactDateTime(issue.createdAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Issue Evidence Photo */}
          <div className="space-y-2">
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Incident Photo Evidence</h3>
            {issue.photos[0] ? (
              <div className="rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-100 aspect-video relative shadow-xs">
                <img src={issue.photos[0]} alt="Issue Evidence" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 aspect-video flex flex-col items-center justify-center text-slate-400">
                <Camera size={32} className="mb-2 opacity-60" />
                <span className="text-xs font-semibold">No photo evidence provided with this report</span>
              </div>
            )}
          </div>

          {/* Section 3: Description & Location Details */}
          <Card className="p-6 rounded-2xl border border-slate-200/80 bg-white shadow-[0_4px_20px_rgba(15,23,42,0.03)] flex flex-col gap-4">
            {issue.description && (
              <div>
                <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Description</h3>
                <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 font-normal">
                  {issue.description}
                </p>
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 flex items-start gap-3">
              <MapPin size={20} className="text-blue-600 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Incident Location</h3>
                <p className="text-sm font-bold text-slate-900">{issue.location.address}</p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1 font-mono">
                  <span className="font-semibold text-slate-700">{issue.location.ward}</span>
                  <span>•</span>
                  <span>{issue.location.zone} Zone</span>
                  <span>•</span>
                  <span>Lat: {issue.location.lat.toFixed(5)}, Lng: {issue.location.lng.toFixed(5)}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Section 4: Resolution Evidence & Community Verification */}
          {(isResolved || isCitizenVerified || isReopened || hasRecheck) && (
            <Card className="p-6 rounded-2xl border border-blue-200/80 shadow-md bg-gradient-to-br from-white to-blue-50/20 relative overflow-hidden">
              <div className="border-b border-slate-100 pb-4 mb-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-emerald-600" /> Resolution Evidence & Verification
                  </h3>
                  <Badge variant={isCitizenVerified ? 'success' : isResolved ? 'info' : isReopened ? 'danger' : 'warning'} className="text-xs font-semibold">
                    {isCitizenVerified ? 'Citizen Confirmed' : isResolved ? 'Awaiting Citizen Verification' : isReopened ? 'Reopened by Citizen' : 'Re-review in progress'}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Compare the reported issue with the resolution proof submitted by municipal ground workers.
                </p>
              </div>

              {/* Official Authority Resolution Note */}
              {(issue.resolutionNote || isResolved) && (
                <div className="bg-emerald-50/90 border border-emerald-300/80 rounded-xl p-3.5 mb-4 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-emerald-700" />
                      Official Resolution Summary
                    </span>
                    {(issue.resolvedAt || issue.resolutionDate) && (
                      <span className="text-[11px] text-emerald-800 font-semibold font-mono">
                        Resolved on: {formatExactDateTime(issue.resolvedAt || issue.resolutionDate)}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-800 leading-relaxed font-normal">
                    {issue.resolutionNote || 'The municipal authority inspected and resolved this issue on ground.'}
                  </p>
                </div>
              )}

              {/* Before and After Side-by-Side Comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Before (Reported)</span>
                  <div className="h-40 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden relative">
                    {issue.photos[0] ? (
                      <img src={issue.photos[0]} alt="Before" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                        <Camera size={20} className="mr-1 opacity-60" /> Initial photo
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block flex items-center gap-1.5">
                    <CheckCircle2 size={14} /> After (Resolution Evidence)
                  </span>
                  <div className="h-40 rounded-xl bg-slate-100 border border-emerald-300/80 overflow-hidden relative">
                    {issue.resolutionEvidence?.[0] ? (
                      <img src={issue.resolutionEvidence[0]} alt="After" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-emerald-50/50 text-slate-500 text-xs p-3 text-center">
                        <CheckCircle2 size={24} className="text-emerald-600 mb-1" />
                        <span className="font-semibold text-slate-700">Work marked completed by department technician</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Explicit Verification Actions */}
              {isResolved && !isCitizenVerified && !isReopened && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
                  <h4 className="text-sm font-bold text-slate-900">Is this issue actually resolved on ground?</h4>
                  <p className="text-xs text-slate-500">
                    Your verification ensures municipal accountability and maintains high civic data integrity.
                  </p>

                  {isReopening ? (
                    <div className="space-y-3 pt-2 bg-rose-50/60 p-3.5 rounded-xl border border-rose-200">
                      <label className="text-xs font-bold text-rose-900 block">
                        Why is this issue still a problem? (Authority will receive this immediately)
                      </label>
                      <textarea
                        value={reopenReasonText}
                        onChange={(e) => setReopenReasonText(e.target.value)}
                        placeholder="e.g. The pothole was only filled with loose sand and has collapsed again..."
                        className="w-full text-xs p-2.5 rounded-lg border border-rose-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 min-h-[70px]"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={handleConfirmReopen}
                          className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg"
                        >
                          Submit Reopen Request
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setIsReopening(false)}
                          className="text-xs font-medium rounded-lg"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-3 pt-1">
                      <Button 
                        onClick={() => handleVerify(true)} 
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 rounded-xl shadow-xs"
                      >
                        <CheckCircle2 size={18} className="mr-2" /> Looks Resolved
                      </Button>
                      <Button 
                        onClick={() => handleVerify(false)} 
                        variant="outline"
                        className="flex-1 border-rose-200 text-rose-600 hover:bg-rose-50 font-bold h-11 rounded-xl"
                      >
                        <XCircle size={18} className="mr-2" /> Still a Problem
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Reopened Banner */}
              {isReopened && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle size={15} className="text-rose-600" />
                    <span>Issue Reopened for Re-inspection</span>
                  </div>
                  <p className="text-slate-700 pl-5 font-normal">
                    {issue.reopenedReason ? `Citizen feedback: "${issue.reopenedReason}"` : 'A citizen indicated this issue is still persistent on site.'}
                  </p>
                  <p className="text-[10.5px] text-rose-600 font-semibold pl-5 pt-0.5">
                    Municipal authorities and field leads have been notified to re-evaluate this site.
                  </p>
                </div>
              )}

              {/* Re-review Feedback Notice */}
              {(recheckMessage || hasRecheck) && !isReopened && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-300/80 rounded-xl text-amber-900 text-xs font-semibold flex items-center gap-2">
                  <ShieldAlert size={16} className="text-amber-600 shrink-0" />
                  <span>
                    Community feedback received — Re-review in progress ({issue.communityRecheckRequests || 1} citizen recheck requests)
                  </span>
                </div>
              )}

              {isCitizenVerified && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <Check size={16} className="text-emerald-600 shrink-0" />
                  <span>Resolution successfully verified by citizens on ground. Thank you!</span>
                </div>
              )}
            </Card>
          )}

          {/* Section: Related Citizen Reports Cluster */}
          {relatedReports.length > 0 && (
            <Card className="p-5 rounded-2xl border border-blue-200/80 bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/20 shadow-xs flex flex-col gap-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Layers size={17} className="text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Related Citizen Reports ({relatedReports.length + 1} reports)
                  </h3>
                </div>
                <span className="text-xs font-bold text-blue-700 bg-blue-100/70 border border-blue-200 px-2.5 py-0.5 rounded-full">
                  {relatedReports.length + 1} citizen reports describe this issue
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Multiple citizens have reported or corroborated this same civic issue near this location. Each report provides additional ground photos and helps municipal authorities verify the scale without creating duplicate work orders.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {relatedReports.map(rel => (
                  <Link 
                    key={rel.id} 
                    to={`/issue/${rel.id}`} 
                    className="p-3 rounded-xl bg-white border border-slate-200/80 hover:border-blue-300 hover:shadow-2xs transition-all flex items-start gap-3 group"
                  >
                    {rel.photos && rel.photos[0] ? (
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                        <img src={rel.photos[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-slate-400 shrink-0">
                        <MapPin size={18} />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                          {rel.id}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Date(rel.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <h5 className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                        {rel.title}
                      </h5>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {rel.description}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {/* Section 5: Community Support & Voting Block */}
          <Card className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-[0_4px_20px_rgba(15,23,42,0.03)] flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users size={16} className="text-blue-600" />
                Community Support
              </h3>
              {totalVotes > 0 && (
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200/80 flex items-center gap-1">
                  <Flame size={13} className="text-amber-500" /> {supportPercent}% Support ({totalVotes} votes)
                </span>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-slate-100/70 rounded-full p-1 border border-slate-200/80">
                  <button 
                    onClick={() => voteIssue(issue.id, userVote === 'up' ? null : 'up')}
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all", 
                      userVote === 'up' ? "bg-slate-900 text-white shadow-xs" : "hover:bg-white text-slate-700"
                    )}
                    title={userVote === 'up' ? "Remove upvote" : "Upvote this report"}
                  >
                    <ThumbsUp size={14} className={userVote === 'up' ? "fill-white" : ""} /> Upvote ({upvotes})
                  </button>
                  <div className="w-px h-4 bg-slate-300" />
                  <button 
                    onClick={() => voteIssue(issue.id, userVote === 'down' ? null : 'down')}
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all", 
                      userVote === 'down' ? "bg-rose-600 text-white shadow-xs" : "hover:bg-white text-slate-700"
                    )}
                    title={userVote === 'down' ? "Remove downvote" : "Downvote / Not an issue"}
                  >
                    <ThumbsDown size={14} className={userVote === 'down' ? "fill-white" : ""} /> Downvote ({downvotes})
                  </button>
                </div>
              </div>
              
              <p className="text-[11px] text-slate-500 sm:text-right max-w-xs font-medium">
                Community validation signals local urgency to help prioritize municipal response.
              </p>
            </div>
          </Card>

          {/* Section 6: Community Discussion */}
          <Card className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-[0_4px_20px_rgba(15,23,42,0.03)] flex flex-col gap-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <MessageSquare size={16} className="text-blue-600" />
              Community Discussion
            </h3>
            
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {(!issue.communityComments || issue.communityComments.length === 0) ? (
                <p className="text-xs text-slate-400 text-center py-6">No comments yet. Share ground updates or additional context for municipal teams.</p>
              ) : (
                issue.communityComments.map(comment => (
                  <div key={comment.id} className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-xs text-slate-900">{comment.author}</span>
                      <span className="text-[10px] text-slate-400">{new Date(comment.timestamp).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{comment.text}</p>
                  </div>
                ))
              )}
            </div>
            
            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <input 
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a community note or status update..."
                className="flex-1 px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && commentText.trim()) {
                    addCommunityComment(issue.id, commentText.trim());
                    setCommentText('');
                  }
                }}
              />
              <Button 
                onClick={() => {
                  if (commentText.trim()) {
                    addCommunityComment(issue.id, commentText.trim());
                    setCommentText('');
                  }
                }}
                disabled={!commentText.trim()}
                className="px-4 text-xs font-bold rounded-xl bg-slate-900 text-white hover:bg-slate-800"
              >
                <Send size={13} className="mr-1.5" /> Post
              </Button>
            </div>
          </Card>

        </div>

        {/* Sidebar: Right Column */}
        <div className="space-y-6">
          
          {/* Section 7: AI Analysis & Priority Breakdown */}
          <Card className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-[0_4px_20px_rgba(15,23,42,0.03)]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs flex items-center gap-1.5">
                <Sparkles size={15} className="text-blue-600" />
                AI-Assisted Assessment
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                Automated Engine
              </span>
            </div>

            {issue.aiAnalysis ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">Detected Category</span>
                    <span className="font-bold text-xs text-slate-900">{issue.aiAnalysis.detectedCategory}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">Priority Level</span>
                    <PriorityBadge priority={issue.aiAnalysis.severity} score={issue.priorityScore} size="sm" />
                  </div>
                </div>

                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Priority Score</span>
                  <span className="font-black text-blue-600 text-lg tabular-nums">{issue.priorityScore}/100</span>
                </div>

                <div className="pb-3 border-b border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1.5">Priority Factor Reasoning</span>
                  <div className="space-y-1.5">
                    {issue.aiAnalysis.priorityReasoning?.map((reason, i) => (
                      <div key={i} className="text-xs text-slate-700 flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="font-semibold text-slate-800">{reason.factor}</span>
                        <span className="text-blue-600 font-mono font-bold">+{reason.score} pts</span>
                      </div>
                    )) || (
                      <p className="text-xs text-slate-500 italic">Calculated based on hazard severity, public density, and urgency.</p>
                    )}
                  </div>
                </div>

                <div className="pb-3 border-b border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">Assigned Department</span>
                  <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <Building2 size={14} className="text-blue-600" />
                    {issue.assignedDepartmentId || issue.aiAnalysis.suggestedDepartment}
                  </span>
                  {issue.assignedOfficer && (
                    <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-1 rounded-md mt-2 w-full">
                      <UserCheck size={13} className="text-emerald-600 shrink-0" />
                      <span>Officer: <strong className="font-semibold">{issue.assignedOfficer}</strong></span>
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">Target Resolution (ETA)</span>
                  <span className="font-bold text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 inline-block font-mono">
                    ⏱️ {issue.estimatedResolutionTime || '2-5 days'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="text-xs text-slate-500 font-bold">Priority Level</span>
                  <PriorityBadge priority={issue.priority || issue.citizenUrgency} score={issue.priorityScore} size="sm" />
                </div>
                <div className="pb-2 border-b border-slate-100">
                  <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Assigned Department</span>
                  <span className="text-xs font-semibold text-slate-800">🏛️ {issue.assignedDepartmentId || 'Municipal Works'}</span>
                </div>
                <p className="text-xs text-slate-400 italic">Automated assessment scheduled for routing.</p>
              </div>
            )}
          </Card>

          {/* Section 8: Status Timeline */}
          <Card className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-[0_4px_20px_rgba(15,23,42,0.03)]">
            <h3 className="font-bold text-slate-900 mb-4 text-xs uppercase tracking-wider border-b border-slate-100 pb-2">
              Status Timeline
            </h3>
            <Timeline events={issue.timeline} />
          </Card>
        </div>

      </div>
    </div>
  );
};

export default IssueDetails;
