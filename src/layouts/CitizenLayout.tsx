import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Map as MapIcon, 
  PlusCircle, 
  User, 
  Bell, 
  FileText, 
  Users, 
  AlertTriangle,
  ArrowRight,
  Shield,
  Layers,
  BookOpen,
  Trash2,
  MoreHorizontal,
  X,
  ExternalLink
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useStore } from '../store/useStore';
import { Button } from '../components/ui/Button';
import { Footer } from '../components/ui/Footer';
import { PwaInstallPrompt } from '../components/common/PwaInstallPrompt';

const CitizenLayout = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const currentUser = useStore(state => state.currentUser);
  const reportDraft = useStore(state => state.reportDraft);
  const hasUnsavedReportData = useStore(state => state.hasUnsavedReportData);
  const clearReportDraft = useStore(state => state.clearReportDraft);
  
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [showMobileMore, setShowMobileMore] = useState(false);

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
    { name: 'Community', path: '/community-pulse', icon: Users },
    { name: 'More', path: '#more', icon: MoreHorizontal, isAction: true },
  ];

  // Universal navigation interceptor
  const requestLeave = (path: string, e?: React.SyntheticEvent) => {
    if (pathname === '/report' && path !== '/report' && hasUnsavedReportData()) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      setPendingPath(path);
      setShowDiscardConfirm(false);
      setShowLeaveModal(true);
      return true;
    }
    return false;
  };

  const handleNavigate = (e: React.MouseEvent, path: string) => {
    if (path === '#more') {
      e.preventDefault();
      setShowMobileMore(true);
      return;
    }
    requestLeave(path, e);
  };

  // Continue Report: stay on current report step
  const handleContinueReport = () => {
    setShowLeaveModal(false);
    setShowDiscardConfirm(false);
    setPendingPath(null);
  };

  // Save & Exit: preserve draft in store and navigate away
  const handleSaveAndExit = () => {
    setShowLeaveModal(false);
    setShowDiscardConfirm(false);
    const target = pendingPath;
    setPendingPath(null);
    if (target === '__BACK__') {
      window.history.back();
    } else if (target) {
      navigate(target);
    }
  };

  // Prompt Discard Confirmation
  const handlePromptDiscard = () => {
    setShowDiscardConfirm(true);
  };

  const handleCancelDiscard = () => {
    setShowDiscardConfirm(false);
  };

  // Discard Report: completely clear draft and navigate away
  const handleConfirmDiscard = () => {
    clearReportDraft();
    setShowDiscardConfirm(false);
    setShowLeaveModal(false);
    const target = pendingPath;
    setPendingPath(null);
    if (target === '__BACK__') {
      window.history.back();
    } else if (target) {
      navigate(target);
    }
  };

  // Global document click listener + popstate guard for report exit protection
  useEffect(() => {
    if (pathname !== '/report') return;

    const handleDocumentClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a');
      if (!anchor) return;
      if (anchor.closest('[data-modal]')) return;
      
      const href = anchor.getAttribute('href');
      if (!href) return;
      if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:') || href === '#more') return;
      if (href === '/report') return;

      if (hasUnsavedReportData()) {
        e.preventDefault();
        e.stopPropagation();
        setPendingPath(href);
        setShowDiscardConfirm(false);
        setShowLeaveModal(true);
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedReportData()) {
        e.preventDefault();
        e.returnValue = 'Your progress will be lost if you exit without saving.';
        return 'Your progress will be lost if you exit without saving.';
      }
    };

    // Push state for back button guard
    window.history.pushState({ civicReportGuard: true }, '', window.location.href);

    const handlePopState = () => {
      if (hasUnsavedReportData()) {
        window.history.pushState({ civicReportGuard: true }, '', window.location.href);
        setPendingPath('__BACK__');
        setShowDiscardConfirm(false);
        setShowLeaveModal(true);
      }
    };

    document.addEventListener('click', handleDocumentClick, true);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      document.removeEventListener('click', handleDocumentClick, true);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [pathname, hasUnsavedReportData]);

  const notifications = useStore(state => state.notifications);
  const unreadCount = notifications ? notifications.filter(n => !n.read).length : 0;

  return (
    <div className="min-h-screen text-slate-900 pb-20 md:pb-0 antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* PWA Install Notification Bar */}
      <PwaInstallPrompt />

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

            {/* Desktop Navigation links */}
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
                title="Profile"
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

            {/* Mobile Header Elements */}
            <div className="flex md:hidden items-center gap-1.5">
              <Link 
                to="/profile" 
                onClick={(e) => handleNavigate(e, '/profile')}
                className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                title="Notifications"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white animate-pulse" />
                )}
              </Link>
              <Link 
                to="/admin" 
                onClick={(e) => handleNavigate(e, '/admin')} 
                className="text-[11px] font-bold text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50"
              >
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

      {/* Mobile Bottom Navigation Dock */}
      <nav 
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 w-full border-t border-slate-200/90 bg-white/95 backdrop-blur-md z-40 px-2 py-1.5 shadow-[0_-2px_12px_rgba(15,23,42,0.06)]"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0.5rem)' }}
      >
        <div className="flex justify-around items-center max-w-md mx-auto">
          {mobileNav.map((item) => {
            const isCurrent = pathname === item.path;
            const Icon = item.icon;
            
            if (item.highlight) {
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={(e) => handleNavigate(e, item.path)}
                  className="flex flex-col items-center justify-center -mt-5 group focus:outline-none"
                  aria-label="Report an Issue"
                >
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-slate-900 text-white shadow-lg border-[3px] border-white group-hover:bg-blue-600 transition-all duration-200 group-hover:scale-105">
                    <Icon size={22} className="text-white" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-800 mt-0.5">Report</span>
                </Link>
              );
            }

            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={(e) => handleNavigate(e, item.path)}
                className={cn(
                  "flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-all duration-150",
                  isCurrent ? "text-blue-600 font-bold" : "text-slate-500 hover:text-slate-900"
                )}
              >
                <div className={cn(
                  "flex items-center justify-center h-7 w-7 rounded-lg transition-colors",
                  isCurrent ? "bg-blue-50 text-blue-600" : "text-slate-500"
                )}>
                  <Icon size={18} />
                </div>
                <span className="text-[10px] tracking-tight mt-0.5">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile "More" Drawer */}
      {showMobileMore && (
        <div 
          data-modal="mobile-more"
          className="md:hidden fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setShowMobileMore(false)}
        >
          <div 
            className="bg-white rounded-t-3xl shadow-2xl w-full max-w-lg p-5 border-t border-slate-200 animate-slide-up"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 1.5rem)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">CivicPulse Menu</h3>
              <button 
                onClick={() => setShowMobileMore(false)} 
                className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 mb-4">
              <Link
                to="/my-reports"
                onClick={(e) => {
                  setShowMobileMore(false);
                  handleNavigate(e, '/my-reports');
                }}
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/80 hover:bg-slate-50 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <FileText size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">My Reports</div>
                  <div className="text-[10px] text-slate-400">Track status</div>
                </div>
              </Link>

              <Link
                to="/collaboration"
                onClick={(e) => {
                  setShowMobileMore(false);
                  handleNavigate(e, '/collaboration');
                }}
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/80 hover:bg-slate-50 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Layers size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Collaboration</div>
                  <div className="text-[10px] text-slate-400">City challenges</div>
                </div>
              </Link>

              <Link
                to="/docs"
                onClick={(e) => {
                  setShowMobileMore(false);
                  handleNavigate(e, '/docs');
                }}
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/80 hover:bg-slate-50 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <BookOpen size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Documentation</div>
                  <div className="text-[10px] text-slate-400">Guides & API</div>
                </div>
              </Link>

              <Link
                to="/profile"
                onClick={(e) => {
                  setShowMobileMore(false);
                  handleNavigate(e, '/profile');
                }}
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/80 hover:bg-slate-50 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <User size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Profile</div>
                  <div className="text-[10px] text-slate-400">Civic points</div>
                </div>
              </Link>
            </div>

            <Link
              to="/admin"
              onClick={(e) => {
                setShowMobileMore(false);
                handleNavigate(e, '/admin');
              }}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-blue-400" />
                <span>Authority Management Portal</span>
              </div>
              <ExternalLink size={14} className="text-slate-400" />
            </Link>
          </div>
        </div>
      )}

      {/* Primary Report Interception Modal (3 Buttons) */}
      {showLeaveModal && !showDiscardConfirm && (
        <div data-modal="leave-report" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative overflow-hidden text-center border border-slate-200/80 animate-scale-up">
            <div className="mx-auto w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100 flex items-center justify-center mb-4">
              <AlertTriangle size={28} />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 mb-2">Leave this report?</h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              Your progress will be lost if you exit without saving.
            </p>
            <div className="flex flex-col gap-2.5">
              <Button 
                onClick={handleContinueReport} 
                className="w-full h-11 text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 rounded-xl shadow-xs"
              >
                Continue Report
              </Button>
              <Button 
                onClick={handleSaveAndExit} 
                variant="outline" 
                className="w-full h-11 text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl border-slate-200"
              >
                Save & Exit
              </Button>
              <button 
                type="button"
                onClick={handlePromptDiscard} 
                className="w-full h-10 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
              >
                Exit Without Saving
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Secondary Destructive Discard Confirmation Modal */}
      {showLeaveModal && showDiscardConfirm && (
        <div data-modal="discard-confirm" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative overflow-hidden text-center border border-slate-200/80 animate-scale-up">
            <div className="mx-auto w-14 h-14 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex items-center justify-center mb-4">
              <Trash2 size={26} />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 mb-2">Discard this report?</h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              All entered information will be permanently removed.
            </p>
            <div className="flex flex-col gap-2.5">
              <Button 
                onClick={handleConfirmDiscard} 
                className="w-full h-11 text-sm font-bold bg-red-600 text-white hover:bg-red-700 rounded-xl shadow-xs"
              >
                Discard Report
              </Button>
              <Button 
                onClick={handleCancelDiscard} 
                variant="outline" 
                className="w-full h-11 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl border-slate-200"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CitizenLayout;
