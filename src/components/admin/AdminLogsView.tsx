import { useState, useEffect } from 'react';
import { getAdminLogs } from '@/src/lib/supabase';
import { AdminLog } from '@/src/types';
import { History, RefreshCw, Filter, Search } from 'lucide-react';

export function AdminLogsView() {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await getAdminLogs(100);
      setLogs(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchAction = filterAction === 'all' || log.action === filterAction;
    const matchQuery =
      !search ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.entity.toLowerCase().includes(search.toLowerCase()) ||
      (log.user_email && log.user_email.toLowerCase().includes(search.toLowerCase()));
    return matchAction && matchQuery;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft-sm">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-5 h-5 text-teal-600" />
            <span>Admin Audit & Activity Logs</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Full compliance trail of all creations, updates, bulk imports, and admin logins
          </p>
        </div>

        <button
          onClick={loadLogs}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search activity by email, action, entity..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs"
          />
        </div>

        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          aria-label="Filter by action"
          className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold"
        >
          <option value="all">All Actions</option>
          <option value="CREATE">CREATE</option>
          <option value="UPDATE">UPDATE</option>
          <option value="DELETE">DELETE</option>
          <option value="BULK_UPDATE">BULK_UPDATE</option>
          <option value="BULK_DELETE">BULK_DELETE</option>
          <option value="IMPORT_BATCH">IMPORT_BATCH</option>
          <option value="LOGIN">LOGIN</option>
        </select>
      </div>

      {/* Logs Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 uppercase font-bold text-[10px] text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4">Time</th>
                <th className="p-4">Admin Email</th>
                <th className="p-4">Action</th>
                <th className="p-4">Entity</th>
                <th className="p-4">Target ID</th>
                <th className="p-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No logs recorded yet.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-4 whitespace-nowrap text-slate-500">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="p-4 font-sans font-semibold text-slate-800 dark:text-slate-200">
                      {log.user_email || 'system'}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-slate-700 dark:text-slate-300 font-sans">
                      {log.entity}
                    </td>
                    <td className="p-4 text-slate-400 max-w-[120px] truncate">
                      {log.entity_id || '--'}
                    </td>
                    <td className="p-4 font-mono text-[11px] text-slate-500 max-w-xs truncate">
                      {log.details ? JSON.stringify(log.details) : '--'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
