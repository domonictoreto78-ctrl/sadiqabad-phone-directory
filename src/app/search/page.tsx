'use client';

import { useEffect, useState, useMemo } from 'react';
import { Container } from '@/src/components/ui/Container';
import { SearchBar } from '@/src/components/search/SearchBar';
import { FilterPanel } from '@/src/components/search/FilterPanel';
import { SortDropdown } from '@/src/components/search/SortDropdown';
import { BusinessGrid } from '@/src/components/business/BusinessGrid';
import { getBusinesses } from '@/src/lib/supabase';
import { Business, FilterOptions, SortOption } from '@/src/types';
import { useLanguage } from '@/src/lib/i18n';
import { useGeolocation } from '@/src/hooks/useGeolocation';
import { useDebounce } from '@/src/hooks/useDebounce';
import { Filter, SlidersHorizontal, Sparkles } from 'lucide-react';

export default function SearchPage() {
  const { t, isUrdu } = useLanguage();
  const { coords, requestLocation } = useGeolocation();

  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    sort: 'relevance',
  });
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Debounce search text
  const debouncedQuery = useDebounce(query, 300);

  // Read URL params on initial mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const q = urlParams.get('q') || '';
      const category = urlParams.get('category') || undefined;
      const area = urlParams.get('area') || undefined;
      const featured = urlParams.get('featured') === 'true';
      const openNow = urlParams.get('openNow') === 'true';
      const nearMe = urlParams.get('nearMe') === 'true';

      if (q) setQuery(q);
      setFilters((prev) => ({
        ...prev,
        categorySlug: category,
        areaSlug: area,
        openNow,
        verifiedOnly: featured ? true : prev.verifiedOnly,
        sort: nearMe ? 'nearest' : prev.sort,
      }));

      if (nearMe) {
        requestLocation();
      }
    }
  }, []);

  // Fetch businesses whenever query, filters, or coords change
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const results = await getBusinesses({
          ...filters,
          query: debouncedQuery,
          userLat: coords?.latitude,
          userLng: coords?.longitude,
        });
        setBusinesses(results);
      } catch (err) {
        console.error('Error fetching search results:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [debouncedQuery, filters, coords]);

  const handleFilterChange = (updated: Partial<FilterOptions>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
  };

  const handleResetFilters = () => {
    setQuery('');
    setFilters({ sort: 'relevance' });
  };

  return (
    <div className="py-8 sm:py-12 bg-slate-50 dark:bg-slate-950 min-h-screen">
      <Container size="xl">
        {/* Search Bar Header */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {isUrdu ? 'کاروبار و سروسز تلاش کریں' : 'Search Sadiqabad Directory'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                {businesses.length} verified listings found in Sadiqabad
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileFilterOpen(true)}
                className="lg:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold shadow-soft-sm"
              >
                <SlidersHorizontal className="w-4 h-4 text-teal-600" />
                <span>{t.filters}</span>
              </button>

              <SortDropdown
                value={filters.sort || 'relevance'}
                onChange={(sort: SortOption) => handleFilterChange({ sort })}
              />
            </div>
          </div>

          <SearchBar
            value={query}
            onChange={setQuery}
            onSubmit={() => {}}
            selectedCategory={filters.categorySlug}
            onSelectCategory={(categorySlug) =>
              handleFilterChange({ categorySlug: categorySlug || undefined })
            }
            onNearMe={requestLocation}
            onToggleFilters={() => setMobileFilterOpen(true)}
            suggestions={businesses}
            onSelectSuggestion={(b) => {
              if (typeof window !== 'undefined') {
                window.location.href = `/business/${b.id}`;
              }
            }}
          />
        </div>

        {/* Content Layout: Filters Sidebar + Results Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Desktop Filter Panel */}
          <div className="hidden lg:block lg:col-span-1 sticky top-24">
            <FilterPanel
              filters={filters}
              onChange={handleFilterChange}
              onReset={handleResetFilters}
            />
          </div>

          {/* Results Grid */}
          <div className="lg:col-span-3">
            <BusinessGrid
              businesses={businesses}
              isLoading={isLoading}
              onResetFilters={handleResetFilters}
            />
          </div>
        </div>

        {/* Mobile Filter Drawer */}
        {mobileFilterOpen && (
          <div className="fixed inset-0 z-50 flex bg-black/50 backdrop-blur-sm lg:hidden">
            <div className="w-full max-w-sm ml-auto h-full bg-white dark:bg-slate-900 overflow-y-auto p-4 animate-in slide-in-from-right">
              <FilterPanel
                filters={filters}
                onChange={handleFilterChange}
                onReset={handleResetFilters}
                isMobileDrawer={true}
                onCloseMobileDrawer={() => setMobileFilterOpen(false)}
              />
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
