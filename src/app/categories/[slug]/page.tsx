'use client';

import { useEffect, useState } from 'react';
import { Container } from '@/src/components/ui/Container';
import { BusinessGrid } from '@/src/components/business/BusinessGrid';
import { FilterPanel } from '@/src/components/search/FilterPanel';
import { SortDropdown } from '@/src/components/search/SortDropdown';
import { getBusinesses, getCategories } from '@/src/lib/supabase';
import { Business, Category, FilterOptions, SortOption } from '@/src/types';
import { useLanguage } from '@/src/lib/i18n';
import { STATIC_CATEGORIES } from '@/src/lib/categories';
import { ArrowLeft, Building2 } from 'lucide-react';

interface CategoryDetailPageProps {
  params: Promise<{ slug: string }> | { slug: string };
}

export default function CategoryDetailPage({ params }: CategoryDetailPageProps) {
  const { t, isUrdu } = useLanguage();
  const [resolvedSlug, setResolvedSlug] = useState<string>('');
  const [category, setCategory] = useState<Category | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({ sort: 'relevance' });
  const [isLoading, setIsLoading] = useState(true);

  // Unwrap params if it's a promise
  useEffect(() => {
    Promise.resolve(params).then((resolved) => {
      setResolvedSlug(resolved.slug);
      const cat = STATIC_CATEGORIES.find((c) => c.slug === resolved.slug);
      if (cat) setCategory(cat);
      setFilters((prev) => ({ ...prev, categorySlug: resolved.slug }));
    });
  }, [params]);

  useEffect(() => {
    if (!resolvedSlug) return;
    async function fetchCategoryData() {
      setIsLoading(true);
      try {
        const results = await getBusinesses({
          ...filters,
          categorySlug: resolvedSlug,
        });
        setBusinesses(results);
      } catch (err) {
        console.error('Error fetching category businesses:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCategoryData();
  }, [resolvedSlug, filters]);

  const categoryTitleEn = category ? category.name_en : resolvedSlug.replace('-', ' ');
  const categoryTitleUr = category ? category.name_ur : '';

  return (
    <div className="py-10 bg-slate-50 dark:bg-slate-950 min-h-screen">
      <Container size="xl">
        {/* Back navigation */}
        <div className="mb-6">
          <a
            href="/categories"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-teal-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Categories</span>
          </a>
        </div>

        {/* Category Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft-sm mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: category?.color || '#0F766E' }}
              />
              <span className="text-xs font-bold uppercase tracking-wider text-teal-600">
                Sadiqabad Category
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white capitalize">
              {categoryTitleEn}
            </h1>
            {categoryTitleUr && (
              <p className="text-lg sm:text-xl font-urdu text-slate-500 mt-1">
                {categoryTitleUr}
              </p>
            )}
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {businesses.length} Verified Places
            </span>
            <SortDropdown
              value={filters.sort || 'relevance'}
              onChange={(sort: SortOption) => setFilters((p) => ({ ...p, sort }))}
            />
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="hidden lg:block lg:col-span-1">
            <FilterPanel
              filters={filters}
              onChange={(upd) => setFilters((p) => ({ ...p, ...upd }))}
              onReset={() => setFilters({ categorySlug: resolvedSlug, sort: 'relevance' })}
            />
          </div>

          <div className="lg:col-span-3">
            <BusinessGrid
              businesses={businesses}
              isLoading={isLoading}
              onResetFilters={() => setFilters({ categorySlug: resolvedSlug, sort: 'relevance' })}
            />
          </div>
        </div>
      </Container>
    </div>
  );
}
