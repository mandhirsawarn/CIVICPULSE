import React, { useState } from 'react';
import { Users, MapPin, Map as MapIcon, List, Info, Sparkles, SlidersHorizontal } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { ReportCard, getCategoryEmoji } from '../../components/ui/ReportCard';
import { cn } from '../../utils/cn';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const FILTER_TABS = [
  'All',
  'Nearby',
  'Most Supported',
  'Newest',
  'High Priority',
  'In Progress',
  'Resolved'
] as const;

type FilterTab = typeof FILTER_TABS[number];

const CATEGORIES = [
  'All',
  'Pothole',
  'Garbage',
  'Streetlight',
  'Waterlogging',
  'Road Damage',
  'Public Safety'
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'RESOLVED': case 'CITIZEN_VERIFIED': return '#10b981'; // Green
    case 'IN_PROGRESS': return '#f59e0b'; // Amber
    default: return '#ef4444'; // Red
  }
};

const createCustomIcon = (color: string) => {
  return new L.DivIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
};

const CommunityPulse = () => {
  const { issues, voteIssue, currentUser } = useStore();
  const [viewMode, setViewMode] = useState<'feed' | 'map'>('feed');
  const [activeTab, setActiveTab] = useState<FilterTab>('All');
  const [activeCategory, setActiveCategory] = useState('All');

  const userId = currentUser?.id || 'demo-user-1';
  const mockLocality = "Chandigarh University / Kharar";

  // Filter issues based on active tab and category
  const filteredIssues = issues.filter(issue => {
    // Category filter
    if (activeCategory !== 'All' && issue.category !== activeCategory) {
      return false;
    }

    // Status/Criteria filter tab
    switch (activeTab) {
      case 'High Priority':
        return issue.priority === 'HIGH' || issue.priority === 'CRITICAL' || (issue.priorityScore || 0) >= 70;
      case 'In Progress':
        return issue.status === 'IN_PROGRESS' || issue.status === 'ASSIGNED';
      case 'Resolved':
        return issue.status === 'RESOLVED' || issue.status === 'CITIZEN_VERIFIED';
      case 'Nearby':
      case 'All':
      case 'Most Supported':
      case 'Newest':
      default:
        return true;
    }
  });

  // Sort issues
  const sortedIssues = [...filteredIssues].sort((a, b) => {
    if (activeTab === 'Most Supported') {
      const scoreA = (a.upvotes || 0) - (a.downvotes || 0);
      const scoreB = (b.upvotes || 0) - (b.downvotes || 0);
      return scoreB - scoreA;
    }
    if (activeTab === 'Newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (activeTab === 'High Priority') {
      return (b.priorityScore || 0) - (a.priorityScore || 0);
    }
    // Default: Sort by activity / recency
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const handleVote = (issueId: string, type: 'up' | 'down') => {
    const currentVote = issues.find(i => i.id === issueId)?.userVotes?.[userId];
    if (currentVote === type) {
      voteIssue(issueId, null); // Cancel vote if clicked again
    } else {
      voteIssue(issueId, type);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-4 md:py-8 space-y-6 animate-fade-in">
      {/* Header */}
      <PageHeader 
        title="Community Pulse" 
        description="Explore civic issues reported across your community, support reports with upvotes, and confirm fixes." 
        action={
          <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl border border-blue-200/60 shadow-2xs">
            <MapPin size={16} />
            <span className="font-bold text-xs sm:text-sm">📍 {mockLocality}</span>
          </div>
        }
      />

      {/* Filter and Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(15,23,42,0.03)] space-y-3">
        {/* Main Filter Tabs */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar pb-1 sm:pb-0">
            {FILTER_TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-150 whitespace-nowrap cursor-pointer",
                  activeTab === tab 
                    ? "bg-slate-900 text-white shadow-xs" 
                    : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* View Mode Toggle: Feed vs Map */}
          <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200/60 shrink-0">
            <button
              onClick={() => setViewMode('feed')}
              className={cn(
                "flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer",
                viewMode === 'feed' ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
              )}
            >
              <List size={14} /> Feed
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={cn(
                "flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer",
                viewMode === 'map' ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
              )}
            >
              <MapIcon size={14} /> Map
            </button>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 overflow-x-auto hide-scrollbar">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 shrink-0">
            <SlidersHorizontal size={12} /> Category:
          </span>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all duration-150 whitespace-nowrap cursor-pointer",
                activeCategory === cat 
                  ? "bg-blue-50 text-blue-700 font-bold border border-blue-200/60" 
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              )}
            >
              {cat !== 'All' && <span className="mr-1">{getCategoryEmoji(cat)}</span>}
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Community Signal Notice */}
      <div className="bg-blue-50/50 border border-blue-200/50 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <Info size={15} className="text-blue-600 shrink-0" />
          <span>
            <strong>Community Prioritization Signal:</strong> Community support contributes to priority ranking, but does not guarantee automatic government dispatch or legal mandates.
          </span>
        </div>
        <span className="text-[11px] font-semibold hidden sm:inline text-blue-700">
          Showing {sortedIssues.length} reports
        </span>
      </div>

      {/* Main Content Area */}
      {sortedIssues.length === 0 ? (
        <Card className="text-center py-16">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">No matching community issues found</h3>
          <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
            Try choosing another category or filter tab, or report a new civic issue in your area.
          </p>
          <Link to="/report">
            <Button className="font-bold">Report an Issue</Button>
          </Link>
        </Card>
      ) : viewMode === 'feed' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {sortedIssues.map(issue => (
            <ReportCard 
              key={issue.id} 
              issue={issue} 
              currentUserId={userId}
              onVote={handleVote}
              showImage={true}
            />
          ))}
        </div>
      ) : (
        <div className="h-[600px] bg-white rounded-2xl shadow-sm border border-brand-200 overflow-hidden relative">
          <MapContainer 
            center={[30.7333, 76.7794]} 
            zoom={13} 
            maxZoom={19}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {sortedIssues.map(issue => (
              <Marker 
                key={issue.id} 
                position={[issue.location.lat, issue.location.lng]}
                icon={createCustomIcon(getStatusColor(issue.status))}
              >
                <Popup className="rounded-xl overflow-hidden border-0 shadow-lg p-0">
                  <div className="p-3 min-w-[220px]">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{getCategoryEmoji(issue.category)}</span>
                      <h4 className="font-bold text-sm text-civic-text leading-tight">{issue.title}</h4>
                    </div>
                    <div className="flex justify-between items-center text-xs mb-3 border-y border-brand-100 py-2">
                      <div>
                        <span className="text-civic-muted font-semibold block">Score</span>
                        <span className="font-bold text-civic-primary">{(issue.upvotes || 0) - (issue.downvotes || 0)}</span>
                      </div>
                      <div>
                        <span className="text-civic-muted font-semibold block">Upvotes</span>
                        <span className="font-bold text-brand-600">{issue.upvotes || 0}</span>
                      </div>
                      <div>
                        <span className="text-civic-muted font-semibold block">Status</span>
                        <span className={cn("font-bold text-[11px]", issue.status === 'RESOLVED' ? "text-green-600" : "text-amber-600")}>
                          {issue.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <Link to={`/issue/${issue.id}`} className="block w-full">
                      <Button size="sm" className="w-full text-xs font-bold">View Report Details</Button>
                    </Link>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}
    </div>
  );
};

export default CommunityPulse;
