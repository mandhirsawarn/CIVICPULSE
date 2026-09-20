import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { ShieldAlert, AlertTriangle, Activity, MapPin, Users, CheckCircle2, ChevronRight, X, Clock, BrainCircuit, ArrowRight, Flame, Layers } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Issue, FieldTeam } from '../../types';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';

import { SectionHeader } from '../../components/ui/SectionHeader';

const IssueIntelligence = () => {
  const { issues, departments, fieldTeams, assignTeam } = useStore();
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'REPORTED': return <Badge variant="outline">REPORTED</Badge>;
      case 'AI_VERIFIED': return <Badge variant="info">AI VERIFIED</Badge>;
      case 'ASSIGNED': return <Badge variant="info">ASSIGNED</Badge>;
      case 'IN_PROGRESS': return <Badge variant="warning">IN PROGRESS</Badge>;
      case 'RESOLVED': return <Badge variant="success">RESOLVED</Badge>;
      default: return null;
    }
  };

  const handleAssign = (teamId: string) => {
    if (!selectedIssue) return;
    const team = fieldTeams.find(t => t.id === teamId);
    if (team) {
      assignTeam(selectedIssue.id, team.id, team.departmentId);
      setSelectedIssue({ ...selectedIssue, status: 'ASSIGNED', assignedTeamId: team.id });
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col relative animate-fade-in max-w-7xl mx-auto">
      <div className="mb-6">
        <SectionHeader 
          eyebrow="AI TRIAGE & DISPATCH"
          title="Issue Intelligence Queue" 
          description="AI-prioritized civic reports awaiting departmental triage, verification, and field team dispatch." 
        />
      </div>

      <Card className="flex-1 overflow-hidden flex flex-col p-0 border border-slate-200/80 rounded-2xl shadow-[0_4px_20px_rgba(15,23,42,0.03)] bg-white">
        <div className="overflow-x-auto flex-1 custom-scrollbar">
          <table className="w-full text-left text-sm text-slate-800">
            <thead className="text-[11px] uppercase bg-slate-50 text-slate-500 border-b border-slate-200/80 tracking-wider font-bold">
              <tr>
                <th className="px-6 py-3.5">Issue ID</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5">AI Priority</th>
                <th className="px-6 py-3.5">Community Score</th>
                <th className="px-6 py-3.5">Location</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {issues.map(issue => (
                <tr 
                  key={issue.id} 
                  className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                  onClick={() => setSelectedIssue(issue)}
                >
                  <td className="px-6 py-4 font-mono font-bold text-xs text-slate-900">{issue.id}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-xs text-slate-900">{issue.category}</span>
                      {(issue.isDuplicate || issue.aiAnalysis?.possibleDuplicate) && (
                        <span className="bg-amber-50 text-amber-700 border border-amber-200/80 px-1.5 py-0.5 rounded text-[9.5px] font-bold" title={issue.duplicateOf ? `Duplicate of ${issue.duplicateOf}` : 'Possible Duplicate'}>
                          DUPLICATE
                        </span>
                      )}
                      {(issue.duplicateCount || 0) > 0 && (
                        <span className="bg-blue-50 text-blue-700 border border-blue-200/80 px-1.5 py-0.5 rounded text-[9.5px] font-bold" title={`${issue.duplicateCount} citizen corroboration reports linked`}>
                          +{issue.duplicateCount} LINKED
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {issue.aiAnalysis ? (
                      <div className="flex items-center gap-2.5">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border tabular-nums",
                          issue.aiAnalysis.priorityScore > 75 ? "text-red-700 border-red-200 bg-red-50" : "text-amber-700 border-amber-200 bg-amber-50"
                        )}>
                          {issue.aiAnalysis.priorityScore}
                        </div>
                        <span className={cn("text-[11px] font-bold uppercase tracking-wider", issue.aiAnalysis.severity === 'HIGH' || issue.aiAnalysis.severity === 'CRITICAL' ? 'text-red-700' : 'text-amber-700')}>
                          {issue.aiAnalysis.severity}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs italic">Awaiting AI</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-xs tabular-nums">
                        {(issue.upvotes || 0) - (issue.downvotes || 0)}
                      </div>
                      {((issue.upvotes || 0) - (issue.downvotes || 0)) >= 10 && <Flame size={14} className="text-amber-500" />}
                    </div>
                  </td>
                  <td className="px-6 py-4 truncate max-w-[200px] text-xs text-slate-500">
                    {issue.location.ward}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(issue.status)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-blue-600 hover:text-blue-800 text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer">
                      Analyze <ArrowRight size={13} className="opacity-0 group-hover:opacity-100 transition-opacity -ml-1 group-hover:ml-0" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Intelligence Drawer */}
      {selectedIssue && (
        <>
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40" onClick={() => setSelectedIssue(null)}></div>
          <div className="fixed right-0 top-0 bottom-0 w-[520px] max-w-[95%] bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col overflow-y-auto animate-fade-in custom-scrollbar">
            
            <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-200/80 p-5 flex items-center justify-between z-10">
              <div>
                <div className="text-[10px] font-bold text-slate-400 tracking-wider mb-1 uppercase font-mono">{selectedIssue.id}</div>
                <h2 className="text-base font-bold text-slate-900">{selectedIssue.title}</h2>
              </div>
              <button onClick={() => setSelectedIssue(null)} className="p-2 text-slate-400 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-8 flex-1">
              
              {/* Image & Map Context */}
              <div className="grid grid-cols-2 gap-4">
                {selectedIssue.photos[0] ? (
                  <img src={selectedIssue.photos[0]} alt="Issue" className="w-full h-32 object-cover rounded-xl border border-slate-200" />
                ) : (
                  <div className="w-full h-32 bg-slate-100 rounded-xl flex flex-col items-center justify-center text-slate-400 border border-slate-200">
                    <MapPin size={22} className="mb-1" />
                    <span className="text-[11px] font-medium">No image attached</span>
                  </div>
                )}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 flex flex-col justify-center relative overflow-hidden">
                   <div className="relative z-10">
                     <h4 className="text-xs font-bold text-slate-900 mb-1">{selectedIssue.location.ward}</h4>
                     <p className="text-xs text-slate-500 leading-relaxed">{selectedIssue.location.address}</p>
                   </div>
                </div>
              </div>

              {/* AI Priority Engine View */}
              {selectedIssue.aiAnalysis && (
                <Card className="border border-slate-200/80 bg-white shadow-xs p-5 relative overflow-hidden rounded-2xl">
                  <div className="absolute top-0 right-0 p-3 opacity-5">
                    <BrainCircuit size={64} className="text-blue-600" />
                  </div>
                  
                  <div className="flex items-center gap-2 mb-5 relative z-10">
                    <div className="bg-blue-50 text-blue-600 border border-blue-200/60 p-1.5 rounded-xl">
                      <BrainCircuit size={17} />
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm">AI Priority Engine Breakdown</h3>
                  </div>

                  <div className="flex items-center gap-6 mb-5 relative z-10">
                    <div className="text-center bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl min-w-[85px]">
                      <div className={cn("text-3xl font-black tabular-nums", selectedIssue.aiAnalysis.priorityScore > 75 ? "text-red-700" : "text-amber-700")}>
                        {selectedIssue.aiAnalysis.priorityScore}
                      </div>
                      <div className="text-[9px] text-slate-400 font-bold tracking-wider uppercase mt-0.5">Priority Index</div>
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      {selectedIssue.aiAnalysis.priorityReasoning.map((reason, idx) => (
                        <div key={idx} className="flex justify-between text-xs items-center">
                          <span className="text-slate-500 font-medium truncate mr-2">{reason.factor}</span>
                          <span className="text-slate-900 font-bold bg-slate-100 px-2 py-0.5 rounded-md tabular-nums">+{reason.score}</span>
                        </div>
                      ))}
                      {selectedIssue.aiAnalysis.possibleDuplicate && (
                        <div className="flex justify-between text-xs border-t border-slate-100 pt-2 items-center">
                          <span className="text-amber-700 font-semibold">Cluster Corroboration</span>
                          <span className="text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-md">+10</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-blue-50/70 border border-blue-200/60 rounded-xl p-3 text-xs text-slate-700 relative z-10 leading-relaxed">
                    <span className="font-bold text-blue-900 block mb-0.5">AI Operational Recommendation:</span>
                    Prioritize inspection within standard emergency SLA. Spatial proximity correlates with elevated traffic corridor.
                  </div>
                </Card>
              )}

              {/* Corroborating Reports Cluster */}
              {((selectedIssue.duplicateCount || 0) > 0 || selectedIssue.isDuplicate || (selectedIssue.relatedReportIds && selectedIssue.relatedReportIds.length > 0)) && (() => {
                const relatedList = issues.filter(i => 
                  i.id !== selectedIssue.id && (
                    (selectedIssue.relatedReportIds && selectedIssue.relatedReportIds.includes(i.id)) ||
                    i.duplicateOf === selectedIssue.id ||
                    (selectedIssue.duplicateOf && (i.id === selectedIssue.duplicateOf || i.duplicateOf === selectedIssue.duplicateOf))
                  )
                );

                return (
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <Layers size={15} className="text-blue-600" />
                        Corroborating Reports Cluster ({relatedList.length + 1} Total)
                      </h3>
                      {selectedIssue.isDuplicate && (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                          Duplicate of {selectedIssue.duplicateOf}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed">
                      All citizen submissions mapped to this underlying physical incident. Field authorities can inspect all angles and confirm ground impact.
                    </p>

                    <div className="space-y-2">
                      {relatedList.map(rel => (
                        <div 
                          key={rel.id} 
                          onClick={() => setSelectedIssue(rel)}
                          className="bg-white border border-slate-200/80 hover:border-blue-300 p-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between shadow-2xs group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {rel.photos[0] ? (
                              <img src={rel.photos[0]} alt="" className="w-10 h-10 rounded-lg object-cover border border-slate-100 shrink-0" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                <MapPin size={14} />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-xs text-blue-700">{rel.id}</span>
                                <span className="text-[10px] text-slate-400">{new Date(rel.createdAt).toLocaleDateString()}</span>
                              </div>
                              <p className="text-xs text-slate-700 truncate font-medium group-hover:text-blue-600 transition-colors">{rel.title}</p>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-blue-600 shrink-0 ml-2 group-hover:translate-x-0.5 transition-transform">Inspect →</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Smart Resource Allocation */}
              {(selectedIssue.status === 'REPORTED' || selectedIssue.status === 'AI_VERIFIED') && (
                <div>
                  <h3 className="font-bold text-slate-900 mb-3 text-xs uppercase tracking-wider flex items-center gap-2">
                    <Users size={16} className="text-slate-400" />
                    Field Team Dispatch Options
                  </h3>
                  
                  <div className="space-y-2.5">
                    {fieldTeams.filter(t => t.departmentId === selectedIssue.aiAnalysis?.suggestedDepartment).map((team, idx) => (
                      <div key={team.id} className="bg-white border border-slate-200/80 rounded-xl p-3.5 flex items-center justify-between hover:border-slate-300 transition-colors shadow-2xs">
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{team.name}</h4>
                            {idx === 0 && <span className="bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">AI OPTIMAL</span>}
                          </div>
                          <div className="text-[11px] text-slate-400 font-medium">
                            {team.status === 'AVAILABLE' ? '🟢 Available for dispatch' : `🟡 Status: ${team.status}`} • ~1.2 km radius
                          </div>
                        </div>
                        <Button 
                          onClick={() => handleAssign(team.id)}
                          disabled={team.status !== 'AVAILABLE'}
                          size="sm"
                          variant={team.status === 'AVAILABLE' ? 'primary' : 'outline'}
                          className="text-xs font-bold"
                        >
                          Assign Team
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedIssue.status === 'ASSIGNED' && (
                <div className="bg-emerald-50 border border-emerald-200/60 rounded-2xl p-6 text-center">
                  <CheckCircle2 size={36} className="text-emerald-600 mx-auto mb-2" />
                  <h3 className="text-sm font-bold text-slate-900 mb-0.5">Field Team Dispatched</h3>
                  <p className="text-slate-500 text-xs">
                    Team {fieldTeams.find(t => t.id === selectedIssue.assignedTeamId)?.name || 'Municipal Team'} has been assigned this work order.
                  </p>
                </div>
              )}

            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default IssueIntelligence;
