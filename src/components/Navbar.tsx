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
} from 'lucide-react';

export type ActiveTab = 'scanner' | 'generator' | 'directory' | 'logs';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  isSupabaseLive: boolean;
  onOpenSetupModal: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  isSupabaseLive,
  onOpenSetupModal,
  isMuted,
  onToggleMute,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#222730] bg-[#12151a]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand & Official Logo */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="relative w-11 h-11 sm:w-13 sm:h-13 rounded-full overflow-hidden bg-white p-0.5 border-2 border-orange-500 shadow-md shrink-0 flex items-center justify-center">
              <img
                src="/km100-logo.png"
                alt="KM100 Skills and Training Center Logo"
                className="w-full h-full object-contain rounded-full"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-white">KM100</span>
                <span className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded font-extrabold bg-orange-600/20 text-orange-400 border border-orange-500/30 uppercase tracking-wider">
                  Access Portal
                </span>
              </div>
              <p className="text-[11px] sm:text-xs font-semibold text-slate-300 tracking-wide uppercase line-clamp-1">
                Skills &amp; Training Center, Inc.
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1.5 p-1 bg-[#0d0f12] border border-[#222730] rounded-xl">
            <button
              onClick={() => onTabChange('scanner')}
              aria-label="Open Gate Scanner Tab"
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 ${
                activeTab === 'scanner'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-[#1a1e26]'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Gate Scanner</span>
            </button>

            <button
              onClick={() => onTabChange('generator')}
              aria-label="Open Issue Staff Badge Tab"
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 ${
                activeTab === 'generator'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-[#1a1e26]'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>Issue Badge</span>
            </button>

            <button
              onClick={() => onTabChange('directory')}
              aria-label="Open Staff Directory Tab"
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 ${
                activeTab === 'directory'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-[#1a1e26]'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Personnel Directory</span>
            </button>

            <button
              onClick={() => onTabChange('logs')}
              aria-label="Open Attendance & Scan Logs Tab"
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 ${
                activeTab === 'logs'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-[#1a1e26]'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Attendance Logs</span>
            </button>
          </nav>

          {/* Right Controls: Database status + Sound toggle */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Supabase status indicator */}
            <button
              onClick={onOpenSetupModal}
              title={isSupabaseLive ? 'Connected to live Supabase DB' : 'Running in local Demo Storage mode. Click to view DB setup'}
              aria-label={isSupabaseLive ? 'Supabase database is connected. Click for setup instructions' : 'Running in Demo Sandbox mode. Click for setup instructions'}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 ${
                isSupabaseLive
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400 hover:bg-emerald-950'
                  : 'bg-orange-950/40 border-orange-500/40 text-orange-300 hover:bg-orange-950/70'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {isSupabaseLive ? 'Supabase Connected' : 'Local Demo Sandbox'}
              </span>
              {isSupabaseLive ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-orange-400" />
              )}
            </button>

            {/* Mute/Unmute sound effects */}
            <button
              onClick={onToggleMute}
              title={isMuted ? 'Gate audio muted. Click to enable sound' : 'Gate audio enabled. Click to mute'}
              aria-label={isMuted ? 'Gate audio muted. Press to unmute audio chimes' : 'Gate audio active. Press to mute audio'}
              className="p-2 sm:p-2.5 rounded-lg bg-[#0d0f12] border border-[#222730] text-slate-300 hover:text-white hover:bg-[#1a1e26] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-orange-400" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar with accessible 44px minimum tap targets */}
        <div className="flex md:hidden items-center justify-around py-1.5 border-t border-[#222730]">
          <button
            onClick={() => onTabChange('scanner')}
            aria-label="Navigate to Gate Scanner"
            className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center py-1 px-3 text-[10px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 rounded-lg ${
              activeTab === 'scanner' ? 'text-orange-400 bg-orange-950/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4 mb-0.5" />
            Scanner
          </button>
          <button
            onClick={() => onTabChange('generator')}
            aria-label="Navigate to Issue Badge Generator"
            className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center py-1 px-3 text-[10px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 rounded-lg ${
              activeTab === 'generator' ? 'text-orange-400 bg-orange-950/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <QrCode className="w-4 h-4 mb-0.5" />
            Badge
          </button>
          <button
            onClick={() => onTabChange('directory')}
            aria-label="Navigate to Staff Directory"
            className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center py-1 px-3 text-[10px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 rounded-lg ${
              activeTab === 'directory' ? 'text-orange-400 bg-orange-950/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4 mb-0.5" />
            Personnel
          </button>
          <button
            onClick={() => onTabChange('logs')}
            aria-label="Navigate to Attendance Logs"
            className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center py-1 px-3 text-[10px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 rounded-lg ${
              activeTab === 'logs' ? 'text-orange-400 bg-orange-950/30' : 'text-slate-400 hover:text-slate-200'
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
