import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BrainCircuit, 
  Map as MapIcon, 
  Users, 
  Activity,
  LogOut,
  Bell,
  Search,
  User,
  MapPin,
  Briefcase,
  Shield
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useAdminAuth } from '../store/useAdminAuth';
import { useStore } from '../store/useStore';

const AdminLayout = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { logout, adminName } = useAdminAuth();
  const { issues, unreadIncomingCount, latestIncomingAlert, clearIncomingAlert } = useStore();
  const [showBellDropdown, setShowBellDropdown] = React.useState(false);

  const newReportsCount = issues.filter(i => i.status === 'REPORTED').length;

  const handleLogout = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };

  const menuItems = [
    { name: 'Overview', path: '/admin/overview', icon: LayoutDashboard },
    { name: 'Issue Intelligence', path: '/admin/issues', icon: BrainCircuit },
    { name: 'Live Map', path: '/admin/map', icon: MapIcon },
    { name: 'Field Teams', path: '/admin/teams', icon: Users },
    { name: 'SLA Monitor', path: '/admin/sla', icon: Activity },
    { name: 'Collab Hub', path: '/admin/collab', icon: Briefcase },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 flex text-slate-900 font-sans antialiased">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-950 text-slate-300 flex-col hidden md:flex z-30 flex-shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-slate-800/80 bg-slate-950">
          <Link to="/admin" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs group-hover:scale-105 transition-transform duration-200">
              <Shield className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-base tracking-tight text-white leading-none">
                Civic<span className="text-blue-400">Pulse</span>
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                Authority Portal
              </span>
            </div>
          </Link>
        </div>

        <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-3">
            Command Operations
          </div>
          <nav className="space-y-1">
            {menuItems.map(item => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.path);
              const isIssueIntelligence = item.path === '/admin/issues';

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-150 text-xs font-semibold",
                    isActive 
                      ? "bg-blue-600 text-white shadow-xs" 
                      : "text-slate-400 hover:bg-slate-900 hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} className={cn(isActive ? "text-white" : "text-slate-400")} />
                    <span>{item.name}</span>
                  </div>
                  {isIssueIntelligence && newReportsCount > 0 && (
                    <span className={cn(
                      "px-1.5 py-0.2 rounded-full text-[10px] font-black tabular-nums",
                      isActive ? "bg-white text-blue-700" : "bg-red-500 text-white animate-pulse"
                    )}>
                      {newReportsCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800/80 space-y-1 bg-slate-950">
          <Link to="/" className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-400 hover:bg-slate-900 hover:text-white transition-colors text-xs font-semibold">
            <LogOut size={16} />
            Citizen Portal
          </Link>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors text-xs font-semibold cursor-pointer"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 z-10 relative bg-slate-50/50">
        <header className="h-16 border-b border-slate-200/80 bg-white/95 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-20 shadow-[0_1px_3px_rgba(15,23,42,0.02)]">
          <div className="flex items-center bg-slate-50 rounded-xl px-3.5 py-2 border border-slate-200/80 w-80 sm:w-96 focus-within:border-slate-900 focus-within:bg-white transition-all">
            <Search size={15} className="text-slate-400 mr-2 shrink-0" />
            <input 
              type="text" 
              placeholder="Search issues, field teams, or wards..." 
              className="bg-transparent border-none outline-none text-xs sm:text-sm w-full text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-4 relative">
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/60">
              <MapPin size={13} className="text-blue-600" />
              <span>Central Municipal Zone</span>
            </div>

            {/* Bell Icon & Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowBellDropdown(!showBellDropdown)} 
                className="relative p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer" 
                title="Real-Time Alerts"
              >
                <Bell size={18} />
                {newReportsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse"></span>
                )}
              </button>

              {showBellDropdown && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowBellDropdown(false)}></div>
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 shadow-xl rounded-2xl p-4 z-40 animate-scale-in">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-2.5">
                      <span className="font-extrabold text-xs text-slate-900">Live Incoming Reports</span>
                      <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                        {newReportsCount} New
                      </span>
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                      {issues.filter(i => i.status === 'REPORTED').slice(0, 5).map(r => (
                        <Link
                          key={r.id}
                          to="/admin/issues"
                          onClick={() => setShowBellDropdown(false)}
                          className="block p-2 rounded-xl hover:bg-slate-50 transition-colors border border-slate-100"
                        >
                          <div className="flex items-center justify-between text-[10px] font-mono text-blue-700 mb-0.5">
                            <span className="font-bold">{r.id}</span>
                            <span className="text-slate-400">{new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div className="text-xs font-bold text-slate-900 truncate">{r.title}</div>
                          <div className="text-[11px] text-slate-400 truncate">{r.location.address}</div>
                        </Link>
                      ))}
                      {newReportsCount === 0 && (
                        <div className="text-center py-4 text-xs text-slate-400">All incoming reports triaged.</div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 mt-2 text-center">
                      <Link
                        to="/admin/issues"
                        onClick={() => setShowBellDropdown(false)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800"
                      >
                        Open Full Queue →
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-slate-900">{adminName || 'Municipal Admin'}</div>
                <div className="text-[10px] font-semibold text-slate-400">City Operations Hub</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
                <User size={15} />
              </div>
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-auto p-4 sm:p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
