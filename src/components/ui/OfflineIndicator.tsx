import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { useLanguage } from '@/src/lib/i18n';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const { isUrdu } = useLanguage();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top duration-300">
      <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-amber-500 text-slate-950 font-bold text-xs shadow-xl border border-amber-300 backdrop-blur-md">
        <span className="w-2.5 h-2.5 rounded-full bg-slate-950 animate-pulse" />
        <WifiOff className="w-3.5 h-3.5" />
        <span>
          {isUrdu
            ? 'آپ آف لائن ہیں۔ محفوظ شدہ ڈیٹا دکھایا جا رہا ہے۔'
            : 'Offline Mode — Viewing cached directory data.'}
        </span>
      </div>
    </div>
  );
}
