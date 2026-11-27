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

/**
 * Returns date formatted as YYYY-MM-DD in the Asia/Manila (UTC+8) timezone
 */
export function getManilaDateString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * Returns the start (00:00:00.000) and end (23:59:59.999) of "today" in Asia/Manila
 */
export function getManilaTodayBounds(date: Date = new Date()): {
  dateStr: string;
  startOfDay: Date;
  endOfDay: Date;
} {
  const dateStr = getManilaDateString(date);
  const startOfDay = new Date(`${dateStr}T00:00:00.000+08:00`);
  const endOfDay = new Date(`${dateStr}T23:59:59.999+08:00`);
  return { dateStr, startOfDay, endOfDay };
}

/**
 * Checks whether an ISO timestamp string occurred "today" in Asia/Manila
 */
export function isTodayInManila(isoString: string, referenceDate: Date = new Date()): boolean {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return false;
    return getManilaDateString(d) === getManilaDateString(referenceDate);
  } catch {
    return false;
  }
}

/**
 * Gets the most recent valid attendance log today (in Asia/Manila) for an employee from a log list
 */
export function getLatestTodayValidLog(
  logs: ScanLog[],
  employeeId?: string | null,
  employeeCode?: string | null
): ScanLog | null {
  const { startOfDay, endOfDay } = getManilaTodayBounds();
  const startTime = startOfDay.getTime();
  const endTime = endOfDay.getTime();
  const targetCode = employeeCode ? employeeCode.trim().toUpperCase() : null;

  const matching = logs.filter((log) => {
    if (log.verification_status !== 'VALID') return false;
    const logTime = new Date(log.scanned_at).getTime();
    if (logTime < startTime || logTime > endTime) return false;

    if (employeeId && log.employee_id && log.employee_id === employeeId) return true;
    if (targetCode && log.employee_code.trim().toUpperCase() === targetCode) return true;
    return false;
  });

  if (matching.length === 0) return null;
  matching.sort((a, b) => new Date(b.scanned_at).getTime() - new Date(a.scanned_at).getTime());
  return matching[0];
}
