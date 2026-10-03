import { useState, useEffect } from 'react';
import {
  getAllBusinessesAdmin,
  getCategories,
  getAreas,
  getAdminLogs,
  getTopSearches,
  getZeroResultSearches,
  AdminSession,
} from '@/src/lib/supabase';
import { Business, Category, Area, AdminLog } from '@/src/types';
import {
  Building2,
  CheckCircle2,
  Sparkles,
  Layers,
  MapPin,
  AlertTriangle,
  FileSpreadsheet,
  PlusCircle,
  TrendingUp,
  History,
  PhoneOff,
  NavigationOff,
  ArrowRight,
  Search,
  SearchX,
} from 'lucide-react';

interface AdminDashboardProps {
  session: AdminSession;
  onNavigate: (path: string) => void;
}

export function AdminDashboard({ session, onNavigate }: AdminDashboardProps) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [topSearches, setTopSearches] = useState<{ query: string; count: number; avg_results: number }[]>([]);
  const [zeroSearches, setZeroSearches] = useState<{ query: string; count: number; last_searched: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [bData, cData, aData, lData, tsData, zsData] = await Promise.all([
          getAllBusinessesAdmin(),
          getCategories(),
          getAreas(),
          getAdminLogs(8),
          getTopSearches(7),
          getZeroResultSearches(7),
        ]);
        setBusinesses(bData);
        setCategories(cData);
        setAreas(aData);
        setLogs(lData);
        setTopSearches(tsData);
        setZeroSearches(zsData);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-400">Loading Dashboard Metrics...</p>
      </div>
    );
  }

  // Metrics
  const totalBusinesses = businesses.length;
  const activeBusinesses = businesses.filter((b) => b.is_active).length;
  const verifiedBusinesses = businesses.filter((b) => b.is_verified).length;
  const featuredBusinesses = businesses.filter((b) => b.is_featured).length;

  // Data Quality Issues
  const missingPhone = businesses.filter((b) => !b.phone || b.phone.trim().length < 5);
  const missingCoords = businesses.filter((b) => !b.latitude || !b.longitude || (b.latitude === 0 && b.longitude === 0));
  const missingDescription = businesses.filter((b) => !b.description || b.description.trim().length === 0);

  // Category counts
  const categoryCounts = categories.map((cat) => {
    const count = businesses.filter((b) => b.category_id === cat.id).length;
    return { ...cat, count };
  }).sort((a, b) => b.count - a.count);

  const maxCount = Math.max(...categoryCounts.map((c) => c.count), 1);

  return (
    <div className="space-y-8">
      {/* Top Banner / Welcome */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white shadow-soft-lg flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-300 mb-2 inline-block">
            Sadiqabad City Directory • Live Administration
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Assalam-o-Alaikum, {session.user.email?.split('@')[0]}!
          </h2>
          <p className="text-xs sm:text-sm text-teal-100/80 mt-1 leading-relaxed">
            Manage city healthcare, emergency helplines, local commerce, and bulk imports for Sadiqabad with real-time Supabase sync.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigate('/admin/businesses/new')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 hover:scale-105 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Business</span>
          </button>

          <button
            onClick={() => onNavigate('/admin/import')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs border border-white/20 backdrop-blur-md transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Bulk Import</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
        {[
          { label: 'Total Places', value: totalBusinesses, icon: Building2, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-950/60' },
          { label: 'Active Places', value: activeBusinesses, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/60' },
          { label: 'Verified', value: verifiedBusinesses, icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/60' },
          { label: 'Featured', value: featuredBusinesses, icon: Sparkles, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/60' },
          { label: 'Categories', value: categories.length, icon: Layers, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/60' },
          { label: 'City Areas', value: areas.length, icon: MapPin, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-950/60' },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft-sm hover:shadow-soft-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {item.label}
                </span>
                <div className={`p-1.5 rounded-lg ${item.bg}`}>
                  <Icon className={`w-4 h-4 ${item.color}`} />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {item.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid: Data Quality + Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Data Quality Health Widget */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Data Quality Widget</span>
            </h3>
            <span className="text-[11px] font-semibold text-slate-400">
              Audit
            </span>
          </div>

          <div className="space-y-3">
            {/* Missing Phone */}
            <div
              onClick={() => onNavigate('/admin/businesses?missingPhone=true')}
              className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40 flex items-center justify-between cursor-pointer hover:bg-rose-100/60 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white dark:bg-slate-800 shadow-xs">
                  <PhoneOff className="w-4 h-4 text-rose-500" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Missing Phone Number
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Directory listings cannot receive direct dials
                  </p>
                </div>
              </div>
              <span className="text-sm font-extrabold text-rose-600 font-mono">
                {missingPhone.length}
              </span>
            </div>

            {/* Missing Coordinates */}
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white dark:bg-slate-800 shadow-xs">
                  <NavigationOff className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Missing Coordinates
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Cannot be plotted on the interactive city map
                  </p>
                </div>
              </div>
              <span className="text-sm font-extrabold text-amber-600 font-mono">
                {missingCoords.length}
              </span>
            </div>

            {/* Missing Description */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white dark:bg-slate-800 shadow-xs">
                  <Building2 className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Empty Description
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Lacks profile overview text
                  </p>
                </div>
              </div>
              <span className="text-sm font-extrabold text-slate-600 font-mono">
                {missingDescription.length}
              </span>
            </div>
          </div>
        </div>

        {/* Category Breakdown Bar Chart */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-600" />
              <span>Businesses Per Category</span>
            </h3>
            <button
              onClick={() => onNavigate('/admin/categories')}
              className="text-xs font-bold text-teal-600 hover:text-teal-700"
            >
              View Categories →
            </button>
          </div>

          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
            {categoryCounts.map((cat) => {
              const percentage = Math.round((cat.count / maxCount) * 100);
              return (
                <div key={cat.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-800 dark:text-slate-200 truncate pr-2">
                      {cat.name_en}
                    </span>
                    <span className="font-mono text-slate-500 font-bold shrink-0">
                      {cat.count}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(percentage, 4)}%`,
                        backgroundColor: cat.color || '#0F766E',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Search Intelligence Widgets (Part 3) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Searches (7 days) */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Search className="w-4 h-4 text-teal-600" />
              <span>Top Searches (7 Days)</span>
            </h3>
            <span className="text-[11px] font-bold text-slate-400">
              User Demand
            </span>
          </div>

          {topSearches.length === 0 ? (
            <p className="text-xs text-slate-400 py-3">No searches recorded this week.</p>
          ) : (
            <div className="space-y-2">
              {topSearches.map((ts, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold text-xs font-mono">
                      #{idx + 1}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        "{ts.query}"
                      </h4>
                      <span className="text-[10px] text-slate-400">
                        Avg. {ts.avg_results} results found
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-teal-600 font-mono">
                    {ts.count} query{ts.count > 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Searches with No Results */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <SearchX className="w-4 h-4 text-amber-500" />
              <span>Searches with No Results</span>
            </h3>
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
              Supply Gaps
            </span>
          </div>

          {zeroSearches.length === 0 ? (
            <p className="text-xs text-slate-400 py-3">All recent searches found matching listings.</p>
          ) : (
            <div className="space-y-2">
              {zeroSearches.map((zs, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-xs">
                      !
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        "{zs.query}"
                      </h4>
                      <span className="text-[10px] text-slate-400">
                        Last requested: {new Date(zs.last_searched).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-amber-600 font-mono">
                    {zs.count} miss{zs.count > 1 ? 'es' : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Log Section */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-4 h-4 text-teal-600" />
            <span>Recent Admin Audit Trail</span>
          </h3>
          <button
            onClick={() => onNavigate('/admin/logs')}
            className="text-xs font-bold text-teal-600 hover:text-teal-700"
          >
            All Activity Logs →
          </button>
        </div>

        {logs.length === 0 ? (
          <p className="text-xs text-slate-400 py-4">No recent activity recorded.</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {logs.map((log) => (
              <div key={log.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-mono font-bold px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 uppercase shrink-0">
                    {log.action}
                  </span>
                  <span className="text-slate-700 dark:text-slate-300 font-medium truncate">
                    {log.entity} {log.entity_id ? `(#${log.entity_id.slice(0, 8)})` : ''}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0 text-slate-400">
                  <span className="hidden sm:inline">{log.user_email}</span>
                  <span className="font-mono text-[11px]">
                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
