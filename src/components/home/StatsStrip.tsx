import { useLanguage } from '@/src/lib/i18n';
import { Container } from '../ui/Container';
import { Building2, Layers, MapPin, ShieldCheck } from 'lucide-react';

interface StatsStripProps {
  totalBusinesses?: number;
  totalCategories?: number;
  totalAreas?: number;
}

export function StatsStrip({
  totalBusinesses = 500,
  totalCategories = 12,
  totalAreas = 8,
}: StatsStripProps) {
  const { t } = useLanguage();

  const stats = [
    {
      label: t.statsBusinesses,
      value: `${totalBusinesses}+`,
      icon: Building2,
      color: 'text-teal-600 dark:text-teal-400',
      bgColor: 'bg-teal-500/10',
    },
    {
      label: t.statsCategories,
      value: `${totalCategories}`,
      icon: Layers,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-500/10',
    },
    {
      label: t.statsAreas,
      value: `${totalAreas}`,
      icon: MapPin,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: t.statsVerified,
      value: '100%',
      icon: ShieldCheck,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-500/10',
    },
  ];

  return (
    <div className="w-full py-12 border-y border-slate-200/80 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30">
      <Container size="xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-soft-sm hover:shadow-soft-md transition-shadow"
              >
                <div
                  className={`w-12 h-12 rounded-2xl ${stat.bgColor} flex items-center justify-center shrink-0`}
                >
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                    {stat.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </div>
  );
}
