const fs = require('fs');

const content = `import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Map as MapIcon, PlusCircle, User, Bell, FileText, Users, MapPin, AlertTriangle } from 'lucide-react';
import { cn } from '../utils/cn';
import { useStore } from '../store/useStore';
import { Button } from '../components/ui/Button';

const CitizenLayout = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const currentUser = useStore(state => state.currentUser);
  const reportDraft = useStore(state => state.reportDraft);
  
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  const desktopNav = [
    { name: 'Home', path: '/' },
    { name: 'Explore Map', path: '/map' },
    { name: 'My Reports', path: '/my-reports' },
    { name: 'Community', path: '/collaboration' },
  ];

  const mobileNav = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Map', path: '/map', icon: MapIcon },
    { name: 'Report', path: '/report', icon: PlusCircle, highlight: true },
    { name: 'Reports', path: '/my-reports', icon: FileText },
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

  return (
    <div className="min-h-screen bg-civic-background text-civic-text pb-20 md:pb-0">
      {/* Desktop Header */}
      <header className="sticky top-0 z-40 w-full border-b border-civic-border bg-civic-surface/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" onClick={(e) => handleNavigate(e, '/')} className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-civic-primary text-white">
                <MapPin className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-civic-primary">CivicPulse</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              {desktopNav.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={(e) => handleNavigate(e, item.path)}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-civic-primary",
                    pathname === item.path ? "text-civic-primary" : "text-civic-muted"
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-4">
              <button className="text-civic-muted hover:text-civic-primary transition-colors">
                <Bell size={20} />
              </button>
              <Link to="/profile" onClick={(e) => handleNavigate(e, '/profile')} className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-brand-200 flex items-center justify-center overflow-hidden border border-civic-border">
                  <User size={16} className="text-civic-muted" />
                </div>
              </Link>
              <Link to="/report" onClick={(e) => handleNavigate(e, '/report')}>
                <Button variant="primary" size="sm" className="font-semibold">
                  Report an Issue
                </Button>
              </Link>
              <Link to="/admin" onClick={(e) => handleNavigate(e, '/admin')} className="text-xs font-medium text-civic-muted hover:text-civic-primary ml-2">
                Authority Portal
              </Link>
            </div>
            {/* Mobile Header elements */}
            <div className="flex md:hidden items-center gap-3">
              <Link to="/admin" onClick={(e) => handleNavigate(e, '/admin')} className="text-xs font-medium text-civic-muted hover:text-civic-primary">
                Portal
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="container mx-auto px-4 py-8 md:py-12 relative z-10 max-w-7xl">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 w-full border-t border-civic-border bg-civic-surface z-50 px-2 py-2 pb-safe">
        <div className="flex justify-around items-center">
          {mobileNav.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={(e) => handleNavigate(e, item.path)}
              className={cn(
                "flex flex-col items-center justify-center w-16 transition-colors",
                item.highlight ? "-mt-6" : "",
                pathname === item.path ? "text-civic-primary" : "text-civic-muted hover:text-civic-text"
              )}
            >
              <div className={cn(
                "flex items-center justify-center",
                item.highlight ? "bg-civic-primary text-white h-12 w-12 rounded-full shadow-lg border-4 border-civic-surface" : "h-8 w-8 rounded-full",
                !item.highlight && pathname === item.path ? "bg-brand-100 text-civic-primary" : ""
              )}>
                <item.icon size={item.highlight ? 24 : 20} />
              </div>
              {!item.highlight && (
                <span className="text-[10px] font-medium mt-1">{item.name}</span>
              )}
            </Link>
          ))}
        </div>
      </nav>

      {/* Interception Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative overflow-hidden text-center">
            <div className="mx-auto w-16 h-16 bg-civic-warning/10 text-civic-warning rounded-full flex items-center justify-center mb-4">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-bold text-civic-text mb-2">Leave this report?</h3>
            <p className="text-civic-muted mb-6">
              You have an unfinished report. Your progress has been saved as a draft.
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={cancelLeave} className="w-full h-12 text-md">
                Continue Report
              </Button>
              <Button onClick={confirmLeave} variant="outline" className="w-full h-12 text-md text-civic-muted hover:text-civic-text hover:bg-brand-50">
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
`;

fs.writeFileSync('c:/Users/mandh/Downloads/civicpulse-upgraded/src/layouts/CitizenLayout.tsx', content);
