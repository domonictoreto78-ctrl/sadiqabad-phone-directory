import { useState, useEffect } from 'react';
import { useLanguage } from '@/src/lib/i18n';
import { Container } from '../ui/Container';
import { EmergencyContact } from '@/src/types';
import { getEmergencyContacts } from '@/src/lib/supabase';
import { generateCallUrl } from '@/src/lib/phone';
import {
  PhoneCall,
  ShieldAlert,
  Flame,
  Ambulance,
  HeartPulse,
  ArrowRight,
} from 'lucide-react';

interface EmergencyStripProps {
  onNavigate?: (path: string) => void;
}

export function EmergencyStrip({ onNavigate }: EmergencyStripProps) {
  const { t, isUrdu } = useLanguage();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);

  useEffect(() => {
    async function loadContacts() {
      try {
        const data = await getEmergencyContacts();
        setContacts(data.slice(0, 4));
      } catch (err) {
        console.error('Error loading emergency strip contacts:', err);
      }
    }
    loadContacts();
  }, []);

  const getIcon = (cat: string, name: string) => {
    const lower = `${cat} ${name}`.toLowerCase();
    if (lower.includes('fire')) return <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400" />;
    if (lower.includes('medical') || lower.includes('ambulance') || lower.includes('edhi'))
      return <Ambulance className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
    if (lower.includes('police') || lower.includes('15'))
      return <ShieldAlert className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
    return <PhoneCall className="w-5 h-5 text-rose-600 dark:text-rose-400" />;
  };

  return (
    <div className="w-full -mt-10 relative z-20">
      <Container size="xl">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-900/5 backdrop-blur-md">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600" />
              </span>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {t.emergencyTitle}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {t.emergencySubtitle}
                </p>
              </div>
            </div>

            {onNavigate && (
              <button
                onClick={() => onNavigate('/emergency')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 transition-colors self-start sm:self-auto"
              >
                <span>{isUrdu ? 'تمام ایمرجنسی نمبرز دیکھیں' : 'View All Emergency Helplines'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Emergency Helpline Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {contacts.map((item) => (
              <a
                key={item.id}
                href={generateCallUrl(item.phone)}
                className="group relative flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-slate-50 hover:bg-rose-50/60 dark:bg-slate-800/60 dark:hover:bg-rose-950/20 border border-slate-200/60 hover:border-rose-300 dark:border-slate-700/60 dark:hover:border-rose-900/60 transition-all duration-200 hover:shadow-soft-md"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform shrink-0">
                    {getIcon(item.category, item.name_en)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                      {isUrdu ? item.name_ur : item.name_en}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                      {item.category}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0 pl-2">
                  <span className="font-mono text-base font-extrabold text-rose-600 dark:text-rose-400 group-hover:scale-105 transition-transform">
                    {item.phone}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-slate-400 group-hover:text-rose-600 transition-colors">
                    Dial Now
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
}
