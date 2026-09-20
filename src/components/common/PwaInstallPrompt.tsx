import React, { useState, useEffect } from 'react';
import { Download, Check, X } from 'lucide-react';
import { Button } from '../ui/Button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
      return;
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

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

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

  // Only render if a real install prompt is available and not dismissed or installed
  if (!deferredPrompt || isInstalled || dismissed) {
    return null;
  }

  return (
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
          <strong className="text-white font-bold">Install CivicPulse:</strong> Fast access directly from your phone home screen with offline report drafting.
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
  );
};
