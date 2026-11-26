import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';
import { portalService, isSupabaseConfigured } from '../lib/supabase';

interface SetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetData: () => void;
}

export const SetupModal: React.FC<SetupModalProps> = ({ isOpen, onClose, onResetData }) => {
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [copiedSQL, setCopiedSQL] = useState(false);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const envTemplate = `VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key`;

  const sqlQuickSnippet = `-- Run in Supabase SQL Editor:
-- Find full schema in supabase/schema.sql

CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_code TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL,
    department TEXT NOT NULL,
    shift_schedule TEXT NOT NULL DEFAULT 'Day Shift (08:00 - 17:00)',
    status TEXT NOT NULL DEFAULT 'Active',
    photo_url TEXT,
    qr_token TEXT NOT NULL UNIQUE,
    is_on_site BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE employees ADD COLUMN IF NOT EXISTS is_on_site BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS scan_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    employee_code TEXT NOT NULL,
    employee_name TEXT NOT NULL,
    department TEXT,
    scan_type TEXT NOT NULL,
    verification_status TEXT NOT NULL,
    gate_location TEXT NOT NULL DEFAULT 'Main Gate',
    scanned_at TIMESTAMPTZ NOT NULL DEFAULT now()
);`;

  const copyToClipboard = (text: string, type: 'env' | 'sql') => {
    navigator.clipboard.writeText(text);
    if (type === 'env') {
      setCopiedEnv(true);
      setTimeout(() => setCopiedEnv(false), 2000);
    } else {
      setCopiedSQL(true);
      setTimeout(() => setCopiedSQL(false), 2000);
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset all demo staff and scan logs back to initial KM100 seeds?')) {
      portalService.resetDemoData();
      onResetData();
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="setup-modal-title"
      className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-white border border-slate-200 dark:bg-[#16191e] dark:border-[#222730] rounded-3xl p-6 max-w-xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto transition-colors">
        <button
          onClick={onClose}
          aria-label="Close database setup modal"
          className="absolute right-4 top-4 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-[#222730] dark:hover:bg-[#2c3340] dark:text-slate-400 dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 id="setup-modal-title" className="text-base font-bold text-slate-900 dark:text-white">Database &amp; Supabase Setup</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">KM100 Portal Backend Configuration</p>
          </div>
        </div>

        {/* Current Status Pill */}
        <div
          className={`p-3 rounded-xl border mb-5 flex items-center justify-between ${
            isSupabaseConfigured
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/50 dark:border-emerald-500/40 dark:text-emerald-300'
              : 'bg-orange-50 border-orange-300 text-orange-800 dark:bg-amber-950/40 dark:border-amber-500/40 dark:text-amber-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            {isSupabaseConfigured ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-orange-600 dark:text-amber-400" />
            )}
            <span className="text-xs font-semibold">
              {isSupabaseConfigured
                ? 'Connected to Live Supabase Database'
                : 'Running in High-Performance Local Demo Sandbox Mode'}
            </span>
          </div>
        </div>

        {/* Steps to connect */}
        <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 dark:bg-[#0d0f12] dark:border-[#222730] space-y-3 transition-colors">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Step 1: Execute Database Schema</span>
            </h4>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Open your Supabase project dashboard, navigate to the <strong>SQL Editor</strong>, and run the complete script located in{' '}
              <code className="text-orange-600 dark:text-orange-400 font-mono">supabase/schema.sql</code>. It creates the <code className="text-slate-900 dark:text-white">employees</code> and <code className="text-slate-900 dark:text-white">scan_logs</code> tables, RLS policies, and 5 pre-seeded KM100 staff members.
            </p>
            <div className="relative">
              <pre className="p-3 bg-white border border-slate-200 dark:bg-[#16191e] dark:border-[#222730] rounded-lg font-mono text-[11px] text-slate-700 dark:text-slate-400 overflow-x-auto max-h-36">
                {sqlQuickSnippet}
              </pre>
              <button
                onClick={() => copyToClipboard(sqlQuickSnippet, 'sql')}
                className="absolute right-2 top-2 p-1.5 rounded bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 dark:bg-[#222730] dark:hover:bg-[#2c3340] dark:text-slate-300 dark:border-none text-[10px] flex items-center gap-1 cursor-pointer"
              >
                {copiedSQL ? <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedSQL ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 dark:bg-[#0d0f12] dark:border-[#222730] space-y-3 transition-colors">
            <h4 className="font-bold text-slate-900 dark:text-white">Step 2: Add Environment Variables</h4>
            <p className="text-slate-600 dark:text-slate-400">
              Create or edit your <code className="text-orange-600 dark:text-orange-400 font-mono">.env</code> file in the project root:
            </p>
            <div className="relative">
              <pre className="p-3 bg-white border border-slate-200 dark:bg-[#16191e] dark:border-[#222730] rounded-lg font-mono text-[11px] text-orange-600 dark:text-emerald-300 overflow-x-auto">
                {envTemplate}
              </pre>
              <button
                onClick={() => copyToClipboard(envTemplate, 'env')}
                className="absolute right-2 top-2 p-1.5 rounded bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 dark:bg-[#222730] dark:hover:bg-[#2c3340] dark:text-slate-300 dark:border-none text-[10px] flex items-center gap-1 cursor-pointer"
              >
                {copiedEnv ? <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedEnv ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Reset Demo Sandbox button */}
          <div className="pt-2 flex items-center justify-between">
            <button
              onClick={handleReset}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 dark:bg-[#222730] dark:hover:bg-[#2c3340] dark:text-slate-300 dark:border-none text-xs font-semibold transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
              <span>Reset Demo Staff &amp; Logs</span>
            </button>

            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-xs font-bold text-white shadow-md transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
