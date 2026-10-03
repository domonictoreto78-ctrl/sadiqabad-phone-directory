import { Business } from '@/src/types';
import { useLanguage } from '@/src/lib/i18n';
import { Container } from '../ui/Container';
import { BusinessGrid } from '../business/BusinessGrid';
import { Sparkles, ArrowRight } from 'lucide-react';

interface FeaturedBusinessesProps {
  businesses: Business[];
  onNavigate?: (path: string) => void;
  onSelectBusiness?: (business: Business) => void;
}

export function FeaturedBusinesses({
  businesses,
  onNavigate,
  onSelectBusiness,
}: FeaturedBusinessesProps) {
  const { t, isUrdu } = useLanguage();

  // Filter featured or highest rated
  const featured = businesses
    .filter((b) => b.is_featured || b.rating >= 4.7)
    .slice(0, 6);

  return (
    <section className="py-16 sm:py-20 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-200/80 dark:border-slate-800">
      <Container size="xl">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isUrdu ? 'اعلیٰ ترین ریٹنگ' : 'Handpicked Top Spots'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {t.featuredBusinesses}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-xl">
              {isUrdu
                ? 'صادق آباد کے سب سے زیادہ قابل اعتماد اور تسلیم شدہ تجارتی ادارے'
                : 'Highest rated medical centers, schools, dining spots, and shopping centers.'}
            </p>
          </div>

          <a
            href="/search?featured=true"
            onClick={(e) => {
              if (onNavigate) {
                e.preventDefault();
                onNavigate('/search?featured=true');
              }
            }}
            className="inline-flex items-center gap-2 text-sm font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 transition-colors group"
          >
            <span>{t.viewAll}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        <BusinessGrid
          businesses={featured}
          onSelectBusiness={onSelectBusiness}
          onNavigate={onNavigate}
        />
      </Container>
    </section>
  );
}
