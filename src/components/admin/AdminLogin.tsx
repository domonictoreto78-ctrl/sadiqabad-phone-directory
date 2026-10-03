import { useState } from 'react';
import { signInAdmin, isSupabaseConfigured } from '@/src/lib/supabase';
import { useLanguage } from '@/src/lib/i18n';
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { showToast } from '../ui/Toast';

interface AdminLoginProps {
  onSuccess: () => void;
  onNavigateHome: () => void;
}

export function AdminLogin({ onSuccess, onNavigateHome }: AdminLoginProps) {
  const { t, isUrdu } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please provide both email and password');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await signInAdmin(email.trim(), password);
      if (res.success) {
        showToast('Login Successful', `Welcome back, ${res.session?.user.email}!`, 'success');
        onSuccess();
      } else {
        setErrorMessage(res.error || 'Authentication failed. Please verify credentials.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-teal-950 to-slate-950 p-4 sm:p-6 text-white relative overflow-hidden">
      {/* Ambient gradient meshes */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        {/* Logo and Welcome */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-3xl bg-gradient-to-tr from-teal-600 to-teal-400 text-white items-center justify-center font-black text-2xl shadow-xl shadow-teal-500/30 mb-4">
            SQB
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Sadiqabad City Directory
          </h1>
          <p className="text-sm text-teal-200/80 mt-1">
            Admin & Editor Portal • Management Console
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/10 dark:bg-slate-900/80 backdrop-blur-2xl p-6 sm:p-8 rounded-3xl border border-white/20 shadow-2xl shadow-black/50">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/10 text-xs font-semibold text-teal-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Secure Supabase Authentication & RLS Protected</span>
          </div>

          {errorMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-200 text-xs flex items-start gap-2.5 leading-relaxed">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-teal-100 mb-2">
                Admin Email
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 w-4 h-4 text-teal-300 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@sadiqabad.city"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 text-white placeholder:text-white/40 text-sm font-medium border border-white/15 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white/15 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-teal-100 mb-2">
                Password
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 w-4 h-4 text-teal-300 pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 text-white placeholder:text-white/40 text-sm font-medium border border-white/15 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white/15 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/25 transition-transform active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Admin Panel</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Back to public site */}
        <div className="text-center mt-6">
          <button
            onClick={onNavigateHome}
            className="text-xs text-teal-200/80 hover:text-white transition-colors"
          >
            ← Back to Public Directory
          </button>
        </div>
      </div>
    </div>
  );
}
