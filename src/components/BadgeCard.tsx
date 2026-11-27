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

  return (
    <div
      id={id}
      className={`relative w-[340px] h-[530px] rounded-2xl overflow-hidden bg-white border-2 border-slate-200 shadow-xl flex flex-col justify-between text-slate-900 font-sans ${className}`}
      style={{
        boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05)',
      }}
    >
      {/* Top Lanyard Slot & Organization Branding Header with TESDA Logo */}
      <div className="w-full pt-3 pb-2.5 px-3 bg-white border-b border-slate-100 flex flex-col items-center">
        {/* Lanyard punch hole cutout simulation */}
        <div className="w-12 h-2 rounded-full bg-slate-200 border border-slate-300 mb-2 shadow-inner" />

        <div className="w-full flex items-center justify-between px-1">
          {/* Left: KM100 Logo */}
          <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-white shadow-xs">
            <img
              src="/km100-logo.png"
              alt="KM100 Logo"
              className="w-full h-full object-contain rounded-full"
            />
          </div>

          {/* Center: 1-line Black Company Name */}
          <div className="flex-1 mx-1.5 text-center">
            <span className="text-[10px] font-black tracking-tight text-black uppercase leading-tight whitespace-nowrap block">
              KM100 SKILLS &amp; TRAINING CENTER, INC.
            </span>
          </div>

          {/* Right: Official TESDA Logo */}
          <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-white shadow-xs">
            <img
              src="/tesda-logo.png"
              alt="TESDA Logo"
              className="w-full h-full object-contain rounded-full"
            />
          </div>
        </div>
      </div>

      {/* KM100 Brand Accent Stripe */}
      <div className="h-1.5 w-full bg-orange-600" />

      {/* Main Body */}
      <div className="flex-1 px-5 pt-3 pb-4 flex flex-col items-center justify-between text-center">
        {/* 2x2 Square Photo (Simple Border, No Border Radius) */}
        <div className="relative mt-0.5">
          <div className="w-32 h-32 aspect-square p-0.5 bg-white border border-slate-300 shadow-sm flex items-center justify-center overflow-hidden">
            {employee.photo_url ? (
              <img
                src={employee.photo_url}
                alt={employee.full_name}
                width={128}
                height={128}
                loading="lazy"
                className="w-full h-full object-cover bg-slate-100"
                crossOrigin="anonymous"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full bg-slate-100 flex items-center justify-center text-2xl font-black text-slate-700 tracking-wider">
                {initials}
              </div>
            )}
          </div>
        </div>

        {/* Employee Details (Name & Employee Code Only - Position Removed) */}
        <div className="mt-1.5 w-full space-y-0.5">
          <h2 className="text-lg font-black text-slate-900 tracking-tight leading-tight line-clamp-1">
            {employee.full_name}
          </h2>
          <p className="text-xs font-mono font-bold text-slate-700 tracking-wider">
            {employee.employee_code}
          </p>
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
    </div>
  );
};
