import { Compass, Search, Grid, MapPin, Heart } from 'lucide-react';
import { useFavorites } from '@/src/hooks/useFavorites';
import { useLanguage } from '@/src/lib/i18n';

interface MobileBottomNavProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

export function MobileBottomNav({
  currentPath = '/',
  onNavigate,
}: MobileBottomNavProps) {
  const { t } = useLanguage();
  const { favoriteCount } = useFavorites();

  const handleLinkClick = (path: string, e: React.MouseEvent) => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate(path);
    }
  };

  const tabs = [
    { label: t.navHome, path: '/', icon: Compass },
    { label: t.navSearch, path: '/search', icon: Search },
    { label: t.navCategories, path: '/categories', icon: Grid },
    { label: t.navMap, path: '/map', icon: MapPin },
    {
      label: t.navFavorites,
      path: '/favorites',
      icon: Heart,
      badge: favoriteCount > 0 ? favoriteCount : undefined,
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200/90 dark:border-slate-800/90 px-2 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom,0px)]">
      <nav className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            currentPath === tab.path ||
            (tab.path !== '/' && currentPath?.startsWith(tab.path));

          return (
            <a
              key={tab.path}
              href={tab.path}
              onClick={(e) => handleLinkClick(tab.path, e)}
              className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-150 ${
                isActive
                  ? 'text-teal-600 dark:text-teal-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110 text-teal-600 dark:text-teal-400' : ''
                  }`}
                />
                {tab.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2 px-1 py-0.2 min-w-4 text-[10px] font-bold text-center leading-tight rounded-full bg-rose-500 text-white">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-1">
                {tab.label}
              </span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-teal-600 dark:bg-teal-400 mt-0.5" />
              )}
            </a>
          );
        })}
      </nav>
    </div>
  );
}
