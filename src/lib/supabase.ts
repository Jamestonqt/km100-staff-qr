import { createClient, type SupabaseClient, type Session, type User, type AuthChangeEvent } from '@supabase/supabase-js';
import type { Employee, KPISummary, ScanLog } from '../types/database';

export type { Session, User };

const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
// Normalize URL: fix accidental leading 'hh', strip trailing /rest/v1/ or slashes
const normalizedUrl = rawUrl
  .replace(/^hhttps:\/\//i, 'https://')
  .replace(/\/rest\/v1\/?$/i, '')
  .replace(/\/+$/, '');

const supabaseUrl = normalizedUrl;
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const isSupabaseConfigured: boolean = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project') &&
  supabaseUrl.startsWith('https://')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const DEMO_AUTH_KEY = 'km100_demo_auth_session';

export const authService = {
  async getSession(): Promise<{ data: { session: Session | null }; error: Error | null }> {
    if (isSupabaseConfigured && supabase) {
      return await supabase.auth.getSession();
    }
    try {
      const stored = localStorage.getItem(DEMO_AUTH_KEY);
      if (stored) {
        return { data: { session: JSON.parse(stored) as Session }, error: null };
      }
    } catch {
      localStorage.removeItem(DEMO_AUTH_KEY);
    }
    return { data: { session: null }, error: null };
  },

  onAuthStateChange(
    callback: (event: AuthChangeEvent, session: Session | null) => void
  ): { data: { subscription: { unsubscribe: () => void } } } {
    if (isSupabaseConfigured && supabase) {
      return supabase.auth.onAuthStateChange(callback);
    }
    const handler = (e: StorageEvent) => {
      if (e.key === DEMO_AUTH_KEY) {
        const nextSession = e.newValue ? (JSON.parse(e.newValue) as Session) : null;
        callback(nextSession ? 'SIGNED_IN' : 'SIGNED_OUT', nextSession);
      }
    };
    window.addEventListener('storage', handler);
    return {
      data: {
        subscription: {
          unsubscribe: () => window.removeEventListener('storage', handler),
        },
      },
    };
  },

  async signInWithPassword(credentials: {
    email: string;
    password: string;
  }): Promise<{ data: { session: Session | null; user: User | null }; error: Error | null }> {
    if (isSupabaseConfigured && supabase) {
      const res = await supabase.auth.signInWithPassword(credentials);
      return {
        data: { session: res.data.session, user: res.data.user },
        error: res.error,
      };
    }

    const email = credentials.email.trim();
    const password = credentials.password;
    if (!email || !password) {
      return {
        data: { session: null, user: null },
        error: new Error('Please enter both administrative email and password.'),
      };
    }

    const demoSession = {
      access_token: 'demo_km100_token_' + Date.now(),
      token_type: 'bearer',
      expires_in: 86400,
      user: {
        id: 'km100-admin-demo-user',
        email,
        role: 'authenticated',
        aud: 'authenticated',
        app_metadata: { provider: 'email' },
        user_metadata: { role: 'admin', full_name: 'KM100 Administrator' },
        created_at: new Date().toISOString(),
      },
    } as unknown as Session;

    localStorage.setItem(DEMO_AUTH_KEY, JSON.stringify(demoSession));
    window.dispatchEvent(new StorageEvent('storage', { key: DEMO_AUTH_KEY, newValue: JSON.stringify(demoSession) }));
    return { data: { session: demoSession, user: demoSession.user }, error: null };
  },

  async signOut(): Promise<{ error: Error | null }> {
    if (isSupabaseConfigured && supabase) {
      const res = await supabase.auth.signOut();
      return { error: res.error };
    }
    localStorage.removeItem(DEMO_AUTH_KEY);
    window.dispatchEvent(new StorageEvent('storage', { key: DEMO_AUTH_KEY, newValue: null }));
    return { error: null };
  },
};

// Initial pre-seeded mock employees (matching supabase/schema.sql)
const SEED_EMPLOYEES: Employee[] = [
  {
    id: 'f87a3e21-001a-4d3b-9a8c-123456789001',
    employee_code: 'KM100-001',
    full_name: 'Elena Vance',
    role: 'Technical Vocational Trainer',
    department: 'Technical & Vocational Training',
    shift_schedule: 'Day Shift (08:00 - 17:00)',
    status: 'Active',
    photo_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256',
    qr_token: 'km100_sec_token_001_8a7d2b',
    is_on_site: false,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'f87a3e21-002a-4d3b-9a8c-123456789002',
    employee_code: 'KM100-002',
    full_name: 'Marcus Thorne',
    role: 'Workshop Operations Lead',
    department: 'Operations & Facilities',
    shift_schedule: 'Day Shift (08:00 - 17:00)',
    status: 'Active',
    photo_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=256',
    qr_token: 'km100_sec_token_002_9f1c3e',
    is_on_site: false,
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    id: 'f87a3e21-003a-4d3b-9a8c-123456789003',
    employee_code: 'KM100-003',
    full_name: 'Aria Chen',
    role: 'Safety & Compliance Officer',
    department: 'Safety & Compliance',
    shift_schedule: 'Swing Shift (14:00 - 23:00)',
    status: 'Active',
    photo_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=256',
    qr_token: 'km100_sec_token_003_4b8e1a',
    is_on_site: false,
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: 'f87a3e21-004a-4d3b-9a8c-123456789004',
    employee_code: 'KM100-004',
    full_name: 'David Rodriguez',
    role: 'IT Systems Engineer',
    department: 'IT & Engineering',
    shift_schedule: 'Day Shift (08:00 - 17:00)',
    status: 'On Leave',
    photo_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=256',
    qr_token: 'km100_sec_token_004_7c3a9d',
    is_on_site: false,
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'f87a3e21-005a-4d3b-9a8c-123456789005',
    employee_code: 'KM100-005',
    full_name: 'Sarah Jenkins',
    role: 'Registrar & Records Officer',
    department: 'Student & Staff Affairs',
    shift_schedule: 'Day Shift (08:00 - 17:00)',
    status: 'Inactive',
    photo_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=256',
    qr_token: 'km100_sec_token_005_3e5f2c',
    is_on_site: false,
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
];

const SEED_SCAN_LOGS: ScanLog[] = [
  {
    id: 'l-001',
    employee_id: 'f87a3e21-001a-4d3b-9a8c-123456789001',
    employee_code: 'KM100-001',
    employee_name: 'Elena Vance',
    department: 'Technical & Vocational Training',
    scan_type: 'CHECK_IN',
    verification_status: 'VALID',
    gate_location: 'Main Campus Gate',
    scanned_at: new Date(Date.now() - 2.5 * 3600000).toISOString(),
  },
  {
    id: 'l-002',
    employee_id: 'f87a3e21-003a-4d3b-9a8c-123456789003',
    employee_code: 'KM100-003',
    employee_name: 'Aria Chen',
    department: 'Safety & Compliance',
    scan_type: 'CHECK_IN',
    verification_status: 'VALID',
    gate_location: 'Technical Workshop Bay',
    scanned_at: new Date(Date.now() - 1.8 * 3600000).toISOString(),
  },
  {
    id: 'l-003',
    employee_id: 'f87a3e21-005a-4d3b-9a8c-123456789005',
    employee_code: 'KM100-005',
    employee_name: 'Sarah Jenkins',
    department: 'Student & Staff Affairs',
    scan_type: 'CHECK_IN',
    verification_status: 'INACTIVE_STAFF',
    gate_location: 'Main Campus Gate',
    scanned_at: new Date(Date.now() - 0.9 * 3600000).toISOString(),
  },
  {
    id: 'l-004',
    employee_id: null,
    employee_code: 'KM100-999',
    employee_name: 'Unknown / Unregistered',
    department: 'Unknown',
    scan_type: 'CHECK_IN',
    verification_status: 'INVALID_QR',
    gate_location: 'VIP & Logistics Gate',
    scanned_at: new Date(Date.now() - 0.4 * 3600000).toISOString(),
  },
];

// Local storage keys
const LS_EMPLOYEES = 'km100_employees_v2';
const LS_SCAN_LOGS = 'km100_scan_logs_v2';

class LocalDataStore {
  private getEmployeesRaw(): Employee[] {
    const raw = localStorage.getItem(LS_EMPLOYEES);
    if (!raw) {
      localStorage.setItem(LS_EMPLOYEES, JSON.stringify(SEED_EMPLOYEES));
      return SEED_EMPLOYEES;
    }
    try {
      const parsed = JSON.parse(raw) as Employee[];
      const normalized = parsed.map((e) => ({
        ...e,
        is_on_site: e.is_on_site === true,
      }));
      if (normalized.some((e, i) => e.is_on_site !== parsed[i].is_on_site)) {
        this.saveEmployees(normalized);
      }
      return normalized;
    } catch {
      return SEED_EMPLOYEES;
    }
  }

  private saveEmployees(list: Employee[]): void {
    localStorage.setItem(LS_EMPLOYEES, JSON.stringify(list));
  }

  private getScanLogsRaw(): ScanLog[] {
    const raw = localStorage.getItem(LS_SCAN_LOGS);
    if (!raw) {
      localStorage.setItem(LS_SCAN_LOGS, JSON.stringify(SEED_SCAN_LOGS));
      return SEED_SCAN_LOGS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return SEED_SCAN_LOGS;
    }
  }

  private saveScanLogs(logs: ScanLog[]): void {
    localStorage.setItem(LS_SCAN_LOGS, JSON.stringify(logs));
  }

  public async getEmployees(): Promise<Employee[]> {
    return this.getEmployeesRaw().sort((a, b) => a.employee_code.localeCompare(b.employee_code));
  }

  public async createEmployee(data: Omit<Employee, 'id' | 'created_at'>): Promise<Employee> {
    const list = this.getEmployeesRaw();
    const newEmp: Employee = {
      ...data,
      is_on_site: data.is_on_site === true,
      id: 'emp-' + Math.random().toString(36).substring(2, 10),
      created_at: new Date().toISOString(),
    };
    list.push(newEmp);
    this.saveEmployees(list);
    return newEmp;
  }

  public async updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee> {
    const list = this.getEmployeesRaw();
    const idx = list.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error('Employee not found');
    list[idx] = { ...list[idx], ...updates };
    this.saveEmployees(list);
    return list[idx];
  }

  public async deleteEmployee(id: string): Promise<boolean> {
    const list = this.getEmployeesRaw().filter((e) => e.id !== id);
    this.saveEmployees(list);
    return true;
  }

  public async getScanLogs(): Promise<ScanLog[]> {
    return this.getScanLogsRaw().sort(
      (a, b) => new Date(b.scanned_at).getTime() - new Date(a.scanned_at).getTime()
    );
  }

  public async recordScanLog(log: Omit<ScanLog, 'id' | 'scanned_at'>): Promise<ScanLog> {
    const logs = this.getScanLogsRaw();
    const newLog: ScanLog = {
      gate_location: log.gate_location || 'Main Entrance',
      ...log,
      id: 'log-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6),
      scanned_at: new Date().toISOString(),
    };
    logs.unshift(newLog);
    this.saveScanLogs(logs.slice(0, 500));
    return newLog;
  }

  public resetToSeeds(): void {
    localStorage.setItem(LS_EMPLOYEES, JSON.stringify(SEED_EMPLOYEES));
    localStorage.setItem(LS_SCAN_LOGS, JSON.stringify(SEED_SCAN_LOGS));
  }
}

const localStore = new LocalDataStore();

// Unified Service Layer
export const portalService = {
  isLive: isSupabaseConfigured,

  async getEmployees(): Promise<Employee[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('employees')
          .select('*')
          .order('employee_code', { ascending: true });
        if (error) throw error;
        return data as Employee[];
      } catch (err) {
        console.warn('Supabase fetch failed, falling back to local store:', err);
        return localStore.getEmployees();
      }
    }
    return localStore.getEmployees();
  },

  async createEmployee(data: Omit<Employee, 'id' | 'created_at'>): Promise<Employee> {
    const payload = { ...data, is_on_site: data.is_on_site === true };

    if (isSupabaseConfigured && supabase) {
      const client = supabase;

      const insertEmployee = async (row: Record<string, unknown>) => {
        const { data: inserted, error } = await client
          .from('employees')
          .insert([row])
          .select()
          .single();
        if (error) throw error;
        return inserted as Employee;
      };

      try {
        const inserted = await insertEmployee(payload);
        return { ...inserted, is_on_site: inserted.is_on_site === true };
      } catch (err) {
        const errRecord = err as { message?: unknown; details?: unknown; code?: unknown };
        const message = [
          err instanceof Error ? err.message : '',
          errRecord?.message ? String(errRecord.message) : '',
          errRecord?.details ? String(errRecord.details) : '',
          errRecord?.code ? String(errRecord.code) : '',
          String(err),
        ].join(' ');
        const missingPresenceColumn =
          /is_on_site/i.test(message) ||
          /schema cache/i.test(message) ||
          /column .* does not exist/i.test(message);

        if (missingPresenceColumn) {
          try {
            const legacyPayload: Partial<typeof payload> = { ...payload };
            delete legacyPayload.is_on_site;
            const inserted = await insertEmployee(legacyPayload as Record<string, unknown>);
            return { ...inserted, is_on_site: false };
          } catch (retryErr) {
            console.error('Supabase employee insert retry failed:', retryErr);
            throw retryErr;
          }
        }

        console.error('Supabase employee insert failed:', err);
        throw err;
      }
    }

    return localStore.createEmployee(payload);
  },

  async updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: updated, error } = await supabase
          .from('employees')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return updated as Employee;
      } catch (err) {
        console.warn('Supabase update failed, saving locally:', err);
        return localStore.updateEmployee(id, updates);
      }
    }
    return localStore.updateEmployee(id, updates);
  },

  async setEmployeeOnSite(id: string, isOnSite: boolean): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('employees')
          .update({ is_on_site: isOnSite })
          .eq('id', id);
        if (error) throw error;
        return true;
      } catch (err) {
        console.warn('Supabase presence update failed, trying local store:', err);
      }
    }

    try {
      await localStore.updateEmployee(id, { is_on_site: isOnSite });
      return true;
    } catch (err) {
      console.warn('Presence update skipped (employee not found in local store):', err);
      return false;
    }
  },

  async deleteEmployee(id: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('employees').delete().eq('id', id);
        if (error) throw error;
        return true;
      } catch (err) {
        console.warn('Supabase delete failed, deleting locally:', err);
        return localStore.deleteEmployee(id);
      }
    }
    return localStore.deleteEmployee(id);
  },

  async getScanLogs(): Promise<ScanLog[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('scan_logs')
          .select('*')
          .order('scanned_at', { ascending: false })
          .limit(200);
        if (error) throw error;
        return data as ScanLog[];
      } catch (err) {
        console.warn('Supabase log fetch failed, falling back to local store:', err);
        return localStore.getScanLogs();
      }
    }
    return localStore.getScanLogs();
  },

  async recordScanLog(log: Omit<ScanLog, 'id' | 'scanned_at'>): Promise<ScanLog> {
    const payload = {
      gate_location: log.gate_location || 'Main Entrance',
      ...log,
    };
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: inserted, error } = await supabase
          .from('scan_logs')
          .insert([payload])
          .select()
          .single();
        if (error) throw error;
        return inserted as ScanLog;
      } catch (err) {
        console.warn('Supabase insert log failed, recording locally:', err);
        return localStore.recordScanLog(payload);
      }
    }
    return localStore.recordScanLog(payload);
  },

  async findEmployeeByCode(code: string): Promise<Employee | null> {
    const trimmedCode = code.trim().toUpperCase();
    const employees = await this.getEmployees();
    return employees.find((e) => e.employee_code.toUpperCase() === trimmedCode) || null;
  },

  async getKPISummary(): Promise<KPISummary> {
    const [employees, logs] = await Promise.all([
      this.getEmployees(),
      this.getScanLogs(),
    ]);

    const totalActiveStaff = employees.filter((e) => e.status === 'Active').length;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayLogs = logs.filter(
      (l) => new Date(l.scanned_at).getTime() >= todayStart.getTime()
    );

    const todayCheckIns = todayLogs.filter(
      (l) => l.scan_type === 'CHECK_IN' && l.verification_status === 'VALID'
    ).length;

    const deniedToday = todayLogs.filter(
      (l) => l.verification_status !== 'VALID' && l.verification_status !== 'DUPLICATE_SCAN'
    ).length;

    const hasPresenceField = employees.some((e) => typeof e.is_on_site === 'boolean');

    // Presence is derived from the latest valid scan per employee so the
    // On-Site / Off-Site status always follows the actual time-in / time-out.
    const latestValidScanByCode = new Map<string, ScanLog>();
    for (const log of logs) {
      if (log.verification_status !== 'VALID') continue;
      const code = log.employee_code.toUpperCase();
      const existing = latestValidScanByCode.get(code);
      if (!existing || new Date(log.scanned_at).getTime() > new Date(existing.scanned_at).getTime()) {
        latestValidScanByCode.set(code, log);
      }
    }

    let currentlyOnSite = 0;
    for (const log of latestValidScanByCode.values()) {
      if (log.scan_type === 'CHECK_IN') currentlyOnSite++;
    }

    // Prefer the stored flag only when no scan history exists at all.
    if (latestValidScanByCode.size === 0 && hasPresenceField) {
      currentlyOnSite = employees.filter((e) => e.is_on_site === true).length;
    }

    return {
      totalActiveStaff,
      currentlyOnSite,
      todayCheckIns,
      deniedToday,
    };
  },

  subscribeToEmployees(onChange: () => void): () => void {
    if (!isSupabaseConfigured || !supabase) return () => {};

    const channel = supabase
      .channel('employees-presence')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'employees' },
        () => onChange()
      )
      .subscribe();

    return () => {
      void supabase?.removeChannel(channel);
    };
  },

  subscribeToScanLogs(onChange: () => void): () => void {
    if (!isSupabaseConfigured || !supabase) return () => {};

    const channel = supabase
      .channel('scan-logs-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'scan_logs' },
        () => onChange()
      )
      .subscribe();

    return () => {
      void supabase?.removeChannel(channel);
    };
  },

  resetDemoData(): void {
    localStore.resetToSeeds();
  },
};
