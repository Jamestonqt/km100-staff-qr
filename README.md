# KM100 Staff & Access Portal (`km100-staff-qr`)

A high-contrast, production-ready enterprise web application for generating, managing, verifying, and auditing employee/staff QR access badges for the organization **KM100**.

![KM100 Staff & Access Portal](https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=1200)

---

## 🌟 Key Features

### 1. Top Real-Time KPI Summary Bar
- **Total Active Staff:** Real-time count of active KM100 credentials.
- **Currently On-Site:** Intelligently calculated based on staff whose latest valid scan today is a `CHECK_IN`.
- **Today's Check-Ins:** Valid gate admissions recorded today.
- **Denied / Invalid:** Real-time count of blocked attempts (inactive accounts, unverified credentials, rogue QR codes).

### 2. Live QR Gate Scanner (`ScannerView`)
- **Camera Scanning:** Integrated using `html5-qrcode` with support for mobile rear cameras, front webcams, and torch/flashlight toggle.
- **Gate Controls:**
  - Segmented toggle for **CHECK-IN** (Emerald) vs. **CHECK-OUT** (Indigo).
  - Gate / Station selector: `Main Gate`, `Admin Building`, `Warehouse Bay`, `VIP Entrance`.
- **QR Payload Validation:**
  - Standard JSON structure: `{"org":"KM100","code":"KM100-001","token":"..."}`.
  - Fallback text recognition for manual code entries (e.g. `KM100-001`).
  - Security token matching to prevent counterfeit QR fabrication.
- **Anti-Passback Protection:**
  - 10-second cooldown per employee prevents accidental double-scans and floods.
- **Instant Audio Feedback:**
  - Web Audio API synthesized two-tone harmonic chime for valid admissions.
  - Low harsh buzzer for denied access.
  - Staccato warning beep for cooldown violations.
  - Global audio mute/unmute toggle.
- **Simulation Bar:**
  - One-click buttons to simulate valid admissions, inactive staff, on-leave staff, or counterfeit QR codes for testing without a camera.

### 3. Generate Employee QR Badge (`GeneratorView`)
- **Registration Form:**
  - Auto-calculates next sequential `employee_code` (e.g. `KM100-006`).
  - Full Name, Role (with quick pills), Department dropdown, Shift Schedule dropdown, Status, and Avatar Picker / Randomizer.
  - Generates cryptographic verification token (`qr_token`).
- **CR80 Vertical Badge Preview (3.375" x 2.125"):**
  - KM100 security branding, holographic accent stripe, and NFC chip indicator.
  - High-resolution QR code (`QRCodeSVG`) with Error Correction Level `H`.
  - Monospace staff code and official footer barcode simulation.
- **Export & Print:**
  - **Download QR PNG:** High-resolution standalone QR code image.
  - **Download Full Badge PNG:** High-DPI canvas capture using `html2canvas`.
  - **Print ID Badge:** Dedicated `@media print` CSS targeting only the badge with exact card dimensions.

### 4. Staff Directory (`DirectoryView`)
- Search by Name, Employee Code (`KM100-XXX`), or Role.
- Filter by Department and Account Status (`Active`, `On Leave`, `Inactive`).
- Dynamic **On-Site vs. Off-Site** status badge derived from gate scans.
- Actions:
  - **View & Print Badge Modal:** Re-open, download, or print any staff member's badge anytime.
  - **Edit Staff:** Modal to update role, department, shift, or toggle active/leave/inactive status.
  - **Delete Staff:** Permanent deletion with confirmation safeguard.

### 5. Attendance & Scan Logs (`LogsView`)
- Comprehensive audit trail of all access activity.
- Filters: Date (All Time, Today, Yesterday), Scan Type (`CHECK_IN`, `CHECK_OUT`), Status (`VALID`, `DENIED`).
- **Export CSV:** One-click export to `km100-scan-logs-YYYY-MM-DD.csv` formatted for payroll and security compliance.

---

## 🛠 Tech Stack
- **Framework:** React 19 + TypeScript + Vite 8
- **Styling:** Tailwind CSS v4 + Lucide React Icons
- **Database:** Supabase (`@supabase/supabase-js`) with transparent Local Demo Sandbox fallback
- **QR Generation:** `qrcode.react`
- **QR Scanning:** `html5-qrcode`
- **Canvas Rendering:** `html2canvas` + `canvas-confetti`
- **Audio Synthesis:** Web Audio API

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

The portal runs out of the box in **Demo Sandbox Mode** with 5 pre-seeded KM100 staff members and persistent browser storage.

### 3. Connect Live Supabase (Optional)
1. In your Supabase dashboard, open the **SQL Editor** and run the contents of `supabase/schema.sql`.
2. Copy `.env.example` to `.env`:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```
3. Restart Vite (`npm run dev`). The top navbar indicator will turn green: **"Supabase Live"**.

---

## 🗄 Database Schema (`supabase/schema.sql`)

### `employees` Table
| Column | Type | Constraints / Description |
|---|---|---|
| `id` | `UUID` | Primary Key, `gen_random_uuid()` |
| `employee_code` | `TEXT` | Unique, Not Null (e.g. `KM100-001`) |
| `full_name` | `TEXT` | Not Null |
| `role` | `TEXT` | Not Null |
| `department` | `TEXT` | Not Null |
| `shift_schedule` | `TEXT` | Default `'Day Shift (08:00 - 17:00)'` |
| `status` | `TEXT` | Check: `Active`, `On Leave`, `Inactive` |
| `photo_url` | `TEXT` | Nullable avatar URL |
| `qr_token` | `TEXT` | Unique security token |
| `created_at` | `TIMESTAMPTZ` | Default `now()` |

### `scan_logs` Table
| Column | Type | Constraints / Description |
|---|---|---|
| `id` | `UUID` | Primary Key, `gen_random_uuid()` |
| `employee_id` | `UUID` | FK referencing `employees(id)` |
| `employee_code` | `TEXT` | Scanned code |
| `employee_name` | `TEXT` | Staff name or `'Unknown / Unregistered'` |
| `department` | `TEXT` | Nullable department |
| `scan_type` | `TEXT` | Check: `CHECK_IN`, `CHECK_OUT` |
| `verification_status`| `TEXT` | Check: `VALID`, `INACTIVE_STAFF`, `INVALID_QR`, `DUPLICATE_SCAN` |
| `gate_location` | `TEXT` | Default `'Main Gate'` |
| `scanned_at` | `TIMESTAMPTZ` | Default `now()` |

---

## 🔒 Security & Anti-Passback
- QR codes encode an organization signature `{"org":"KM100", ...}` and token pairing. Rogue or unissued QR codes are rejected (`INVALID_QR`).
- Inactive or on-leave staff are immediately barred (`INACTIVE_STAFF`).
- 10-second anti-passback cooldown prevents tailgating double-scans (`DUPLICATE_SCAN`).
