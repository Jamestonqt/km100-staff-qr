import React, { useState, useEffect } from 'react';
import type { Employee } from '../types/database';
import { createQRPayload, getInitials } from '../utils/qr';
import { generateBrandedQrDataUrl } from '../utils/brandedQr';

interface BadgeCardProps {
  employee: Employee;
  id?: string;
  className?: string;
}

export const BadgeCard: React.FC<BadgeCardProps> = ({ employee, id = 'cr80-badge-card', className = '' }) => {
  const qrValue = createQRPayload(employee);
  const initials = getInitials(employee.full_name);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    generateBrandedQrDataUrl(qrValue, 320)
      .then((url) => {
        if (isMounted) setQrDataUrl(url);
      })
      .catch((err) => {
        console.error('Failed to generate branded QR code:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [qrValue]);

  const isInactive = employee.status === 'Inactive';
  const isOnLeave = employee.status === 'On Leave';

  return (
    <div
      id={id}
      className={`relative w-[340px] h-[530px] rounded-2xl overflow-hidden bg-white border-2 border-slate-200 shadow-xl flex flex-col justify-between text-slate-900 font-sans ${className}`}
      style={{
        boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05)',
      }}
    >
      {/* Top Lanyard Slot & Organization Branding Header */}
      <div className="w-full pt-3 pb-2.5 px-4 bg-white border-b border-slate-100 flex flex-col items-center">
        {/* Lanyard punch hole cutout simulation */}
        <div className="w-12 h-2 rounded-full bg-slate-200 border border-slate-300 mb-2 shadow-inner" />

        <div className="w-full flex items-center justify-center space-x-2.5">
          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 flex items-center justify-center">
            <img
              src="/km100-logo.png"
              alt="KM100 Logo"
              className="w-full h-full object-contain rounded-full"
            />
          </div>
          <div className="text-left">
            <div className="text-sm font-black tracking-tight text-slate-900 leading-tight">
              KM100
            </div>
            <div className="text-[8.5px] uppercase tracking-wider text-orange-600 font-black leading-none">
              Skills &amp; Training Center, Inc.
            </div>
          </div>
        </div>
      </div>

      {/* KM100 Brand Accent Stripe */}
      <div className="h-1.5 w-full bg-orange-600" />

      {/* Main Body */}
      <div className="flex-1 px-5 py-3.5 flex flex-col items-center justify-between text-center">
        {/* 1x1 Square Photo with Crisp Ring */}
        <div className="relative mt-0.5">
          <div className="w-24 h-24 aspect-square rounded-xl p-1 bg-white border-2 border-orange-500 shadow-md flex items-center justify-center overflow-hidden">
            {employee.photo_url ? (
              <img
                src={employee.photo_url}
                alt={employee.full_name}
                width={96}
                height={96}
                loading="lazy"
                className="w-full h-full rounded-lg object-cover bg-slate-100"
                crossOrigin="anonymous"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full rounded-lg bg-orange-50 flex items-center justify-center text-xl font-black text-orange-600 tracking-wider">
                {initials}
              </div>
            )}
          </div>

          {/* Account Status Badge */}
          <div
            className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase shadow-sm border ${
              isInactive
                ? 'bg-rose-600 text-white border-rose-500'
                : isOnLeave
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                : 'bg-emerald-600 text-white border-emerald-500'
            }`}
          >
            {employee.status}
          </div>
        </div>

        {/* Employee Details */}
        <div className="mt-2.5 w-full">
          <h2 className="text-lg font-black text-slate-900 tracking-tight leading-tight line-clamp-1">
            {employee.full_name}
          </h2>
          <p className="text-xs text-orange-600 font-bold mt-0.5 line-clamp-1 uppercase tracking-wide">
            {employee.role}
          </p>
          <div className="mt-2 flex items-center justify-center gap-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 border border-slate-200 text-slate-700">
              {employee.department}
            </span>
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-black bg-orange-50 border border-orange-200 text-orange-700 tracking-wider">
              {employee.employee_code}
            </span>
          </div>
        </div>

        {/* High-Resolution Branded QR Code */}
        <div className="my-1 p-2 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-center w-[156px] h-[156px]">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`KM100 QR Access Badge for ${employee.full_name}`}
              width={140}
              height={140}
              className="w-[140px] h-[140px] object-contain rounded-lg"
            />
          ) : (
            <div className="w-[140px] h-[140px] bg-slate-50 flex items-center justify-center rounded-lg">
              <span className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* Clean Minimalist Footer */}
      <div className="w-full px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 font-mono">
        <span>{employee.shift_schedule || 'Standard Shift (08:00 - 17:00)'}</span>
      </div>
    </div>
  );
};
