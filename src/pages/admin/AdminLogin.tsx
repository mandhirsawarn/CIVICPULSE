import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, User, Users, Briefcase, Building, Loader2, ArrowLeft } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useAdminAuth } from '../../store/useAdminAuth';

const ROLES = [
  { id: 'admin', title: 'Command Center Admin', desc: 'Full access to intelligence dashboards, GIS maps, and routing.', icon: ShieldCheck, color: 'text-blue-400', bg: 'bg-blue-600/10', border: 'border-blue-500/40', path: '/admin/overview' },
  { id: 'field', title: 'Field Officer', desc: 'Access mobile tasks and submit resolution evidence.', icon: Briefcase, color: 'text-orange-400', bg: 'bg-orange-600/10', border: 'border-orange-500/40', path: '/admin/field-teams' },
  { id: 'partner', title: 'University Partner', desc: 'Access Collaboration Hub for civic problem solving.', icon: Building, color: 'text-purple-400', bg: 'bg-purple-600/10', border: 'border-purple-500/40', path: '/collaboration' },
  { id: 'citizen', title: 'Citizen Reporter', desc: 'Standard user access to report and track issues.', icon: User, color: 'text-green-400', bg: 'bg-green-600/10', border: 'border-green-500/40', path: '/' },
];

const AdminLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setCurrentUser } = useStore();
  const login = useAdminAuth((s) => s.login); // We will bypass password check internally or just set true
  const setAuthenticated = useAdminAuth((s) => s.setAuthenticated);

  const [loadingRole, setLoadingRole] = useState<string | null>(null);

  const from = (location.state as { from?: string } | null)?.from;

  const handleRoleSelect = (roleId: string, path: string) => {
    setLoadingRole(roleId);

    setTimeout(() => {
      if (roleId === 'admin' || roleId === 'field') {
        setAuthenticated(true);
      } else {
        setAuthenticated(false);
      }

      if (roleId === 'admin') {
        setCurrentUser({ id: 'admin-1', name: 'Admin User', email: 'admin@civicpulse.gov', role: 'AUTHORITY_ADMIN' });
      } else if (roleId === 'field') {
        setCurrentUser({ id: 'officer-1', name: 'Field Officer Beta', email: 'field@civicpulse.gov', role: 'FIELD_OPERATOR' });
      } else if (roleId === 'partner') {
        setCurrentUser({ id: 'partner-1', name: 'Tech University', email: 'research@tech.edu', role: 'PARTNER' });
      } else {
        setCurrentUser({ id: 'user-1', name: 'Rohan Sharma', email: 'rohan@example.com', role: 'CITIZEN', civicPoints: 420 });
      }

      navigate(from || path, { replace: true });
    }, 800);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 text-slate-200 py-12">
      {/* Background grid + glow */}
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-blue-600/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-purple-600/10 blur-[120px]" />

      <button
        onClick={() => navigate('/')}
        className="absolute left-6 top-6 z-10 flex items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-white"
      >
        <ArrowLeft size={16} /> Back to citizen portal
      </button>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-2xl"
      >
        <div className="glass-morphism rounded-3xl border border-slate-700/50 p-8 shadow-2xl">
          <div className="flex flex-col items-center text-center mb-8">
            <h1 className="font-black text-2xl uppercase tracking-widest text-white glow-text mb-2">
              Prototype Authentication
            </h1>
            <p className="text-sm text-slate-400 max-w-md">
              Select a persona to explore different features of the CivicPulse platform without requiring a password.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ROLES.map((role) => (
              <button
                key={role.id}
                disabled={loadingRole !== null}
                onClick={() => handleRoleSelect(role.id, role.path)}
                className={`flex flex-col items-start p-5 rounded-2xl border bg-slate-900/50 hover:bg-slate-800/80 transition-all text-left ${
                  loadingRole === role.id ? 'border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'border-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl border ${role.border} ${role.bg}`}>
                    <role.icon className={`h-6 w-6 ${role.color}`} />
                  </div>
                  {loadingRole === role.id && (
                    <Loader2 size={20} className="animate-spin text-slate-400" />
                  )}
                </div>
                <h3 className="font-bold text-white mb-1">{role.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{role.desc}</p>
              </button>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800 text-center">
            <p className="text-[11px] uppercase tracking-wider text-slate-500">
              Zero-Cost Hackathon Architecture • Secure Fallback Mode Active
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
