import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/src/lib/i18n';
import { STATIC_CATEGORIES, STATIC_AREAS } from '@/src/lib/categories';
import { Business, Category, ParsedSearchFilters } from '@/src/types';
import { SearchSuggestions } from './SearchSuggestions';
import { callAISearch } from '@/src/lib/supabase';
import { parseQueryWithSynonyms } from '@/src/lib/transliteration';
import { Search, X, Navigation, Filter, Sparkles, Check } from 'lucide-react';
import { useGeolocation } from '@/src/hooks/useGeolocation';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  selectedCategory?: string;
  onSelectCategory?: (slug: string) => void;
  onNearMe?: () => void;
  onToggleFilters?: () => void;
  suggestions?: Business[];
  onSelectSuggestion?: (business: Business) => void;
  onAiResults?: (results: Business[], filters: ParsedSearchFilters) => void;
  autoFocus?: boolean;
}

export function SearchBar({
  value,
  onChange,
  onSubmit,
  selectedCategory,
  onSelectCategory,
  onNearMe,
  onToggleFilters,
  suggestions = [],
  onSelectSuggestion,
  onAiResults,
  autoFocus = false,
}: SearchBarProps) {
  const { t, isUrdu } = useLanguage();
  const [isFocused, setIsFocused] = useState(false);
  const [aiMode, setAiMode] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [understoodChips, setUnderstoodChips] = useState<{ id: string; label: string; key: keyof ParsedSearchFilters }[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const { loading: geoLoading, requestLocation } = useGeolocation();

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleNearMeClick = () => {
    requestLocation();
    if (onNearMe) onNearMe();
  };

  const handleExecuteSearch = async () => {
    setIsFocused(false);

    if (aiMode && value.trim()) {
      setIsAiLoading(true);
      try {
        const aiRes = await callAISearch(value, isUrdu ? 'ur' : 'en');
        let filters = aiRes.filters;

        // If AI Gateway returned no filters or source was fallback, use local synonym dictionary
        if (!filters || Object.keys(filters).length === 0) {
          filters = parseQueryWithSynonyms(value);
        }

        // Generate chips for understood filters
        const chips: { id: string; label: string; key: keyof ParsedSearchFilters }[] = [];
        if (filters.category_slug) {
          const cat = STATIC_CATEGORIES.find((c) => c.slug === filters.category_slug);
          chips.push({
            id: 'chip-cat',
            label: isUrdu ? `کیٹیگری: ${cat?.name_ur || filters.category_slug}` : `Category: ${cat?.name_en || filters.category_slug}`,
            key: 'category_slug',
          });
        }
        if (filters.area_slug) {
          const ar = STATIC_AREAS.find((a) => a.slug === filters.area_slug);
          chips.push({
            id: 'chip-area',
            label: isUrdu ? `علاقہ: ${ar?.name_ur || filters.area_slug}` : `Area: ${ar?.name_en || filters.area_slug}`,
            key: 'area_slug',
          });
        }
        if (filters.open_now) {
          chips.push({
            id: 'chip-open',
            label: isUrdu ? 'اس وقت کھلا ہے' : 'Open Now',
            key: 'open_now',
          });
        }
        if (filters.min_rating) {
          chips.push({
            id: 'chip-rating',
            label: `Min Rating: ★ ${filters.min_rating}+`,
            key: 'min_rating',
          });
        }

        setUnderstoodChips(chips);

        if (onAiResults && aiRes.results && aiRes.results.length > 0) {
          onAiResults(aiRes.results, filters);
          return;
        }
      } catch {
        // Silently fall back to standard submit
      } finally {
        setIsAiLoading(false);
      }
    }

    onSubmit();
  };

  const handleRemoveChip = (chipId: string) => {
    setUnderstoodChips((prev) => prev.filter((c) => c.id !== chipId));
    // Trigger re-search
    onSubmit();
  };

  return (
    <div ref={containerRef} className="relative w-full space-y-2">
      <div className={`flex items-center gap-2 rounded-2xl bg-white dark:bg-slate-900 border transition-all p-2 shadow-soft-sm ${
        aiMode
          ? 'border-teal-500 ring-2 ring-teal-500/20'
          : 'border-slate-200 dark:border-slate-800 focus-within:ring-2 focus-within:ring-teal-500/40 focus-within:border-teal-500'
      }`}>
        {/* Search icon */}
        <Search className={`w-5 h-5 ml-3 shrink-0 ${aiMode ? 'text-teal-500' : 'text-slate-400'}`} />

        {/* Input field */}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleExecuteSearch();
            }
          }}
          autoFocus={autoFocus}
          placeholder={
            aiMode
              ? (isUrdu ? 'اے آئی سمارٹ سرچ: مثلاً "سستا پیزا"، "ڈاکٹر ہسپتال روڈ پر"...' : 'AI Smart Search: e.g. "sasta pizza", "doctor near hospital road", "open now pharmacy"...')
              : t.searchPlaceholder
          }
          className="flex-1 min-w-0 bg-transparent py-2 px-1 text-sm sm:text-base font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
        />

        {/* Clear Button */}
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              setUnderstoodChips([]);
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label="Clear search input"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* AI Smart Search Toggle Button */}
        <button
          type="button"
          onClick={() => {
            setAiMode(!aiMode);
            if (!aiMode) setUnderstoodChips([]);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            aiMode
              ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 shadow-sm shadow-amber-500/30 ring-2 ring-amber-400/40'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-slate-700'
          }`}
          title="Toggle AI Smart Search (Natural Language, Roman Urdu & English)"
        >
          <Sparkles className={`w-3.5 h-3.5 ${aiMode ? 'text-slate-950 fill-current' : 'text-amber-500'}`} />
          <span className="hidden sm:inline">AI Smart</span>
        </button>

        {/* Category Select Dropdown (Hidden when AI Mode is active to prevent conflicting UI) */}
        {!aiMode && onSelectCategory && (
          <div className="hidden md:flex items-center border-l border-slate-200 dark:border-slate-800 pl-2">
            <select
              value={selectedCategory || ''}
              onChange={(e) => onSelectCategory(e.target.value)}
              aria-label="Filter by Category"
              className="bg-transparent text-xs font-semibold text-slate-600 dark:text-slate-300 py-1.5 px-2 focus:outline-none cursor-pointer max-w-[150px] truncate"
            >
              <option value="">{t.allCategories}</option>
              {STATIC_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {isUrdu ? cat.name_ur : cat.name_en}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Near Me button */}
        {onNearMe && (
          <button
            type="button"
            onClick={handleNearMeClick}
            title={t.nearMe}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-slate-700 hover:text-teal-600 transition-colors flex items-center gap-1.5 text-xs font-bold shrink-0"
          >
            <Navigation className={`w-4 h-4 ${geoLoading ? 'animate-spin text-teal-600' : 'text-teal-600 dark:text-teal-400'}`} />
            <span className="hidden sm:inline">{t.nearMe}</span>
          </button>
        )}

        {/* Mobile Filter Toggle Button */}
        {onToggleFilters && (
          <button
            type="button"
            onClick={onToggleFilters}
            className="lg:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors shrink-0"
            aria-label="Toggle Filters"
          >
            <Filter className="w-4 h-4" />
          </button>
        )}

        {/* Submit Search Button */}
        <button
          type="button"
          onClick={handleExecuteSearch}
          disabled={isAiLoading}
          className="px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-teal-500/20 transition-all shrink-0 flex items-center gap-1.5 disabled:opacity-50"
        >
          {isAiLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <span>{isUrdu ? 'تلاش' : 'Search'}</span>
          )}
        </button>
      </div>

      {/* Understood AI Filters as Removable Chips per requirement E.2 */}
      {understoodChips.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap px-1 animate-in fade-in">
          <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>AI Filters:</span>
          </span>
          {understoodChips.map((chip) => (
            <span
              key={chip.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60"
            >
              <span>{chip.label}</span>
              <button
                type="button"
                onClick={() => handleRemoveChip(chip.id)}
                className="hover:text-rose-500"
                aria-label={`Remove filter ${chip.label}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={() => {
              setUnderstoodChips([]);
              onSubmit();
            }}
            className="text-[11px] text-slate-400 hover:text-slate-600 underline font-medium"
          >
            Clear AI Filters
          </button>
        </div>
      )}

      {/* Auto-suggestions dropdown */}
      {isFocused && (
        <SearchSuggestions
          query={value}
          categories={STATIC_CATEGORIES}
          suggestions={suggestions}
          onSelectBusiness={(b) => {
            if (onSelectSuggestion) onSelectSuggestion(b);
            setIsFocused(false);
          }}
          onSelectCategory={(c) => {
            if (onSelectCategory) onSelectCategory(c.slug);
            setIsFocused(false);
          }}
          onClose={() => setIsFocused(false)}
        />
      )}
    </div>
  );
}
