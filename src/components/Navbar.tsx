import React from 'react';
import {
  Shield,
  QrCode,
  Users,
  FileText,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  LogOut,
} from 'lucide-react';
import type { Theme } from '../utils/theme';

export type ActiveTab = 'scanner' | 'generator' | 'directory' | 'logs';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  isSupabaseLive?: boolean;
  onOpenSetupModal?: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  theme: Theme;
  onToggleTheme: () => void;
  onSignOut: () => void;
  userEmail?: string | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  isMuted,
  onToggleMute,
  theme,
  onToggleTheme,
  onSignOut,
  userEmail,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 dark:border-[#222730] dark:bg-[#12151a]/95 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16 sm:h-20">
          {/* Brand & Official Logo */}
          <div className="flex items-center space-x-3 shrink-0">
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden shrink-0 flex items-center justify-center">
              <img
                src="/km100-logo.png"
                alt="KM100 Skills and Training Center Logo"
                className="w-full h-full object-contain rounded-full"
              />
            </div>
            <div className="shrink-0">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white m-0 p-0 leading-tight">
                KM100
              </h1>
              <p className="text-[11px] sm:text-xs font-bold text-slate-600 dark:text-slate-300 tracking-wider uppercase whitespace-nowrap">
                Skills &amp; Training Center, Inc.
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 sm:space-x-1.5 p-1 bg-slate-100 border border-slate-200 dark:bg-[#0d0f12] dark:border-[#222730] rounded-xl transition-colors shrink-0">
            <button
              onClick={() => onTabChange('scanner')}
              aria-label="Open Scanner Tab"
              className={`flex items-center space-x-2 px-3 sm:px-3.5 py-2 rounded-lg text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 cursor-pointer whitespace-nowrap ${
                activeTab === 'scanner'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white dark:text-slate-300 dark:hover:text-white dark:hover:bg-[#1a1e26]'
              }`}
            >
              <Shield className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">Access Scanner</span>
            </button>

            <button
              onClick={() => onTabChange('generator')}
              aria-label="Open Issue Staff Badge Tab"
              className={`flex items-center space-x-2 px-3 sm:px-3.5 py-2 rounded-lg text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 cursor-pointer whitespace-nowrap ${
                activeTab === 'generator'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white dark:text-slate-300 dark:hover:text-white dark:hover:bg-[#1a1e26]'
              }`}
            >
              <QrCode className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">Issue Badge</span>
            </button>

            <button
              onClick={() => onTabChange('directory')}
              aria-label="Open Staff Directory Tab"
              className={`flex items-center space-x-2 px-3 sm:px-3.5 py-2 rounded-lg text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 cursor-pointer whitespace-nowrap ${
                activeTab === 'directory'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white dark:text-slate-300 dark:hover:text-white dark:hover:bg-[#1a1e26]'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">Personnel Directory</span>
            </button>

            <button
              onClick={() => onTabChange('logs')}
              aria-label="Open Attendance & Scan Logs Tab"
              className={`flex items-center space-x-2 px-3 sm:px-3.5 py-2 rounded-lg text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 cursor-pointer whitespace-nowrap ${
                activeTab === 'logs'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white dark:text-slate-300 dark:hover:text-white dark:hover:bg-[#1a1e26]'
              }`}
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">Attendance Logs</span>
            </button>
          </nav>

          {/* Right Controls: Theme toggle + Sound toggle + Sign Out */}
          <div className="flex items-center space-x-1.5 sm:space-x-2.5 shrink-0">
            {/* Light / Dark Mode Toggle */}
            <button
              onClick={onToggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="min-h-[44px] min-w-[44px] p-2.5 rounded-lg bg-slate-100 border border-slate-300 text-slate-700 hover:bg-slate-200 dark:bg-[#0d0f12] dark:border-[#222730] dark:text-slate-300 dark:hover:text-white dark:hover:bg-[#1a1e26] transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 cursor-pointer"
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
              title={isMuted ? 'Portal audio muted. Click to enable sound' : 'Portal audio enabled. Click to mute'}
              aria-label={isMuted ? 'Portal audio muted. Press to unmute audio chimes' : 'Portal audio active. Press to mute audio'}
              className="min-h-[44px] min-w-[44px] p-2.5 rounded-lg bg-slate-100 border border-slate-300 text-slate-700 hover:bg-slate-200 dark:bg-[#0d0f12] dark:border-[#222730] dark:text-slate-300 dark:hover:text-white dark:hover:bg-[#1a1e26] transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-500 dark:text-rose-400" /> : <Volume2 className="w-4 h-4 text-orange-600 dark:text-orange-400" />}
            </button>

            {/* Admin Sign Out */}
            <button
              onClick={onSignOut}
              title={userEmail ? `Signed in as ${userEmail} • Click to Sign Out` : 'Sign Out of KM100 Admin Access'}
              aria-label="Sign Out of KM100 Admin Access"
              className="min-h-[44px] px-3 sm:px-3.5 py-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:border-rose-900/50 dark:text-rose-300 dark:hover:bg-rose-950/70 transition-colors flex items-center space-x-1.5 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 cursor-pointer shadow-sm whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar with accessible 44px minimum tap targets */}
        <div className="flex md:hidden items-center justify-around py-1.5 border-t border-slate-200 dark:border-[#222730] transition-colors">
          <button
            onClick={() => onTabChange('scanner')}
            aria-label="Navigate to Access Scanner"
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
