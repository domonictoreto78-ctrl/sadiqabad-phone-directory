import { useState, useEffect } from 'react';
import { getAdminUsers, updateAdminUserRole, deleteAdminUser, AdminSession } from '@/src/lib/supabase';
import { AdminUser, AdminRole } from '@/src/types';
import { showToast } from '../ui/Toast';
import { Users, Shield, Trash2, Key, Info, Check, Copy } from 'lucide-react';

interface AdminUsersViewProps {
  session: AdminSession;
}

export function AdminUsersView({ session }: AdminUsersViewProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getAdminUsers();
      setUsers(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: AdminRole) => {
    const res = await updateAdminUserRole(userId, newRole);
    if (res.success) {
      showToast('Role Updated', `Changed role to ${newRole}`);
      loadUsers();
    } else {
      showToast('Error', res.error, 'error');
    }
  };

  const handleDelete = async (user: AdminUser) => {
    if (user.user_id === session.user.id) {
      alert('You cannot remove your own admin account while logged in.');
      return;
    }

    if (window.confirm(`Are you sure you want to revoke admin permissions for ${user.email || user.user_id}?`)) {
      const res = await deleteAdminUser(user.user_id);
      if (res.success) {
        showToast('Revoked', 'User removed from admin_users table');
        loadUsers();
      } else {
        showToast('Error', res.error, 'error');
      }
    }
  };

  const copySqlSnippet = () => {
    const sql = `INSERT INTO public.admin_users (user_id, email, role)
VALUES ('NEW-USER-UUID-FROM-AUTH', 'editor@sadiqabad.city', 'editor');`;
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft-sm">
        <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-teal-600" />
          <span>Admin & Editor Management</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Role-Based Access Control (RBAC) powered by Supabase Auth and Row Level Security
        </p>
      </div>

      {/* Instructions on adding admins */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-teal-950/40 to-slate-900 border border-teal-800/40 text-xs text-slate-300 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-sm text-teal-200 flex items-center gap-2">
            <Info className="w-4 h-4 text-teal-400" />
            <span>How to Grant Access to a New Team Member:</span>
          </h4>
          <button
            onClick={copySqlSnippet}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-800/60 hover:bg-teal-700 text-teal-200 text-xs font-semibold transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied SQL!' : 'Copy SQL'}</span>
          </button>
        </div>
        <ol className="list-decimal list-inside space-y-1 text-slate-400 pl-1 leading-relaxed">
          <li>Create the new user in <strong>Supabase Dashboard → Authentication → Users</strong>.</li>
          <li>Copy their generated <strong>User UID</strong>.</li>
          <li>Run the SQL command below in Supabase SQL editor to assign their role:</li>
        </ol>
        <pre className="p-3 rounded-xl bg-slate-950 font-mono text-[11px] text-teal-300 overflow-x-auto border border-slate-800">
{`INSERT INTO public.admin_users (user_id, email, role)
VALUES ('PASTE-USER-UID-HERE', 'teammate@sadiqabad.city', 'editor');`}
        </pre>
      </div>

      {/* Admin Users Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 uppercase font-bold text-[10px] text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4">Admin User</th>
                <th className="p-4">User UID</th>
                <th className="p-4">Assigned Role</th>
                <th className="p-4">Created Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map((u) => (
                <tr key={u.user_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="p-4 font-bold text-slate-900 dark:text-white">
                    {u.email || 'Admin User'}
                    {u.user_id === session.user.id && (
                      <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                        You
                      </span>
                    )}
                  </td>
                  <td className="p-4 font-mono text-slate-400 text-[11px]">
                    {u.user_id}
                  </td>
                  <td className="p-4">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.user_id, e.target.value as AdminRole)}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs"
                    >
                      <option value="super_admin">Super Admin</option>
                      <option value="editor">Editor</option>
                    </select>
                  </td>
                  <td className="p-4 text-slate-500 font-mono">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDelete(u)}
                      disabled={u.user_id === session.user.id}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 disabled:opacity-20"
                      title="Revoke admin access"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
