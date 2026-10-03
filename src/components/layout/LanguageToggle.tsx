import { useLanguage } from '@/src/lib/i18n';
import { Languages } from 'lucide-react';

export function LanguageToggle() {
  const { language, setLanguage, isUrdu } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ur' : 'en');
  };

  return (
    <button
      onClick={toggleLanguage}
      aria-label="Switch Language / زبان تبدیل کریں"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm text-slate-700 dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-slate-800 transition-all hover:border-teal-500/30"
    >
      <Languages className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
      <span>{isUrdu ? 'English' : 'اردو'}</span>
    </button>
  );
}
