import { useState, useEffect } from 'react';
import { EmergencyContact } from '@/src/types';
import { getEmergencyContacts } from '@/src/lib/supabase';
import { useLanguage } from '@/src/lib/i18n';
import { Container } from '../ui/Container';
import { generateCallUrl } from '@/src/lib/phone';
import {
  PhoneCall,
  ShieldAlert,
  Flame,
  Ambulance,
  HeartPulse,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react';

interface EmergencyPageProps {
  onNavigate: (path: string) => void;
}

export function EmergencyPage({ onNavigate }: EmergencyPageProps) {
  const { isUrdu } = useLanguage();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadContacts() {
      setLoading(true);
      try {
        const data = await getEmergencyContacts();
        setContacts(data);
      } catch (err) {
        console.error('Error loading emergency contacts:', err);
      } finally {
        setLoading(false);
      }
    }
    loadContacts();
  }, []);

  const filtered = contacts.filter((c) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name_en.toLowerCase().includes(q) ||
      c.name_ur.includes(q) ||
      c.phone.includes(q) ||
      c.category.toLowerCase().includes(q)
    );
  });

  // Group by category
  const categories = Array.from(new Set(filtered.map((c) => c.category)));

  const getCategoryIcon = (cat: string) => {
    const lower = cat.toLowerCase();
    if (lower.includes('fire')) return <Flame className="w-5 h-5 text-rose-500" />;
    if (lower.includes('medical') || lower.includes('ambulance') || lower.includes('health'))
      return <Ambulance className="w-5 h-5 text-emerald-500" />;
    if (lower.includes('police') || lower.includes('law'))
      return <ShieldAlert className="w-5 h-5 text-blue-500" />;
    return <HeartPulse className="w-5 h-5 text-amber-500" />;
  };

  return (
    <div className="py-8 sm:py-12 bg-slate-50 dark:bg-slate-950 min-h-screen">
      <Container size="xl">
        {/* Top Breadcrumb */}
        <div className="mb-6">
          <button
            onClick={() => onNavigate('/')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-teal-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{isUrdu ? '← ہوم پیج پر واپس جائیں' : '← Back to Home'}</span>
          </button>
        </div>

        {/* Hero Header */}
        <div className="p-6 sm:p-10 rounded-3xl bg-gradient-to-r from-rose-900 via-rose-800 to-slate-900 text-white shadow-soft-lg mb-8 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-200 text-xs font-bold uppercase tracking-wider mb-3">
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
              <span>24/7 Sadiqabad Emergency Helplines</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
              {isUrdu
                ? 'صادق آباد ایمرجنسی و لائف سیونگ رابطہ نمبرز'
                : 'Emergency & Urgent Assistance Directory'}
            </h1>
            <p className="text-xs sm:text-sm text-rose-100/90 mt-2 leading-relaxed">
              {isUrdu
                ? 'کسی بھی ایمرجنسی میں ریسکیو، پولیس، فائر بریگیڈ اور ایمبولینس سروسز کو ایک کلک سے کال کریں۔'
                : 'Direct one-tap toll-free access to ambulance, civil defense, law enforcement, and municipal disaster helplines.'}
            </p>
          </div>

          <div className="mt-6 max-w-md relative z-10">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isUrdu ? 'ہیلپ لائن یا سروس تلاش کریں...' : 'Search emergency helplines...'}
                className="w-full py-3 pl-10 pr-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/60 text-xs focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
            </div>
          </div>
        </div>

        {/* Categories Grouping */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-400">Loading Helplines...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <p className="text-xs text-slate-500">No emergency contacts matched your search.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {categories.map((cat) => {
              const catContacts = filtered.filter((c) => c.category === cat);
              return (
                <div key={cat} className="space-y-4">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200 dark:border-slate-800">
                    <div className="p-2 rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-slate-200/80 dark:border-slate-800">
                      {getCategoryIcon(cat)}
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      {cat}
                    </h2>
                    <span className="text-xs text-slate-400 font-semibold">
                      ({catContacts.length})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {catContacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft-sm hover:shadow-soft-md transition-all flex flex-col justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-200/40">
                              24/7 Helpline
                            </span>
                            <span className="text-xs text-slate-400 font-mono">
                              #{contact.sort_order}
                            </span>
                          </div>

                          <h3 className="text-base font-bold text-slate-900 dark:text-white">
                            {contact.name_en}
                          </h3>
                          {contact.name_ur && (
                            <p className="text-xs font-urdu font-semibold text-slate-500 mt-0.5">
                              {contact.name_ur}
                            </p>
                          )}
                        </div>

                        <div>
                          <a
                            href={generateCallUrl(contact.phone)}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-700 hover:to-rose-600 text-white font-extrabold text-sm shadow-md shadow-rose-600/25 transition-transform active:scale-[0.98]"
                          >
                            <PhoneCall className="w-4 h-4 animate-bounce" />
                            <span>Call {contact.phone}</span>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Offline Disclaimer Notice */}
        <div className="mt-12 p-5 rounded-2xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400 space-y-1">
          <p className="font-semibold text-slate-700 dark:text-slate-300">
            {isUrdu
              ? 'یہ تمام نمبرز آف لائن پی ڈبلیو اے کیش میں محفوظ رہتے ہیں۔'
              : 'All nationwide and municipal helplines are cached offline in this app for immediate availability.'}
          </p>
          <p className="text-[11px]">
            In case of telecommunication outage, standard SIM emergency dialing rules apply.
          </p>
        </div>
      </Container>
    </div>
  );
}
