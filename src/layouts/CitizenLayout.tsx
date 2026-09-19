import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Map as MapIcon, 
  PlusCircle, 
  User, 
  Bell, 
  FileText, 
  Users, 
  MapPin, 
  AlertTriangle,
  ArrowRight,
  Shield,
  Layers,
  BookOpen
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useStore } from '../store/useStore';
import { Button } from '../components/ui/Button';
import { Footer } from '../components/ui/Footer';

const CitizenLayout = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const currentUser = useStore(state => state.currentUser);
  const reportDraft = useStore(state => state.reportDraft);
  
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  const desktopNav = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Explore Map', path: '/map', icon: MapIcon },
    { name: 'Community Pulse', path: '/community-pulse', icon: Users },
    { name: 'My Reports', path: '/my-reports', icon: FileText },
    { name: 'Collaboration', path: '/collaboration', icon: Layers },
    { name: 'Docs', path: '/docs', icon: BookOpen },
  ];

  const mobileNav = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Map', path: '/map', icon: MapIcon },
    { name: 'Report', path: '/report', icon: PlusCircle, highlight: true },
    { name: 'Pulse', path: '/community-pulse', icon: Users },
    { name: 'Docs', path: '/docs', icon: BookOpen },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  const handleNavigate = (e: React.MouseEvent, path: string) => {
    if (pathname === '/report' && reportDraft && reportDraft.step < 8 && path !== '/report') {
      e.preventDefault();
      setPendingPath(path);
      setShowLeaveModal(true);
    }
  };

  const confirmLeave = () => {
    setShowLeaveModal(false);
    if (pendingPath) {
      navigate(pendingPath);
      setPendingPath(null);
    }
  };

  const cancelLeave = () => {
    setShowLeaveModal(false);
    setPendingPath(null);
  };

  const notifications = useStore(state => state.notifications);
  const unreadCount = notifications ? notifications.filter(n => !n.read).length : 0;

  return (
    <div className="min-h-screen text-slate-900 pb-20 md:pb-0 antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Desktop Sticky Header */}
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.03)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" onClick={(e) => handleNavigate(e, '/')} className="flex items-center gap-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm group-hover:scale-105 transition-transform duration-200">
                <Shield className="h-5 w-5 text-blue-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-[19px] font-black tracking-tight text-slate-900 leading-none">
                  Civic<span className="text-blue-600">Pulse</span>
                </span>
                <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  Citizen Intelligence
                </span>
              </div>
            </Link>

            {/* Navigation links */}
            <nav className="hidden lg:flex items-center gap-1">
              {desktopNav.map((item) => {
                const isActive = pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={(e) => handleNavigate(e, item.path)}
                    className={cn(
                      "text-xs font-semibold px-3 py-1.5 rounded-[9px] transition-all duration-150 flex items-center gap-1.5",
                      isActive
                        ? "bg-blue-50 text-blue-700 font-bold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                    )}
                  >
                    <Icon size={14} className={isActive ? "text-blue-600" : "text-slate-400"} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2.5">
              <Link 
                to="/profile" 
                onClick={(e) => handleNavigate(e, '/profile')}
                className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                title="Notifications"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white animate-pulse" />
                )}
              </Link>
              <Link 
                to="/profile" 
                onClick={(e) => handleNavigate(e, '/profile')} 
                className="flex items-center gap-2 p-1 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                  <User size={15} className="text-slate-700" />
                </div>
              </Link>
              <Link to="/report" onClick={(e) => handleNavigate(e, '/report')}>
                <Button 
                  variant="primary" 
                  size="sm" 
                  className="font-bold gap-1.5 shadow-xs hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
                >
                  <span>Report an Issue</span>
                  <ArrowRight size={14} className="text-slate-300" />
                </Button>
              </Link>
              <Link 
                to="/admin" 
                onClick={(e) => handleNavigate(e, '/admin')} 
                className="text-xs font-semibold text-slate-500 hover:text-slate-900 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200 ml-1"
              >
                Authority Portal
              </Link>
            </div>
            {/* Mobile Header elements */}
            <div className="flex md:hidden items-center gap-2">
              <Link to="/report" onClick={(e) => handleNavigate(e, '/report')}>
                <Button variant="primary" size="sm" className="text-xs font-bold py-1 px-3">
                  Report
                </Button>
              </Link>
              <Link to="/admin" onClick={(e) => handleNavigate(e, '/admin')} className="text-xs font-bold text-slate-500 hover:text-slate-900 p-1.5">
                Portal
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-10 relative z-10">
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 w-full border-t border-slate-200 bg-white/95 backdrop-blur-md z-50 px-2 py-2 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.03)]">
        <div className="flex justify-around items-center">
          {mobileNav.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={(e) => handleNavigate(e, item.path)}
              className={cn(
                "flex flex-col items-center justify-center w-16 transition-colors",
                item.highlight ? "-mt-5" : "",
                pathname === item.path ? "text-blue-600" : "text-slate-500 hover:text-slate-900"
              )}
            >
              <div className={cn(
                "flex items-center justify-center transition-all duration-150",
                item.highlight ? "bg-slate-900 text-white h-11 w-11 rounded-full shadow-md border-2 border-white" : "h-8 w-8 rounded-full",
                !item.highlight && pathname === item.path ? "bg-blue-50 text-blue-600" : ""
              )}>
                <item.icon size={item.highlight ? 22 : 18} />
              </div>
              {!item.highlight && (
                <span className="text-[10px] font-semibold mt-1">{item.name}</span>
              )}
            </Link>
          ))}
        </div>
      </nav>

      {/* Interception Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative overflow-hidden text-center border border-slate-200/80">
            <div className="mx-auto w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100 flex items-center justify-center mb-4">
              <AlertTriangle size={28} />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 mb-2">Leave this report?</h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              You have an unfinished report in progress. Your data has been automatically preserved in your local draft.
            </p>
            <div className="flex flex-col gap-2.5">
              <Button onClick={cancelLeave} className="w-full h-11 text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 rounded-xl shadow-xs">
                Continue Report
              </Button>
              <Button onClick={confirmLeave} variant="outline" className="w-full h-11 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl border-slate-200">
                Save & Exit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CitizenLayout;
