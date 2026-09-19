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
  Briefcase
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useAdminAuth } from '../store/useAdminAuth';

const AdminLayout = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { logout, adminName } = useAdminAuth();

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
    <div className="min-h-screen bg-brand-50 flex text-civic-text font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-civic-border bg-brand-900 text-brand-100 flex-col hidden md:flex z-10 flex-shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-brand-800 bg-brand-950">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-civic-secondary text-white">
              <MapPin className="h-5 w-5" />
            </div>
            <span className="font-bold text-lg tracking-tight text-white">CivicPulse</span>
          </div>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          <div className="text-xs font-semibold text-brand-400 uppercase tracking-wider mb-4 px-3">
            Command Center
          </div>
          <nav className="space-y-1">
            {menuItems.map(item => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium",
                    isActive 
                      ? "bg-brand-800 text-white" 
                      : "text-brand-300 hover:bg-brand-800/50 hover:text-white"
                  )}
                >
                  <Icon size={18} className={cn(isActive ? "text-civic-secondary" : "text-brand-400")} />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-brand-800 space-y-1 bg-brand-950/50">
          <Link to="/" className="flex items-center gap-3 px-3 py-2 rounded-lg text-brand-300 hover:bg-brand-800 hover:text-white transition-colors text-sm font-medium">
            <LogOut size={18} />
            Citizen Portal
          </Link>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-civic-danger/80 hover:bg-civic-danger/10 hover:text-civic-danger transition-colors text-sm font-medium"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 z-10 relative bg-brand-50">
        <header className="h-16 border-b border-civic-border bg-white flex items-center justify-between px-6 sticky top-0 z-20">
          <div className="flex items-center bg-brand-50 rounded-lg px-3 py-1.5 border border-civic-border w-96 focus-within:border-civic-secondary focus-within:ring-1 focus-within:ring-civic-secondary transition-all">
            <Search size={16} className="text-brand-400 mr-2" />
            <input 
              type="text" 
              placeholder="Search issues, teams, or wards..." 
              className="bg-transparent border-none outline-none text-sm w-full text-civic-text placeholder:text-brand-400"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm font-medium text-civic-muted mr-2">
              <MapPin size={14} />
              <span>Central Zone</span>
            </div>
            <button className="relative text-civic-muted hover:text-civic-primary transition-colors">
              <Bell size={20} />
              <span className="absolute top-0 right-0 w-2 h-2 bg-civic-danger rounded-full"></span>
            </button>
            <div className="flex items-center gap-3 border-l border-civic-border pl-4">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold text-civic-text">{adminName || 'Admin'}</div>
                <div className="text-xs text-civic-muted">City Operations</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-brand-100 border border-brand-200 flex items-center justify-center">
                <User size={16} className="text-civic-primary" />
              </div>
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-auto p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
