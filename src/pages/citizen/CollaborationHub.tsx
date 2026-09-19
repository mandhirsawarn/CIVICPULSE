import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Lightbulb, TrendingUp, Award, MapPin, AlertTriangle, ArrowRight, BookOpen, CheckCircle } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { cn } from '../../utils/cn';

const CollaborationHub = () => {
  const { challenges } = useStore();
  const [activeTab, setActiveTab] = useState<'University' | 'Industry' | 'Community'>('University');

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div className="max-w-5xl mx-auto py-4 md:py-8 space-y-8" variants={containerVariants} initial="hidden" animate="show">
      <motion.div variants={itemVariants}>
        <PageHeader 
          title="Collaboration Hub" 
          description="Partnering with universities, industry, and the community to solve complex civic challenges." 
          action={
            <Button className="flex items-center gap-2">
              <Lightbulb size={18} /> Propose Solution
            </Button>
          }
        />
      </motion.div>

      {/* Intro Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-brand-50 border-brand-200 py-6 text-center">
          <div className="flex justify-center mb-3 text-civic-primary"><BookOpen size={28} /></div>
          <div className="text-3xl font-bold text-civic-text mb-1">12</div>
          <div className="text-xs font-semibold text-civic-muted uppercase tracking-wider">Active Challenges</div>
        </Card>
        <Card className="bg-brand-50 border-brand-200 py-6 text-center">
          <div className="flex justify-center mb-3 text-civic-accent"><Users size={28} /></div>
          <div className="text-3xl font-bold text-civic-text mb-1">5</div>
          <div className="text-xs font-semibold text-civic-muted uppercase tracking-wider">University Partners</div>
        </Card>
        <Card className="bg-brand-50 border-brand-200 py-6 text-center">
          <div className="flex justify-center mb-3 text-civic-warning"><TrendingUp size={28} /></div>
          <div className="text-3xl font-bold text-civic-text mb-1">24</div>
          <div className="text-xs font-semibold text-civic-muted uppercase tracking-wider">Submitted Proposals</div>
        </Card>
        <Card className="bg-brand-50 border-brand-200 py-6 text-center">
          <div className="flex justify-center mb-3 text-civic-secondary"><CheckCircle size={28} /></div>
          <div className="text-3xl font-bold text-civic-text mb-1">3</div>
          <div className="text-xs font-semibold text-civic-muted uppercase tracking-wider">Solutions Deployed</div>
        </Card>
      </motion.div>

      {/* Active Challenges */}
      <motion.div variants={itemVariants} className="mt-12">
        <h2 className="text-2xl font-bold text-civic-text mb-6">Open Civic Challenges</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {challenges.map(challenge => (
            <Card key={challenge.id} className="flex flex-col h-full hover:shadow-md transition-shadow group">
              <div className="flex justify-between items-start mb-4">
                <Badge variant={challenge.severity === 'CRITICAL' ? 'danger' : 'warning'}>
                  {challenge.severity} PRIORITY
                </Badge>
                <div className="flex items-center gap-1.5 text-sm font-bold text-civic-primary bg-brand-100 px-3 py-1 rounded-full">
                  <Award size={16} /> {challenge.rewardPoints} pts
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-civic-text mb-3">{challenge.title}</h3>
              <p className="text-sm text-civic-muted mb-6 flex-1 line-clamp-3 leading-relaxed">
                {challenge.description}
              </p>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-brand-100 mt-auto">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center text-xs font-medium text-civic-muted gap-2">
                    <MapPin size={14} className="text-brand-400" /> {challenge.location}
                  </div>
                  <div className="flex items-center text-xs font-medium text-civic-muted gap-2">
                    <AlertTriangle size={14} className="text-brand-400" /> {challenge.proposalsCount} Active Proposals
                  </div>
                </div>
                <Button variant="outline" size="sm" className="group-hover:bg-civic-primary group-hover:text-white group-hover:border-civic-primary transition-colors">
                  View Challenge <ArrowRight size={16} className="ml-1" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* Proposals Workspace */}
      <motion.div variants={itemVariants} className="mt-12">
        <Card className="p-0 overflow-hidden">
          <div className="bg-brand-50 border-b border-brand-200 p-4 md:px-6">
            <h2 className="text-lg font-bold text-civic-text mb-4">Explore Solutions</h2>
            <div className="flex gap-2 overflow-x-auto hide-scrollbar">
              {['University', 'Industry', 'Community'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap",
                    activeTab === tab
                      ? "bg-white text-civic-primary shadow-sm border border-brand-200"
                      : "text-civic-muted hover:bg-brand-100"
                  )}
                >
                  {tab} Solutions
                </button>
              ))}
            </div>
          </div>
          
          <div className="p-4 md:p-6 bg-white">
            {activeTab === 'University' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-brand-200 hover:border-civic-primary transition-colors">
                  <div className="w-16 h-16 rounded-xl bg-brand-100 flex items-center justify-center text-civic-primary flex-shrink-0">
                    <BookOpen size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-civic-text">IoT Drainage Sensor Network</h4>
                      <Badge variant="info">In Review</Badge>
                    </div>
                    <p className="text-xs font-semibold text-brand-500 mb-2">Delhi Technological University (DTU) • Prof. Sharma's Lab</p>
                    <p className="text-sm text-civic-muted line-clamp-2">
                      A proposal to install low-cost IoT water level sensors in primary drains around Chandni Chowk to predict and prevent waterlogging before it hits the streets.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'Industry' && (
              <div className="space-y-4">
                 <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-brand-200 hover:border-civic-primary transition-colors">
                  <div className="w-16 h-16 rounded-xl bg-civic-secondary/10 flex items-center justify-center text-civic-secondary flex-shrink-0">
                    <TrendingUp size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-civic-text">AI Waste Route Optimization</h4>
                      <Badge variant="success">Approved</Badge>
                    </div>
                    <p className="text-xs font-semibold text-brand-500 mb-2">TechCorp Logistics India</p>
                    <p className="text-sm text-civic-muted line-clamp-2">
                      Implementing computer vision models on garbage collection trucks to map bin fill levels dynamically and optimize daily collection routes.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'Community' && (
              <div className="py-12 text-center text-civic-muted flex flex-col items-center">
                <Users size={48} className="mb-4 text-brand-300" />
                <h4 className="text-lg font-bold text-civic-text mb-2">Community Ideation Phase</h4>
                <p className="text-sm max-w-sm mb-6">Local community brainstorming sessions are scheduled for next week. Ideas will be posted here.</p>
                <Button variant="outline">Join Ideation Session</Button>
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default CollaborationHub;
