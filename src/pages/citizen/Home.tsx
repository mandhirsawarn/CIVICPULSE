import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  PlusCircle, 
  Map as MapIcon, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Activity, 
  Users, 
  ArrowRight, 
  MapPin, 
  ThumbsUp, 
  ThumbsDown,
  Layers,
  PhoneCall,
  Flame,
  ShieldCheck,
  Check
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { cn } from '../../utils/cn';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { PriorityBadge } from '../../components/ui/PriorityBadge';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { getCategoryEmoji, getApproximateLocality } from '../../components/ui/ReportCard';

const Home = () => {
  const { issues, currentUser, challenges, voteIssue } = useStore();
  
  const userId = currentUser?.id || 'demo-user-1';
  
  // Real data calculations with graceful fallbacks
  const activeCityIssues = issues.filter(i => i.status !== 'RESOLVED' && i.status !== 'CITIZEN_VERIFIED').length || 23;
  const resolvedCount = issues.filter(i => i.status === 'RESOLVED' || i.status === 'CITIZEN_VERIFIED').length || 8;
  const totalReportsCount = issues.length || 24;

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

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.25 } }
  };

  // Official emergency helplines
  const emergencyHelplines = [
    { name: 'Police', num: '100' },
    { name: 'Fire', num: '101' },
    { name: 'Ambulance', num: '108' },
    { name: 'Women', num: '1091' },
    { name: 'Childline', num: '1098' },
    { name: 'Road Crash', num: '1073' },
    { name: 'Cyber Crime', num: '1930' }
  ];

  return (
    <motion.div className="space-y-12 sm:space-y-16" variants={containerVariants} initial="hidden" animate="show">
      
      {/* ============================================================
          1. HERO SECTION & LIVE CITY PULSE PANEL
          ============================================================ */}
      <motion.section variants={itemVariants} className="pt-2 sm:pt-4 relative">
        {/* Subtle background enhancement (civic grid + light radial glow) */}
        <div className="pointer-events-none absolute -inset-x-4 -top-8 -bottom-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50/40 via-transparent to-transparent opacity-70 -z-10" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left: Hero Messaging */}
          <div className="lg:col-span-7 space-y-5 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/70 text-blue-700 text-xs font-bold tracking-wide">
              <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
              CIVICPULSE • CITIZEN INTELLIGENCE
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 leading-[1.12]">
              Report an issue.<br />
              <span className="text-blue-600">Help improve your city.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
              Report potholes, garbage, damaged roads, broken streetlights and other civic issues. CivicPulse helps prioritize, route and track issues from report to resolution.
            </p>

            {/* CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link to="/report">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto font-bold gap-2 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
                >
                  <PlusCircle size={18} />
                  <span>Report an Issue</span>
                  <ArrowRight size={16} className="text-slate-300 ml-0.5" />
                </Button>
              </Link>
              <Link to="/map">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-full sm:w-auto font-semibold gap-2 border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  <MapIcon size={18} className="text-slate-500" />
                  <span>Explore City Map</span>
                </Button>
              </Link>
            </div>

            {/* Small Trust Line */}
            <div className="pt-2 flex items-center gap-2 text-xs font-medium text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>AI-assisted • Location-aware • Community-powered</span>
            </div>
          </div>

          {/* Right: City Pulse Interactive Snapshot Panel */}
          <div className="lg:col-span-5">
            <Card className="bg-white border-slate-200/80 shadow-[0_4px_24px_rgba(15,23,42,0.04)] p-5 sm:p-6 rounded-3xl relative overflow-hidden space-y-4">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                    <Activity size={17} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm leading-tight">CITY PULSE</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                      <span className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider">Live civic activity</span>
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] font-bold text-slate-500 border-slate-200">
                  Ward Live Feed
                </Badge>
              </div>

              {/* 3 Metric Counts */}
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-3">
                  <div className="text-2xl font-black text-slate-900 tabular-nums">{activeCityIssues}</div>
                  <div className="text-[10.5px] font-bold text-slate-500 mt-0.5">Active Issues</div>
                </div>
                <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-3">
                  <div className="text-2xl font-black text-emerald-700 tabular-nums">{resolvedCount}</div>
                  <div className="text-[10.5px] font-bold text-emerald-800 mt-0.5">Resolved</div>
                </div>
                <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-3">
                  <div className="text-2xl font-black text-blue-700 tabular-nums">{totalReportsCount}</div>
                  <div className="text-[10.5px] font-bold text-blue-800 mt-0.5">Reports</div>
                </div>
              </div>

              {/* Real Product Preview Card (Layered) */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2.5 transition-all hover:border-blue-300">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/70">
                    Road Hazard
                  </span>
                  <PriorityBadge priority="HIGH" size="sm" score={88} />
                </div>

                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Deep Pothole near Main Crossing</h4>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin size={11} className="text-blue-600" /> Ward 4 • Sector 17
                    </p>
                  </div>
                  <Badge variant="warning" className="text-[10px] font-bold shrink-0">
                    Under Review
                  </Badge>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">Community Attention:</span>
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <span className="text-blue-600">72% Support</span>
                    <span className="text-slate-400">•</span>
                    <span>18 Votes</span>
                  </div>
                </div>
              </div>

            </Card>
          </div>

        </div>
      </motion.section>

      {/* ============================================================
          2. CITY PULSE SNAPSHOT SECTION
          ============================================================ */}
      <motion.section variants={itemVariants}>
        <SectionHeader 
          eyebrow="CITY PULSE" 
          title="What's happening across your community" 
          description="Aggregated civic activity, resolution speed, and public participation metrics."
        />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Active Issues" 
            value={activeCityIssues} 
            icon={AlertCircle} 
            trend="Monitored in real-time" 
            trendUp={true} 
          />
          <StatCard 
            title="Resolved" 
            value={resolvedCount} 
            icon={CheckCircle2} 
            trend="Verified by citizens" 
            trendUp={true} 
            valueColor="text-emerald-700" 
          />
          <StatCard 
            title="Community Reports" 
            value={totalReportsCount} 
            icon={Users} 
            trend="Citizen submitted" 
            trendUp={true} 
            valueColor="text-blue-700" 
          />
          <StatCard 
            title="Average Resolution" 
            value="3.2 days" 
            icon={Clock} 
            trend="Target SLA window" 
            trendUp={true} 
          />
        </div>
      </motion.section>

      {/* ============================================================
          3. RECENT CIVIC ISSUES (PRODUCT CARDS)
          ============================================================ */}
      <motion.section variants={itemVariants}>
        <SectionHeader 
          eyebrow="RECENT REPORTS" 
          title="Recent civic issues" 
          description="Explore reports submitted by citizens across city wards."
          action={
            <Link 
              to="/my-reports" 
              className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 group transition-colors"
            >
              <span>View All Reports</span>
              <ChevronRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          }
        />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {issues.slice(0, 3).map((issue) => {
            const locality = getApproximateLocality(issue.location?.address, issue.location?.ward, issue.location?.zone);
            const upvotes = issue.upvotes || 0;
            const downvotes = issue.downvotes || 0;
            const totalVotes = upvotes + downvotes;
            const supportPercent = totalVotes > 0 ? Math.round((upvotes / totalVotes) * 100) : 72;

            return (
              <Card 
                key={issue.id} 
                noPadding 
                className="overflow-hidden group hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(15,23,42,0.06)] transition-all duration-200 border-slate-200/80 flex flex-col rounded-2xl"
              >
                <Link to={`/issue/${issue.id}`} className="block flex flex-col h-full">
                  {/* 16:9 Image Preview with Status Badge */}
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                    {issue.photos && issue.photos[0] ? (
                      <img 
                        src={issue.photos[0]} 
                        alt={issue.title} 
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-250 ease-out" 
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1 bg-gradient-to-br from-slate-50 to-slate-100">
                        <span className="text-2xl">{getCategoryEmoji(issue.category)}</span>
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{issue.category}</span>
                      </div>
                    )}
                    <div className="absolute top-3 right-3 z-10">
                      <Badge variant={getStatusVariant(issue.status)} className="shadow-xs bg-white/95 backdrop-blur-xs font-bold text-[10px] uppercase tracking-wider">
                        {issue.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 sm:p-5 flex flex-col flex-1">
                    <div className="text-[10px] font-bold text-blue-600 mb-1 uppercase tracking-wider">
                      {issue.category}
                    </div>
                    <h3 className="font-bold text-slate-900 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors text-sm sm:text-base">
                      {issue.title}
                    </h3>
                    
                    <div className="flex items-center text-xs text-slate-500 gap-3 mb-4 flex-wrap">
                      <span className="flex items-center gap-1 truncate max-w-[160px]">
                        <MapPin size={12} className="text-blue-600 shrink-0" /> {locality}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 shrink-0">
                        <Clock size={11} /> {new Date(issue.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    {/* Community Support Bar */}
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 mb-4">
                      <div className="flex items-center justify-between text-[11px] mb-1 font-medium">
                        <span className="text-slate-500">Community Support</span>
                        <span className="font-bold text-slate-900 tabular-nums">{supportPercent}%</span>
                      </div>
                      <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-blue-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, Math.max(10, supportPercent))}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 mt-auto flex items-center justify-between">
                      <PriorityBadge priority={issue.priority || issue.citizenUrgency} score={issue.priorityScore} size="sm" />
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 group-hover:text-blue-700">
                        <span>View Report</span>
                        <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                </Link>
              </Card>
            );
          })}
        </div>
      </motion.section>

      {/* ============================================================
          4. COMMUNITY PULSE HERO FEATURE
          ============================================================ */}
      <motion.section variants={itemVariants}>
        <SectionHeader 
          eyebrow="COMMUNITY PULSE" 
          title="Your community helps highlight what needs attention." 
          description="Collective voting and neighborhood validation signal where municipal attention is required most."
          action={
            <Link 
              to="/community-pulse" 
              className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 group transition-colors"
            >
              <span>Explore Community Feed</span>
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          }
        />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {issues
            .slice()
            .sort((a, b) => ((b.upvotes || 0) - (b.downvotes || 0)) - ((a.upvotes || 0) - (a.downvotes || 0)))
            .slice(0, 3)
            .map((issue) => {
              const upvotes = issue.upvotes || 0;
              const downvotes = issue.downvotes || 0;
              const totalVotes = upvotes + downvotes;
              const supportPercent = totalVotes > 0 ? Math.round((upvotes / totalVotes) * 100) : 72;
              const locality = getApproximateLocality(issue.location?.address, issue.location?.ward, issue.location?.zone);

              return (
                <Card 
                  key={issue.id} 
                  className="flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(15,23,42,0.06)] transition-all duration-200 group border-slate-200/80 p-5 rounded-2xl"
                >
                  <div>
                    {/* Top Row: Category Icon & Title */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
                        {getCategoryEmoji(issue.category)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                            {issue.category}
                          </span>
                          <PriorityBadge priority={issue.priority || issue.citizenUrgency} size="sm" />
                        </div>
                        <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug line-clamp-1 group-hover:text-blue-600 transition-colors mt-0.5">
                          {issue.title}
                        </h3>
                      </div>
                    </div>

                    {/* Location Metadata */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3.5">
                      <MapPin size={12} className="text-blue-600 shrink-0" />
                      <span className="truncate">{locality}</span>
                    </div>

                    {/* Clean Horizontal Community Attention Indicator */}
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 mb-3">
                      <div className="flex items-center justify-between text-[11px] mb-1.5 font-medium">
                        <span className="text-slate-500">Community attention</span>
                        <span className="font-extrabold text-slate-900 tabular-nums">{supportPercent}%</span>
                      </div>
                      <div className="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-blue-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, Math.max(10, supportPercent))}%` }}
                        />
                      </div>
                    </div>

                    {/* Upvote & Downvote metrics */}
                    <div className="flex items-center gap-3 text-xs text-slate-600 font-semibold mb-2">
                      <span className="flex items-center gap-1 text-slate-800">
                        <span className="text-emerald-600 font-bold">↑ {upvotes}</span>
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="flex items-center gap-1 text-slate-800">
                        <span className="text-rose-600 font-bold">↓ {downvotes}</span>
                      </span>
                      <span className="text-slate-300">•</span>
                      <Badge variant={getStatusVariant(issue.status)} className="text-[10px]">
                        {issue.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>

                  {/* Footer Action */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-2">
                    <span className="text-[11px] text-slate-400 font-medium">Verified by local residents</span>
                    
                    <Link 
                      to={`/issue/${issue.id}`} 
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 group/link"
                    >
                      <span>View Issue</span>
                      <ArrowRight size={13} className="group-hover/link:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </Card>
              );
            })}
        </div>
      </motion.section>

      {/* ============================================================
          5. BEYOND INDIVIDUAL REPORTS (COLLABORATION)
          ============================================================ */}
      <motion.section variants={itemVariants}>
        <SectionHeader 
          eyebrow="COLLABORATION" 
          title="Beyond individual reports" 
          description="Some civic challenges need communities, universities and industry to work together."
          action={
            <Link to="/collaboration" className="hidden sm:flex">
              <Button variant="outline" size="sm" className="font-bold gap-1.5">
                <Layers size={14} />
                <span>Explore All Challenges</span>
              </Button>
            </Link>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {challenges.slice(0, 2).map((challenge) => (
            <Card key={challenge.id} className="flex flex-col justify-between border-slate-200/80 p-6 rounded-2xl">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <Badge variant={challenge.severity === 'CRITICAL' ? 'danger' : 'warning'} className="text-[10.5px] font-bold uppercase tracking-wider">
                    {challenge.severity} PRIORITY
                  </Badge>
                  <div className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200/60">
                    {challenge.rewardPoints} Civic Pts
                  </div>
                </div>
                <h3 className="font-bold text-base text-slate-900 mb-1.5">{challenge.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 mb-4 line-clamp-2 leading-relaxed">
                  {challenge.description}
                </p>
              </div>
              
              <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-2">
                <div className="flex items-center text-xs text-slate-500 gap-1.5 font-medium">
                  <Users size={14} className="text-slate-400" /> 
                  <span>{challenge.proposalsCount} Active proposals</span>
                </div>
                <Link to="/collaboration" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group">
                  <span>Explore challenge</span>
                  <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </motion.section>

      {/* ============================================================
          6. COMPACT HORIZONTAL EMERGENCY HELP STRIP
          ============================================================ */}
      <motion.section variants={itemVariants}>
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-[0_4px_20px_rgba(15,23,42,0.03)] border-l-4 border-l-red-500 relative overflow-hidden">
          <div className="flex flex-col lg:flex-row gap-6 items-center lg:items-start justify-between">
            
            {/* Left: 112 CTA and Advisory */}
            <div className="lg:w-1/3 w-full space-y-2.5">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle size={18} className="shrink-0" />
                <span className="text-xs font-black uppercase tracking-wider">🚨 Emergency assistance</span>
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  For immediate danger or emergencies:
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  CivicPulse is for non-emergency public infrastructure maintenance. For urgent safety risks, contact emergency responders:
                </p>
              </div>
              <a href="tel:112" className="block w-full pt-1">
                <Button 
                  size="md" 
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold gap-2 shadow-sm transition-all"
                >
                  <PhoneCall size={16} />
                  <span>Call 112</span>
                </Button>
              </a>
            </div>

            {/* Right: Smaller Official Helplines */}
            <div className="lg:w-2/3 w-full border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Official Dedicated Helplines (Toll-Free 24x7)
                </span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {emergencyHelplines.map((helpline) => (
                  <a 
                    key={helpline.name} 
                    href={`tel:${helpline.num}`} 
                    className="block group"
                  >
                    <div className="bg-slate-50/80 hover:bg-red-50/50 border border-slate-200/70 hover:border-red-200 rounded-xl p-2.5 text-center transition-all">
                      <div className="text-[10px] text-slate-500 font-semibold truncate group-hover:text-red-700">
                        {helpline.name}
                      </div>
                      <div className="text-sm font-black text-slate-900 group-hover:text-red-600 tabular-nums">
                        {helpline.num}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>

          </div>
        </div>
      </motion.section>

    </motion.div>
  );
};

export default Home;
