import React, { useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import {
  Download,
  Printer,
  Sparkles,
  UserCheck,
  RefreshCw,
  Image as ImageIcon,
  CheckCircle2,
  FileCheck,
} from 'lucide-react';
import type {
  Employee,
  EmployeeStatus,
} from '../types/database';
import { DEPARTMENTS, SHIFT_SCHEDULES } from '../types/database';
import { portalService } from '../lib/supabase';
import { BadgeCard } from './BadgeCard';
import { generateQRToken, getNextEmployeeCode } from '../utils/qr';

interface GeneratorViewProps {
  onEmployeeCreated: (newEmp: Employee) => void;
  existingEmployees: Employee[];
}

const SAMPLE_AVATARS = [
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=256',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=256',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=256',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256',
];

const COMMON_ROLES = [
  'Technical Vocational Trainer',
  'Workshop Supervisor',
  'Safety & Compliance Officer',
  'Technical Skills Instructor',
  'IT Systems Engineer',
  'Registrar & Records Officer',
  'Campus Operations Lead',
];

export const GeneratorView: React.FC<GeneratorViewProps> = ({
  onEmployeeCreated,
  existingEmployees,
}) => {
  const [employeeCode, setEmployeeCode] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [role, setRole] = useState<string>('Technical Vocational Trainer');
  const [department, setDepartment] = useState<string>('Technical & Vocational Training');
  const [shiftSchedule, setShiftSchedule] = useState<string>('Day Shift (08:00 - 17:00)');
  const [status, setStatus] = useState<EmployeeStatus>('Active');
  const [photoUrl, setPhotoUrl] = useState<string>(SAMPLE_AVATARS[0]);

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Initialize employee code with next sequential
  useEffect(() => {
    const codes = existingEmployees.map((e) => e.employee_code);
    const nextCode = getNextEmployeeCode(codes);
    setEmployeeCode(nextCode);
  }, [existingEmployees]);

  // Temporary preview employee object
  const previewEmployee: Employee = {
    id: 'preview',
    employee_code: employeeCode || 'KM100-XXX',
    full_name: fullName.trim() || 'Staff Name',
    role: role.trim() || 'Role / Position',
    department,
    shift_schedule: shiftSchedule,
    status,
    photo_url: photoUrl || null,
    qr_token: generateQRToken(employeeCode || 'KM100-XXX'),
    is_on_site: false,
    created_at: new Date().toISOString(),
  };

  const handlePickRandomAvatar = () => {
    const random = SAMPLE_AVATARS[Math.floor(Math.random() * SAMPLE_AVATARS.length)];
    setPhotoUrl(random);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !employeeCode.trim()) return;

    setIsSaving(true);
    try {
      const qrToken = generateQRToken(employeeCode);
      const created = await portalService.createEmployee({
        employee_code: employeeCode.trim().toUpperCase(),
        full_name: fullName.trim(),
        role: role.trim(),
        department,
        shift_schedule: shiftSchedule,
        status,
        photo_url: photoUrl.trim() || null,
        qr_token: qrToken,
        is_on_site: false,
      });

      onEmployeeCreated(created);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

      // Reset for next employee
      const updatedCodes = [...existingEmployees.map((e) => e.employee_code), created.employee_code];
      setEmployeeCode(getNextEmployeeCode(updatedCodes));
      setFullName('');
    } catch (err) {
      console.error('Failed to create staff:', err);
      const errRecord = err as { message?: unknown };
      const message = err instanceof Error
        ? err.message
        : errRecord?.message
        ? String(errRecord.message)
        : 'Please try again.';
      alert(`Error creating staff badge: ${message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Download high-resolution QR PNG only
  const handleDownloadQR = () => {
    const svgEl = document.querySelector('#cr80-badge-card svg') as SVGElement | null;
    if (!svgEl) return;

    const svgData = new XMLSerializer().serializeToString(svgEl);
    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 1000;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 1000, 1000);
      ctx.drawImage(img, 50, 50, 900, 900);
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `${previewEmployee.employee_code}-qr.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  // Download full CR80 badge as PNG via html2canvas
  const handleDownloadFullBadge = async () => {
    const badgeEl = document.getElementById('cr80-badge-card');
    if (!badgeEl) return;

    setIsDownloading(true);
    try {
      const canvas = await html2canvas(badgeEl, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#020617',
        logging: false,
      });

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${previewEmployee.employee_code}-CR80-badge.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Badge image render failed:', err);
      alert('Unable to render badge image. Check image CORS permissions.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Print badge using dedicated clean print style
  const handlePrintBadge = () => {
    window.print();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Form (7 cols) */}
      <div className="lg:col-span-7 bg-white border border-slate-200 dark:bg-[#16191e] dark:border-[#222730] rounded-2xl p-6 shadow-sm transition-colors">
        <div className="flex items-start justify-between gap-3 pb-4 mb-5 border-b border-slate-200 dark:border-[#222730]">
          <div className="min-w-0">
            <h2 className="text-base font-black text-slate-900 dark:text-white tracking-wide">
              Issue Official KM100 Staff Badge
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Register faculty or staff &amp; issue verifiable CR80 access pass
            </p>
          </div>
          <span className="shrink-0 px-3 py-1 rounded-full text-xs font-mono font-bold bg-orange-100 text-orange-800 border border-orange-300 dark:bg-orange-950/60 dark:text-orange-400 dark:border-orange-500/30">
            CR80 Pass
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Employee Code */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Employee Code <span className="text-orange-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={employeeCode}
                  onChange={(e) => setEmployeeCode(e.target.value.toUpperCase())}
                  placeholder="KM100-006"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 dark:bg-[#0d0f12] dark:border-[#222730] rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors"
                />
                <button
                  type="button"
                  title="Generate next sequential code"
                  aria-label="Generate next sequential employee code"
                  onClick={() => {
                    const codes = existingEmployees.map((e) => e.employee_code);
                    setEmployeeCode(getNextEmployeeCode(codes));
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 min-h-[32px] min-w-[32px] flex items-center justify-center text-slate-400 hover:text-orange-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 rounded-lg cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Account Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as EmployeeStatus)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 dark:bg-[#0d0f12] dark:border-[#222730] rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 cursor-pointer transition-colors"
              >
                <option value="Active">Active (Full Gate Access)</option>
                <option value="On Leave">On Leave (Access Denied)</option>
                <option value="Inactive">Inactive (Revoked)</option>
              </select>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Full Legal Name <span className="text-orange-500">*</span>
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Jonathan Mercer"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 dark:bg-[#0d0f12] dark:border-[#222730] rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          {/* Role / Position */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Role / Position <span className="text-orange-500">*</span>
            </label>
            <input
              type="text"
              required
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Technical Vocational Trainer"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 dark:bg-[#0d0f12] dark:border-[#222730] rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
            />
            <div className="flex flex-wrap gap-1 mt-2">
              {COMMON_ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                    role === r
                      ? 'bg-orange-600 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Department */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 dark:bg-[#0d0f12] dark:border-[#222730] rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 cursor-pointer transition-colors"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Shift Schedule */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Shift Schedule
              </label>
              <select
                value={shiftSchedule}
                onChange={(e) => setShiftSchedule(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 dark:bg-[#0d0f12] dark:border-[#222730] rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 cursor-pointer transition-colors"
              >
                {SHIFT_SCHEDULES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Photo URL & Presets */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Staff Photo URL (Optional)
              </label>
              <button
                type="button"
                onClick={handlePickRandomAvatar}
                className="text-[11px] text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 cursor-pointer font-semibold"
              >
                <Sparkles className="w-3 h-3" />
                Randomize Photo
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://... (or leave empty for initials)"
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 dark:bg-[#0d0f12] dark:border-[#222730] rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
              />
              {photoUrl && (
                <button
                  type="button"
                  onClick={() => setPhotoUrl('')}
                  className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 bg-slate-200 dark:text-slate-400 dark:hover:text-white dark:bg-slate-800 rounded-xl cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <button
              type="submit"
              disabled={isSaving || !fullName.trim() || !employeeCode.trim()}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 active:bg-orange-700 disabled:opacity-50 text-white text-xs font-black shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>{isSaving ? 'Registering...' : 'Save & Issue Badge'}</span>
            </button>

            {saveSuccess && (
              <div className="flex items-center justify-center sm:justify-start space-x-1.5 text-xs text-orange-600 dark:text-orange-400 font-bold animate-fade-in">
                <CheckCircle2 className="w-4 h-4" />
                <span>Badge Registered &amp; Verified!</span>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Right Column: Live CR80 Badge Preview & Export Controls (5 cols) */}
      <div className="lg:col-span-5 w-full flex flex-col items-center">
        <div className="w-full max-w-[364px]">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-orange-500" />
              Live CR80 Pass Preview
            </span>
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">3.375" x 2.125" CR80</span>
          </div>

          {/* Dedicated printable card wrapper */}
          <div id="printable-badge-area" className="w-full overflow-x-auto flex justify-center p-3 rounded-2xl bg-white border border-slate-200 dark:bg-[#16191e] dark:border-[#222730] shadow-sm transition-colors">
            <BadgeCard employee={previewEmployee} id="cr80-badge-card" />
          </div>

          {/* Action Export Buttons */}
          <div className="mt-4 space-y-2 w-full">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleDownloadQR}
                aria-label="Download QR code only as PNG"
                className="min-h-[42px] flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-orange-500" />
                <span>QR Only (PNG)</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadFullBadge}
                disabled={isDownloading}
                aria-label="Download full CR80 ID pass card as PNG"
                className="min-h-[42px] flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5 text-orange-500" />
                <span>{isDownloading ? 'Rendering...' : 'Full Badge (PNG)'}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handlePrintBadge}
              aria-label="Print official CR80 staff pass card"
              className="min-h-[44px] w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white text-xs font-bold transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official CR80 Pass</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
