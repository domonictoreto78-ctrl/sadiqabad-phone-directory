import React, { useState } from 'react';
import { AdminSession, signOutAdmin } from '@/src/lib/supabase';
import { useLanguage } from '@/src/lib/i18n';
import { ThemeToggle } from '../layout/ThemeToggle';
import { LanguageToggle } from '../layout/LanguageToggle';
import {
  LayoutDashboard,
  Building2,
  PlusCircle,
  Layers,
  MapPin,
  FileSpreadsheet,
  History,
  Users,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Shield,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

interface AdminLayoutProps {
  session: AdminSession;
  currentPath: string;
  onNavigate: (path: string) => void;
  children: React.ReactNode;
}

export function AdminLayout({
  session,
  currentPath,
  onNavigate,
  children,
}: AdminLayoutProps) {
  const { isUrdu } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isSuperAdmin = session.role === 'super_admin';

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Businesses', path: '/admin/businesses', icon: Building2 },
    { label: 'Add Business', path: '/admin/businesses/new', icon: PlusCircle },
    { label: 'Categories', path: '/admin/categories', icon: Layers },
    { label: 'Areas', path: '/admin/areas', icon: MapPin },
    { label: 'Bulk Import', path: '/admin/import', icon: FileSpreadsheet, badge: 'Excel' },
    { label: 'Activity Logs', path: '/admin/logs', icon: History },
    ...(isSuperAdmin
      ? [{ label: 'Admin Users', path: '/admin/users', icon: Users, badge: 'Super' }]
      : []),
  ];

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out of the Sadiqabad Admin Panel?')) {
      await signOutAdmin();
      onNavigate('/admin/login');
    }
  };

  const handleNavClick = (path: string) => {
    onNavigate(path);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row antialiased">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-64 lg:w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out shrink-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Logo & Brand */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-700 via-teal-600 to-teal-500 text-white flex items-center justify-center font-extrabold text-lg shadow-md shadow-teal-500/20">
                SQB
              </div>
              <div>
                <h2 className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white leading-tight">
                  Sadiqabad Admin
                </h2>
                <span className="text-[11px] font-semibold text-teal-600 dark:text-teal-400">
                  Control Center
                </span>
              </div>
            </div>

            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile Mini Card */}
          <div className="p-4 mx-4 my-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <div className="flex items-center gap-2 mb-1.5">
              <Shield className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span
                className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                  isSuperAdmin
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                    : 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-300 dark:border-teal-800'
                }`}
              >
                {isSuperAdmin ? 'Super Admin' : 'Editor'}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
              {session.user.email}
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 space-y-1 overflow-y-auto max-h-[calc(100vh-270px)]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                currentPath === item.path ||
                (item.path !== '/admin' && currentPath.startsWith(item.path));

              return (
                <button
                  key={item.path}
                  onClick={() => handleNavClick(item.path)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-teal-500/10 text-teal-700 dark:text-teal-300 font-bold shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                        item.badge === 'Excel'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <button
            onClick={() => onNavigate('/')}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5" />
              <span>View Public Directory</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 sm:h-20 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Open Admin Menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white capitalize truncate">
                {currentPath.replace('/admin', '').replace('/', '') || 'Dashboard'}
              </h1>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Sadiqabad City Directory • Content & Data Management
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageToggle />
            <ThemeToggle />

            <button
              onClick={() => onNavigate('/')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-colors shadow-soft-sm"
            >
              <ExternalLink className="w-3.5 h-3.5 text-teal-600" />
              <span>Live Site</span>
            </button>
          </div>
        </header>

        {/* Page View Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-20">
          {children}
        </main>
      </div>
    </div>
  );
}
