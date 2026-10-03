import React, { useState } from 'react';
import { useLanguage } from '@/src/lib/i18n';
import { Container } from '../ui/Container';
import { STATIC_CATEGORIES, POPULAR_SEARCH_TAGS } from '@/src/lib/categories';
import { Search, MapPin, Navigation, Sparkles, ArrowRight } from 'lucide-react';
import { useGeolocation } from '@/src/hooks/useGeolocation';

interface HeroProps {
  onSearch?: (query: string, categorySlug?: string, useNearMe?: boolean) => void;
  onNavigate?: (path: string) => void;
}

export function Hero({ onSearch, onNavigate }: HeroProps) {
  const { t, isUrdu } = useLanguage();
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const { coords, loading: geoLoading, requestLocation } = useGeolocation();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(query, selectedCategory || undefined, false);
    } else if (onNavigate) {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (selectedCategory) params.set('category', selectedCategory);
      onNavigate(`/search?${params.toString()}`);
    }
  };

  const handleNearMeClick = () => {
    requestLocation();
    if (onSearch) {
      onSearch(query, selectedCategory || undefined, true);
    } else if (onNavigate) {
      onNavigate('/search?nearMe=true');
    }
  };

  const handleTagClick = (tagQuery: string) => {
    setQuery(tagQuery);
    if (onSearch) {
      onSearch(tagQuery, undefined, false);
    } else if (onNavigate) {
      onNavigate(`/search?q=${encodeURIComponent(tagQuery)}`);
    }
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-teal-900 via-teal-800 to-slate-900 text-white pt-12 pb-24 md:pt-20 md:pb-32">
      {/* Decorative ambient gradients and glowing blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none translate-y-1/3" />
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      <Container size="lg" className="relative z-10 text-center">
        {/* City verification pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs sm:text-sm font-medium mb-6 text-teal-200 shadow-soft-sm animate-in fade-in">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Sadiqabad's Official Digital Directory 2026</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
        </div>

        {/* Big bilingual headlines */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-4 leading-tight">
          <span className="font-urdu block mb-2 text-4xl sm:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-amber-200 via-white to-teal-100 bg-clip-text text-transparent">
            صادق آباد کا سب کچھ، ایک جگہ
          </span>
          <span className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-teal-100/90 font-sans">
            Sadiqabad City Phone & Business Directory
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-sm sm:text-base text-teal-100/80 mb-10 leading-relaxed font-light">
          {t.heroSubheadline}
        </p>

        {/* Glassmorphic Search Container */}
        <div className="max-w-3xl mx-auto bg-white/15 dark:bg-slate-900/60 backdrop-blur-xl p-2 sm:p-3 rounded-2xl sm:rounded-3xl border border-white/25 shadow-2xl shadow-teal-950/50">
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-col md:flex-row items-stretch gap-2"
          >
            {/* Search Input */}
            <div className="relative flex-1 flex items-center min-w-0">
              <Search className="absolute left-4 w-5 h-5 text-teal-200 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full pl-12 pr-4 py-3 sm:py-3.5 rounded-xl bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm sm:text-base font-medium focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all shadow-inner"
              />
            </div>

            {/* Category Select Dropdown */}
            <div className="relative md:w-52 flex items-center">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                aria-label="Filter by Category"
                className="w-full px-4 py-3 sm:py-3.5 rounded-xl bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-400 appearance-none cursor-pointer"
              >
                <option value="">{t.allCategories}</option>
                {STATIC_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.slug}>
                    {isUrdu ? cat.name_ur : cat.name_en}
                  </option>
                ))}
              </select>
              <div className="absolute right-3.5 pointer-events-none text-slate-400">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>

            {/* Search Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-slate-950 font-bold text-sm sm:text-base shadow-lg shadow-amber-500/30 transition-transform active:scale-95 focus:outline-none"
              >
                <Search className="w-4 h-4" />
                <span>{isUrdu ? 'تلاش کریں' : 'Search'}</span>
              </button>

              <button
                type="button"
                onClick={handleNearMeClick}
                title="Find businesses closest to your current location"
                className="inline-flex items-center justify-center p-3 sm:p-3.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-medium text-sm border border-white/20 transition-all focus:outline-none"
              >
                <Navigation className={`w-5 h-5 ${geoLoading ? 'animate-spin text-amber-300' : 'text-teal-200'}`} />
                <span className="hidden sm:inline-block ml-1.5 text-xs font-semibold">{t.nearMe}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Popular quick searches tags */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto">
          <span className="text-xs font-semibold text-teal-200/80 mr-1 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            {t.popularSearches}:
          </span>
          {POPULAR_SEARCH_TAGS.map((tag) => (
            <button
              key={tag.query}
              onClick={() => handleTagClick(tag.query)}
              className="text-xs px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/15 backdrop-blur-sm transition-all hover:scale-105 active:scale-95"
            >
              {isUrdu ? tag.label_ur : tag.label_en}
            </button>
          ))}
        </div>
      </Container>
    </div>
  );
}
