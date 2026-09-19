import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Lightbulb, TrendingUp, Award, MapPin, AlertTriangle, ArrowRight, BookOpen, CheckCircle, Sparkles } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Badge } from '../../components/ui/Badge';
import { cn } from '../../utils/cn';

const CollaborationHub = () => {
  const { challenges } = useStore();
  const [activeTab, setActiveTab] = useState<'University' | 'Industry' | 'Community'>('University');

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div className="max-w-6xl mx-auto py-4 md:py-6 space-y-8" variants={containerVariants} initial="hidden" animate="show">
      <motion.div variants={itemVariants}>
        <SectionHeader 
          eyebrow="COLLABORATION HUB"
          title="Civic Innovation & Research Partnerships" 
          description="Partnering with universities, research institutions, and community builders to engineer scalable civic solutions." 
          action={
            <Button className="flex items-center gap-2 bg-slate-900 text-white hover:bg-slate-800 shadow-sm font-semibold rounded-xl">
              <Lightbulb size={17} className="text-amber-400" /> Propose Solution
            </Button>
          }
        />
      </motion.div>

      {/* Intro Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-[0_4px_20px_rgba(15,23,42,0.03)] text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 border border-blue-100 text-blue-600 mb-3">
            <BookOpen size={22} />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums mb-0.5">12</div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Challenges</div>
        </Card>

        <Card className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-[0_4px_20px_rgba(15,23,42,0.03)] text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 mb-3">
            <Users size={22} />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums mb-0.5">5</div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">University Partners</div>
        </Card>

        <Card className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-[0_4px_20px_rgba(15,23,42,0.03)] text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 border border-amber-100 text-amber-600 mb-3">
            <TrendingUp size={22} />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums mb-0.5">24</div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Submitted Proposals</div>
        </Card>

        <Card className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-[0_4px_20px_rgba(15,23,42,0.03)] text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 border border-purple-100 text-purple-600 mb-3">
            <CheckCircle size={22} />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums mb-0.5">3</div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Solutions Deployed</div>
        </Card>
      </motion.div>

      {/* Active Challenges */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Open Civic Challenges</h2>
            <p className="text-xs text-slate-500 mt-0.5">High-impact issues open for cross-sector research and pilot deployments</p>
          </div>
          <Badge variant="outline" className="text-xs font-semibold text-slate-600 border-slate-200">
            {challenges.length} Open Requests
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {challenges.map(challenge => (
            <Card key={challenge.id} className="p-6 rounded-2xl border border-slate-200/80 bg-white shadow-[0_4px_20px_rgba(15,23,42,0.03)] hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between group">
              <div>
                <div className="flex justify-between items-start gap-3 mb-3">
                  <Badge variant={challenge.severity === 'CRITICAL' ? 'danger' : 'warning'} className="text-[11px] font-bold uppercase tracking-wider">
                    {challenge.severity} PRIORITY
                  </Badge>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                    <Award size={15} className="text-amber-500" /> {challenge.rewardPoints} Civic Pts
                  </div>
                </div>
                
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-2">
                  {challenge.title}
                </h3>
                <p className="text-sm text-slate-600 mb-6 leading-relaxed line-clamp-3">
                  {challenge.description}
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100 mt-auto">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center text-xs font-medium text-slate-500 gap-1.5">
                    <MapPin size={13} className="text-slate-400" /> {challenge.location}
                  </div>
                  <div className="flex items-center text-xs font-medium text-slate-500 gap-1.5">
                    <AlertTriangle size={13} className="text-amber-500" /> {challenge.proposalsCount} Active Proposals
                  </div>
                </div>
                <Button variant="outline" size="sm" className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all font-semibold">
                  View Challenge <ArrowRight size={14} className="ml-1" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* Proposals Workspace */}
      <motion.div variants={itemVariants} className="space-y-4">
        <Card className="p-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_4px_20px_rgba(15,23,42,0.03)]">
          <div className="bg-slate-50/70 border-b border-slate-100 p-4 md:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Explore Partner Solutions</h3>
              <p className="text-xs text-slate-500 mt-0.5">Filter submitted research papers, technical blueprints, and pilot projects</p>
            </div>
            
            <div className="flex gap-1.5 bg-slate-200/60 p-1 rounded-xl">
              {(['University', 'Industry', 'Community'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
                    activeTab === tab
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                  )}
                >
                  {tab} Solutions
                </button>
              ))}
            </div>
          </div>
          
          <div className="p-5 md:p-6 bg-white">
            {activeTab === 'University' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 p-5 rounded-2xl border border-slate-200/80 hover:border-blue-300 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <BookOpen size={22} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <h4 className="font-bold text-slate-900 text-base">IoT Drainage Sensor Network</h4>
                      <Badge variant="info" className="text-xs font-semibold">In Review</Badge>
                    </div>
                    <p className="text-xs font-semibold text-blue-600 mb-2">Delhi Technological University (DTU) • Prof. Sharma's Lab</p>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      A proposal to install low-cost IoT water level sensors in primary drains around Chandni Chowk to predict and prevent waterlogging before it hits the streets.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'Industry' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 p-5 rounded-2xl border border-slate-200/80 hover:border-blue-300 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                    <TrendingUp size={22} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <h4 className="font-bold text-slate-900 text-base">AI Waste Route Optimization</h4>
                      <Badge variant="success" className="text-xs font-semibold">Approved</Badge>
                    </div>
                    <p className="text-xs font-semibold text-purple-600 mb-2">TechCorp Logistics India</p>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Implementing computer vision models on garbage collection trucks to map bin fill levels dynamically and optimize daily collection routes.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'Community' && (
              <div className="py-12 text-center text-slate-500 flex flex-col items-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-3">
                  <Users size={24} />
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-1">Community Ideation Phase</h4>
                <p className="text-xs text-slate-500 max-w-sm mb-5 leading-relaxed">Local community brainstorming sessions are scheduled for next week. Ideas will be posted here.</p>
                <Button variant="outline" className="rounded-xl font-semibold text-xs">Join Ideation Session</Button>
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default CollaborationHub;
