import React from 'react';
import {
  Shield,
  QrCode,
  Users,
  FileText,
  Volume2,
  VolumeX,
  Database,
  CheckCircle2,
  AlertCircle,
  Sun,
  Moon,
} from 'lucide-react';
import type { Theme } from '../utils/theme';

export type ActiveTab = 'scanner' | 'generator' | 'directory' | 'logs';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  isSupabaseLive: boolean;
  onOpenSetupModal: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  theme: Theme;
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  isSupabaseLive,
  onOpenSetupModal,
  isMuted,
  onToggleMute,
  theme,
  onToggleTheme,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 dark:border-[#222730] dark:bg-[#12151a]/95 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2 h-16 sm:h-20">
          {/* Brand & Official Logo */}
          <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
            <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden shrink-0 flex items-center justify-center">
              <img
                src="/km100-logo.png"
                alt="KM100 Skills and Training Center Logo"
                className="w-full h-full object-contain rounded-full"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2 min-w-0">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">KM100</span>
                <span className="hidden sm:inline text-[10px] sm:text-[11px] px-2 py-0.5 rounded font-extrabold bg-orange-100 text-orange-700 border border-orange-300 dark:bg-orange-600/20 dark:text-orange-400 dark:border-orange-500/30 uppercase tracking-wider">
                  Access Portal
                </span>
              </div>
              <p className="text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-300 tracking-wide uppercase truncate">
                Skills &amp; Training Center, Inc.
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1.5 p-1 bg-slate-100 border border-slate-200 dark:bg-[#0d0f12] dark:border-[#222730] rounded-xl transition-colors">
            <button
              onClick={() => onTabChange('scanner')}
              aria-label="Open Gate Scanner Tab"
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 cursor-pointer ${
                activeTab === 'scanner'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white dark:text-slate-300 dark:hover:text-white dark:hover:bg-[#1a1e26]'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Gate Scanner</span>
            </button>

            <button
              onClick={() => onTabChange('generator')}
              aria-label="Open Issue Staff Badge Tab"
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 cursor-pointer ${
                activeTab === 'generator'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white dark:text-slate-300 dark:hover:text-white dark:hover:bg-[#1a1e26]'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>Issue Badge</span>
            </button>

            <button
              onClick={() => onTabChange('directory')}
              aria-label="Open Staff Directory Tab"
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 cursor-pointer ${
                activeTab === 'directory'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white dark:text-slate-300 dark:hover:text-white dark:hover:bg-[#1a1e26]'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Personnel Directory</span>
            </button>

            <button
              onClick={() => onTabChange('logs')}
              aria-label="Open Attendance & Scan Logs Tab"
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 cursor-pointer ${
                activeTab === 'logs'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white dark:text-slate-300 dark:hover:text-white dark:hover:bg-[#1a1e26]'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Attendance Logs</span>
            </button>
          </nav>

          {/* Right Controls: Database status + Theme toggle + Sound toggle */}
          <div className="flex items-center space-x-1.5 sm:space-x-2.5 shrink-0">
            {/* Supabase status indicator */}
            <button
              onClick={onOpenSetupModal}
              title={isSupabaseLive ? 'Connected to live Supabase DB' : 'Running in local Demo Storage mode. Click to view DB setup'}
              aria-label={isSupabaseLive ? 'Supabase database is connected. Click for setup instructions' : 'Running in Demo Sandbox mode. Click for setup instructions'}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 cursor-pointer ${
                isSupabaseLive
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:border-emerald-500/40 dark:text-emerald-400 dark:hover:bg-emerald-950'
                  : 'bg-orange-50 border-orange-300 text-orange-800 hover:bg-orange-100 dark:bg-orange-950/40 dark:border-orange-500/40 dark:text-orange-300 dark:hover:bg-orange-950/70'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {isSupabaseLive ? 'Supabase Connected' : 'Local Demo Sandbox'}
              </span>
              {isSupabaseLive ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
              )}
            </button>

            {/* Light / Dark Mode Toggle */}
            <button
              onClick={onToggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-2 sm:p-2.5 rounded-lg bg-slate-100 border border-slate-300 text-slate-700 hover:bg-slate-200 dark:bg-[#0d0f12] dark:border-[#222730] dark:text-slate-300 dark:hover:text-white dark:hover:bg-[#1a1e26] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 cursor-pointer"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            {/* Mute/Unmute sound effects */}
            <button
              onClick={onToggleMute}
              title={isMuted ? 'Gate audio muted. Click to enable sound' : 'Gate audio enabled. Click to mute'}
              aria-label={isMuted ? 'Gate audio muted. Press to unmute audio chimes' : 'Gate audio active. Press to mute audio'}
              className="p-2 sm:p-2.5 rounded-lg bg-slate-100 border border-slate-300 text-slate-700 hover:bg-slate-200 dark:bg-[#0d0f12] dark:border-[#222730] dark:text-slate-300 dark:hover:text-white dark:hover:bg-[#1a1e26] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-500 dark:text-rose-400" /> : <Volume2 className="w-4 h-4 text-orange-600 dark:text-orange-400" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar with accessible 44px minimum tap targets */}
        <div className="flex md:hidden items-center justify-around py-1.5 border-t border-slate-200 dark:border-[#222730] transition-colors">
          <button
            onClick={() => onTabChange('scanner')}
            aria-label="Navigate to Gate Scanner"
            className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center py-1 px-3 text-[10px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 rounded-lg cursor-pointer ${
              activeTab === 'scanner' ? 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-950/30' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4 mb-0.5" />
            Scanner
          </button>
          <button
            onClick={() => onTabChange('generator')}
            aria-label="Navigate to Issue Badge Generator"
            className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center py-1 px-3 text-[10px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 rounded-lg cursor-pointer ${
              activeTab === 'generator' ? 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-950/30' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <QrCode className="w-4 h-4 mb-0.5" />
            Badge
          </button>
          <button
            onClick={() => onTabChange('directory')}
            aria-label="Navigate to Staff Directory"
            className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center py-1 px-3 text-[10px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 rounded-lg cursor-pointer ${
              activeTab === 'directory' ? 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-950/30' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4 mb-0.5" />
            Personnel
          </button>
          <button
            onClick={() => onTabChange('logs')}
            aria-label="Navigate to Attendance Logs"
            className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center py-1 px-3 text-[10px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 rounded-lg cursor-pointer ${
              activeTab === 'logs' ? 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-950/30' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4 mb-0.5" />
            Logs
          </button>
        </div>
      </div>
    </header>
  );
};
