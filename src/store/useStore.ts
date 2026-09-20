import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  Issue, Department, FieldTeam, CivicChallenge, User, Hotspot, 
  Notification, IssueCategory, Severity, ReportDraft, InternalNote, IssueStatus 
} from '../types';
import { mockIssues, mockDepartments, mockFieldTeams, mockChallenges, mockHotspots } from '../mockData';
import { isValidEmailFormat } from '../utils/emailValidation';

interface IncomingAlert {
  id: string;
  issueId: string;
  title: string;
  category: string;
  location: string;
  priority: string;
  timestamp: string;
}

interface StoreState {
  currentUser: User | null;
  issues: Issue[];
  departments: Department[];
  fieldTeams: FieldTeam[];
  challenges: CivicChallenge[];
  hotspots: Hotspot[];
  notifications: Notification[];
  cityPulseScore: number;
  reportDraft: ReportDraft | null;

  // Real-time synchronization states
  isSyncing: boolean;
  lastSyncTime: string | null;
  syncError: string | null;
  unreadIncomingCount: number;
  latestIncomingAlert: IncomingAlert | null;
  clearIncomingAlert: () => void;

  // Core Actions
  setCurrentUser: (user: User | null) => void;
  syncIssuesFromServer: () => Promise<void>;
  addIssue: (issue: Issue) => Promise<void>;
  updateIssueStatus: (id: string, status: IssueStatus, evidence?: string[], note?: string) => Promise<void>;
  updateIssueOperationalFields: (id: string, fields: Partial<Issue>, auditDescription?: string) => Promise<void>;
  assignTeam: (issueId: string, teamId: string, departmentId: string, officerName?: string) => Promise<void>;
  updateEta: (issueId: string, etaIsoString: string) => Promise<void>;
  addInternalNote: (issueId: string, text: string, author?: string) => Promise<void>;
  resolveIssueWithProof: (issueId: string, resolutionNote: string, evidencePhotos: string[], officerName?: string) => Promise<void>;
  reopenIssue: (issueId: string, reason: string) => Promise<void>;
  overrideDuplicateStatus: (issueId: string, action: 'CONFIRM' | 'SEPARATE', notes?: string) => Promise<void>;

  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  recalculateHotspots: () => void;
  setReportDraft: (draft: ReportDraft | null) => void;
  updateReportDraft: (updates: Partial<ReportDraft>) => void;
  clearReportDraft: () => void;
  hasUnsavedReportData: () => boolean;
  voteIssue: (issueId: string, voteType: 'up' | 'down' | null) => Promise<void>;
  addCommunityComment: (issueId: string, text: string) => Promise<void>;
  requestCommunityRecheck: (issueId: string) => Promise<void>;
}

// Simple Haversine for store
const getDistKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c; 
};

// Cross-tab broadcast channel
const syncChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('civicpulse_tab_sync')
  : null;

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      currentUser: {
        id: 'user-1',
        name: 'Rohan Sharma',
        email: 'rohan@example.com',
        role: 'CITIZEN',
        civicPoints: 420
      },
      issues: mockIssues,
      departments: mockDepartments,
      fieldTeams: mockFieldTeams,
      challenges: mockChallenges,
      hotspots: mockHotspots,
      notifications: [],
      cityPulseScore: 84,
      reportDraft: null,

      // Live sync state
      isSyncing: false,
      lastSyncTime: null,
      syncError: null,
      unreadIncomingCount: 0,
      latestIncomingAlert: null,

      clearIncomingAlert: () => set({ latestIncomingAlert: null, unreadIncomingCount: 0 }),

      setCurrentUser: (user) => {
        if (user && user.email && user.email.trim().length > 0) {
          if (!isValidEmailFormat(user.email.trim())) {
            console.warn('Rejected user with invalid email format:', user.email);
            return;
          }
        }
        set({ currentUser: user });
      },

      setReportDraft: (draft) => set({ reportDraft: draft }),
      updateReportDraft: (updates) => set((state) => ({ 
        reportDraft: state.reportDraft 
          ? { ...state.reportDraft, ...updates, updatedAt: new Date().toISOString() } 
          : { 
              category: '', description: '', locationStr: 'Fetching location...', coordinates: null, locationSource: 'GPS', searchQuery: '', urgency: '', contactPhone: '', contactEmail: '', step: 1, ...updates, updatedAt: new Date().toISOString() 
            } as ReportDraft
      })),
      clearReportDraft: () => {
        try {
          if ('indexedDB' in window) {
            import('../utils/indexedDB').then(({ deleteMediaBlob }) => {
              deleteMediaBlob('current-report-photo').catch(() => {});
            }).catch(() => {});
          }
        } catch {
          // ignore
        }
        set({ reportDraft: null });
      },
      hasUnsavedReportData: () => {
        const draft = get().reportDraft;
        if (!draft) return false;
        return Boolean(
          draft.category ||
          (draft.description && draft.description.trim().length > 0) ||
          draft.urgency ||
          draft.photo ||
          draft.photoId ||
          draft.coordinates ||
          (draft.contactPhone && draft.contactPhone.trim().length > 0) ||
          (draft.contactEmail && draft.contactEmail.trim().length > 0)
        );
      },

      // Fetch latest issues from shared server API
      syncIssuesFromServer: async () => {
        try {
          set({ isSyncing: true, syncError: null });
          const res = await fetch('/api/issues', {
            headers: { 'Cache-Control': 'no-cache' }
          });
          if (!res.ok) throw new Error(`HTTP error ${res.status}`);
          const data = await res.json();
          if (data && Array.isArray(data.issues) && data.issues.length > 0) {
            const serverIssues: Issue[] = data.issues;
            
            // Server is single source of truth for all persisted issues
            const currentIssues = get().issues;
            const issueMap = new Map<string, Issue>();
            
            // 1. Add all server issues first
            for (const issue of serverIssues) {
              issueMap.set(issue.id, issue);
            }
            
            // 2. If a local issue was created offline and not yet on server, keep it and push it
            for (const local of currentIssues) {
              if (!issueMap.has(local.id)) {
                issueMap.set(local.id, local);
                // Background sync to server
                fetch('/api/issues', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(local)
                }).catch(() => {});
              }
            }

            const merged = Array.from(issueMap.values());
            // Sort by createdAt descending
            merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            set({ 
              issues: merged, 
              lastSyncTime: new Date().toISOString(),
              isSyncing: false 
            });
            get().recalculateHotspots();
          } else {
            set({ isSyncing: false });
          }
        } catch (err: any) {
          console.warn('[CivicPulse Sync] Cloud sync notice (working offline/local cache):', err?.message);
          set({ isSyncing: false, syncError: err?.message || 'Offline' });
        }
      },

      // Add issue (Citizen flow -> persists locally, pushes to shared server, broadcasts live)
      addIssue: async (issue: Issue) => {
        if (issue.contactEmail && issue.contactEmail.trim().length > 0) {
          if (!isValidEmailFormat(issue.contactEmail.trim())) {
            console.warn('Rejected issue with invalid contactEmail:', issue.contactEmail);
            throw new Error('Please enter a valid email address.');
          }
        }

        // 1. Optimistic Local State Update
        set((state) => {
          let updatedIssues = [issue, ...state.issues.filter(i => i.id !== issue.id)];

          // If this is a duplicate of an existing report, update the original master issue
          if (issue.isDuplicate && issue.duplicateOf) {
            updatedIssues = updatedIssues.map(existing => {
              if (existing.id === issue.duplicateOf) {
                const prevRelated = existing.relatedReportIds || [];
                const newRelated = prevRelated.includes(issue.id) ? prevRelated : [...prevRelated, issue.id];
                return {
                  ...existing,
                  duplicateCount: (existing.duplicateCount || 0) + 1,
                  relatedReportIds: newRelated,
                  timeline: [
                    ...existing.timeline,
                    {
                      id: `tl-dup-${Date.now()}`,
                      status: existing.status,
                      timestamp: new Date().toISOString(),
                      description: `Citizen corroboration report (${issue.id}) linked to this issue`,
                      actor: 'AI Corroboration Engine'
                    }
                  ]
                };
              }
              return existing;
            });
          }

          return { issues: updatedIssues };
        });

        get().recalculateHotspots();
        
        // 2. Add local notification
        get().addNotification({
          userId: issue.reporterId,
          title: issue.isDuplicate ? 'Report Logged as Corroborating Evidence' : 'Issue Reported Successfully',
          message: issue.isDuplicate && issue.duplicateOf 
            ? `Your report for ${issue.category} was linked to existing issue ${issue.duplicateOf}. Authorities have been notified of repeated citizen impact.`
            : `Your report for ${issue.category} has been received and is under AI analysis.`,
          actionUrl: '/my-reports'
        });

        // 3. Post to shared server
        try {
          await fetch('/api/issues', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(issue)
          });
        } catch (postErr) {
          console.warn('[CivicPulse Sync] Shared server POST deferred:', postErr);
        }

        // 4. Multi-tab broadcast
        syncChannel?.postMessage({ type: 'ISSUE_CREATED', issue });
      },

      // Update issue status with optional evidence & note
      updateIssueStatus: async (id, status, evidence, note) => {
        let updatedIssue: Issue | null = null;
        const nowIso = new Date().toISOString();

        set((state) => ({
          issues: state.issues.map(issue => {
            if (issue.id === id) {
              const updated: Issue = { 
                ...issue, 
                status, 
                createdAt: issue.createdAt, // ALWAYS PRESERVED
                lastUpdatedAt: nowIso,
                updatedAt: nowIso 
              };
              if (status === 'RESOLVED') {
                updated.resolvedAt = issue.resolvedAt || nowIso;
                if (!updated.resolutionDate) updated.resolutionDate = updated.resolvedAt;
              } else if (status === 'REOPENED') {
                updated.reopenedAt = issue.reopenedAt || nowIso;
              }
              if (evidence) updated.resolutionEvidence = evidence;
              if (note) updated.resolutionNote = note;
              updated.timeline = [
                ...issue.timeline,
                {
                  id: `tl-${Date.now()}`,
                  status,
                  timestamp: nowIso,
                  description: note ? `Status changed to ${status.replace('_', ' ')}: ${note}` : `Status updated to ${status.replace('_', ' ')}`,
                  actor: 'Authority'
                }
              ];
              updatedIssue = updated;
              return updated;
            }
            return issue;
          })
        }));

        if (updatedIssue) {
          const u = updatedIssue as Issue;
          get().addNotification({
            userId: u.reporterId,
            title: 'Issue Status Updated',
            message: `Your report ${u.id} is now ${status.replace('_', ' ')}.`,
            actionUrl: '/my-reports'
          });

          // Sync with server
          fetch(`/api/issues/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              status, 
              resolutionEvidence: evidence, 
              resolutionNote: note, 
              createdAt: u.createdAt,
              resolvedAt: u.resolvedAt,
              lastUpdatedAt: u.lastUpdatedAt,
              reopenedAt: u.reopenedAt,
              timeline: u.timeline 
            })
          }).catch(() => {});

          syncChannel?.postMessage({ type: 'ISSUE_UPDATED', issue: u });
        }
      },

      // Full Authority Operational Update (Status, Priority, Dept, Team, Officer, ETA, Notes)
      updateIssueOperationalFields: async (id, fields, auditDescription) => {
        let updatedIssue: Issue | null = null;
        const nowIso = new Date().toISOString();

        set((state) => ({
          issues: state.issues.map(issue => {
            if (issue.id === id) {
              const newTimeline = [...issue.timeline];
              if (auditDescription) {
                newTimeline.push({
                  id: `tl-${Date.now()}`,
                  status: fields.status || issue.status,
                  timestamp: nowIso,
                  description: auditDescription,
                  actor: 'Authority'
                });
              }

              const updated: Issue = {
                ...issue,
                ...fields,
                createdAt: issue.createdAt, // ALWAYS PRESERVE ORIGINAL CREATED AT
                lastUpdatedAt: nowIso,
                updatedAt: nowIso,
                timeline: newTimeline
              };

              if (fields.status === 'RESOLVED') {
                updated.resolvedAt = fields.resolvedAt || issue.resolvedAt || nowIso;
                if (!updated.resolutionDate) updated.resolutionDate = updated.resolvedAt;
              } else if (fields.status === 'REOPENED') {
                updated.reopenedAt = fields.reopenedAt || issue.reopenedAt || nowIso;
              }

              updatedIssue = updated;
              return updated;
            }
            return issue;
          })
        }));

        if (updatedIssue) {
          const u = updatedIssue as Issue;
          // Notify citizen if status, department, or ETA changed
          if (fields.status || fields.assignedDepartmentId || fields.slaTarget || fields.assignedOfficer) {
            let msg = `Your report ${u.id} has been updated by municipal authority.`;
            if (fields.status) msg = `Status updated to ${fields.status.replace('_', ' ')}.`;
            if (fields.assignedOfficer) msg += ` Assigned to Officer ${fields.assignedOfficer}.`;
            get().addNotification({
              userId: u.reporterId,
              title: 'Official Report Update',
              message: msg,
              actionUrl: '/my-reports'
            });
          }

          // Push to shared server
          try {
            await fetch(`/api/issues/${id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                ...fields, 
                createdAt: u.createdAt,
                resolvedAt: u.resolvedAt,
                lastUpdatedAt: u.lastUpdatedAt,
                reopenedAt: u.reopenedAt,
                timeline: u.timeline 
              })
            });
          } catch (err) {
            console.error('[CivicPulse Sync] PATCH failed:', err);
          }

          syncChannel?.postMessage({ type: 'ISSUE_UPDATED', issue: u });
        }
      },

      // Assign team and optional officer
      assignTeam: async (issueId, teamId, departmentId, officerName) => {
        const team = get().fieldTeams.find(t => t.id === teamId);
        const teamName = team?.name || 'Municipal Response Team';
        const audit = officerName 
          ? `Assigned to ${teamName} (Officer in charge: ${officerName})`
          : `Assigned to ${teamName}`;

        await get().updateIssueOperationalFields(
          issueId,
          {
            status: 'ASSIGNED',
            assignedTeamId: teamId,
            assignedDepartmentId: departmentId,
            assignedOfficer: officerName || undefined
          },
          audit
        );

        set((state) => ({
          fieldTeams: state.fieldTeams.map(t =>
            t.id === teamId ? { ...t, status: 'EN_ROUTE', currentIssueId: issueId } : t
          )
        }));
      },

      // Update ETA
      updateEta: async (issueId, etaIsoString) => {
        const dateStr = new Date(etaIsoString).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
        await get().updateIssueOperationalFields(
          issueId,
          {
            slaTarget: etaIsoString,
            estimatedResolutionTime: dateStr
          },
          `Estimated resolution date revised to ${dateStr}`
        );
      },

      // Add internal authority note
      addInternalNote: async (issueId, text, author) => {
        const newNote: InternalNote = {
          id: `note-${Date.now()}`,
          text,
          author: author || 'Municipal Officer',
          timestamp: new Date().toISOString()
        };

        const issue = get().issues.find(i => i.id === issueId);
        if (!issue) return;

        const currentNotes = issue.internalNotes || [];
        await get().updateIssueOperationalFields(
          issueId,
          { internalNotes: [...currentNotes, newNote] },
          `Internal operational note added by ${newNote.author}`
        );
      },

      // Mark resolved with proof
      resolveIssueWithProof: async (issueId, resolutionNote, evidencePhotos, officerName) => {
        const issue = get().issues.find(i => i.id === issueId);
        if (!issue) return;

        const resolutionDate = new Date().toISOString();
        await get().updateIssueOperationalFields(
          issueId,
          {
            status: 'RESOLVED',
            resolutionNote,
            resolutionEvidence: evidencePhotos,
            resolutionDate
          },
          `Issue marked RESOLVED by ${officerName || 'Authority'}. Resolution note: "${resolutionNote}"`
        );

        get().addNotification({
          userId: issue.reporterId,
          title: '✓ Issue Resolved by Authority',
          message: `Your report ${issue.id} has been marked resolved. You can view the resolution proof and confirm.`,
          actionUrl: `/issue/${issue.id}`
        });
      },

      // Citizen or Authority reopens a resolved issue
      reopenIssue: async (issueId, reason) => {
        const issue = get().issues.find(i => i.id === issueId);
        if (!issue) return;

        const nowIso = new Date().toISOString();
        await get().updateIssueOperationalFields(
          issueId,
          {
            status: 'REOPENED',
            reopenedReason: reason,
            reopenedAt: nowIso,
            lastUpdatedAt: nowIso
          },
          `Issue REOPENED. Citizen feedback: "${reason}"`
        );

        get().addNotification({
          userId: issue.reporterId,
          title: 'Issue Reopened for Review',
          message: `Your request for re-inspection of ${issue.id} has been queued for municipal review.`,
          actionUrl: `/issue/${issue.id}`
        });
      },

      // Authority confirms or overrides duplicate classification
      overrideDuplicateStatus: async (issueId, action, notes) => {
        if (action === 'CONFIRM') {
          await get().updateIssueOperationalFields(
            issueId,
            { status: 'DUPLICATE' },
            `Authority verified duplicate report classification. ${notes || ''}`
          );
        } else {
          await get().updateIssueOperationalFields(
            issueId,
            {
              isDuplicate: false,
              duplicateOf: undefined,
              status: 'UNDER_REVIEW'
            },
            `Authority cleared duplicate tag: Marked as separate independent incident. ${notes || ''}`
          );
        }
      },

      // Community Voting
      voteIssue: async (issueId, voteType) => {
        const userId = get().currentUser?.id || 'demo-user-1';
        set((state) => ({
          issues: state.issues.map(issue => {
            if (issue.id === issueId) {
              const currentVote = issue.userVotes?.[userId];
              let newUpvotes = issue.upvotes || 0;
              let newDownvotes = issue.downvotes || 0;
              
              if (currentVote === 'up') newUpvotes = Math.max(0, newUpvotes - 1);
              if (currentVote === 'down') newDownvotes = Math.max(0, newDownvotes - 1);
              
              if (voteType === 'up') newUpvotes += 1;
              if (voteType === 'down') newDownvotes += 1;
              
              const newUserVotes = { ...(issue.userVotes || {}) };
              if (voteType) {
                newUserVotes[userId] = voteType;
              } else {
                delete newUserVotes[userId];
              }
              
              const updated = { ...issue, upvotes: newUpvotes, downvotes: newDownvotes, userVotes: newUserVotes };
              fetch(`/api/issues/${issueId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ upvotes: newUpvotes, downvotes: newDownvotes, userVotes: newUserVotes })
              }).catch(() => {});
              syncChannel?.postMessage({ type: 'ISSUE_UPDATED', issue: updated });
              return updated;
            }
            return issue;
          })
        }));
      },

      // Community Comments
      addCommunityComment: async (issueId, text) => {
        const userId = get().currentUser?.name || 'Concerned Citizen';
        const newComment = { id: `c-${Date.now()}`, text, timestamp: new Date().toISOString(), author: userId };
        
        set((state) => ({
          issues: state.issues.map(issue => {
            if (issue.id === issueId) {
              const updatedComments = [...(issue.communityComments || []), newComment];
              const updated = { ...issue, communityComments: updatedComments };
              fetch(`/api/issues/${issueId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ communityComments: updatedComments })
              }).catch(() => {});
              syncChannel?.postMessage({ type: 'ISSUE_UPDATED', issue: updated });
              return updated;
            }
            return issue;
          })
        }));
      },

      requestCommunityRecheck: async (issueId) => {
        set((state) => ({
          issues: state.issues.map(issue => {
            if (issue.id === issueId) {
              const count = (issue.communityRecheckRequests || 0) + 1;
              const updated = { ...issue, communityRecheckRequests: count };
              fetch(`/api/issues/${issueId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ communityRecheckRequests: count })
              }).catch(() => {});
              syncChannel?.postMessage({ type: 'ISSUE_UPDATED', issue: updated });
              return updated;
            }
            return issue;
          })
        }));
      },

      addNotification: (notif) => set((state) => ({
        notifications: [{
          ...notif,
          id: `notif-${Date.now()}`,
          timestamp: new Date().toISOString(),
          read: false
        }, ...state.notifications]
      })),

      markNotificationRead: (id) => set((state) => ({
        notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
      })),

      recalculateHotspots: () => {
        const issues = get().issues.filter(i => i.status !== 'RESOLVED' && i.status !== 'CITIZEN_VERIFIED');
        const clusters: { lat: number; lng: number; issues: Issue[] }[] = [];
        const CLUSTER_RADIUS_KM = 1.0;

        issues.forEach(issue => {
          let added = false;
          for (const cluster of clusters) {
            if (getDistKm(issue.location.lat, issue.location.lng, cluster.lat, cluster.lng) <= CLUSTER_RADIUS_KM) {
              cluster.issues.push(issue);
              added = true;
              break;
            }
          }
          if (!added) {
            clusters.push({ lat: issue.location.lat, lng: issue.location.lng, issues: [issue] });
          }
        });

        const newHotspots: Hotspot[] = clusters
          .filter(c => c.issues.length >= 3)
          .map((c, idx) => {
            const cats = c.issues.map(i => i.category);
            const topCategory = cats.sort((a,b) => cats.filter(v => v===a).length - cats.filter(v => v===b).length).pop() as IssueCategory;
            const hasCritical = c.issues.some(i => i.priority === 'CRITICAL');
            const hasHigh = c.issues.some(i => i.priority === 'HIGH');
            const riskLevel: Severity = hasCritical ? 'CRITICAL' : hasHigh ? 'HIGH' : 'MEDIUM';

            return {
              id: `HS-${Date.now()}-${idx}`,
              name: `Cluster Zone ${idx + 1}`,
              description: `High concentration of issues around this area.`,
              location: { lat: c.lat, lng: c.lng, radius: 1000 },
              reportCount: c.issues.length,
              topCategory,
              riskLevel,
              trend: Math.round(Math.random() * 20) + 10
            };
          });

        set({ hotspots: newHotspots.length > 0 ? newHotspots : mockHotspots });
      }
    }),
    {
      name: 'civicpulse-storage',
    }
  )
);

// ----------------------------------------------------------------------------
// AUTOMATIC BI-DIRECTIONAL REAL-TIME SYNCHRONIZATION ENGINE
// ----------------------------------------------------------------------------
if (typeof window !== 'undefined') {
  // 1. Initial synchronization on window load
  setTimeout(() => {
    useStore.getState().syncIssuesFromServer();
  }, 100);

  // 2. Server-Sent Events (SSE) Live Subscription
  let sseSource: EventSource | null = null;
  function connectSSE() {
    try {
      sseSource = new EventSource('/api/events');
      sseSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'ISSUE_CREATED' && data.issue) {
            const newIssue: Issue = data.issue;
            const currentIssues = useStore.getState().issues;
            if (!currentIssues.some(i => i.id === newIssue.id)) {
              useStore.setState({
                issues: [newIssue, ...currentIssues],
                unreadIncomingCount: useStore.getState().unreadIncomingCount + 1,
                latestIncomingAlert: {
                  id: `alert-${Date.now()}`,
                  issueId: newIssue.id,
                  title: newIssue.title,
                  category: newIssue.category,
                  location: newIssue.location.address,
                  priority: newIssue.priority || 'MEDIUM',
                  timestamp: new Date().toISOString()
                }
              });
              useStore.getState().recalculateHotspots();
            }
          } else if (data.type === 'ISSUE_UPDATED' && data.issue) {
            const updatedIssue: Issue = data.issue;
            useStore.setState({
              issues: useStore.getState().issues.map(i => i.id === updatedIssue.id ? updatedIssue : i)
            });
            useStore.getState().recalculateHotspots();
          }
        } catch {
          // ignore
        }
      };

      sseSource.onerror = () => {
        sseSource?.close();
        sseSource = null;
        // Reconnect after 5 seconds
        setTimeout(connectSSE, 5000);
      };
    } catch {
      // SSE not available, fallback to poller
    }
  }

  connectSSE();

  // 3. Fallback Heartbeat Poller (Every 4 seconds)
  // Ensures multi-device sync (e.g. mobile phone on Wi-Fi <-> desktop Authority Portal)
  setInterval(() => {
    if (!document.hidden) {
      useStore.getState().syncIssuesFromServer();
    }
  }, 4000);

  // 4. Cross-tab Broadcast Channel listener
  syncChannel?.addEventListener('message', (event) => {
    if (event.data?.type === 'ISSUE_CREATED' && event.data.issue) {
      const current = useStore.getState().issues;
      if (!current.some(i => i.id === event.data.issue.id)) {
        useStore.setState({ issues: [event.data.issue, ...current] });
      }
    } else if (event.data?.type === 'ISSUE_UPDATED' && event.data.issue) {
      useStore.setState({
        issues: useStore.getState().issues.map(i => i.id === event.data.issue.id ? event.data.issue : i)
      });
    }
  });

  // Re-sync on window focus
  window.addEventListener('focus', () => {
    useStore.getState().syncIssuesFromServer();
  });
}
