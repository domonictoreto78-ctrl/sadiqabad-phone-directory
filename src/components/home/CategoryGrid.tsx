import { useLanguage } from '@/src/lib/i18n';
import { Category } from '@/src/types';
import { Container } from '../ui/Container';
import {
  Stethoscope,
  Hospital,
  Pill,
  GraduationCap,
  UtensilsCrossed,
  Smartphone,
  Zap,
  Wrench,
  Building2,
  Hotel,
  Scissors,
  ShoppingCart,
  ArrowRight,
} from 'lucide-react';

interface CategoryGridProps {
  categories: Category[];
  onSelectCategory?: (slug: string) => void;
  onNavigate?: (path: string) => void;
}

export function CategoryGrid({
  categories,
  onSelectCategory,
  onNavigate,
}: CategoryGridProps) {
  const { t, isUrdu } = useLanguage();

  const renderIcon = (iconName: string) => {
    const props = { className: 'w-6 h-6' };
    switch (iconName) {
      case 'Stethoscope':
        return <Stethoscope {...props} />;
      case 'Hospital':
        return <Hospital {...props} />;
      case 'Pill':
        return <Pill {...props} />;
      case 'GraduationCap':
        return <GraduationCap {...props} />;
      case 'UtensilsCrossed':
        return <UtensilsCrossed {...props} />;
      case 'Smartphone':
        return <Smartphone {...props} />;
      case 'Zap':
        return <Zap {...props} />;
      case 'Wrench':
        return <Wrench {...props} />;
      case 'Building2':
        return <Building2 {...props} />;
      case 'Hotel':
        return <Hotel {...props} />;
      case 'Scissors':
        return <Scissors {...props} />;
      case 'ShoppingCart':
        return <ShoppingCart {...props} />;
      default:
        return <Building2 {...props} />;
    }
  };

  const handleClick = (slug: string, e: React.MouseEvent) => {
    if (onSelectCategory) {
      e.preventDefault();
      onSelectCategory(slug);
    } else if (onNavigate) {
      e.preventDefault();
      onNavigate(`/categories/${slug}`);
    }
  };

  return (
    <section className="py-16 sm:py-20 w-full">
      <Container size="xl">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-2">
              <span>{isUrdu ? 'شعبہ جات' : 'City Directory'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {t.exploreCategories}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-xl">
              {isUrdu
                ? 'صادق آباد کے تمام بڑے شعبہ جات، ماہرین اور سروسز کی فہرست'
                : 'Browse verified contacts by sector, healthcare services, markets, and shops.'}
            </p>
          </div>

          <a
            href="/categories"
            onClick={(e) => {
              if (onNavigate) {
                e.preventDefault();
                onNavigate('/categories');
              }
            }}
            className="inline-flex items-center gap-2 text-sm font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 transition-colors group"
          >
            <span>{t.viewAll} (12)</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-5">
          {categories.map((category) => (
            <a
              key={category.id}
              href={`/categories/${category.slug}`}
              onClick={(e) => handleClick(category.slug, e)}
              className="group relative flex flex-col items-center text-center p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft-sm hover:shadow-soft-lg hover:-translate-y-1.5 transition-all duration-300"
            >
              {/* Category Icon Circle */}
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-3.5 shadow-md transition-transform duration-300 group-hover:scale-110"
                style={{
                  backgroundColor: category.color || '#0F766E',
                  boxShadow: `0 8px 20px -4px ${category.color}40`,
                }}
              >
                {renderIcon(category.icon)}
              </div>

              {/* Title & Urdu Title */}
              <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors line-clamp-1">
                {isUrdu ? category.name_ur : category.name_en}
              </h3>
              <span className={`text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 ${isUrdu ? 'font-sans' : 'font-urdu'}`}>
                {isUrdu ? category.name_en : category.name_ur}
              </span>

              {/* Listing Count Badge */}
              <span className="mt-3 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-teal-50 dark:group-hover:bg-teal-950/60 group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors">
                {category.businesses_count || 3}+ Places
              </span>
            </a>
          ))}
        </div>
      </Container>
    </section>
  );
}
