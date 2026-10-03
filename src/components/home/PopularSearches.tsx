import { POPULAR_SEARCH_TAGS } from '@/src/lib/categories';
import { useLanguage } from '@/src/lib/i18n';
import { Sparkles } from 'lucide-react';

interface PopularSearchesProps {
  onSelectTag?: (query: string) => void;
  className?: string;
}

export function PopularSearches({ onSelectTag, className = '' }: PopularSearchesProps) {
  const { t, isUrdu } = useLanguage();

  return (
    <div className={`flex flex-wrap items-center justify-center gap-2 ${className}`}>
      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 mr-1">
        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
        {t.popularSearches}:
      </span>
      {POPULAR_SEARCH_TAGS.map((tag) => (
        <button
          key={tag.query}
          onClick={() => onSelectTag?.(tag.query)}
          className="text-xs px-3 py-1 rounded-full bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all hover:scale-105 active:scale-95"
        >
          {isUrdu ? tag.label_ur : tag.label_en}
        </button>
      ))}
    </div>
  );
}
