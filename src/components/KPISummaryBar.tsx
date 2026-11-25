import React from 'react';
import { Users, Building2, LogIn, ShieldAlert } from 'lucide-react';
import type { KPISummary } from '../types/database';

interface KPISummaryBarProps {
  summary: KPISummary;
  loading?: boolean;
}

export const KPISummaryBar: React.FC<KPISummaryBarProps> = ({ summary, loading = false }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
      {/* Total Active Personnel */}
      <div className="bg-white border border-slate-200 dark:bg-[#16191e] dark:border-[#222730] rounded-xl p-4 shadow-sm hover:border-slate-300 dark:hover:border-[#323946] transition-colors">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Active Personnel
            </p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {loading ? '-' : summary.totalActiveStaff}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
          KM100 verified credentials
        </div>
      </div>

      {/* Currently On-Site */}
      <div className="bg-white border border-slate-200 dark:bg-[#16191e] dark:border-[#222730] rounded-xl p-4 shadow-sm hover:border-slate-300 dark:hover:border-[#323946] transition-colors">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Currently On-Site
            </p>
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {loading ? '-' : summary.currentlyOnSite}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Building2 className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse motion-reduce:animate-none" />
          Inside campus facilities
        </div>
      </div>

      {/* Today's Valid Check-Ins */}
      <div className="bg-white border border-slate-200 dark:bg-[#16191e] dark:border-[#222730] rounded-xl p-4 shadow-sm hover:border-slate-300 dark:hover:border-[#323946] transition-colors">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Admissions Today
            </p>
            <h3 className="text-2xl font-black text-sky-600 dark:text-sky-400 mt-1">
              {loading ? '-' : summary.todayCheckIns}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400">
            <LogIn className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
          Valid time-in gate scans
        </div>
      </div>

      {/* Denied / Flagged Scans */}
      <div className="bg-white border border-slate-200 dark:bg-[#16191e] dark:border-[#222730] rounded-xl p-4 shadow-sm hover:border-slate-300 dark:hover:border-[#323946] transition-colors">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Denied / Flagged
            </p>
            <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
              {loading ? '-' : summary.deniedToday}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-2 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
          Blocked or unauthorized scans
        </div>
      </div>
    </div>
  );
};
