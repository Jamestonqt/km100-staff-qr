import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Cpu } from 'lucide-react';
import type { Employee } from '../types/database';
import { createQRPayload, getInitials } from '../utils/qr';

interface BadgeCardProps {
  employee: Employee;
  id?: string;
  className?: string;
}

export const BadgeCard: React.FC<BadgeCardProps> = ({ employee, id = 'cr80-badge-card', className = '' }) => {
  const qrValue = createQRPayload(employee);
  const initials = getInitials(employee.full_name);

  const isInactive = employee.status === 'Inactive';
  const isOnLeave = employee.status === 'On Leave';

  return (
    <div
      id={id}
      className={`relative w-[340px] h-[530px] rounded-2xl overflow-hidden bg-[#12151a] border-2 border-[#222730] shadow-2xl flex flex-col justify-between text-white font-sans ${className}`}
      style={{
        boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08) inset',
      }}
    >
      {/* Top Lanyard Slot & Organization Branding Header */}
      <div className="w-full pt-3 pb-2 px-4 bg-[#0d0f12] border-b border-[#222730] flex flex-col items-center">
        {/* Lanyard punch hole cut out simulation */}
        <div className="w-12 h-2 rounded-full bg-[#181b22] border border-[#2e3542] mb-2 shadow-inner" />

        <div className="w-full flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 flex items-center justify-center">
              <img
                src="/km100-logo.png"
                alt="KM100 Logo"
                className="w-full h-full object-contain rounded-full"
              />
            </div>
            <div className="text-left">
              <div className="text-xs font-black tracking-tight text-white leading-tight">
                KM100
              </div>
              <div className="text-[8px] uppercase tracking-wider text-orange-400 font-extrabold leading-none">
                Skills &amp; Training Center
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <span className="flex items-center text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-[#1e232b] border border-[#2f3644] text-slate-300">
              <Cpu className="w-2.5 h-2.5 mr-1 text-orange-400" />
              ID-PASS
            </span>
          </div>
        </div>
      </div>

      {/* KM100 Brand Accent Stripe */}
      <div className="h-1.5 w-full bg-orange-600" />

      {/* Main Body */}
      <div className="flex-1 px-5 py-3 flex flex-col items-center justify-between text-center">
        {/* Photo / Avatar with High-Fidelity Badge Ring */}
        <div className="relative mt-1">
          <div className="w-24 h-24 rounded-full p-1 bg-[#1a1e26] border-2 border-orange-500 shadow-md">
            {employee.photo_url ? (
              <img
                src={employee.photo_url}
                alt={employee.full_name}
                className="w-full h-full rounded-full object-cover bg-[#0d0f12]"
                crossOrigin="anonymous"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full rounded-full bg-[#161a22] flex items-center justify-center text-xl font-black text-orange-400 tracking-wider">
                {initials}
              </div>
            )}
          </div>

          {/* Account Status Badge */}
          <div
            className={`absolute -bottom-1 left-1/2 transform -translate-x-1/2 px-2.5 py-0.5 rounded text-[9px] font-extrabold tracking-wider uppercase shadow-sm border ${
              isInactive
                ? 'bg-rose-600 text-white border-rose-400'
                : isOnLeave
                ? 'bg-amber-600 text-white border-amber-400'
                : 'bg-emerald-600 text-white border-emerald-400'
            }`}
          >
            {employee.status}
          </div>
        </div>

        {/* Employee Details */}
        <div className="mt-2 w-full">
          <h2 className="text-base font-black text-white tracking-tight leading-tight line-clamp-1">
            {employee.full_name}
          </h2>
          <p className="text-xs text-orange-300 font-semibold mt-0.5 line-clamp-1">
            {employee.role}
          </p>
          <div className="mt-1.5 flex items-center justify-center gap-1.5 flex-wrap">
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#1a1e26] border border-[#2a303d] text-slate-300">
              {employee.department}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-orange-950/60 border border-orange-500/40 text-orange-300 tracking-wider">
              {employee.employee_code}
            </span>
          </div>
        </div>

        {/* High-Resolution QR Code */}
        <div className="my-2 p-2 bg-white rounded-xl shadow-md border border-slate-300 flex items-center justify-center">
          <QRCodeSVG
            value={qrValue}
            size={116}
            level="H"
            includeMargin={false}
            fgColor="#0d0f12"
            bgColor="#ffffff"
          />
        </div>

        <div className="text-[9px] text-slate-400 font-mono tracking-tight leading-tight">
          OFFICIAL KM100 FACULTY &amp; STAFF CREDENTIAL
        </div>
      </div>

      {/* Footer / Shift Schedule & Official Barcode */}
      <div className="w-full px-4 py-2 bg-[#0d0f12] border-t border-[#222730] flex items-center justify-between text-[9px] text-slate-400 font-mono">
        <div className="text-left">
          <div className="text-slate-200 font-bold">{employee.shift_schedule}</div>
          <div className="text-[8px] text-slate-500 uppercase">
            PROPERTY OF KM100 SKILLS &amp; TRAINING CENTER, INC.
          </div>
        </div>

        {/* Official Barcode Strip */}
        <div className="flex items-end space-x-[2px] h-4.5 opacity-80 shrink-0">
          <div className="w-1 h-full bg-slate-300" />
          <div className="w-[1px] h-full bg-slate-300" />
          <div className="w-1.5 h-full bg-slate-300" />
          <div className="w-[2px] h-full bg-slate-300" />
          <div className="w-1 h-full bg-slate-300" />
          <div className="w-[1px] h-full bg-slate-300" />
          <div className="w-2 h-full bg-slate-300" />
          <div className="w-1 h-full bg-slate-300" />
          <div className="w-[2px] h-full bg-slate-300" />
          <div className="w-1 h-full bg-slate-300" />
        </div>
      </div>
    </div>
  );
};
