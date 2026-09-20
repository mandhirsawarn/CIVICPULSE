import React from 'react';
import { motion } from 'framer-motion';
import { Award, FileText, CheckCircle2, ShieldCheck, Settings, Bell, ChevronRight, LogOut, User, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { isValidEmailFormat } from '../../utils/emailValidation';
import { cn } from '../../utils/cn';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
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
  const [emailError, setEmailError] = React.useState('');

  const handleSave = () => {
    if (!isValidEmailFormat(editEmail.trim())) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    if (currentUser) {
      setCurrentUser({ ...currentUser, name: editName.trim(), email: editEmail.trim() });
    }
    setEmailError('');
    setIsEditing(false);
  };

  return (
    <motion.div className="max-w-3xl mx-auto space-y-6 pb-12 pt-4" variants={containerVariants} initial="hidden" animate="show">
      <motion.div variants={itemVariants}>
        <SectionHeader 
          eyebrow="CITIZEN ACCOUNT"
          title="Profile & Civic Score" 
          description="Manage your personal credentials, impact record, and municipal communication channels."
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left p-6 rounded-2xl border border-slate-200/80 bg-white shadow-[0_4px_20px_rgba(15,23,42,0.03)]">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-2xl font-extrabold text-blue-600 border border-blue-100 shadow-xs">
            {initials}
          </div>
          <div className="flex-1 w-full">
            {isEditing ? (
              <div className="space-y-3 w-full max-w-sm">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Full Name</label>
                  <input 
                    type="text" 
                    value={editName} 
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                    {editEmail.trim().length > 0 && isValidEmailFormat(editEmail.trim()) && (
                      <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 animate-fade-in">
                        <CheckCircle2 size={11} className="text-emerald-500" />
                        <span>✓ Valid email address</span>
                      </span>
                    )}
                  </div>
                  <input 
                    type="email" 
                    value={editEmail} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditEmail(val);
                      if (val.trim().length === 0) {
                        setEmailError('Please enter a valid email address.');
                      } else if (isValidEmailFormat(val.trim())) {
                        setEmailError('');
                      }
                    }}
                    onBlur={() => {
                      if (!isValidEmailFormat(editEmail.trim())) {
                        setEmailError('Please enter a valid email address.');
                      } else {
                        setEmailError('');
                      }
                    }}
                    className={cn(
                      "w-full px-3.5 py-2 border rounded-xl text-sm outline-none font-medium text-slate-800 transition-colors",
                      emailError 
                        ? "border-red-500 focus:ring-2 focus:ring-red-500" 
                        : editEmail.trim().length > 0 && isValidEmailFormat(editEmail.trim())
                          ? "border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                          : "border-slate-200 focus:ring-2 focus:ring-blue-500"
                    )}
                  />
                  {emailError && (
                    <p className="text-xs text-red-600 mt-1 font-medium flex items-center gap-1 animate-fade-in">
                      <span>❌ {emailError}</span>
                    </p>
                  )}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button 
                    size="sm" 
                    onClick={handleSave} 
                    disabled={!isValidEmailFormat(editEmail.trim())}
                    className="rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800"
                  >
                    Save Changes
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      setIsEditing(false);
                      setEditEmail(currentUser?.email || '');
                      setEditName(currentUser?.name || '');
                      setEmailError('');
                    }} 
                    className="rounded-xl font-semibold"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-extrabold text-slate-900 mb-1">{currentUser?.name}</h2>
                <p className="text-xs text-slate-500 mb-3">{currentUser?.email}</p>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                  <Award size={14} className="text-emerald-600" /> Verified Civic Contributor
                </div>
              </>
            )}
          </div>
          {!isEditing && (
            <div>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="rounded-xl font-semibold text-xs border-slate-200">
                Edit Profile
              </Button>
            </div>
          )}
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Contribution Impact</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="flex flex-col items-center justify-center text-center p-5 rounded-2xl border border-slate-200/80 bg-white shadow-[0_4px_20px_rgba(15,23,42,0.03)]">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 border border-blue-100 text-blue-600 mb-2">
              <FileText size={22} />
            </div>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums mb-0.5">{userIssues.length}</p>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Reports Submitted</p>
          </Card>

          <Card className="flex flex-col items-center justify-center text-center p-5 rounded-2xl border border-slate-200/80 bg-white shadow-[0_4px_20px_rgba(15,23,42,0.03)]">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 mb-2">
              <CheckCircle2 size={22} />
            </div>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums mb-0.5">{resolved}</p>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Issues Resolved</p>
          </Card>

          <Card className="flex flex-col items-center justify-center text-center p-5 rounded-2xl border border-slate-200/80 bg-white shadow-[0_4px_20px_rgba(15,23,42,0.03)]">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 border border-amber-100 text-amber-600 mb-2">
              <Award size={22} />
            </div>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums mb-0.5">{currentUser?.civicPoints ?? 0}</p>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Civic Points</p>
          </Card>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="space-y-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-4">Account & Preferences</h3>
        
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-[0_4px_20px_rgba(15,23,42,0.03)] divide-y divide-slate-100">
          <Link to="/my-reports" className="flex items-center justify-between p-4 transition-colors hover:bg-slate-50/80">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                <FileText size={17} />
              </div>
              <div>
                <span className="text-sm font-bold text-slate-900 block">My Submitted Reports</span>
                <span className="text-xs text-slate-500">View progress and resolution updates</span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </Link>

          <button className="w-full flex items-center justify-between p-4 transition-colors hover:bg-slate-50/80 text-left">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Bell size={17} />
              </div>
              <div>
                <span className="text-sm font-bold text-slate-900 block">Notifications & Alerts</span>
                <span className="text-xs text-slate-500">Push, SMS, and WhatsApp alerts for ward status</span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </button>

          <Link to="/admin/login" className="flex items-center justify-between p-4 transition-colors hover:bg-slate-50/80">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <ShieldCheck size={17} />
              </div>
              <div>
                <span className="text-sm font-bold text-slate-900 block">Authority & Partner Portal</span>
                <span className="text-xs text-slate-500">Secure access for municipal department leads</span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </Link>
          
          <button className="w-full flex items-center justify-between p-4 transition-colors hover:bg-rose-50/50 text-rose-600">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                <LogOut size={17} />
              </div>
              <span className="text-sm font-bold">Sign Out</span>
            </div>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Profile;
