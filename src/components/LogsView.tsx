import React, { useState, useMemo } from 'react';
import {
  Download,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  LogIn,
  LogOut,
  MapPin,
  Calendar,
} from 'lucide-react';
import type { ScanLog } from '../types/database';

interface LogsViewProps {
  logs: ScanLog[];
}

export const LogsView: React.FC<LogsViewProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [scanTypeFilter, setScanTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('ALL');

  // Filter logs
  const filteredLogs = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86400000;

    return logs.filter((log) => {
      // Search
      const matchSearch =
        log.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.employee_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.gate_location.toLowerCase().includes(searchTerm.toLowerCase());

      // Type
      const matchType = scanTypeFilter === 'ALL' || log.scan_type === scanTypeFilter;

      // Status
      const matchStatus =
        statusFilter === 'ALL'
          ? true
          : statusFilter === 'VALID'
          ? log.verification_status === 'VALID'
          : log.verification_status !== 'VALID';

      // Date
      let matchDate = true;
      const logTime = new Date(log.scanned_at).getTime();
      if (dateFilter === 'TODAY') {
        matchDate = logTime >= todayStart;
      } else if (dateFilter === 'YESTERDAY') {
        matchDate = logTime >= yesterdayStart && logTime < todayStart;
      }

      return matchSearch && matchType && matchStatus && matchDate;
    });
  }, [logs, searchTerm, scanTypeFilter, statusFilter, dateFilter]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      alert('No scan logs to export.');
      return;
    }

    const headers = [
      'Timestamp (ISO)',
      'Local Time',
      'Employee Code',
      'Full Name',
      'Department',
      'Gate Location',
      'Scan Type',
      'Verification Status',
    ];

    const rows = filteredLogs.map((l) => [
      `"${l.scanned_at}"`,
      `"${new Date(l.scanned_at).toLocaleString()}"`,
      `"${l.employee_code}"`,
      `"${l.employee_name.replace(/"/g, '""')}"`,
      `"${l.department || 'N/A'}"`,
      `"${l.gate_location}"`,
      `"${l.scan_type}"`,
      `"${l.verification_status}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `km100-scan-logs-${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Controls & Export Bar */}
      <div className="bg-white border border-slate-200 dark:bg-[#16191e] dark:border-[#222730] rounded-2xl p-4 sm:p-5 shadow-sm transition-colors flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search logs by staff name, code, gate..."
            aria-label="Search logs by staff name, employee code, or gate"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 dark:bg-[#0d0f12] dark:border-[#2a303c] rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Date Filter */}
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-300 dark:bg-[#0d0f12] dark:border-[#2a303c] px-3 py-2 rounded-xl transition-colors">
            <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-white text-slate-900 dark:bg-[#16191e] dark:text-white">
                All Dates
              </option>
              <option value="TODAY" className="bg-white text-slate-900 dark:bg-[#16191e] dark:text-white">
                Today Only
              </option>
              <option value="YESTERDAY" className="bg-white text-slate-900 dark:bg-[#16191e] dark:text-white">
                Yesterday
              </option>
            </select>
          </div>

          {/* Scan Type Filter */}
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-300 dark:bg-[#0d0f12] dark:border-[#2a303c] px-3 py-2 rounded-xl transition-colors">
            <Filter className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <select
              value={scanTypeFilter}
              onChange={(e) => setScanTypeFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-white text-slate-900 dark:bg-[#16191e] dark:text-white">
                All Types
              </option>
              <option value="CHECK_IN" className="bg-white text-emerald-600 dark:bg-[#16191e] dark:text-emerald-400">
                Check In
              </option>
              <option value="CHECK_OUT" className="bg-white text-blue-600 dark:bg-[#16191e] dark:text-blue-400">
                Check Out
              </option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-300 dark:bg-[#0d0f12] dark:border-[#2a303c] px-3 py-2 rounded-xl transition-colors">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-white text-slate-900 dark:bg-[#16191e] dark:text-white">
                All Status
              </option>
              <option value="VALID" className="bg-white text-emerald-600 dark:bg-[#16191e] dark:text-emerald-400">
                Valid Only
              </option>
              <option value="DENIED" className="bg-white text-rose-600 dark:bg-[#16191e] dark:text-rose-400">
                Denied / Flagged
              </option>
            </select>
          </div>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            aria-label="Export filtered scan logs to CSV file"
            className="min-h-[44px] flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white text-xs font-bold shadow-md transition-all ml-auto md:ml-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-slate-200 dark:bg-[#16191e] dark:border-[#222730] rounded-2xl shadow-sm transition-colors overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 border-b border-slate-200 dark:bg-[#0d0f12] dark:border-[#222730] text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-400 font-semibold transition-colors">
              <tr>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Staff Member</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Gate Location</th>
                <th className="py-3.5 px-4 text-center">Type</th>
                <th className="py-3.5 px-4 text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-[#222730] transition-colors">
              {filteredLogs.map((log) => {
                const isValid = log.verification_status === 'VALID';
                const isDuplicate = log.verification_status === 'DUPLICATE_SCAN';

                return (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-[#1c2128] transition-colors">
                    {/* Time */}
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {new Date(log.scanned_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>

                    {/* Staff */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{log.employee_name}</div>
                      <div className="text-[11px] font-mono text-orange-600 dark:text-orange-400">
                        {log.employee_code}
                      </div>
                    </td>

                    {/* Department */}
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {log.department || 'N/A'}
                    </td>

                    {/* Gate */}
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      <span>{log.gate_location}</span>
                    </td>

                    {/* Type */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          log.scan_type === 'CHECK_IN'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/70 dark:border-emerald-500/40 dark:text-emerald-400'
                            : 'bg-blue-50 border-blue-300 text-blue-800 dark:bg-blue-950/70 dark:border-blue-500/40 dark:text-blue-400'
                        }`}
                      >
                        {log.scan_type === 'CHECK_IN' ? (
                          <LogIn className="w-2.5 h-2.5 mr-0.5" />
                        ) : (
                          <LogOut className="w-2.5 h-2.5 mr-0.5" />
                        )}
                        {log.scan_type.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Verification Status */}
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          isValid
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/80 dark:border-emerald-500/40 dark:text-emerald-300'
                            : isDuplicate
                            ? 'bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-950/80 dark:border-amber-500/40 dark:text-amber-300'
                            : 'bg-rose-50 border-rose-300 text-rose-800 dark:bg-rose-950/80 dark:border-rose-500/40 dark:text-rose-300'
                        }`}
                      >
                        {isValid ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 mr-1" />
                        ) : (
                          <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400 mr-1" />
                        )}
                        {log.verification_status}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No scan logs found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
