import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { ShieldAlert, AlertTriangle, Activity, MapPin, Users, CheckCircle2, ChevronRight, X, Clock, BrainCircuit, ArrowRight } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Issue, FieldTeam } from '../../types';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';

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
    <div className="h-[calc(100vh-100px)] flex flex-col relative animate-fade-in max-w-7xl mx-auto">
      <div className="mb-6">
        <PageHeader 
          title="Issue Intelligence" 
          description="AI-prioritized civic reports awaiting triage and dispatch." 
        />
      </div>

      <Card className="flex-1 overflow-hidden flex flex-col p-0 border border-civic-border">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm text-civic-text">
            <thead className="text-xs uppercase bg-brand-50 text-civic-muted border-b border-brand-200">
              <tr>
                <th className="px-6 py-4 font-semibold">Issue ID</th>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold">AI Priority</th>
                <th className="px-6 py-4 font-semibold">Location</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-100">
              {issues.map(issue => (
                <tr 
                  key={issue.id} 
                  className="hover:bg-brand-50 transition-colors cursor-pointer group"
                  onClick={() => setSelectedIssue(issue)}
                >
                  <td className="px-6 py-4 font-semibold text-civic-text">{issue.id}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{issue.category}</span>
                      {issue.aiAnalysis?.possibleDuplicate && (
                        <span className="bg-brand-200 text-brand-600 px-1.5 py-0.5 rounded text-[10px] font-bold" title="Possible Duplicate">
                          POSSIBLE DUPLICATE
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {issue.aiAnalysis ? (
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2",
                          issue.aiAnalysis.priorityScore > 75 ? "text-civic-danger border-civic-danger/20 bg-civic-danger/5" : "text-civic-warning border-civic-warning/20 bg-civic-warning/5"
                        )}>
                          {issue.aiAnalysis.priorityScore}
                        </div>
                        <div>
                          <div className={cn("text-xs font-bold uppercase tracking-wider", issue.aiAnalysis.severity === 'HIGH' ? 'text-civic-danger' : 'text-civic-warning')}>
                            {issue.aiAnalysis.severity}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-civic-muted text-xs italic">Awaiting AI</span>
                    )}
                  </td>
                  <td className="px-6 py-4 truncate max-w-[200px] text-civic-muted">
                    {issue.location.ward}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(issue.status)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-civic-primary hover:text-civic-primary/80 text-sm font-semibold transition-colors flex items-center justify-end w-full gap-1">
                      Analyze <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity -ml-1 group-hover:ml-0" />
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
          <div className="absolute inset-0 bg-civic-text/20 backdrop-blur-sm z-40 rounded-xl" onClick={() => setSelectedIssue(null)}></div>
          <div className="absolute right-0 top-0 bottom-0 w-[500px] max-w-[95%] bg-white border-l border-civic-border shadow-2xl z-50 flex flex-col overflow-y-auto animate-fade-in custom-scrollbar rounded-r-xl">
            
            <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-civic-border p-5 flex items-center justify-between z-10">
              <div>
                <div className="text-xs font-bold text-civic-muted tracking-wider mb-1 uppercase">{selectedIssue.id}</div>
                <h2 className="text-lg font-bold text-civic-text">{selectedIssue.title}</h2>
              </div>
              <button onClick={() => setSelectedIssue(null)} className="p-2 text-civic-muted hover:text-civic-text bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-8 flex-1">
              
              {/* Image & Map Context */}
              <div className="grid grid-cols-2 gap-4">
                {selectedIssue.photos[0] ? (
                  <img src={selectedIssue.photos[0]} alt="Issue" className="w-full h-32 object-cover rounded-xl border border-brand-200" />
                ) : (
                  <div className="w-full h-32 bg-brand-50 rounded-xl flex flex-col items-center justify-center text-civic-muted border border-brand-200">
                    <MapPin size={24} className="mb-2" />
                    <span className="text-xs font-medium">No image provided</span>
                  </div>
                )}
                <div className="bg-brand-50 rounded-xl p-4 border border-brand-200 flex flex-col justify-center relative overflow-hidden">
                   <div className="relative z-10">
                     <h4 className="text-sm font-bold text-civic-text mb-1">{selectedIssue.location.ward}</h4>
                     <p className="text-xs text-civic-muted leading-relaxed">{selectedIssue.location.address}</p>
                   </div>
                </div>
              </div>

              {/* AI Priority Engine View */}
              {selectedIssue.aiAnalysis && (
                <Card className="border border-brand-200 bg-white shadow-sm p-5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 opacity-5">
                    <BrainCircuit size={64} className="text-civic-primary" />
                  </div>
                  
                  <div className="flex items-center gap-2 mb-6 relative z-10">
                    <div className="bg-civic-primary/10 text-civic-primary p-1.5 rounded-lg">
                      <BrainCircuit size={18} />
                    </div>
                    <h3 className="font-bold text-civic-text">AI Priority Engine</h3>
                  </div>

                  <div className="flex items-center gap-8 mb-6 relative z-10">
                    <div className="text-center">
                      <div className={cn("text-4xl font-black", selectedIssue.aiAnalysis.priorityScore > 75 ? "text-civic-danger" : "text-civic-warning")}>
                        {selectedIssue.aiAnalysis.priorityScore}
                      </div>
                      <div className="text-[10px] text-civic-muted font-bold tracking-wider uppercase">Score</div>
                    </div>
                    
                    <div className="flex-1 space-y-2.5">
                      {selectedIssue.aiAnalysis.priorityReasoning.map((reason, idx) => (
                        <div key={idx} className="flex justify-between text-xs items-center">
                          <span className="text-civic-muted font-medium truncate mr-2">{reason.factor}</span>
                          <span className="text-civic-text font-bold bg-brand-50 px-2 py-0.5 rounded">+{reason.score}</span>
                        </div>
                      ))}
                      {selectedIssue.aiAnalysis.possibleDuplicate && (
                        <div className="flex justify-between text-xs border-t border-brand-100 pt-2 items-center">
                          <span className="text-civic-muted font-semibold">Possible Duplicate</span>
                          <span className="text-civic-primary font-bold bg-civic-primary/10 px-2 py-0.5 rounded">+10</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-civic-accent/10 border border-civic-accent/20 rounded-lg p-3 text-sm text-civic-text relative z-10">
                    <span className="font-bold text-civic-accent block mb-1">AI Recommendation:</span>
                    Prioritize this issue within the next 2 hours. High safety risk detected in heavy traffic zone.
                  </div>
                </Card>
              )}

              {/* Smart Resource Allocation */}
              {(selectedIssue.status === 'REPORTED' || selectedIssue.status === 'AI_VERIFIED') && (
                <div>
                  <h3 className="font-bold text-civic-text mb-4 flex items-center gap-2">
                    <Users size={18} className="text-civic-muted" />
                    Smart Resource Allocation
                  </h3>
                  
                  <div className="space-y-3">
                    {fieldTeams.filter(t => t.departmentId === selectedIssue.aiAnalysis?.suggestedDepartment).map((team, idx) => (
                      <div key={team.id} className="bg-white border border-brand-200 rounded-xl p-4 flex items-center justify-between hover:border-civic-primary transition-colors shadow-sm">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-civic-text text-sm">{team.name}</h4>
                            {idx === 0 && <span className="bg-civic-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded">AI REC</span>}
                          </div>
                          <div className="text-xs text-civic-muted font-medium">
                            {team.status === 'AVAILABLE' ? 'Available now' : `Currently: ${team.status}`} • 1.2km away
                          </div>
                        </div>
                        <Button 
                          onClick={() => handleAssign(team.id)}
                          disabled={team.status !== 'AVAILABLE'}
                          size="sm"
                          variant={team.status === 'AVAILABLE' ? 'primary' : 'outline'}
                        >
                          Assign Team
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedIssue.status === 'ASSIGNED' && (
                <div className="bg-civic-accent/10 border border-civic-accent/20 rounded-xl p-6 text-center">
                  <CheckCircle2 size={40} className="text-civic-accent mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-civic-text mb-1">Team Dispatched</h3>
                  <p className="text-civic-muted text-sm">Team {fieldTeams.find(t => t.id === selectedIssue.assignedTeamId)?.name} is handling this issue.</p>
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
