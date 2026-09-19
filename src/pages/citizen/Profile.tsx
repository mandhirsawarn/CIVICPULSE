import React from 'react';
import { motion } from 'framer-motion';
import { Award, FileText, CheckCircle2, ShieldCheck, Settings, Bell, ChevronRight, LogOut, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

const Profile = () => {
  const { currentUser, issues, setCurrentUser } = useStore();
  const userIssues = issues.filter((i) => i.reporterId === currentUser?.id);
  const resolved = userIssues.filter((i) => i.status === 'RESOLVED' || i.status === 'CITIZEN_VERIFIED').length;

  const initials = (currentUser?.name ?? '?')
    .split(' ')
    .map((n) => n[0])
    .join('');

  const [isEditing, setIsEditing] = React.useState(false);
  const [editName, setEditName] = React.useState(currentUser?.name || '');
  const [editEmail, setEditEmail] = React.useState(currentUser?.email || '');

  const handleSave = () => {
    if (currentUser) {
      setCurrentUser({ ...currentUser, name: editName, email: editEmail });
    }
    setIsEditing(false);
  };

  return (
    <motion.div className="max-w-2xl mx-auto space-y-6 pb-6 pt-4" variants={containerVariants} initial="hidden" animate="show">
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold text-civic-text mb-6">Profile Settings</h1>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-brand-100 text-3xl font-bold text-civic-primary border border-brand-200">
            {initials}
          </div>
          <div className="flex-1 w-full">
            {isEditing ? (
              <div className="space-y-3 w-full max-w-sm">
                <div>
                  <label className="text-xs font-semibold text-civic-muted uppercase">Name</label>
                  <input 
                    type="text" 
                    value={editName} 
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 border border-civic-border rounded-lg text-sm mt-1 focus:ring-2 focus:ring-civic-primary/50 focus:border-civic-primary outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-civic-muted uppercase">Email</label>
                  <input 
                    type="email" 
                    value={editEmail} 
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-civic-border rounded-lg text-sm mt-1 focus:ring-2 focus:ring-civic-primary/50 focus:border-civic-primary outline-none"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" onClick={handleSave}>Save Changes</Button>
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-civic-text">{currentUser?.name}</h2>
                <p className="text-sm text-civic-muted mb-4">{currentUser?.email}</p>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-civic-accent/10 px-3 py-1 text-xs font-semibold text-civic-accent">
                  <Award size={14} /> Verified Contributor
                </div>
              </>
            )}
          </div>
          {!isEditing && (
            <div>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>Edit Profile</Button>
            </div>
          )}
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <h3 className="font-semibold text-civic-text mb-4">Contribution Impact</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="flex flex-col items-center justify-center text-center py-6">
            <FileText className="mb-2 h-6 w-6 text-brand-400" />
            <p className="text-3xl font-bold text-civic-text mb-1">{userIssues.length}</p>
            <p className="text-xs font-medium uppercase tracking-wider text-civic-muted">Reports Submitted</p>
          </Card>
          <Card className="flex flex-col items-center justify-center text-center py-6">
            <CheckCircle2 className="mb-2 h-6 w-6 text-civic-accent" />
            <p className="text-3xl font-bold text-civic-text mb-1">{resolved}</p>
            <p className="text-xs font-medium uppercase tracking-wider text-civic-muted">Issues Resolved</p>
          </Card>
          <Card className="flex flex-col items-center justify-center text-center py-6">
            <Award className="mb-2 h-6 w-6 text-civic-secondary" />
            <p className="text-3xl font-bold text-civic-text mb-1">{currentUser?.civicPoints ?? 0}</p>
            <p className="text-xs font-medium uppercase tracking-wider text-civic-muted">Civic Points</p>
          </Card>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="space-y-4">
        <h3 className="font-semibold text-civic-text mb-4 mt-8">Account & Preferences</h3>
        
        <div className="bg-white rounded-xl border border-civic-border overflow-hidden shadow-sm">
          <Link to="/my-reports" className="flex items-center justify-between p-4 transition-colors hover:bg-brand-50 border-b border-brand-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-civic-muted">
                <FileText size={16} />
              </div>
              <span className="text-sm font-semibold text-civic-text">My Reports</span>
            </div>
            <ChevronRight className="h-4 w-4 text-brand-400" />
          </Link>

          <button className="w-full flex items-center justify-between p-4 transition-colors hover:bg-brand-50 border-b border-brand-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-civic-muted">
                <Bell size={16} />
              </div>
              <div className="text-left">
                <span className="text-sm font-semibold text-civic-text block">Notifications</span>
                <span className="text-xs text-civic-muted">Email, push, SMS</span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-brand-400" />
          </button>

          <Link to="/admin/login" className="flex items-center justify-between p-4 transition-colors hover:bg-brand-50 border-b border-brand-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-civic-primary/10 flex items-center justify-center text-civic-primary">
                <ShieldCheck size={16} />
              </div>
              <div className="text-left">
                <span className="text-sm font-semibold text-civic-text block">Authority Portal</span>
                <span className="text-xs text-civic-muted">Access for city officials</span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-brand-400" />
          </Link>
          
          <button className="w-full flex items-center justify-between p-4 transition-colors hover:bg-brand-50 text-civic-danger">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-civic-danger/10 flex items-center justify-center">
                <LogOut size={16} />
              </div>
              <span className="text-sm font-semibold">Sign Out</span>
            </div>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Profile;
