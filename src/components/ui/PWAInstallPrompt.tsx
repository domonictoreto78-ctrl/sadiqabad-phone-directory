import { useState, useEffect } from 'react';
import { usePWAInstall } from '@/src/hooks/usePWAInstall';
import { useLanguage } from '@/src/lib/i18n';
import { Download, X, Smartphone, Share, PlusSquare } from 'lucide-react';

export function PWAInstallPrompt() {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const { t, isUrdu } = useLanguage();
  const [dismissed, setDismissed] = useState(true);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    try {
      const isDismissed = localStorage.getItem('sqb_pwa_dismissed');
      // Wait 3 seconds before showing prompt to not interrupt immediate user landing
      const timer = setTimeout(() => {
        if (!isDismissed && !isInstalled && (isInstallable || isIOS)) {
          setDismissed(false);
        }
      }, 3500);
      return () => clearTimeout(timer);
    } catch {
      // Ignore localStorage errors
    }
  }, [isInstallable, isInstalled, isIOS]);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem('sqb_pwa_dismissed', 'true');
    } catch {}
  };

  if (isInstalled || dismissed) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-20 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 animate-in slide-in-from-bottom duration-300">
        <div className="p-4 rounded-3xl bg-slate-900/95 dark:bg-slate-900/95 text-white backdrop-blur-xl border border-teal-500/30 shadow-2xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-600 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-md shrink-0">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-white truncate">
                {isUrdu ? 'صادق آباد ایپ انسٹال کریں' : 'Install Sadiqabad Directory'}
              </h4>
              <p className="text-[11px] text-teal-200/80 truncate">
                {isUrdu ? 'آف لائن اور فوری رسائی کے لیے' : 'Instant 1-tap access & offline mode'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isInstallable && (
              <button
                onClick={install}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isUrdu ? 'انسٹال' : 'Install'}</span>
              </button>
            )}

            {isIOS && (
              <button
                onClick={() => setShowIOSGuide(true)}
                className="px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs transition-colors flex items-center gap-1"
              >
                <Share className="w-3 h-3 text-teal-300" />
                <span>iOS</span>
              </button>
            )}

            <button
              onClick={handleDismiss}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Dismiss install banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Safari Guided Steps Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-teal-600" />
                <span>Install on iPhone / iPad</span>
              </h3>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 shrink-0">
                  <Share className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">1. Tap Share in Safari</p>
                  <p className="text-[11px] text-slate-500">Tap the Share icon at the bottom of your Safari screen.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 shrink-0">
                  <PlusSquare className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">2. Add to Home Screen</p>
                  <p className="text-[11px] text-slate-500">Scroll down the menu and choose "Add to Home Screen".</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
