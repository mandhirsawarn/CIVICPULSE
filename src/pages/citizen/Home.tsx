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
  BrainCircuit,
  ShieldCheck,
  Search
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { cn } from '../../utils/cn';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';

const Home = () => {
  const { cityPulseScore, issues, currentUser, challenges } = useStore();
  
  const userIssues = issues.filter(i => i.reporterId === currentUser?.id);
  const activeUserIssues = userIssues.filter(i => i.status !== 'RESOLVED' && i.status !== 'CITIZEN_VERIFIED');
  const resolvedUserIssues = userIssues.filter(i => i.status === 'RESOLVED' || i.status === 'CITIZEN_VERIFIED');
  
  // Total stats for the city pulse
  const activeCityIssues = issues.filter(i => i.status !== 'RESOLVED' && i.status !== 'CITIZEN_VERIFIED').length;
  const resolvedToday = issues.filter(i => i.status === 'RESOLVED' || i.status === 'CITIZEN_VERIFIED').length; // Mock data assumption

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

  const getStatusText = (status: string) => {
    return status.replace('_', ' ');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div className="space-y-12" variants={containerVariants} initial="hidden" animate="show">
      
      {/* Hero Section */}
      <motion.section variants={itemVariants} className="text-center py-10 md:py-16">
        <span className="text-civic-secondary font-bold tracking-wider text-xs uppercase mb-4 block">Civic Intelligence Platform</span>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-civic-text mb-6">
          Report what matters.<br />We'll help move it forward.
        </h1>
        <p className="text-lg text-civic-muted max-w-2xl mx-auto mb-10">
          Capture civic issues, understand their priority, and track resolution from report to verification.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/report" className="w-full sm:w-auto">
            <Button size="lg" className="w-full gap-2">
              <PlusCircle size={20} />
              Report an Issue
            </Button>
          </Link>
          <Link to="/map" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full gap-2">
              <MapIcon size={20} />
              Explore City Map
            </Button>
          </Link>
        </div>
      </motion.section>

      {/* EMERGENCY HELP SECTION */}
      <motion.section variants={itemVariants} className="bg-red-50 border border-red-100 rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
          <div className="md:w-1/3 text-center md:text-left">
            <h2 className="text-xl font-black text-red-700 flex items-center justify-center md:justify-start gap-2 mb-2">
              <AlertCircle size={24} className="animate-pulse" /> EMERGENCY HELP
            </h2>
            <p className="text-sm text-red-600 mb-4">
              Need immediate assistance? For emergencies, call 112 directly.
            </p>
            <a href="tel:112" className="inline-block w-full">
              <Button size="lg" className="w-full bg-red-600 hover:bg-red-700 text-white gap-2 border-0">
                📞 Call 112 (Integrated Emergency)
              </Button>
            </a>
          </div>
          
          <div className="md:w-2/3 w-full border-t border-red-200 md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6">
            <h3 className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-3">Official Helplines (Chandigarh / India)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { name: 'Police', num: '100' },
                { name: 'Fire', num: '101' },
                { name: 'Ambulance', num: '108' },
                { name: 'Women', num: '1091' },
                { name: 'Child', num: '1098' },
                { name: 'Road Crash', num: '1073' },
                { name: 'Cyber Crime', num: '1930' }
              ].map(contact => (
                <a key={contact.name} href={`tel:${contact.num}`} className="block">
                  <div className="bg-white border border-red-100 rounded-lg p-2 text-center hover:shadow-md transition-shadow cursor-pointer">
                    <div className="text-[10px] text-gray-500 font-bold truncate">{contact.name}</div>
                    <div className="text-sm font-black text-red-600">{contact.num}</div>
                  </div>
                </a>
              ))}
            </div>
            <p className="text-[10px] text-red-400 mt-3 text-center md:text-left">
              CivicPulse is for reporting non-emergency civic issues. For immediate danger, contact the appropriate emergency service directly.
            </p>
          </div>
        </div>
      </motion.section>

      {/* SECTION 1: City Pulse Overview */}
      <motion.section variants={itemVariants}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-civic-text">City Pulse Overview</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Active Issues" value={activeCityIssues} icon={AlertCircle} trend="-2% this week" trendUp={true} />
          <StatCard title="Resolved Today" value={resolvedToday} icon={CheckCircle2} trend="+15% vs yesterday" trendUp={true} />
          <StatCard title="Avg Resolution" value="3.2 days" icon={Clock} trend="-4 hours" trendUp={true} />
          <StatCard title="Community Reports" value={issues.length} icon={Users} trend="Top 10% active" trendUp={true} />
        </div>
      </motion.section>

      {/* SECTION 2: My Recent Reports */}
      <motion.section variants={itemVariants}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-civic-text">My Recent Reports</h2>
          <Link to="/my-reports" className="text-sm font-medium text-civic-secondary hover:text-civic-secondary/80 flex items-center gap-1">
            View All <ChevronRight size={16} />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {userIssues.slice(0, 3).map(issue => (
            <Card key={issue.id} noPadding className="overflow-hidden group hover:shadow-md transition-shadow">
              <Link to={`/issue/${issue.id}`} className="block">
                <div className="h-40 bg-brand-100 relative">
                  {issue.photos[0] ? (
                    <img src={issue.photos[0]} alt={issue.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-brand-400">
                      <MapIcon size={32} />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <Badge variant={getStatusVariant(issue.status)} className="shadow-sm bg-white/90 backdrop-blur-sm">
                      {getStatusText(issue.status)}
                    </Badge>
                  </div>
                </div>
                <div className="p-4">
                  <div className="text-xs font-semibold text-civic-secondary mb-1 uppercase tracking-wider">{issue.category}</div>
                  <h3 className="font-bold text-civic-text mb-2 line-clamp-1">{issue.title}</h3>
                  <div className="flex items-center text-xs text-civic-muted gap-4">
                    <span className="flex items-center gap-1"><MapIcon size={12} /> {issue.location.ward}</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {new Date(issue.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </Link>
            </Card>
          ))}

          {userIssues.length === 0 && (
            <div className="col-span-3">
              <Card className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-12 w-12 rounded-full bg-brand-100 flex items-center justify-center text-brand-500 mb-4">
                  <FileText size={24} />
                </div>
                <h3 className="text-lg font-bold text-civic-text mb-1">No reports yet</h3>
                <p className="text-sm text-civic-muted mb-4">You haven't reported any civic issues.</p>
                <Link to="/report">
                  <Button variant="outline" size="sm">Create your first report</Button>
                </Link>
              </Card>
            </div>
          )}
        </div>
      </motion.section>

      {/* SECTION 4: How CivicPulse works */}
      <motion.section variants={itemVariants} className="bg-white rounded-2xl border border-civic-border p-8 md:p-12 shadow-sm">
        <h2 className="text-2xl font-bold text-center text-civic-text mb-10">How CivicPulse works</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
          {/* Connector line for desktop */}
          <div className="hidden md:block absolute top-6 left-[12%] right-[12%] h-0.5 bg-brand-200 z-0"></div>
          
          {[
            { step: '01', title: 'Report', desc: 'Capture the issue with photo and location', icon: PlusCircle },
            { step: '02', title: 'AI Understands', desc: 'Auto-categorizes and assesses severity', icon: BrainCircuit },
            { step: '03', title: 'Authority Acts', desc: 'Routed to correct department for fix', icon: Activity },
            { step: '04', title: 'You Verify', desc: 'Confirm resolution to earn points', icon: ShieldCheck },
          ].map((item, idx) => (
            <div key={item.step} className="relative z-10 flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-civic-surface border-2 border-brand-200 flex items-center justify-center text-civic-secondary mb-4 shadow-sm">
                <item.icon size={20} />
              </div>
              <div className="text-xs font-bold text-civic-secondary mb-1">STEP {item.step}</div>
              <h3 className="font-bold text-civic-text mb-2">{item.title}</h3>
              <p className="text-sm text-civic-muted">{item.desc}</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* SECTION 5: Community Challenges */}
      <motion.section variants={itemVariants}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-civic-text">Collaborative Challenges</h2>
            <p className="text-sm text-civic-muted mt-1">Help solve larger civic challenges</p>
          </div>
          <Link to="/collaboration" className="hidden md:flex">
            <Button variant="outline" size="sm">Explore Challenges</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {challenges.slice(0, 2).map(challenge => (
            <Card key={challenge.id} className="flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <Badge variant={challenge.severity === 'CRITICAL' ? 'danger' : 'warning'}>
                  {challenge.severity} PRIORITY
                </Badge>
                <div className="text-sm font-semibold text-civic-primary">
                  {challenge.rewardPoints} pts
                </div>
              </div>
              <h3 className="font-bold text-lg text-civic-text mb-2">{challenge.title}</h3>
              <p className="text-sm text-civic-muted mb-6 flex-1 line-clamp-2">{challenge.description}</p>
              
              <div className="flex items-center justify-between border-t border-civic-border pt-4 mt-auto">
                <div className="flex items-center text-xs text-civic-muted gap-2">
                  <Users size={14} /> {challenge.proposalsCount} Proposals
                </div>
                <Link to="/collaboration" className="text-sm font-medium text-civic-secondary flex items-center gap-1 hover:underline">
                  View details <ArrowRight size={14} />
                </Link>
              </div>
            </Card>
          ))}
        </div>
        <div className="mt-4 md:hidden">
          <Link to="/collaboration" className="w-full">
            <Button variant="outline" className="w-full">Explore Challenges</Button>
          </Link>
        </div>
      </motion.section>
    </motion.div>
  );
};

// Fallback if FileText icon missing above
const FileText = ({ className, ...props }: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>
);

export default Home;
