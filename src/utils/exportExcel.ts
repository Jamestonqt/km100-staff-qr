import ExcelJS from 'exceljs';
import type { Employee } from '../types/database';
import { createQRPayload, generateQRToken } from './qr';
import { getManilaDateString } from './presence';
import { generateBrandedQrDataUrl } from './brandedQr';

/**
 * Generates and downloads a styled Excel workbook (.xlsx) containing employee details
 * and embedded QR code images for the KM100 Staff & Access Portal.
 */
export async function exportPersonnelToExcel(employees: Employee[]): Promise<void> {
  if (employees.length === 0) {
    throw new Error('No employees available to export.');
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'KM100 Staff & Access Portal';
  workbook.lastModifiedBy = 'KM100 Admin';
  workbook.created = new Date();
  workbook.modified = new Date();

  const worksheet = workbook.addWorksheet('KM100 Personnel Directory', {
    views: [{ showGridLines: true }],
  });

  // Set columns and widths (QR Code column width ~22)
  worksheet.columns = [
    { header: 'Employee ID', key: 'employee_code', width: 18 },
    { header: 'Full Name', key: 'full_name', width: 26 },
    { header: 'Role', key: 'role', width: 24 },
    { header: 'Department', key: 'department', width: 32 },
    { header: 'Shift Schedule', key: 'shift_schedule', width: 24 },
    { header: 'Account Status', key: 'status', width: 16 },
    { header: 'QR Code Image', key: 'qr_code', width: 22 },
  ];

  // Style Header Row (bold white text on dark navy/slate background)
  const headerRow = worksheet.getRow(1);
  headerRow.height = 32;

  headerRow.eachCell((cell) => {
    cell.font = {
      name: 'Segoe UI',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0F172A' }, // Slate-900 / dark navy
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true,
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF334155' } },
      left: { style: 'thin', color: { argb: 'FF334155' } },
      bottom: { style: 'medium', color: { argb: 'FFEA580C' } }, // KM100 Orange accent border
      right: { style: 'thin', color: { argb: 'FF334155' } },
    };
  });

  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  };

  // Add each employee row and embed the QR code image
  for (let i = 0; i < employees.length; i++) {
    const emp = employees[i];
    const rowNumber = i + 2; // Row 1 is header

    const row = worksheet.addRow({
      employee_code: emp.employee_code,
      full_name: emp.full_name,
      role: emp.role,
      department: emp.department,
      shift_schedule: emp.shift_schedule || 'Standard (8:00 AM - 5:00 PM)',
      status: emp.status,
      qr_code: '', // The cell holds the embedded image
    });

    // Row height ~90pt as required so the QR code fits with white padding
    row.height = 90;

    const isEven = i % 2 === 1;
    const rowBg = isEven ? 'FFF8FAFC' : 'FFFFFFFF';

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.border = thinBorder;
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: rowBg },
      };
      cell.font = {
        name: 'Segoe UI',
        size: 10,
      };

      if (colNumber === 1) {
        // Employee ID
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFEA580C' } };
      } else if (colNumber === 6) {
        // Account Status
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.font = {
          name: 'Segoe UI',
          size: 10,
          bold: true,
          color: {
            argb:
              emp.status === 'Active'
                ? 'FF059669' // Emerald
                : emp.status === 'On Leave'
                ? 'FFD97706' // Amber
                : 'FFE11D48', // Rose
          },
        };
      } else if (colNumber === 7) {
        // QR Code column
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      }
    });

    // Generate exact QR payload scanned by Access Scanner
    const qrPayload = createQRPayload({
      employee_code: emp.employee_code,
      qr_token: emp.qr_token || generateQRToken(emp.employee_code),
    });

    // Generate crisp branded QR code PNG with centered KM100 logo (High error correction, margin: 3)
    const qrDataUrl = await generateBrandedQrDataUrl(qrPayload, 240);

    // Embed QR image into the workbook
    const imageId = workbook.addImage({
      base64: qrDataUrl,
      extension: 'png',
    });

    // Place image centered inside Column G (col index 6)
    // QR code is 100x100px inside a ~154px wide x 120px high cell, ensuring white padding
    worksheet.addImage(imageId, {
      tl: { col: 6 + 0.18, row: rowNumber - 1 + 0.08 },
      ext: { width: 100, height: 100 },
      editAs: 'oneCell',
    });
  }

  // Generate buffer and trigger browser download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const dateStr = getManilaDateString();
  const filename = `KM100-Personnel-QR-Directory-${dateStr}.xlsx`;

  const downloadUrl = URL.createObjectURL(blob);
  const downloadLink = document.createElement('a');
  downloadLink.href = downloadUrl;
  downloadLink.download = filename;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(downloadUrl);
}
