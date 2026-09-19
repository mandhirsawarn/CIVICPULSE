import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, ThumbsUp, ThumbsDown, ArrowRight, Flame } from 'lucide-react';
import { Issue } from '../../types';
import { Badge } from './Badge';
import { PriorityBadge } from './PriorityBadge';
import { Card } from './Card';
import { cn } from '../../utils/cn';

interface ReportCardProps {
  issue: Issue;
  currentUserId?: string;
  onVote?: (issueId: string, type: 'up' | 'down') => void;
  showImage?: boolean;
  className?: string;
}

export const getCategoryEmoji = (category: string) => {
  switch (category) {
    case 'Pothole':
    case 'Road Damage': return '🛣️';
    case 'Garbage':
    case 'Illegal Dumping': return '🗑️';
    case 'Streetlight': return '💡';
    case 'Waterlogging':
    case 'Drainage': return '🌊';
    case 'Water Leakage': return '💧';
    case 'Traffic Sign': return '🚦';
    case 'Broken Footpath': return '🚶';
    case 'Public Safety': return '⚠️';
    default: return '📍';
  }
};

export const getStatusVariant = (status: string) => {
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

/**
 * Extracts privacy-safe approximate locality from address or ward/zone
 */
export const getApproximateLocality = (address: string, ward?: string, zone?: string): string => {
  if (!address) return ward || 'Local Area';
  const match = address.match(/(Sector\s+\d+|Phase\s+\d+|[A-Za-z0-9\s]+(?:Nagar|Colony|Enclave|Model Town|Township|Tahsil))/i);
  if (match) {
    const locality = match[0].trim();
    const cityMatch = address.match(/\b(Kharar|Mohali|Chandigarh|Ludhiana|Jalandhar|Rourkela|Delhi|Mumbai|Bangalore)\b/i);
    if (cityMatch && !locality.toLowerCase().includes(cityMatch[0].toLowerCase())) {
      return `${locality}, ${cityMatch[0]}`;
    }
    return locality;
  }
  const parts = address.split(',');
  if (parts.length >= 2) {
    return `${parts[0].trim()}, ${parts[1].trim()}`;
  }
  return parts[0]?.trim() || ward || 'Local Area';
};

export const ReportCard: React.FC<ReportCardProps> = ({
  issue,
  currentUserId,
  onVote,
  showImage = false,
  className
}) => {
  const upvotes = issue.upvotes || 0;
  const downvotes = issue.downvotes || 0;
  const totalVotes = upvotes + downvotes;
  const supportPercent = totalVotes > 0 ? Math.round((upvotes / totalVotes) * 100) : 0;
  const userVote = currentUserId && issue.userVotes ? issue.userVotes[currentUserId] : undefined;
  const locality = getApproximateLocality(issue.location?.address, issue.location?.ward, issue.location?.zone);

  return (
    <Card 
      noPadding 
      className={cn(
        "flex flex-col h-full overflow-hidden bg-white border border-slate-200/80 shadow-[0_4px_20px_rgba(15,23,42,0.03)] hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(15,23,42,0.07)] hover:border-slate-300 transition-all duration-200 group", 
        className
      )}
    >
      {/* Optional 16:9 Image Preview with Status Badge */}
      {showImage && (
        <div className="relative aspect-video w-full overflow-hidden bg-slate-100 border-b border-slate-100">
          {issue.photos && issue.photos[0] ? (
            <img 
              src={issue.photos[0]} 
              alt={issue.title} 
              className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]" 
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1 bg-gradient-to-br from-slate-50 to-slate-100">
              <span className="text-2xl">{getCategoryEmoji(issue.category)}</span>
              <span className="text-[11px] font-medium text-slate-400">Civic Notice</span>
            </div>
          )}
          <div className="absolute top-3 right-3 z-10">
            <Badge variant={getStatusVariant(issue.status)} className="shadow-xs bg-white/95 backdrop-blur-xs font-bold text-[10px] uppercase tracking-wider">
              {issue.status.replace('_', ' ')}
            </Badge>
          </div>
        </div>
      )}

      <div className="p-5 flex flex-col flex-1">
        {/* Header with Category & Title */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-start gap-2.5 min-w-0 flex-1">
            {!showImage && (
              <div className="h-9 w-9 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-center text-base shrink-0 group-hover:scale-105 transition-transform">
                {getCategoryEmoji(issue.category)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                  {issue.category}
                </span>
                {!showImage && (
                  <Badge variant={getStatusVariant(issue.status)} className="text-[10px] font-bold uppercase tracking-wider">
                    {issue.status.replace('_', ' ')}
                  </Badge>
                )}
              </div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug line-clamp-1 group-hover:text-blue-600 transition-colors">
                {issue.title}
              </h3>
            </div>
          </div>

          <div className="shrink-0">
            <PriorityBadge priority={issue.priority || issue.citizenUrgency} score={issue.priorityScore} size="sm" />
          </div>
        </div>

        {/* Location and Date metadata */}
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-3 flex-wrap">
          <span className="flex items-center gap-1 font-medium truncate max-w-[180px]">
            <MapPin size={12} className="text-blue-600 shrink-0" /> {locality}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 shrink-0">
            <Clock size={11} /> {new Date(issue.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
          </span>
        </div>

        {/* Description Snippet */}
        <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 mb-4 leading-relaxed flex-1 font-normal">
          {issue.description || "No description provided."}
        </p>

        {/* Community Support Progress Indicator */}
        {totalVotes > 0 && (
          <div className="mb-3.5 bg-slate-50 border border-slate-100 rounded-xl p-2.5">
            <div className="flex items-center justify-between text-[11px] mb-1.5 font-medium">
              <span className="text-slate-500">Community Support</span>
              <span className="font-bold text-slate-800 tabular-nums">{supportPercent}%</span>
            </div>
            <div className="w-full bg-slate-200/70 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-blue-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, supportPercent))}%` }}
              />
            </div>
          </div>
        )}

        {/* Footer: Voting & Action Button */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-50 border border-slate-200/80 rounded-full p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => onVote?.(issue.id, 'up')}
                disabled={!onVote}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer",
                  userVote === 'up' ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-slate-200/60",
                  !onVote && "cursor-default"
                )}
                title={onVote ? "Support this issue" : undefined}
              >
                <ThumbsUp size={12} className={userVote === 'up' ? "fill-white" : ""} />
                <span className="tabular-nums">{upvotes}</span>
              </button>
              <div className="w-px h-3 bg-slate-200" />
              <button
                type="button"
                onClick={() => onVote?.(issue.id, 'down')}
                disabled={!onVote}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer",
                  userVote === 'down' ? "bg-red-600 text-white" : "text-slate-700 hover:bg-slate-200/60",
                  !onVote && "cursor-default"
                )}
                title={onVote ? "Downvote" : undefined}
              >
                <ThumbsDown size={12} className={userVote === 'down' ? "fill-white" : ""} />
                <span className="tabular-nums">{downvotes}</span>
              </button>
            </div>
          </div>

          <Link
            to={`/issue/${issue.id}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors shrink-0 group/link"
          >
            <span>View Details</span>
            <ArrowRight size={13} className="group-hover/link:translate-x-0.5 transition-transform duration-150" />
          </Link>
        </div>
      </div>
    </Card>
  );
};

