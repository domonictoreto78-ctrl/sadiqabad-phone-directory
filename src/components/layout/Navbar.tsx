import { useState } from 'react';
import { useLanguage } from '@/src/lib/i18n';
import { ThemeToggle } from './ThemeToggle';
import { LanguageToggle } from './LanguageToggle';
import { Container } from '../ui/Container';
import {
  Compass,
  Search,
  Grid,
  MapPin,
  Heart,
  Menu,
  X,
  PhoneCall,
  PlusCircle,
} from 'lucide-react';
import { useFavorites } from '@/src/hooks/useFavorites';

interface NavbarProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

export function Navbar({ currentPath = '/', onNavigate }: NavbarProps) {
  const { t, isUrdu } = useLanguage();
  const { favoriteCount } = useFavorites();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLinkClick = (path: string, e?: React.MouseEvent) => {
    if (onNavigate) {
      if (e) e.preventDefault();
      onNavigate(path);
      setMobileMenuOpen(false);
    }
  };

  const navLinks = [
    { label: t.navHome, path: '/', icon: Compass },
    { label: t.navSearch, path: '/search', icon: Search },
    { label: t.navCategories, path: '/categories', icon: Grid },
    {
      label: isUrdu ? 'ایمرجنسی' : 'Emergency',
      path: '/emergency',
      icon: PhoneCall,
      emergency: true,
    },
    { label: t.navMap, path: '/map', icon: MapPin },
    {
      label: t.navFavorites,
      path: '/favorites',
      icon: Heart,
      badge: favoriteCount > 0 ? favoriteCount : undefined,
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md transition-colors">
      <Container size="xl">
        <div className="flex h-16 sm:h-20 items-center justify-between gap-4">
          {/* Logo & City Identity */}
          <a
            href="/"
            onClick={(e) => handleLinkClick('/', e)}
            className="flex items-center gap-3 group focus:outline-none"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-teal-700 via-teal-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-teal-600/25 group-hover:scale-105 transition-transform">
              <span className="font-extrabold text-lg tracking-tighter">SQB</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 dark:text-white">
                  Sadiqabad
                </span>
                <span className="text-teal-600 dark:text-teal-400 font-bold text-xs uppercase tracking-wider bg-teal-50 dark:bg-teal-950/60 px-1.5 py-0.5 rounded-md border border-teal-200/50 dark:border-teal-800/50">
                  Directory
                </span>
              </div>
              <span className={`text-[11px] text-slate-500 dark:text-slate-400 ${isUrdu ? 'font-urdu' : ''}`}>
                {isUrdu ? 'صادق آباد فون و بزنس ڈائریکٹری' : 'Verified City Phone Directory'}
              </span>
            </div>
          </a>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                currentPath === link.path ||
                (link.path !== '/' && currentPath?.startsWith(link.path));

              return (
                <a
                  key={link.path}
                  href={link.path}
                  onClick={(e) => handleLinkClick(link.path, e)}
                  className={`relative flex items-center gap-2 px-3 py-2 rounded-xl text-xs lg:text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-teal-500/10 text-teal-700 dark:text-teal-300 font-bold'
                      : link.emergency
                      ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      link.emergency
                        ? 'text-rose-600 dark:text-rose-400 animate-pulse'
                        : isActive
                        ? 'text-teal-600 dark:text-teal-400'
                        : 'text-slate-400'
                    }`}
                  />
                  <span>{link.label}</span>
                  {link.badge !== undefined && (
                    <span className="ml-0.5 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-rose-500 text-white">
                      {link.badge}
                    </span>
                  )}
                </a>
              );
            })}
          </nav>

          {/* Action Tools & Toggles */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={(e) => handleLinkClick('/submit', e)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all active:scale-95"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{isUrdu ? 'کاروبار شامل کریں' : 'Add Business'}</span>
            </button>

            <LanguageToggle />
            <ThemeToggle />

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Open Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-top-2">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = currentPath === link.path;

                return (
                  <a
                    key={link.path}
                    href={link.path}
                    onClick={(e) => handleLinkClick(link.path, e)}
                    className={`flex items-center justify-between p-3 rounded-xl text-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-teal-500/10 text-teal-700 dark:text-teal-300 font-bold'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                      <span>{link.label}</span>
                    </div>
                    {link.badge !== undefined && (
                      <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-rose-500 text-white">
                        {link.badge}
                      </span>
                    )}
                  </a>
                );
              })}

              <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={(e) => handleLinkClick('/submit', e)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-teal-600 text-white font-bold text-xs"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{isUrdu ? 'کاروبار شامل کریں' : 'Add Your Business Listing'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </Container>
    </header>
  );
}
