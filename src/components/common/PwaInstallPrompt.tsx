import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { Button } from '../ui/Button';
import { useStore } from '../../store/useStore';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [updateWaiting, setUpdateWaiting] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  const { pathname } = useLocation();
  const hasUnsavedReportData = useStore(state => state.hasUnsavedReportData);

  useEffect(() => {
    // Check if already in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Listen for Service Worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (!reg) return;
        
        if (reg.waiting) {
          setUpdateWaiting(true);
          setWaitingWorker(reg.waiting);
        }

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateWaiting(true);
                setWaitingWorker(newWorker);
              }
            });
          }
        });
      }).catch(() => {});

      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing && pathname !== '/report') {
          refreshing = true;
          window.location.reload();
        }
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [pathname]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
      }
    } catch (err) {
      console.warn('PWA install prompt error:', err);
    } finally {
      setDeferredPrompt(null);
    }
  };

  const handleReload = () => {
    // Never force reload while actively reporting with unsaved data
    if (pathname === '/report' && hasUnsavedReportData()) {
      const confirmReload = window.confirm('Your current report draft is saved locally. Reload to apply the new version?');
      if (!confirmReload) return;
    }

    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload();
  };

  return (
    <>
      {/* PWA Update Ready Banner */}
      {updateWaiting && (
        <div 
          role="alert" 
          aria-live="polite"
          className="bg-blue-600 text-white px-4 py-2.5 flex items-center justify-between text-xs border-b border-blue-700 shadow-md relative z-50 animate-fade-in"
        >
          <div className="flex items-center gap-2">
            <RefreshCw size={14} className="text-blue-200" />
            <span className="font-semibold">CivicPulse has been updated.</span>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              type="button" 
              size="sm" 
              onClick={handleReload} 
              className="text-xs h-7 px-3 font-bold bg-white text-blue-700 hover:bg-blue-50 shadow-xs"
            >
              Reload
            </Button>
            <button
              type="button"
              onClick={() => setUpdateWaiting(false)}
              className="text-blue-200 hover:text-white p-1 cursor-pointer"
              title="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Real Install Prompt Banner */}
      {deferredPrompt && !isInstalled && !dismissed && (
        <div 
          role="banner" 
          aria-label="Install CivicPulse Application"
          className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between text-xs border-b border-slate-800 shadow-md relative z-50 animate-fade-in"
        >
          <div className="flex items-center gap-2.5 max-w-xl">
            <div className="h-7 w-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Download size={14} />
            </div>
            <p className="text-slate-200">
              <strong className="text-white font-bold">Install CivicPulse:</strong> Add to your home screen for rapid access and offline drafting.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-3">
            <Button 
              type="button" 
              size="sm" 
              onClick={handleInstallClick} 
              className="text-xs h-7 px-3 font-bold bg-blue-600 hover:bg-blue-500 text-white"
            >
              Install App
            </Button>
            <button 
              type="button" 
              onClick={() => setDismissed(true)} 
              className="text-slate-400 hover:text-white p-1 rounded-md cursor-pointer transition-colors"
              title="Dismiss install notice"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
