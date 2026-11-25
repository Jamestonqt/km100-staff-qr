import type { Employee, QRPayload } from '../types/database';

/**
 * Generates a secure verification hash / token for an employee
 */
export function generateQRToken(code: string): string {
  const randomPart = Math.random().toString(36).substring(2, 10);
  const timePart = Date.now().toString(36);
  const codePart = code.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  return `km100_tok_${codePart}_${timePart}_${randomPart}`;
}

/**
 * Creates the standard JSON QR payload for an employee
 */
export function createQRPayload(employee: Pick<Employee, 'employee_code' | 'qr_token'>): string {
  const payload: QRPayload = {
    org: 'KM100',
    code: employee.employee_code.trim().toUpperCase(),
    token: employee.qr_token,
  };
  return JSON.stringify(payload);
}

export interface ParsedQRResult {
  validFormat: boolean;
  code: string;
  token?: string;
  error?: string;
}

/**
 * Parses and validates raw QR data from the scanner or manual input.
 */
export function parseQRPayload(rawText: string): ParsedQRResult {
  const trimmed = rawText.trim();
  if (!trimmed) {
    return { validFormat: false, code: '', error: 'Empty QR code detected' };
  }

  // Check if it's a JSON payload
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const data = JSON.parse(trimmed);
      if (data.org !== 'KM100') {
        return {
          validFormat: false,
          code: data.code || 'UNKNOWN',
          error: `Invalid organization badge (${data.org || 'Unknown'}). Expected KM100.`,
        };
      }
      if (!data.code || typeof data.code !== 'string') {
        return {
          validFormat: false,
          code: 'UNKNOWN',
          error: 'Missing employee code in badge payload',
        };
      }
      return {
        validFormat: true,
        code: data.code.trim().toUpperCase(),
        token: data.token,
      };
    } catch {
      return {
        validFormat: false,
        code: 'MALFORMED',
        error: 'Malformed QR JSON structure',
      };
    }
  }

  // Fallback: Check if it's a plain KM100 code (e.g., KM100-001 or 001)
  const codeMatch = trimmed.match(/^(?:KM100-?)?(\d{1,4})$/i);
  if (codeMatch) {
    const num = codeMatch[1].padStart(3, '0');
    return {
      validFormat: true,
      code: `KM100-${num}`,
      error: undefined,
    };
  }

  // Also accept standard text code if prefixed with KM100
  if (trimmed.toUpperCase().startsWith('KM100')) {
    return {
      validFormat: true,
      code: trimmed.toUpperCase(),
      error: undefined,
    };
  }

  return {
    validFormat: false,
    code: trimmed,
    error: 'Unrecognized badge format. Not a KM100 credential.',
  };
}

/**
 * Computes next sequential employee code e.g. KM100-006 from existing codes
 */
export function getNextEmployeeCode(existingCodes: string[]): string {
  let highest = 0;
  for (const c of existingCodes) {
    const match = c.match(/KM100-(\d+)/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > highest) {
        highest = num;
      }
    }
  }
  const nextNum = highest + 1;
  return `KM100-${String(nextNum).padStart(3, '0')}`;
}

/**
 * Get initials from full name
 */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return 'KM';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
