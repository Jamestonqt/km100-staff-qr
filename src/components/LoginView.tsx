import React, { useState, type FormEvent } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Sun,
  Moon,
} from 'lucide-react';
import { authService, isSupabaseConfigured, type Session } from '../lib/supabase';
import type { Theme } from '../utils/theme';

interface LoginViewProps {
  onLoginSuccess?: (session: Session) => void;
  theme: Theme;
  onToggleTheme: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  theme,
  onToggleTheme,
}) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Please enter your administrator email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your administrator password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await authService.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) {
        setErrorMessage(
          error.message || 'Authentication failed. Please verify your credentials.'
        );
        return;
      }

      if (data?.session && onLoginSuccess) {
        onLoginSuccess(data.session);
      }
    } catch (err: unknown) {
      const errMessage =
        err instanceof Error ? err.message : 'An unexpected error occurred during sign in.';
      setErrorMessage(errMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-slate-50 dark:bg-[#0d0f12] text-slate-900 dark:text-white font-sans transition-colors selection:bg-orange-600 selection:text-white relative overflow-hidden bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e242f_1px,transparent_1px)] [background-size:24px_24px]">
      {/* Top Ambient Light Depth */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[360px] bg-gradient-to-b from-orange-500/10 via-orange-500/5 to-transparent blur-3xl pointer-events-none" />

      {/* Top Bar with Branding & Theme Switcher */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden shrink-0 flex items-center justify-center border border-slate-200 dark:border-[#222730] bg-white dark:bg-[#16191e] shadow-sm">
            <img
              src="/km100-logo.png"
              alt="KM100 Skills & Training Center Emblem"
              className="w-full h-full object-contain rounded-full"
            />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                KM100
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-extrabold bg-orange-100 text-orange-800 dark:bg-orange-600/20 dark:text-orange-400 border border-orange-200 dark:border-orange-500/30 uppercase tracking-wider">
                Admin
              </span>
            </div>
            <p className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wide uppercase">
              Skills &amp; Training Center, Inc.
            </p>
          </div>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          type="button"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="min-h-[44px] min-w-[44px] p-2.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 dark:bg-[#16191e] dark:border-[#222730] dark:text-slate-300 dark:hover:text-white dark:hover:bg-[#222730] transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 cursor-pointer shadow-sm"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700" />
          )}
        </button>
      </header>

      {/* Main Login Card Section */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-md">
          {/* Card Frame */}
          <div className="bg-white/95 dark:bg-[#16191e]/95 border border-slate-200 dark:border-[#222730] rounded-2xl shadow-2xl shadow-orange-950/5 dark:shadow-black/60 p-6 sm:p-8 backdrop-blur-md transition-colors">
            {/* Header / Institutional Badge */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl p-2 bg-slate-50 dark:bg-[#0d0f12] border-2 border-orange-500/30 dark:border-orange-500/40 mb-4 flex items-center justify-center shadow-md shadow-orange-500/10">
                <img
                  src="/km100-logo.png"
                  alt="KM100 Logo"
                  className="w-full h-full object-contain"
                />
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                KM100 Admin Access
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                Administrative security portal for staff verification, badge issuance, and gate attendance.
              </p>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div
                id="login-error-msg"
                role="alert"
                aria-live="assertive"
                className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800/50 dark:text-rose-300 text-xs flex items-start space-x-2.5 animate-fadeIn"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                <div className="flex-1 font-medium leading-relaxed">
                  {errorMessage}
                </div>
              </div>
            )}

            {/* Demo Sandbox Banner Notice (Only when running locally without Supabase env) */}
            {!isSupabaseConfigured && (
              <div className="mb-5 p-3 rounded-xl bg-orange-50 border border-orange-200 text-orange-900 dark:bg-orange-950/30 dark:border-orange-800/40 dark:text-orange-300 text-xs flex items-start space-x-2.5">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-orange-600 dark:text-orange-400" />
                <div className="flex-1 leading-relaxed">
                  <span className="font-bold">Sandbox Mode:</span> Enter your administrator credentials (e.g., <code className="font-mono font-semibold">admin@km100.edu.ph</code>) to access the portal.
                </div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Email Address */}
              <div>
                <label
                  htmlFor="admin-email"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1.5"
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="admin-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@km100.edu.ph"
                    disabled={isSubmitting}
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 dark:bg-[#0d0f12] dark:border-[#222730] dark:text-white dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="admin-password"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="admin-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    aria-describedby={errorMessage ? 'login-error-msg' : undefined}
                    aria-invalid={Boolean(errorMessage)}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={isSubmitting}
                    className="w-full pl-10 pr-11 py-2.5 sm:py-3 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 dark:bg-[#0d0f12] dark:border-[#222730] dark:text-white dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="min-h-[44px] min-w-[44px] absolute inset-y-0 right-0 pr-3 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 rounded-r-xl"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Sign In Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full min-h-[44px] py-3 px-4 rounded-xl font-bold text-sm text-white bg-orange-600 hover:bg-orange-500 active:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-500 transition-all flex items-center justify-center space-x-2 shadow-md shadow-orange-600/25 hover:shadow-lg hover:shadow-orange-600/35 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <span>Sign In</span>
                  )}
                </button>
              </div>
            </form>

            {/* Security Notice - strictly NO sign up links */}
            <div className="mt-6 pt-5 border-t border-slate-200 dark:border-[#222730] text-center">
              <p className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 shrink-0" />
                <span>Authorized Administrative Personnel Only</span>
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-1">
                Access attempts are logged and monitored under institutional security protocols.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full py-4 text-center text-xs text-slate-400 dark:text-slate-500 border-t border-slate-200 dark:border-[#222730] bg-white/50 dark:bg-[#0d0f12]/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-1">
          <div>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              KM100 Skills &amp; Training Center, Inc.
            </span>
          </div>
          <div>CR80 Staff Access &amp; Gate Control Portal</div>
        </div>
      </footer>
    </div>
  );
};
