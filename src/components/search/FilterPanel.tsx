import { FilterOptions } from '@/src/types';
import { useLanguage } from '@/src/lib/i18n';
import { STATIC_CATEGORIES, STATIC_AREAS } from '@/src/lib/categories';
import { Filter, X, Check, Star, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '../ui/Button';

interface FilterPanelProps {
  filters: FilterOptions;
  onChange: (updated: Partial<FilterOptions>) => void;
  onReset: () => void;
  className?: string;
  isMobileDrawer?: boolean;
  onCloseMobileDrawer?: () => void;
}

export function FilterPanel({
  filters,
  onChange,
  onReset,
  className,
  isMobileDrawer = false,
  onCloseMobileDrawer,
}: FilterPanelProps) {
  const { t, isUrdu } = useLanguage();

  const activeFiltersCount = [
    Boolean(filters.categorySlug),
    Boolean(filters.areaSlug),
    Boolean(filters.openNow),
    Boolean(filters.verifiedOnly),
    Boolean(filters.minRating && filters.minRating > 0),
  ].filter(Boolean).length;

  return (
    <div
      className={`rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-soft-sm ${
        className || ''
      }`}
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            {t.filters}
          </h3>
          {activeFiltersCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-teal-500 text-white">
              {activeFiltersCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {activeFiltersCount > 0 && (
            <button
              onClick={onReset}
              className="text-xs font-semibold text-rose-500 hover:text-rose-600 transition-colors"
            >
              {t.resetFilters}
            </button>
          )}

          {isMobileDrawer && onCloseMobileDrawer && (
            <button
              onClick={onCloseMobileDrawer}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* Category Filter */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            {t.navCategories}
          </label>
          <select
            value={filters.categorySlug || ''}
            onChange={(e) =>
              onChange({ categorySlug: e.target.value || undefined })
            }
            aria-label="Filter by Category"
            className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">{t.allCategories}</option>
            {STATIC_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.slug}>
                {isUrdu ? cat.name_ur : cat.name_en}
              </option>
            ))}
          </select>
        </div>

        {/* Area of Sadiqabad Filter */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            {t.allAreas}
          </label>
          <select
            value={filters.areaSlug || ''}
            onChange={(e) =>
              onChange({ areaSlug: e.target.value || undefined })
            }
            aria-label="Filter by Area"
            className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">{t.allAreas}</option>
            {STATIC_AREAS.map((area) => (
              <option key={area.id} value={area.slug}>
                {isUrdu ? area.name_ur : area.name_en}
              </option>
            ))}
          </select>
        </div>

        {/* Quick Toggles: Open Now & Verified Only */}
        <div className="space-y-3 pt-2">
          {/* Open Now Toggle */}
          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 cursor-pointer hover:bg-slate-100 transition-colors">
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {t.openNow}
              </span>
            </div>
            <input
              type="checkbox"
              checked={Boolean(filters.openNow)}
              onChange={(e) => onChange({ openNow: e.target.checked })}
              className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
            />
          </label>

          {/* Verified Only Toggle */}
          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 cursor-pointer hover:bg-slate-100 transition-colors">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-teal-500" />
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {t.verifiedOnly}
              </span>
            </div>
            <input
              type="checkbox"
              checked={Boolean(filters.verifiedOnly)}
              onChange={(e) => onChange({ verifiedOnly: e.target.checked })}
              className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
            />
          </label>
        </div>

        {/* Rating Filter Buttons */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            {t.minRating}
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {[0, 4.0, 4.5, 4.8].map((score) => {
              const isSelected = (filters.minRating || 0) === score;
              return (
                <button
                  key={score}
                  type="button"
                  onClick={() => onChange({ minRating: score === 0 ? undefined : score })}
                  className={`py-2 px-2 text-xs font-bold rounded-xl border flex items-center justify-center gap-1 transition-all ${
                    isSelected
                      ? 'bg-amber-500 border-amber-500 text-slate-950 shadow-sm'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {score === 0 ? (
                    'Any'
                  ) : (
                    <>
                      <span>{score}</span>
                      <Star className="w-3 h-3 fill-current" />
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {isMobileDrawer && onCloseMobileDrawer && (
          <Button
            variant="primary"
            className="w-full mt-4"
            onClick={onCloseMobileDrawer}
          >
            Apply Filters
          </Button>
        )}
      </div>
    </div>
  );
}
