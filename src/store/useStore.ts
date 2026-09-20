import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Issue, Department, FieldTeam, CivicChallenge, User, Hotspot, Notification, IssueCategory, Severity, ReportDraft } from '../types';
import { mockIssues, mockDepartments, mockFieldTeams, mockChallenges, mockHotspots } from '../mockData';
import { isValidEmailFormat } from '../utils/emailValidation';

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
  
  setCurrentUser: (user: User | null) => void;
  addIssue: (issue: Issue) => void;
  updateIssueStatus: (id: string, status: Issue['status'], evidence?: string[]) => void;
  assignTeam: (issueId: string, teamId: string, departmentId: string) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  recalculateHotspots: () => void;
  setReportDraft: (draft: ReportDraft | null) => void;
  updateReportDraft: (updates: Partial<ReportDraft>) => void;
  clearReportDraft: () => void;
  hasUnsavedReportData: () => boolean;
  voteIssue: (issueId: string, voteType: 'up' | 'down' | null) => void;
  addCommunityComment: (issueId: string, text: string) => void;
  requestCommunityRecheck: (issueId: string) => void;
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
      voteIssue: (issueId, voteType) => set((state) => {
        const userId = state.currentUser?.id || 'demo-user-1';
        return {
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
              
              return { ...issue, upvotes: newUpvotes, downvotes: newDownvotes, userVotes: newUserVotes };
            }
            return issue;
          })
        };
      }),

      addCommunityComment: (issueId, text) => set((state) => {
        const userId = state.currentUser?.name || 'Concerned Citizen';
        return {
          issues: state.issues.map(issue => {
            if (issue.id === issueId) {
              const newComment = { id: `c-${Date.now()}`, text, timestamp: new Date().toISOString(), author: userId };
              return { ...issue, communityComments: [...(issue.communityComments || []), newComment] };
            }
            return issue;
          })
        };
      }),

      requestCommunityRecheck: (issueId) => set((state) => ({
        issues: state.issues.map(issue => {
          if (issue.id === issueId) {
            return { ...issue, communityRecheckRequests: (issue.communityRecheckRequests || 0) + 1 };
          }
          return issue;
        })
      })),
      
      addIssue: (issue) => {
        if (issue.contactEmail && issue.contactEmail.trim().length > 0) {
          if (!isValidEmailFormat(issue.contactEmail.trim())) {
            console.warn('Rejected issue with invalid contactEmail:', issue.contactEmail);
            throw new Error('Please enter a valid email address.');
          }
        }
        set((state) => ({ issues: [issue, ...state.issues] }));
        get().recalculateHotspots();
        
        // Add a notification for the user
        get().addNotification({
          userId: issue.reporterId,
          title: 'Issue Reported Successfully',
          message: `Your report for ${issue.category} has been received and is under AI analysis.`,
          actionUrl: '/my-reports'
        });
      },

      updateIssueStatus: (id, status, evidence) => {
        set((state) => ({
          issues: state.issues.map(issue => {
            if (issue.id === id) {
              const updatedIssue = { ...issue, status };
              if (evidence) updatedIssue.resolutionEvidence = evidence;
              updatedIssue.timeline = [
                ...issue.timeline,
                {
                  id: `tl-${Date.now()}`,
                  status,
                  timestamp: new Date().toISOString(),
                  description: `Status updated to ${status}`,
                  actor: 'System',
                  evidence
                }
              ];
              return updatedIssue;
            }
            return issue;
          })
        }));

        // Notify if it affects current user
        const issue = get().issues.find(i => i.id === id);
        if (issue) {
          get().addNotification({
            userId: issue.reporterId,
            title: 'Issue Status Updated',
            message: `Your report ${issue.id} is now ${status.replace('_', ' ')}.`,
            actionUrl: '/my-reports'
          });
        }
      },

      assignTeam: (issueId, teamId, departmentId) => {
        set((state) => {
          const newIssues = state.issues.map(issue => 
            issue.id === issueId 
              ? { 
                  ...issue, 
                  status: 'ASSIGNED' as const, 
                  assignedTeamId: teamId, 
                  assignedDepartmentId: departmentId,
                  timeline: [
                    ...issue.timeline,
                    {
                      id: `tl-${Date.now()}`,
                      status: 'ASSIGNED' as const,
                      timestamp: new Date().toISOString(),
                      description: 'Assigned to field team',
                      actor: 'Admin'
                    }
                  ]
                } 
              : issue
          );

          const newTeams = state.fieldTeams.map(team =>
            team.id === teamId
              ? { ...team, status: 'EN_ROUTE' as const, currentIssueId: issueId }
              : team
          );

          return { issues: newIssues, fieldTeams: newTeams };
        });

        const issue = get().issues.find(i => i.id === issueId);
        if (issue) {
          get().addNotification({
            userId: issue.reporterId,
            title: 'Team Assigned',
            message: `A field team has been assigned to your report ${issue.id}.`,
            actionUrl: '/my-reports'
          });
        }
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
        // Very simple O(n^2) naive clustering for demo purposes
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
            // Find top category
            const cats = c.issues.map(i => i.category);
            const topCategory = cats.sort((a,b) => cats.filter(v => v===a).length - cats.filter(v => v===b).length).pop() as IssueCategory;
            // Find highest risk
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
              trend: Math.round(Math.random() * 20) + 10 // Mock trend
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
