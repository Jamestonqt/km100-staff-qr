import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  X,
  Printer,
  Download,
  Shield,
  Save,
  FileSpreadsheet,
  RefreshCw,
  Upload,
} from 'lucide-react';
import type {
  Employee,
  EmployeeStatus,
  ScanLog,
} from '../types/database';
import { DEPARTMENTS, SHIFT_SCHEDULES } from '../types/database';
import { portalService } from '../lib/supabase';
import { BadgeCard } from './BadgeCard';
import { getInitials } from '../utils/qr';
import { getOnSiteEmployeeCodes } from '../utils/presence';
import { fileToResizedDataUrl } from '../utils/imageUpload';

interface DirectoryViewProps {
  employees: Employee[];
  logs: ScanLog[];
  onEmployeeUpdated: () => void;
}

// Fit the fixed 340x530 CR80 badge inside the modal viewport without scrolling.
const BADGE_WIDTH = 340;
const BADGE_HEIGHT = 530;
const getBadgeScale = (): number => {
  if (typeof window === 'undefined') return 1;
  const maxHeight = window.innerHeight * 0.92 - 160;
  const maxWidth = Math.min(window.innerWidth - 80, 400);
  return Math.min(1, Math.max(0.5, Math.min(maxHeight / BADGE_HEIGHT, maxWidth / BADGE_WIDTH)));
};

export const DirectoryView: React.FC<DirectoryViewProps> = ({
  employees,
  logs,
  onEmployeeUpdated,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals state
  const [selectedBadgeEmployee, setSelectedBadgeEmployee] = useState<Employee | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [confirmDeleteEmployee, setConfirmDeleteEmployee] = useState<Employee | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false);
  const [badgeScale, setBadgeScale] = useState<number>(1);
  const badgeScalerRef = useRef<HTMLDivElement>(null);
  const badgeModalRef = useRef<HTMLDivElement>(null);
  const editModalRef = useRef<HTMLDivElement>(null);
  const deleteModalRef = useRef<HTMLDivElement>(null);
  const editPhotoFileInputRef = useRef<HTMLInputElement>(null);

  const handleEditPhotoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingEmployee) return;
    try {
      const dataUrl = await fileToResizedDataUrl(file);
      setEditingEmployee({ ...editingEmployee, photo_url: dataUrl });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to read image file.');
    } finally {
      if (editPhotoFileInputRef.current) {
        editPhotoFileInputRef.current.value = '';
      }
    }
  };

  // Keep the badge scaled to fit the modal as the window resizes.
  useEffect(() => {
    if (!selectedBadgeEmployee) return;
    const update = () => setBadgeScale(getBadgeScale());
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [selectedBadgeEmployee]);

  // Close modals on Escape key press and trap focus
  useEffect(() => {
    const isAnyModalOpen = selectedBadgeEmployee || editingEmployee || confirmDeleteEmployee;
    if (!isAnyModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedBadgeEmployee) setSelectedBadgeEmployee(null);
        if (editingEmployee) setEditingEmployee(null);
        if (confirmDeleteEmployee) setConfirmDeleteEmployee(null);
        return;
      }

      if (e.key === 'Tab') {
        const activeModal = badgeModalRef.current || editModalRef.current || deleteModalRef.current;
        if (!activeModal) return;

        const focusables = activeModal.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedBadgeEmployee, editingEmployee, confirmDeleteEmployee]);

  // Derive on-site status from the most recent valid scan per employee:
  // CHECK_IN => On-Site, CHECK_OUT => Off-Site
  const onSiteEmployeeCodes = useMemo(() => getOnSiteEmployeeCodes(logs), [logs]);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchSearch =
        emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employee_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.role.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDept = departmentFilter === 'ALL' || emp.department === departmentFilter;
      const matchStatus = statusFilter === 'ALL' || emp.status === statusFilter;

      return matchSearch && matchDept && matchStatus;
    });
  }, [employees, searchTerm, departmentFilter, statusFilter]);

  // Handle Edit Submit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;

    setIsSavingEdit(true);
    try {
      await portalService.updateEmployee(editingEmployee.id, {
        full_name: editingEmployee.full_name,
        role: editingEmployee.role,
        department: editingEmployee.department,
        shift_schedule: editingEmployee.shift_schedule,
        status: editingEmployee.status,
        photo_url: editingEmployee.photo_url,
      });
      setEditingEmployee(null);
      onEmployeeUpdated();
    } catch (err) {
      console.error('Failed to update employee:', err);
      alert('Failed to update employee');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Handle Delete Confirmation Execution
  const handleExecuteDelete = async () => {
    if (!confirmDeleteEmployee) return;
    const id = confirmDeleteEmployee.id;
    setDeletingId(id);
    try {
      await portalService.deleteEmployee(id);
      setConfirmDeleteEmployee(null);
      onEmployeeUpdated();
    } catch (err) {
      console.error('Failed to delete staff:', err);
    } finally {
      setDeletingId(null);
    }
  };

  // Download Badge PNG in Modal
  const handleDownloadModalBadge = async () => {
    const badgeEl = document.getElementById('modal-badge-preview');
    if (!badgeEl || !selectedBadgeEmployee) return;

    setIsDownloading(true);
    // Capture the badge at its native 340x530 size, not the scaled preview.
    const scaler = badgeScalerRef.current;
    const previousTransform = scaler?.style.transform ?? '';
    if (scaler) scaler.style.transform = 'none';

    try {
      // Ensure all images are fully loaded before capturing
      const images = Array.from(badgeEl.querySelectorAll('img'));
      await Promise.all(
        images.map(
          (img) =>
            new Promise<void>((resolve) => {
              if (img.complete) return resolve();
              img.onload = () => resolve();
              img.onerror = () => resolve();
            })
        )
      );

      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(badgeEl, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 6000,
      });

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${selectedBadgeEmployee.employee_code}-badge.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to download badge:', err);
      try {
        const html2canvas = (await import('html2canvas')).default;
        const canvas = await html2canvas(badgeEl, {
          scale: 3,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
        });
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `${selectedBadgeEmployee.employee_code}-badge.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (fallbackErr) {
        console.error('Fallback badge download failed:', fallbackErr);
        alert('Failed to download badge image.');
      }
    } finally {
      if (scaler) scaler.style.transform = previousTransform;
      setIsDownloading(false);
    }
  };

  // Export Filtered Personnel to Excel (.xlsx) with embedded QR codes
  const handleExportExcel = async () => {
    if (filteredEmployees.length === 0 || isExportingExcel) return;
    setIsExportingExcel(true);
    try {
      const { exportPersonnelToExcel } = await import('../utils/exportExcel');
      await exportPersonnelToExcel(filteredEmployees);
    } catch (err) {
      console.error('Failed to export Excel workbook:', err);
      alert('An error occurred while generating the Excel workbook.');
    } finally {
      setIsExportingExcel(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Header */}
      <div className="bg-white border border-slate-200 dark:bg-[#16191e] dark:border-[#222730] rounded-2xl p-4 sm:p-5 shadow-sm transition-colors flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, code (KM100-XXX), or role..."
            aria-label="Search employees by name, code, or role"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 dark:bg-[#0d0f12] dark:border-[#222730] rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>

        {/* Filter Dropdowns & Export Action */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full md:w-auto">
          <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center sm:gap-2.5">
            {/* Department Filter */}
            <div className="flex items-center space-x-2 w-full sm:w-auto bg-slate-50 border border-slate-300 dark:bg-[#0d0f12] dark:border-[#222730] px-3.5 py-2.5 rounded-xl transition-colors">
              <Filter className="w-3.5 h-3.5 text-orange-500 shrink-0" />
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                aria-label="Filter by department"
                className="w-full sm:w-auto bg-transparent text-xs font-bold text-slate-800 dark:text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-white text-slate-900 dark:bg-[#16191e] dark:text-white">
                  All Departments
                </option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept} className="bg-white text-slate-900 dark:bg-[#16191e] dark:text-white">
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-2 w-full sm:w-auto bg-slate-50 border border-slate-300 dark:bg-[#0d0f12] dark:border-[#222730] px-3.5 py-2.5 rounded-xl transition-colors">
              <Shield className="w-3.5 h-3.5 text-orange-500 shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by account status"
                className="w-full sm:w-auto bg-transparent text-xs font-bold text-slate-800 dark:text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-white text-slate-900 dark:bg-[#16191e] dark:text-white">
                  All Statuses
                </option>
                <option value="Active" className="bg-white text-emerald-600 dark:bg-[#16191e] dark:text-emerald-400">
                  Active
                </option>
                <option value="On Leave" className="bg-white text-amber-600 dark:bg-[#16191e] dark:text-amber-400">
                  On Leave
                </option>
                <option value="Inactive" className="bg-white text-rose-600 dark:bg-[#16191e] dark:text-rose-400">
                  Inactive
                </option>
              </select>
            </div>
          </div>

          {/* Export Excel (.xlsx) Button */}
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={isExportingExcel || filteredEmployees.length === 0}
            aria-label="Export filtered personnel directory to Excel with embedded QR codes"
            className="min-h-[42px] flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {isExportingExcel ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Generating XLSX...</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-4 h-4 text-white" />
                <span>Export Excel</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Staff Table (tablet & desktop) */}
      <div className="hidden md:block bg-white border border-slate-200 dark:bg-[#16191e] dark:border-[#222730] rounded-2xl shadow-sm transition-colors overflow-hidden">
        <div className="overflow-x-auto max-h-[640px] overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 z-10 bg-slate-100/95 dark:bg-[#0d0f12]/95 backdrop-blur-md border-b border-slate-200 dark:border-[#222730] text-[11px] uppercase tracking-wider text-slate-700 dark:text-slate-300 font-bold transition-colors">
              <tr>
                <th className="py-3.5 px-5">Faculty / Personnel</th>
                <th className="py-3.5 px-5">Role &amp; Department</th>
                <th className="py-3.5 px-5">Shift Schedule</th>
                <th className="py-3.5 px-5 text-center">Site Status</th>
                <th className="py-3.5 px-5 text-center">Account</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-[#222730]/80 transition-colors">
              {filteredEmployees.map((emp) => {
                const isOnSite = onSiteEmployeeCodes.has(emp.employee_code.toUpperCase());
                const isInactive = emp.status === 'Inactive';
                const isOnLeave = emp.status === 'On Leave';

                return (
                  <tr key={emp.id} className="hover:bg-slate-50/80 dark:hover:bg-[#1a1e26] transition-colors">
                    {/* Employee Profile */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border-2 border-orange-500 bg-slate-100 dark:bg-[#0d0f12]">
                          {emp.photo_url ? (
                            <img
                              src={emp.photo_url}
                              alt={emp.full_name}
                              width={40}
                              height={40}
                              loading="lazy"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-black text-orange-500">
                              {getInitials(emp.full_name)}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white leading-tight">
                            {emp.full_name}
                          </div>
                          <div className="text-[11px] font-mono text-orange-600 dark:text-orange-400 font-bold">
                            {emp.employee_code}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role & Dept */}
                    <td className="py-3 px-4">
                      <div className="text-slate-800 dark:text-slate-200 font-medium">{emp.role}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{emp.department}</div>
                    </td>

                    {/* Shift */}
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                      {emp.shift_schedule}
                    </td>

                    {/* On-Site Status Badge */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          isOnSite
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/80 dark:border-emerald-500/40 dark:text-emerald-300'
                            : 'bg-slate-100 border-slate-300 text-slate-600 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-500'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            isOnSite ? 'bg-emerald-500 animate-pulse motion-reduce:animate-none' : 'bg-slate-400 dark:bg-slate-600'
                          }`}
                        />
                        {isOnSite ? 'On-Site' : 'Off-Site'}
                      </span>
                    </td>

                    {/* Account Status Badge */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          isInactive
                            ? 'bg-rose-50 border-rose-300 text-rose-800 dark:bg-rose-950/70 dark:border-rose-500/40 dark:text-rose-400'
                            : isOnLeave
                            ? 'bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-950/70 dark:border-amber-500/40 dark:text-amber-300'
                            : 'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/70 dark:border-emerald-500/40 dark:text-emerald-400'
                        }`}
                      >
                        {emp.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setSelectedBadgeEmployee(emp)}
                          title="View & Print Badge"
                          aria-label={`View QR badge for ${emp.full_name}`}
                          className="min-h-[38px] min-w-[38px] p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:hover:text-white transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setEditingEmployee(emp)}
                          title="Edit Staff"
                          aria-label={`Edit staff record for ${emp.full_name}`}
                          className="min-h-[38px] min-w-[38px] p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:hover:text-white transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setConfirmDeleteEmployee(emp)}
                          disabled={deletingId === emp.id}
                          title="Delete Staff"
                          aria-label={`Delete staff record for ${emp.full_name}`}
                          className="min-h-[38px] min-w-[38px] p-2 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-700 dark:bg-slate-800 dark:hover:bg-rose-900/60 dark:text-slate-300 dark:hover:text-rose-400 transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 disabled:opacity-50 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No staff members found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Staff Cards (mobile) */}
      <div className="md:hidden space-y-2">
        {filteredEmployees.map((emp) => {
          const isOnSite = onSiteEmployeeCodes.has(emp.employee_code.toUpperCase());
          const isInactive = emp.status === 'Inactive';
          const isOnLeave = emp.status === 'On Leave';

          return (
            <div
              key={emp.id}
              className="bg-white border border-slate-200 dark:bg-[#16191e] dark:border-[#222730] rounded-xl p-3 shadow-sm transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 border-2 border-orange-500 bg-slate-100 dark:bg-[#0d0f12]">
                  {emp.photo_url ? (
                    <img
                      src={emp.photo_url}
                      alt={emp.full_name}
                      width={44}
                      height={44}
                      loading="lazy"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm font-black text-orange-500">
                      {getInitials(emp.full_name)}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 dark:text-white leading-tight truncate">
                        {emp.full_name}
                      </div>
                      <div className="text-[11px] font-mono text-orange-600 dark:text-orange-400 font-bold">
                        {emp.employee_code}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                        isInactive
                          ? 'bg-rose-50 border-rose-300 text-rose-800 dark:bg-rose-950/70 dark:border-rose-500/40 dark:text-rose-400'
                          : isOnLeave
                          ? 'bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-950/70 dark:border-amber-500/40 dark:text-amber-300'
                          : 'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/70 dark:border-emerald-500/40 dark:text-emerald-400'
                      }`}
                    >
                      {emp.status}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-600 dark:text-slate-300 font-medium truncate mt-0.5">
                    {emp.role}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {emp.department}
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        isOnSite
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/80 dark:border-emerald-500/40 dark:text-emerald-300'
                          : 'bg-slate-100 border-slate-300 text-slate-600 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-500'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                          isOnSite
                            ? 'bg-emerald-500 animate-pulse motion-reduce:animate-none'
                            : 'bg-slate-400 dark:bg-slate-600'
                        }`}
                      />
                      {isOnSite ? 'On-Site' : 'Off-Site'}
                    </span>

                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => setSelectedBadgeEmployee(emp)}
                        title="View & Print Badge"
                        aria-label={`View QR badge for ${emp.full_name}`}
                        className="min-h-[40px] min-w-[40px] p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingEmployee(emp)}
                        title="Edit Staff"
                        aria-label={`Edit staff record for ${emp.full_name}`}
                        className="min-h-[40px] min-w-[40px] p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteEmployee(emp)}
                        disabled={deletingId === emp.id}
                        title="Delete Staff"
                        aria-label={`Delete staff record for ${emp.full_name}`}
                        className="min-h-[40px] min-w-[40px] p-2 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-700 dark:bg-slate-800 dark:hover:bg-rose-900/60 dark:text-slate-300 dark:hover:text-rose-400 transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 disabled:opacity-50 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filteredEmployees.length === 0 && (
          <div className="bg-white border border-slate-200 dark:bg-[#16191e] dark:border-[#222730] rounded-xl p-8 text-center text-xs text-slate-500 dark:text-slate-400">
            No staff members found matching your search.
          </div>
        )}
      </div>

      {/* View Badge Modal */}
      {selectedBadgeEmployee && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="badge-modal-title"
          className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-[#0d0f12]/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            ref={badgeModalRef}
            className="bg-white border border-slate-200 dark:bg-[#16191e] dark:border-[#222730] rounded-3xl p-6 max-w-md w-full max-h-[92vh] overflow-y-auto shadow-2xl relative flex flex-col items-center transition-colors"
          >
            <button
              onClick={() => setSelectedBadgeEmployee(null)}
              aria-label="Close dialog"
              className="absolute right-4 top-4 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-[#222730] dark:hover:bg-[#2e3542] dark:text-slate-400 dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 id="badge-modal-title" className="text-sm font-black text-slate-900 dark:text-white mb-4 uppercase tracking-wider">
              Official KM100 Personnel Badge
            </h3>

            {/* Badge Card — auto-scaled to fit fully inside the modal */}
            <div
              id="printable-badge-area"
              className="w-full flex justify-center items-center"
              style={{ height: BADGE_HEIGHT * badgeScale }}
            >
              <div
                ref={badgeScalerRef}
                style={{ transform: `scale(${badgeScale})`, transformOrigin: 'center center' }}
              >
                <BadgeCard
                  employee={selectedBadgeEmployee}
                  id="modal-badge-preview"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-4 flex items-center gap-3 w-full">
              <button
                type="button"
                onClick={handleDownloadModalBadge}
                disabled={isDownloading}
                aria-label="Download badge as PNG"
                className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 dark:bg-[#222730] dark:hover:bg-[#2b3342] dark:text-slate-200 dark:border-[#323946] text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Download className="w-4 h-4 text-orange-500" />
                <span>Download Pass</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                aria-label="Print pass"
                className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-xs font-black text-white transition-all shadow-md cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Pass</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {editingEmployee && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-modal-title"
          className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-[#0d0f12]/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            ref={editModalRef}
            className="bg-white border border-slate-200 dark:bg-[#16191e] dark:border-[#222730] rounded-3xl p-6 max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl relative transition-colors"
          >
            <button
              onClick={() => setEditingEmployee(null)}
              aria-label="Close edit staff dialog"
              className="absolute right-4 top-4 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-[#222730] dark:hover:bg-[#2e3542] dark:text-slate-400 dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 id="edit-modal-title" className="text-sm font-black text-slate-900 dark:text-white mb-4 uppercase tracking-wider">
              Edit Staff Member • {editingEmployee.employee_code}
            </h3>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label htmlFor="edit-full-name" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  id="edit-full-name"
                  type="text"
                  required
                  value={editingEmployee.full_name}
                  onChange={(e) =>
                    setEditingEmployee({ ...editingEmployee, full_name: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 dark:bg-[#0d0f12] dark:border-[#222730] rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="edit-role" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Role / Position
                  </label>
                  <input
                    id="edit-role"
                    type="text"
                    required
                    value={editingEmployee.role}
                    onChange={(e) =>
                      setEditingEmployee({ ...editingEmployee, role: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 dark:bg-[#0d0f12] dark:border-[#222730] rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="edit-department" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <select
                    id="edit-department"
                    value={editingEmployee.department}
                    onChange={(e) =>
                      setEditingEmployee({ ...editingEmployee, department: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 dark:bg-[#0d0f12] dark:border-[#222730] rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="edit-shift" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Shift Schedule
                  </label>
                  <select
                    id="edit-shift"
                    value={editingEmployee.shift_schedule}
                    onChange={(e) =>
                      setEditingEmployee({ ...editingEmployee, shift_schedule: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 dark:bg-[#0d0f12] dark:border-[#222730] rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors"
                  >
                    {SHIFT_SCHEDULES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="edit-status" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Account Status
                  </label>
                  <select
                    id="edit-status"
                    value={editingEmployee.status}
                    onChange={(e) =>
                      setEditingEmployee({
                        ...editingEmployee,
                        status: e.target.value as EmployeeStatus,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 dark:bg-[#0d0f12] dark:border-[#222730] rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors"
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    2×2 Staff Picture
                  </label>
                  {editingEmployee.photo_url && (
                    <button
                      type="button"
                      onClick={() => setEditingEmployee({ ...editingEmployee, photo_url: null })}
                      className="text-[11px] text-rose-600 hover:text-rose-700 dark:text-rose-400 font-bold hover:underline cursor-pointer"
                    >
                      Remove Picture
                    </button>
                  )}
                </div>

                <input
                  ref={editPhotoFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleEditPhotoFileUpload}
                  className="hidden"
                  id="edit-photo-file-input"
                />

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <button
                    type="button"
                    onClick={() => editPhotoFileInputRef.current?.click()}
                    className="min-h-[38px] px-3.5 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-xs shrink-0"
                  >
                    <Upload className="w-3.5 h-3.5 text-white" />
                    <span>Upload 2×2 Picture</span>
                  </button>

                  <input
                    id="edit-photo-url"
                    type="url"
                    value={editingEmployee.photo_url?.startsWith('data:') ? '' : editingEmployee.photo_url || ''}
                    onChange={(e) =>
                      setEditingEmployee({
                        ...editingEmployee,
                        photo_url: e.target.value || null,
                      })
                    }
                    placeholder={editingEmployee.photo_url?.startsWith('data:') ? 'Custom 2×2 image uploaded' : 'Or enter image URL (https://...)'}
                    className="flex-1 min-w-0 px-3 py-2 bg-slate-50 border border-slate-300 dark:bg-[#0d0f12] dark:border-[#222730] rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingEmployee(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-[#222730] dark:hover:bg-[#2c3342] text-xs font-semibold dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-xs font-black text-white shadow-md cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingEdit ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Staff Confirmation Modal */}
      {confirmDeleteEmployee && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          aria-describedby="delete-dialog-desc"
          className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-[#0d0f12]/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            ref={deleteModalRef}
            className="bg-white border border-slate-200 dark:bg-[#16191e] dark:border-[#222730] rounded-3xl p-6 max-w-sm w-full shadow-2xl relative transition-colors"
          >
            <h3 id="delete-dialog-title" className="text-sm font-black text-slate-900 dark:text-white mb-2 uppercase tracking-wider">
              Revoke &amp; Delete Credential
            </h3>
            <p id="delete-dialog-desc" className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-5">
              Are you sure you want to permanently delete <strong className="text-slate-900 dark:text-white font-bold">{confirmDeleteEmployee.full_name}</strong> (<span className="font-mono text-orange-600 dark:text-orange-400 font-bold">{confirmDeleteEmployee.employee_code}</span>)? Their badge will be immediately invalidated and cannot be scanned at gate kiosks.
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmDeleteEmployee(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-[#222730] dark:hover:bg-[#2c3342] text-xs font-semibold dark:text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                disabled={deletingId === confirmDeleteEmployee.id}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-black text-white shadow-md disabled:opacity-50 cursor-pointer"
              >
                {deletingId === confirmDeleteEmployee.id ? 'Deleting...' : 'Revoke & Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
