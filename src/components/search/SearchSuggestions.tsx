import { Business, Category } from '@/src/types';
import { useLanguage } from '@/src/lib/i18n';
import { Search, MapPin, Building2, ArrowRight } from 'lucide-react';

interface SearchSuggestionsProps {
  suggestions: Business[];
  categories: Category[];
  query: string;
  onSelectBusiness: (business: Business) => void;
  onSelectCategory: (category: Category) => void;
  onClose: () => void;
}

export function SearchSuggestions({
  suggestions,
  categories,
  query,
  onSelectBusiness,
  onSelectCategory,
  onClose,
}: SearchSuggestionsProps) {
  const { isUrdu } = useLanguage();

  if (!query || query.trim().length === 0) return null;

  const matchingCategories = categories.filter(
    (c) =>
      c.name_en.toLowerCase().includes(query.toLowerCase()) ||
      c.name_ur.includes(query)
  );

  const hasContent = suggestions.length > 0 || matchingCategories.length > 0;

  if (!hasContent) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 text-left">
      {/* Categories Match */}
      {matchingCategories.length > 0 && (
        <div className="p-2 border-b border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1 block">
            Categories
          </span>
          {matchingCategories.slice(0, 3).map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                onSelectCategory(cat);
                onClose();
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-teal-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm transition-colors"
            >
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-teal-600" />
                <span className="font-semibold">{isUrdu ? cat.name_ur : cat.name_en}</span>
              </div>
              <span className="text-xs text-slate-400">Category</span>
            </button>
          ))}
        </div>
      )}

      {/* Businesses Match */}
      {suggestions.length > 0 && (
        <div className="p-2 max-h-72 overflow-y-auto">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1 block">
            Businesses & Places
          </span>
          {suggestions.slice(0, 5).map((b) => (
            <button
              key={b.id}
              onClick={() => {
                onSelectBusiness(b);
                onClose();
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-slate-200">
                  <img
                    src={b.image_url}
                    alt={b.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                    {b.name}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-amber-500" />
                    <span>{b.area?.name_en}</span>
                    <span>•</span>
                    <span className="text-teal-600 dark:text-teal-400 font-medium">
                      {b.category?.name_en}
                    </span>
                  </p>
                </div>
              </div>

              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
