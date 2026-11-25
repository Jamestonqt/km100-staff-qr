import React, { useState, useMemo } from 'react';
import html2canvas from 'html2canvas';
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

interface DirectoryViewProps {
  employees: Employee[];
  logs: ScanLog[];
  onEmployeeUpdated: () => void;
}

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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  // Derive on-site status from the most recent valid scan per employee:
  // CHECK_IN => On-Site, CHECK_OUT => Off-Site
  const onSiteEmployeeCodes = useMemo(() => {
    const latestValidMap = new Map<string, ScanLog>();
    for (const log of logs) {
      if (log.verification_status !== 'VALID') continue;
      const code = log.employee_code.toUpperCase();
      const existing = latestValidMap.get(code);
      if (!existing || new Date(log.scanned_at).getTime() > new Date(existing.scanned_at).getTime()) {
        latestValidMap.set(code, log);
      }
    }
    const onSiteSet = new Set<string>();
    for (const [code, log] of latestValidMap.entries()) {
      if (log.scan_type === 'CHECK_IN') {
        onSiteSet.add(code);
      }
    }
    return onSiteSet;
  }, [logs]);

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

  // Handle Delete
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this staff record and revoke their badge?')) {
      return;
    }
    setDeletingId(id);
    try {
      await portalService.deleteEmployee(id);
      onEmployeeUpdated();
    } catch (err) {
      console.error('Failed to delete staff:', err);
      alert('Failed to delete staff');
    } finally {
      setDeletingId(null);
    }
  };

  // Download Badge PNG in Modal
  const handleDownloadModalBadge = async () => {
    const badgeEl = document.getElementById('modal-badge-preview');
    if (!badgeEl || !selectedBadgeEmployee) return;

    setIsDownloading(true);
    try {
      const canvas = await html2canvas(badgeEl, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#020617',
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
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Header */}
      <div className="bg-white border border-slate-200 dark:bg-[#16191e] dark:border-[#222730] rounded-2xl p-4 sm:p-5 shadow-sm transition-colors flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, code (KM100-XXX), or role..."
            aria-label="Search employees by name, code, or role"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 dark:bg-[#0d0f12] dark:border-[#222730] rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Department Filter */}
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-300 dark:bg-[#0d0f12] dark:border-[#222730] px-3.5 py-2 rounded-xl transition-colors">
            <Filter className="w-3.5 h-3.5 text-orange-500" />
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-300 focus:outline-none cursor-pointer"
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
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-300 dark:bg-[#0d0f12] dark:border-[#222730] px-3.5 py-2 rounded-xl transition-colors">
            <Shield className="w-3.5 h-3.5 text-orange-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-300 focus:outline-none cursor-pointer"
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
      </div>

      {/* Staff Table / Cards */}
      <div className="bg-white border border-slate-200 dark:bg-[#16191e] dark:border-[#222730] rounded-2xl shadow-sm transition-colors overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 border-b border-slate-200 dark:bg-[#0d0f12] dark:border-[#222730] text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-400 font-bold transition-colors">
              <tr>
                <th className="py-3 px-4">Faculty / Personnel</th>
                <th className="py-3 px-4">Role &amp; Department</th>
                <th className="py-3 px-4">Shift Schedule</th>
                <th className="py-3 px-4 text-center">Site Status</th>
                <th className="py-3 px-4 text-center">Account</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-[#222730]/80 transition-colors">
              {filteredEmployees.map((emp) => {
                const isOnSite = onSiteEmployeeCodes.has(emp.employee_code.toUpperCase());
                const isInactive = emp.status === 'Inactive';
                const isOnLeave = emp.status === 'On Leave';

                return (
                  <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-[#1a1e26] transition-colors">
                    {/* Employee Profile */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border-2 border-orange-500 bg-slate-100 dark:bg-[#0d0f12]">
                          {emp.photo_url ? (
                            <img
                              src={emp.photo_url}
                              alt={emp.full_name}
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
                          onClick={() => handleDelete(emp.id)}
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

      {/* View Badge Modal */}
      {selectedBadgeEmployee && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-[#0d0f12]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 dark:bg-[#16191e] dark:border-[#222730] rounded-3xl p-6 max-w-md w-full shadow-2xl relative flex flex-col items-center transition-colors">
            <button
              onClick={() => setSelectedBadgeEmployee(null)}
              aria-label="Close dialog"
              className="absolute right-4 top-4 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-[#222730] dark:hover:bg-[#2e3542] dark:text-slate-400 dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-sm font-black text-slate-900 dark:text-white mb-4 uppercase tracking-wider">
              Official KM100 Personnel Badge
            </h3>

            {/* Badge Card */}
            <div id="printable-badge-area">
              <BadgeCard
                employee={selectedBadgeEmployee}
                id="modal-badge-preview"
                className="transform scale-95 origin-top"
              />
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-[#0d0f12]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 dark:bg-[#16191e] dark:border-[#222730] rounded-3xl p-6 max-w-lg w-full shadow-2xl relative transition-colors">
            <button
              onClick={() => setEditingEmployee(null)}
              aria-label="Close edit staff dialog"
              className="absolute right-4 top-4 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-[#222730] dark:hover:bg-[#2e3542] dark:text-slate-400 dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-sm font-black text-slate-900 dark:text-white mb-4 uppercase tracking-wider">
              Edit Staff Member • {editingEmployee.employee_code}
            </h3>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editingEmployee.full_name}
                  onChange={(e) =>
                    setEditingEmployee({ ...editingEmployee, full_name: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 dark:bg-[#0d0f12] dark:border-[#222730] rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Role / Position
                  </label>
                  <input
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
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <select
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Shift Schedule
                  </label>
                  <select
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
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Account Status
                  </label>
                  <select
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
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Photo URL
                </label>
                <input
                  type="url"
                  value={editingEmployee.photo_url || ''}
                  onChange={(e) =>
                    setEditingEmployee({
                      ...editingEmployee,
                      photo_url: e.target.value || null,
                    })
                  }
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 dark:bg-[#0d0f12] dark:border-[#222730] rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors"
                />
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
    </div>
  );
};
