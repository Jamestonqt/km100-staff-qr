import type { Employee, ScanLog } from '../types/database';

/**
 * Presence is derived from the latest valid scan per employee so the
 * on-site status always follows the actual time-in / time-out.
 */
export function getLatestValidScanByCode(logs: ScanLog[]): Map<string, ScanLog> {
  const latest = new Map<string, ScanLog>();
  for (const log of logs) {
    if (log.verification_status !== 'VALID') continue;
    const code = log.employee_code.toUpperCase();
    const existing = latest.get(code);
    if (!existing || new Date(log.scanned_at).getTime() > new Date(existing.scanned_at).getTime()) {
      latest.set(code, log);
    }
  }
  return latest;
}

export function getOnSiteEmployeeCodes(logs: ScanLog[]): Set<string> {
  const onSite = new Set<string>();
  for (const [code, log] of getLatestValidScanByCode(logs).entries()) {
    if (log.scan_type === 'CHECK_IN') onSite.add(code);
  }
  return onSite;
}

export function getCurrentlyOnSiteCount(logs: ScanLog[], employees: Employee[]): number {
  const activeCodes = new Set(
    employees
      .filter((e) => e.status === 'Active')
      .map((e) => e.employee_code.toUpperCase())
  );
  let count = 0;
  for (const code of getOnSiteEmployeeCodes(logs)) {
    if (activeCodes.has(code)) count++;
  }
  return count;
}
