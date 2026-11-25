-- =========================================================================
-- KM100 Staff & Access Portal Database Schema
-- Organization: KM100
-- Tables: employees, scan_logs
-- =========================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------------------------------------------------------
-- 1. EMPLOYEES TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_code TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL,
    department TEXT NOT NULL,
    shift_schedule TEXT NOT NULL DEFAULT 'Day Shift (08:00 - 17:00)',
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'On Leave', 'Inactive')),
    photo_url TEXT,
    qr_token TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for quick QR verification lookups
CREATE INDEX IF NOT EXISTS idx_employees_code ON employees(employee_code);
CREATE INDEX IF NOT EXISTS idx_employees_qr_token ON employees(qr_token);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);

-- -------------------------------------------------------------------------
-- 2. SCAN_LOGS TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS scan_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    employee_code TEXT NOT NULL,
    employee_name TEXT NOT NULL,
    department TEXT,
    scan_type TEXT NOT NULL CHECK (scan_type IN ('CHECK_IN', 'CHECK_OUT')),
    verification_status TEXT NOT NULL CHECK (verification_status IN ('VALID', 'INACTIVE_STAFF', 'INVALID_QR', 'DUPLICATE_SCAN')),
    gate_location TEXT NOT NULL DEFAULT 'Main Gate',
    scanned_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for log auditing & KPI calculations
CREATE INDEX IF NOT EXISTS idx_scan_logs_employee_id ON scan_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_scan_logs_scanned_at ON scan_logs(scanned_at DESC);
CREATE INDEX IF NOT EXISTS idx_scan_logs_verification ON scan_logs(verification_status);
CREATE INDEX IF NOT EXISTS idx_scan_logs_type ON scan_logs(scan_type);

-- -------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY (RLS)
-- -------------------------------------------------------------------------
-- Enable RLS on both tables
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_logs ENABLE ROW LEVEL SECURITY;

-- Note for production:
-- The policies below allow public/anon key access for internal kiosk/scanner
-- terminal usage. In enterprise deployments, you can restrict read/write
-- to authenticated roles using Supabase Auth:
--   CREATE POLICY "Admins full access" ON employees FOR ALL TO authenticated USING (auth.jwt() ->> 'role' = 'admin');

-- Employees Policies
CREATE POLICY "Allow anon read employees for gate verification"
    ON employees FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow anon insert employees for staff registration"
    ON employees FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Allow anon update employees"
    ON employees FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow anon delete employees"
    ON employees FOR DELETE
    TO anon, authenticated
    USING (true);

-- Scan Logs Policies
CREATE POLICY "Allow anon read scan_logs"
    ON scan_logs FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow anon insert scan_logs"
    ON scan_logs FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Allow anon delete scan_logs"
    ON scan_logs FOR DELETE
    TO anon, authenticated
    USING (true);

-- -------------------------------------------------------------------------
-- 4. PRE-SEEDED KM100 SAMPLE STAFF
-- Organization: KM100 Skills and Training Center, Inc.
-- -------------------------------------------------------------------------
INSERT INTO employees (employee_code, full_name, role, department, shift_schedule, status, photo_url, qr_token)
VALUES
    (
        'KM100-001',
        'Elena Vance',
        'Technical Vocational Trainer',
        'Technical & Vocational Training',
        'Day Shift (08:00 - 17:00)',
        'Active',
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256',
        'km100_sec_token_001_8a7d2b'
    ),
    (
        'KM100-002',
        'Marcus Thorne',
        'Workshop Operations Lead',
        'Operations & Facilities',
        'Day Shift (08:00 - 17:00)',
        'Active',
        'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=256',
        'km100_sec_token_002_9f1c3e'
    ),
    (
        'KM100-003',
        'Aria Chen',
        'Safety & Compliance Officer',
        'Safety & Compliance',
        'Swing Shift (14:00 - 23:00)',
        'Active',
        'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=256',
        'km100_sec_token_003_4b8e1a'
    ),
    (
        'KM100-004',
        'David Rodriguez',
        'IT Systems Engineer',
        'IT & Engineering',
        'Day Shift (08:00 - 17:00)',
        'On Leave',
        'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=256',
        'km100_sec_token_004_7c3a9d'
    ),
    (
        'KM100-005',
        'Sarah Jenkins',
        'Registrar & Records Officer',
        'Student & Staff Affairs',
        'Day Shift (08:00 - 17:00)',
        'Inactive',
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=256',
        'km100_sec_token_005_3e5f2c'
    )
ON CONFLICT (employee_code) DO NOTHING;

-- Pre-seeded sample scan logs
INSERT INTO scan_logs (employee_code, employee_name, department, scan_type, verification_status, gate_location, scanned_at)
VALUES
    ('KM100-001', 'Elena Vance', 'Technical & Vocational Training', 'CHECK_IN', 'VALID', 'Main Campus Gate', now() - INTERVAL '3 hours'),
    ('KM100-003', 'Aria Chen', 'Safety & Compliance', 'CHECK_IN', 'VALID', 'Technical Workshop Bay', now() - INTERVAL '2 hours'),
    ('KM100-005', 'Sarah Jenkins', 'Student & Staff Affairs', 'CHECK_IN', 'INACTIVE_STAFF', 'Main Campus Gate', now() - INTERVAL '1 hour'),
    ('KM100-999', 'Unknown / Unregistered', 'Unknown', 'CHECK_IN', 'INVALID_QR', 'VIP & Logistics Gate', now() - INTERVAL '30 minutes');
