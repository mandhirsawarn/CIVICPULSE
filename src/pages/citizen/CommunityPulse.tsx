import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, MapPin, ThumbsUp, ThumbsDown, MessageSquare, Map as MapIcon, List, Filter, Flame, ChevronDown } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { cn } from '../../utils/cn';
import { Link } from 'react-router-dom';
import { Map, AdvancedMarker } from '@vis.gl/react-google-maps';


const CommunityPulse = () => {
  const { issues, voteIssue, currentUser } = useStore();
  const [viewMode, setViewMode] = useState<'feed' | 'map'>('feed');
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'Most Supported' | 'Newest'>('Most Supported');

  const userId = currentUser?.id || 'demo-user-1';

  // For the prototype, we mock the user's locality based on a known good location
  // Let's assume the user is around Chandigarh University / Kharar
  const mockLocality = "Chandigarh University / Kharar";

  // In a real app, we'd filter issues by distance to user's home/current location.
  // For demo, we just use all issues (since they're seeded locally anyway).
  
  const filteredIssues = issues.filter(issue => {
    if (activeCategory !== 'All' && issue.category !== activeCategory) return false;
    return true;
  });

  const sortedIssues = [...filteredIssues].sort((a, b) => {
    if (sortBy === 'Most Supported') {
      const scoreA = (a.upvotes || 0) - (a.downvotes || 0);
      const scoreB = (b.upvotes || 0) - (b.downvotes || 0);
      return scoreB - scoreA;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const categories = ['All', 'Roads', 'Garbage', 'Streetlights', 'Water', 'Drainage'];

  return (
    <div className="max-w-5xl mx-auto py-4 md:py-8 space-y-6">
      <PageHeader 
        title="Community Pulse" 
        description="See what people in your area are reporting and help highlight issues that affect your community." 
        action={
          <div className="flex items-center gap-2 bg-brand-50 text-civic-primary px-4 py-2 rounded-lg border border-brand-200">
            <MapPin size={18} />
            <span className="font-semibold text-sm">📍 {mockLocality}</span>
          </div>
        }
      />

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-brand-200">
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar w-full sm:w-auto">
          {categories.map(cat => {
            const mappedCat = cat === 'Roads' ? 'Pothole' : cat === 'Streetlights' ? 'Streetlight' : cat === 'Water' ? 'Water Leakage' : cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat === 'All' ? 'All' : mappedCat)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap",
                  (activeCategory === (cat === 'All' ? 'All' : mappedCat))
                    ? "bg-civic-primary text-white shadow-md"
                    : "bg-brand-50 text-civic-text hover:bg-brand-100"
                )}
              >
                {cat}
              </button>
            )
          })}
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="appearance-none bg-brand-50 border border-brand-200 text-civic-text text-sm rounded-lg pl-4 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-civic-primary font-medium"
            >
              <option value="Most Supported">Most Supported</option>
              <option value="Newest">Newest</option>
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-civic-muted pointer-events-none" />
          </div>

          <div className="flex bg-brand-50 rounded-lg p-1 border border-brand-200">
            <button
              onClick={() => setViewMode('feed')}
              className={cn("p-1.5 rounded-md transition-colors", viewMode === 'feed' ? "bg-white text-civic-primary shadow-sm" : "text-civic-muted hover:text-civic-text")}
            >
              <List size={18} />
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={cn("p-1.5 rounded-md transition-colors", viewMode === 'map' ? "bg-white text-civic-primary shadow-sm" : "text-civic-muted hover:text-civic-text")}
            >
              <MapIcon size={18} />
            </button>
          </div>
        </div>
      </div>

      {sortedIssues.length === 0 ? (
        <Card className="text-center py-16">
          <div className="w-16 h-16 bg-brand-50 text-civic-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Users size={32} />
          </div>
          <h3 className="text-xl font-bold text-civic-text mb-2">No community issues reported yet.</h3>
          <p className="text-civic-muted mb-6">Be the first person to report a civic issue in your area.</p>
          <Link to="/report">
            <Button>Report an Issue</Button>
          </Link>
        </Card>
      ) : viewMode === 'feed' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedIssues.map(issue => {
            const upvotes = issue.upvotes || 0;
            const downvotes = issue.downvotes || 0;
            const score = upvotes - downvotes;
            const totalVotes = upvotes + downvotes;
            const supportPercent = totalVotes > 0 ? Math.round((upvotes / totalVotes) * 100) : 0;
            const userVote = issue.userVotes?.[userId];
            
            // Generate a non-exact locality string
            const localityMatch = issue.location.address.match(/Sector \\d+|Phase \\d+|[A-Z][a-z]+ Nagar|[A-Z][a-z]+ Colony|[A-Z][a-z]+ Enclave/i);
            const locality = localityMatch ? localityMatch[0] : issue.location.ward || 'Local Area';

            return (
              <Card key={issue.id} className="flex flex-col hover:border-civic-primary/30 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl" title={issue.category}>{getCategoryIcon(issue.category)}</span>
                    <div>
                      <h3 className="font-bold text-civic-text leading-tight">{issue.title}</h3>
                      <p className="text-xs text-civic-muted flex items-center gap-1 mt-1">
                        <MapPin size={12} /> {locality} • {new Date(issue.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant={issue.status === 'RESOLVED' ? 'success' : issue.status === 'IN_PROGRESS' ? 'warning' : 'outline'} className="text-[10px]">
                    {issue.status.replace('_', ' ')}
                  </Badge>
                </div>
                
                <p className="text-sm text-civic-muted line-clamp-2 mb-4 flex-1">
                  {issue.description}
                </p>
                
                <div className="flex items-center justify-between pt-4 border-t border-brand-100">
                  <div className="flex items-center gap-1 bg-brand-50 rounded-full p-1 border border-brand-200">
                    <button 
                      onClick={() => voteIssue(issue.id, userVote === 'up' ? null : 'up')}
                      className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-colors", userVote === 'up' ? "bg-civic-primary text-white" : "hover:bg-brand-100 text-civic-text")}
                    >
                      <ThumbsUp size={14} className={userVote === 'up' ? "fill-white" : ""} /> {upvotes}
                    </button>
                    <div className="w-px h-4 bg-brand-200"></div>
                    <button 
                      onClick={() => voteIssue(issue.id, userVote === 'down' ? null : 'down')}
                      className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-colors", userVote === 'down' ? "bg-civic-danger text-white" : "hover:bg-brand-100 text-civic-text")}
                    >
                      <ThumbsDown size={14} className={userVote === 'down' ? "fill-white" : ""} /> {downvotes}
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {score >= 10 && (
                      <div className="hidden sm:flex items-center gap-1 text-[10px] font-bold text-brand-500 uppercase tracking-wider bg-brand-100 px-2 py-1 rounded-md">
                        <Flame size={12} className="text-brand-500" />
                        {supportPercent}% Support
                      </div>
                    )}
                    <Link to={\`/issue/\${issue.id}\`}>
                      <Button variant="outline" size="sm" className="text-xs h-8">View Details</Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="h-[600px] bg-white rounded-xl shadow-sm border border-brand-200 overflow-hidden relative">
           <MapContainer center={[30.7333, 76.7794]} zoom={12} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
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
                      <span className="text-lg">{getCategoryIcon(issue.category)}</span>
                      <h4 className="font-bold text-sm text-civic-text">{issue.title}</h4>
                    </div>
                    <div className="flex justify-between items-center text-xs mb-3 border-y border-brand-100 py-2">
                      <div>
                        <span className="text-civic-muted font-semibold block">Score</span>
                        <span className="font-bold text-civic-primary">{(issue.upvotes || 0) - (issue.downvotes || 0)}</span>
                      </div>
                      <div>
                        <span className="text-civic-muted font-semibold block">Upvotes</span>
                        <span className="font-bold text-brand-500">{issue.upvotes || 0}</span>
                      </div>
                      <div>
                        <span className="text-civic-muted font-semibold block">Status</span>
                        <span className={cn("font-bold", issue.status === 'RESOLVED' ? "text-green-500" : "text-amber-500")}>{issue.status.replace('_', ' ')}</span>
                      </div>
                    </div>
                    <Link to={\`/issue/\${issue.id}\`} className="block w-full">
                      <Button size="sm" className="w-full">View Community Discussion</Button>
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
