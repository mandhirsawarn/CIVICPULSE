export type Role = 'CITIZEN' | 'AUTHORITY_ADMIN' | 'DEPARTMENT_OFFICER' | 'FIELD_OPERATOR' | 'PARTNER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
  civicPoints?: number;
}

export type IssueStatus = 'REPORTED' | 'AI_VERIFIED' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CITIZEN_VERIFIED';

export type IssueCategory = 'Pothole' | 'Garbage' | 'Streetlight' | 'Waterlogging' | 'Broken Footpath' | 'Traffic Sign' | 'Public Safety' | 'Road Damage' | 'Drainage' | 'Obstruction' | 'Illegal Dumping' | 'Water Leakage' | 'Other';

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type Urgency = 'URGENT' | 'HIGH' | 'MODERATE' | 'LOW';

export interface AIAnalysis {
  confidence: number;
  detectedCategory: IssueCategory;
  severity: Severity;
  safetyRisk: Severity;
  suggestedDepartment: string;
  priorityScore: number; // 0-100
  priorityReasoning: { factor: string; score: number }[];
  keywords?: string[];
  matchedSignals?: string[];
  possibleDuplicate?: boolean;
  estimatedResolutionTime?: string;
}

export interface Issue {
  id: string; // CP-YYYY-XXXX
  title: string;
  description: string;
  category: IssueCategory;
  location: {
    lat: number;
    lng: number;
    accuracy?: number;
    address: string;
    ward: string;
    zone: string;
  };
  photos: string[];
  status: IssueStatus;
  priority: Severity;
  priorityScore: number;
  citizenUrgency?: Urgency;
  estimatedResolutionTime?: string;
  reporterId: string;
  createdAt: string;
  updatedAt: string;
  voiceRecording?: {
    id: string;
    duration: number;
    mimeType: string;
    transcript?: string;
  };
  aiAnalysis?: AIAnalysis;
  assignedDepartmentId?: string;
  assignedTeamId?: string;
  slaTarget?: string; // ISO String
  resolutionEvidence?: string[];
  contactPhone?: string;
  contactEmail?: string;
  timeline: TimelineEvent[];
  // Community Pulse fields
  upvotes?: number;
  downvotes?: number;
  userVotes?: Record<string, 'up' | 'down'>;
  communityComments?: { id: string; text: string; timestamp: string; author: string }[];
  communityRecheckRequests?: number;
}

export interface TimelineEvent {
  id: string;
  status: IssueStatus;
  timestamp: string;
  description: string;
  actor: string;
  evidence?: string[];
}

export interface Department {
  id: string;
  name: string;
  activeIssues: number;
  resolvedToday: number;
  slaComplianceRate: number;
}

export interface FieldTeam {
  id: string;
  name: string;
  departmentId: string;
  status: 'AVAILABLE' | 'EN_ROUTE' | 'WORKING' | 'OFFLINE';
  currentIssueId?: string;
  location: {
    lat: number;
    lng: number;
  };
  members: number;
}

export interface CivicChallenge {
  id: string;
  title: string;
  description: string;
  location: string;
  severity: Severity;
  rewardPoints: number;
  status: 'OPEN' | 'UNDER_REVIEW' | 'SOLUTION_PROPOSED' | 'PILOT' | 'IMPLEMENTED';
  proposalsCount: number;
}

export interface Hotspot {
  id: string;
  name: string;
  description: string;
  location: {
    lat: number;
    lng: number;
    radius: number; // in meters
  };
  reportCount: number;
  topCategory: IssueCategory;
  riskLevel: Severity;
  trend: number; // e.g., 32 for +32%
}

export interface ReportDraft {
  category: string;
  description: string;
  voiceRecordingId?: string;
  voiceTranscript?: string;
  voiceDuration?: number;
  photoId?: string; // id in IndexedDB
  locationStr: string;
  coordinates: { lat: number; lng: number } | null;
  locationSource: 'GPS' | 'Manual' | 'Search';
  searchQuery: string;
  urgency: Urgency | '';
  contactPhone: string;
  contactEmail: string;
  step: number;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}
