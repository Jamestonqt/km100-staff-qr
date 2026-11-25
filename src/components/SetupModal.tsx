import React, { useState } from 'react';
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
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          aria-label="Close database setup modal"
          className="absolute right-4 top-4 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Database & Supabase Setup</h3>
            <p className="text-xs text-slate-400">KM100 Portal Backend Configuration</p>
          </div>
        </div>

        {/* Current Status Pill */}
        <div
          className={`p-3 rounded-xl border mb-5 flex items-center justify-between ${
            isSupabaseConfigured
              ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
              : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            {isSupabaseConfigured ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400" />
            )}
            <span className="text-xs font-semibold">
              {isSupabaseConfigured
                ? 'Connected to Live Supabase Database'
                : 'Running in High-Performance Local Demo Sandbox Mode'}
            </span>
          </div>
        </div>

        {/* Steps to connect */}
        <div className="space-y-4 text-xs text-slate-300">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <span>Step 1: Execute Database Schema</span>
            </h4>
            <p className="text-slate-400 leading-relaxed">
              Open your Supabase project dashboard, navigate to the <strong>SQL Editor</strong>, and run the complete script located in{' '}
              <code className="text-emerald-400 font-mono">supabase/schema.sql</code>. It creates the <code className="text-white">employees</code> and <code className="text-white">scan_logs</code> tables, RLS policies, and 5 pre-seeded KM100 staff members.
            </p>
            <div className="relative">
              <pre className="p-3 bg-slate-900 rounded-lg font-mono text-[11px] text-slate-400 overflow-x-auto max-h-36">
                {sqlQuickSnippet}
              </pre>
              <button
                onClick={() => copyToClipboard(sqlQuickSnippet, 'sql')}
                className="absolute right-2 top-2 p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] flex items-center gap-1"
              >
                {copiedSQL ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedSQL ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <h4 className="font-bold text-white">Step 2: Add Environment Variables</h4>
            <p className="text-slate-400">
              Create or edit your <code className="text-emerald-400 font-mono">.env</code> file in the project root:
            </p>
            <div className="relative">
              <pre className="p-3 bg-slate-900 rounded-lg font-mono text-[11px] text-emerald-300 overflow-x-auto">
                {envTemplate}
              </pre>
              <button
                onClick={() => copyToClipboard(envTemplate, 'env')}
                className="absolute right-2 top-2 p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] flex items-center gap-1"
              >
                {copiedEnv ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedEnv ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Reset Demo Sandbox button */}
          <div className="pt-2 flex items-center justify-between">
            <button
              onClick={handleReset}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
              <span>Reset Demo Staff & Logs</span>
            </button>

            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-md transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
