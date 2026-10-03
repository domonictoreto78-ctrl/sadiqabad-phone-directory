import { SortOption } from '@/src/types';
import { useLanguage } from '@/src/lib/i18n';
import { ArrowUpDown } from 'lucide-react';

interface SortDropdownProps {
  value: SortOption;
  onChange: (option: SortOption) => void;
}

export function SortDropdown({ value, onChange }: SortDropdownProps) {
  const { t } = useLanguage();

  return (
    <div className="relative inline-flex items-center">
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-soft-sm">
        <ArrowUpDown className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
        <span className="text-slate-400 hidden sm:inline">{t.sortBy}:</span>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as SortOption)}
          aria-label={t.sortBy}
          className="bg-transparent font-bold text-slate-800 dark:text-white focus:outline-none cursor-pointer pr-4"
        >
          <option value="relevance">{t.relevance}</option>
          <option value="rating">{t.highestRated}</option>
          <option value="views">{t.mostPopular}</option>
          <option value="name">{t.alphabetical}</option>
          <option value="nearest">{t.nearest}</option>
        </select>
      </div>
    </div>
  );
}
