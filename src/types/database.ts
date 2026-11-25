export type EmployeeStatus = 'Active' | 'On Leave' | 'Inactive';

export type ScanType = 'CHECK_IN' | 'CHECK_OUT';

export type VerificationStatus =
  | 'VALID'
  | 'INACTIVE_STAFF'
  | 'INVALID_QR'
  | 'DUPLICATE_SCAN';

export interface Employee {
  id: string;
  employee_code: string;
  full_name: string;
  role: string;
  department: string;
  shift_schedule: string;
  status: EmployeeStatus;
  photo_url?: string | null;
  qr_token: string;
  is_on_site: boolean;
  created_at: string;
}

export interface ScanLog {
  id: string;
  employee_id?: string | null;
  employee_code: string;
  employee_name: string;
  department?: string | null;
  scan_type: ScanType;
  verification_status: VerificationStatus;
  gate_location?: string;
  scanned_at: string;
}

export interface QRPayload {
  org: string;
  code: string;
  token: string;
}

export interface KPISummary {
  totalActiveStaff: number;
  currentlyOnSite: number;
  todayCheckIns: number;
  deniedToday: number;
}

export type GateStation =
  | 'Main Campus Gate'
  | 'Technical Workshop Bay'
  | 'Admin & Training Building'
  | 'VIP & Logistics Gate';

export const GATE_STATIONS: GateStation[] = [
  'Main Campus Gate',
  'Technical Workshop Bay',
  'Admin & Training Building',
  'VIP & Logistics Gate',
];

export const DEPARTMENTS = [
  'Technical & Vocational Training',
  'Safety & Compliance',
  'Operations & Facilities',
  'Administration & Finance',
  'IT & Engineering',
  'Student & Staff Affairs',
] as const;

export const SHIFT_SCHEDULES = [
  'Day Shift (08:00 - 17:00)',
  'Morning Workshop (06:00 - 15:00)',
  'Evening Workshop (13:00 - 22:00)',
  'Night Shift (20:00 - 05:00)',
  'Flexible / Training Faculty',
] as const;
