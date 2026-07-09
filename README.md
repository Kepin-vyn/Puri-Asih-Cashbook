# 🏨 Puri Asih Cashbook — Sistem Pembukuan Digital Hotel

> Sistem informasi pembukuan berbasis shift untuk Hotel Puri Asih yang menggantikan 5 buku manual menjadi satu platform digital terintegrasi, mendukung proses operasional Front Office dan pengawasan keuangan Manager secara real-time.

Project ini dibuat sebagai **Minimum Viable Product (MVP)** untuk Ujian Akhir Semester (UAS) mata kuliah **Rekayasa Perangkat Lunak Tahun Akademik 2025/2026**.

---

## 📋 Daftar Isi

1. [Deskripsi Project](#1-deskripsi-project)
2. [Informasi Project](#2-informasi-project)
3. [Anggota Kelompok dan Kontribusi](#3-anggota-kelompok-dan-kontribusi)
4. [Ruang Lingkup Sistem](#4-ruang-lingkup-sistem)
5. [Fitur MVP](#5-fitur-mvp)
6. [Tech Stack](#6-tech-stack)
7. [Arsitektur Sistem](#7-arsitektur-sistem-layered-architecture)
8. [Design Patterns yang Digunakan](#8-design-patterns-yang-digunakan)
9. [Struktur Folder Project](#9-struktur-folder-project)
10. [Database Schema](#10-database-schema)
11. [Cara Menjalankan Project Secara Lokal](#11-cara-menjalankan-project-secara-lokal)
12. [Linter dan Code Quality](#12-linter-dan-code-quality)
13. [GitFlow dan Conventional Commits](#13-gitflow-dan-conventional-commits)
14. [Dokumentasi Video Individu](#14-dokumentasi-video-individu)
15. [Status MVP](#15-status-mvp)
16. [Checklist Pengumpulan UAS](#16-checklist-pengumpulan-uas)
17. [Referensi Arsitektur dan Design Pattern](#17-referensi-arsitektur-dan-design-pattern)

---

## 1. Deskripsi Project

**Puri Asih Cashbook** adalah sistem pembukuan digital berbasis web yang dibangun menggunakan **Laravel 11 (PHP)** di backend dan **React.js** di frontend. Sistem ini mendukung pencatatan KAS harian, pengeluaran operasional dengan alur approval, reservasi tamu OTT, refundable deposit, absensi digital, penggajian otomatis, shift report & handover, serta laporan keuangan bulanan.

Sistem memiliki dua peran pengguna:
- **Front Office (FO)** — mencatat operasional hotel per shift, absen, dan melakukan handover
- **Manager** — memonitor laporan keuangan, menyetujui pengeluaran, dan mengelola staff FO


---

## 2. Informasi Project

| Atribut | Detail |
|---------|--------|
| **Nama Project** | Puri Asih Cashbook |
| **Repository** | [github.com/Kepin-vyn/Puri-Asih-Cashbook](https://github.com/Kepin-vyn/Puri-Asih-Cashbook) |
| **Backend** | Laravel 11 (PHP 8.2) |
| **Frontend** | React.js 18 + TanStack Query + Vite |
| **Database** | PostgreSQL (Neon Serverless) |
| **Auth** | Laravel Sanctum (Bearer Token) |
| **Arsitektur** | Layered Architecture + Component-Service Architecture |
| **Design Patterns** | Facade, Singleton, Observer, Strategy |
| **Mata Kuliah** | Rekayasa Perangkat Lunak |
| **Tahun Akademik** | 2025/2026 |

---

## 3. Anggota Kelompok dan Kontribusi

| Nama | NIM | Peran | Fitur yang Dikerjakan | Link Video |
|------|-----|-------|-----------------------|------------|
| Arefcy Theneven Saban | 42430002 | Frontend Developer | UI Login, Activity Log Audit Trail, Dashboard & Handover Enhancements | [▶ Tonton](https://youtu.be/W_PJZfmpEuE) |
| I Made Obi Pranata | 42430003 | Backend Developer | API Authentication (Sanctum), Tarif Kamar Otomatis, PDF Generation, Security Hardening | [▶ Tonton](https://youtu.be/o3iyP4QQUVM?si=Tdy9W3xGHwNIeqn9) |
| Gabriel Jehuda Tamedo | 42430007 | Frontend Developer | UI Shift Report & Handover, Monthly Report, Penggajian, Jadwal Shift Mingguan, ShiftContext, dateFormatter | [▶ Tonton](https://youtu.be/Js3LiPeyvqw) |
| Rosan Kelvino Andre | 42430025 | Backend Developer | API Shift Report & Handover, Monthly Report, Notifikasi, User Management, Otomasi KAS Reservasi | [▶ Tonton](https://youtu.be/DzgDMPAacm0) |
| Cevyn Eduard Imanuel Dapa Talu | 42430055 | Fullstack + Database + PM | Setup Project, API Core (KAS/Pengeluaran/Reservasi/Deposit/Absensi/Penggajian), UI Dashboard, Reservasi, Deposit, Pengeluaran, FO Management | [▶ Tonton](https://youtu.be/dOkOfQarpBk) |

---

## 4. Ruang Lingkup Sistem

### Role Front Office (FO)
- Absensi digital dengan tanda tangan canvas (check-in/out otomatis mulai/tutup shift)
- Mencatat pemasukan KAS harian per shift
- Mencatat reservasi tamu dari 3 sumber: Walk-In, Tiket.com, Booking.com
- Mencatat dan mengelola Refundable Deposit tamu
- Mencatat pengeluaran operasional (≤ Rp 500.000 auto-approved, > Rp 500.000 butuh approval)
- Melakukan Shift Handover ke FO berikutnya + download Shift Report PDF

### Role Manager
- Menyetujui atau menolak pengeluaran dengan alasan
- Memantau laporan keuangan bulanan (KAS + Reservasi + Pengeluaran)
- Mengelola staff FO (tambah, edit, nonaktifkan)
- Mengatur jadwal shift mingguan per staff
- Menghitung gaji otomatis berdasarkan data absensi
- Memantau Activity Log seluruh aktivitas staff
- Export PDF untuk semua laporan


---

## 5. Fitur MVP

### Fitur Front Office (FO)

| Fitur | Status |
|-------|--------|
| Login & Logout (role-based redirect) | ✅ Selesai |
| Absensi digital dengan tanda tangan canvas | ✅ Selesai |
| Dashboard FO (shift aktif, KAS, notifikasi) | ✅ Selesai |
| KAS Harian (CRUD + upload struk + export PDF) | ✅ Selesai |
| Reservasi OTT — Walk-in, Tiket.com, Booking.com | ✅ Selesai |
| Auto-generate Invoice Number | ✅ Selesai |
| Refundable Deposit (catat, refund, hanguskan) | ✅ Selesai |
| Deposit hangus otomatis masuk KAS | ✅ Selesai |
| Pengeluaran Operasional (auto/manual approval) | ✅ Selesai |
| Shift Handover + download Shift Report PDF | ✅ Selesai |
| Shift Report & Laporan Harian | ✅ Selesai |

### Fitur Manager

| Fitur | Status |
|-------|--------|
| Dashboard Manager (occupancy, revenue, pending) | ✅ Selesai |
| Approval Pengeluaran (setujui/tolak dengan alasan) | ✅ Selesai |
| Monthly Report + export PDF | ✅ Selesai |
| FO Management (tambah, edit, nonaktifkan staff) | ✅ Selesai |
| Jadwal Shift Mingguan per staff | ✅ Selesai |
| Payroll — hitung gaji otomatis dari absensi | ✅ Selesai |
| Download Slip Gaji & Rekap Penggajian PDF | ✅ Selesai |
| Activity Log Audit Trail | ✅ Selesai |
| Tarif Kamar (atur harga per malam otomatis) | ✅ Selesai |
| Notifikasi Deposit Jatuh Tempo | ✅ Selesai |

---

## 6. Tech Stack

| Teknologi | Versi | Kegunaan |
|-----------|-------|----------|
| Laravel | 11 | Backend framework (Layered Architecture) |
| PHP | 8.2 | Bahasa pemrograman backend |
| Laravel Sanctum | Built-in | Autentikasi Bearer Token |
| React.js | 18 | Frontend UI framework |
| TanStack Query | 5 | Server state management + polling |
| Vite | 8 | Build tool frontend |
| Tailwind CSS | 4 | Styling komponen UI |
| Axios | 1.x | HTTP client (Singleton instance) |
| Recharts | 3 | Grafik dashboard Manager |
| PostgreSQL | — | Database (Neon Serverless) |
| Neon | — | Serverless PostgreSQL hosting |
| Laravel Snappy | — | Generate PDF (wkhtmltopdf) |
| Laravel Pint | 1.x | PHP Linter — standarisasi PSR-12 |
| ESLint | 10 | JavaScript/JSX Linter |

---

## 7. Arsitektur Sistem (Layered Architecture)

Aplikasi ini menerapkan **Layered Architecture** secara konsisten di backend maupun frontend.

### Backend

```
┌──────────────────────────────────────────────────────────┐
│                  PRESENTATION LAYER                      │
│          app/Http/Controllers/Api/                       │
│   Menerima HTTP request, validasi via FormRequest,       │
│   mendelegasikan ke Service, mengembalikan JSON response │
│   AttendanceController | KasController | ShiftController │
└──────────────────────────┬───────────────────────────────┘
                           │  Delegasi ke Service
                           ▼
┌──────────────────────────────────────────────────────────┐
│             BUSINESS LOGIC LAYER                         │
│                  app/Services/                           │
│   Semua aturan bisnis — tidak bergantung framework       │
│   AttendanceService | PayrollService | ShiftService      │
│   MonthlyReportService | ReservationService              │
└──────────────────────────┬───────────────────────────────┘
                           │  Eloquent ORM Query
                           ▼
┌──────────────────────────────────────────────────────────┐
│               INFRASTRUCTURE LAYER                       │
│         app/Models/ + database/migrations/               │
│   User | Shift | KasTransaction | Expense | Reservation  │
│   Deposit | Attendance | Payroll | Notification          │
│   Definisi kolom, relasi, dan type casting               │
└──────────────────────────────────────────────────────────┘
```

### Bukti Pemisahan Layer di Kode

**Layer 1 — Controller hanya delegasi, tidak ada query langsung:**

```php
// app/Http/Controllers/Api/AttendanceController.php
public function checkin(CheckinRequest $request): JsonResponse
{
    $resolvedShift = $this->attendanceService->resolveShift($user->id, $user->shift);
    $isLate        = $this->attendanceService->checkIsLate($user->id, $resolvedShift, $now);

    // Controller tidak tahu cara hitung keterlambatan — delegasi ke service
    $attendance = Attendance::create([...]);
    return $this->successResponse($attendance, 'Check-in berhasil.');
}
```

**Layer 2 — Service berisi semua aturan bisnis:**

```php
// app/Services/AttendanceService.php
private const LATE_TOLERANCE_MINUTES = 15;

public function checkIsLate(int $userId, string $shiftType, Carbon $actualStart): bool
{
    $resolvedShift = $todaySchedule?->today_shift ?? $shiftType;
    if ($resolvedShift === 'off') return false;

    $deadline = $actualStart->copy()->setTime($shiftHour, self::LATE_TOLERANCE_MINUTES, 0);
    return $actualStart->gt($deadline);
}
```

**Layer 3 — Model hanya definisi struktur data dan relasi:**

```php
// app/Models/Attendance.php
protected $fillable = ['user_id', 'shift_id', 'shift_type', 'actual_start',
                       'actual_end', 'status', 'is_late', 'digital_signature', 'attendance_date'];

public function user(): BelongsTo { return $this->belongsTo(User::class); }
public function shift(): BelongsTo { return $this->belongsTo(Shift::class); }
```

### Frontend (Component-Service Architecture)

```
Presentation Layer  →  src/pages/ + src/components/
                        React components — hanya handle UI & state

Application Logic   →  src/hooks/ + src/context/
                        useActiveShift, ShiftContext — business state

Infrastructure      →  src/services/ + src/utils/axios.js
                        kasService, expenseService, reservationService...
                        Satu Axios instance dengan interceptor terpusat
```


---

## 8. Design Patterns yang Digunakan

### Pattern 1 — Facade Pattern

| Atribut | Detail |
|---------|--------|
| **Nama Pattern** | Facade (Structural) |
| **Lokasi File** | `backend/app/Services/PayrollService.php`, `ShiftService.php`, `MonthlyReportService.php` |

**Tujuan:** Menyembunyikan kompleksitas kalkulasi dan agregasi data di balik satu method yang mudah dipanggil controller.

```php
// app/Services/PayrollService.php
public function calculateMonthlyPayroll(int $userId, int $month, int $year): Payroll
{
    $attendance = $this->attendanceService->getMonthlyAttendance($userId, $month, $year);
    $setting    = PayrollSetting::orderBy('effective_date', 'desc')->first();
    $totalSalary = $attendance['hari_bayar'] * (float) $setting->daily_rate;

    return Payroll::updateOrCreate([...], [...]);
}
```

Controller hanya memanggil `calculateMonthlyPayroll()` — tidak tahu detail kalkulasi absensi, tarif, maupun query database.

---

### Pattern 2 — Singleton Pattern

| Atribut | Detail |
|---------|--------|
| **Nama Pattern** | Singleton (Creational) |
| **Lokasi File** | `frontend/src/store/authStore.js`, `frontend/src/utils/axios.js` |

**Tujuan:** Memastikan hanya ada satu instance global untuk state autentikasi dan konfigurasi HTTP client di seluruh aplikasi.

```javascript
// frontend/src/store/authStore.js
const authStore = {
  login:     (token, user) => { localStorage.setItem(TOKEN_KEY, token); },
  getToken:  () => localStorage.getItem(TOKEN_KEY),
  isLoggedIn: () => !!localStorage.getItem(TOKEN_KEY),
};
export default authStore; // satu instance, bukan class
```

```javascript
// frontend/src/utils/axios.js
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
export default api; // satu instance dengan interceptor terpusat
```

---

### Pattern 3 — Observer Pattern

| Atribut | Detail |
|---------|--------|
| **Nama Pattern** | Observer (Behavioral) |
| **Lokasi File** | `frontend/src/context/ShiftContext.jsx`, `frontend/src/hooks/useActiveShift.js` |

**Tujuan:** Sinkronisasi status shift aktif secara global ke semua komponen tanpa polling manual setiap re-render.

```javascript
// frontend/src/context/ShiftContext.jsx — Subject
export const ShiftProvider = ({ children }) => {
  const [shiftStatus, setShiftStatus] = useState(null);
  const markShiftStarted = useCallback(() => setShiftStatus(true), []);
  const markShiftEnded   = useCallback(() => setShiftStatus(false), []);
  // ...
};

// frontend/src/hooks/useActiveShift.js — Observer
export const useActiveShift = () => {
  const { shiftStatus } = useShiftContext();
  // Prioritas context (instan) > API query (fallback)
  const hasActiveShift = shiftStatus !== null ? shiftStatus : !!(activeShiftData?.data);
  return { hasActiveShift, activeShift: activeShiftData?.data ?? null };
};
```

---

### Pattern 4 — Strategy Pattern

| Atribut | Detail |
|---------|--------|
| **Nama Pattern** | Strategy (Behavioral) |
| **Lokasi File** | `frontend/src/pages/fo/HandoverPage.jsx`, semua `src/services/*.js` |

**Tujuan:** Mengubah perilaku komponen atau service tanpa mengubah struktur kode utama.

```javascript
// frontend/src/pages/fo/HandoverPage.jsx
const KAS_COLS      = [{ key: "amount", render: (r) => formatRp(r.amount) }];
const EXPENSE_COLS  = [{ key: "status", render: (r) => <Badge status={r.status} /> }];

// TransactionTab menerima "strategi" kolom sebagai props
const TransactionTab = ({ items, columns }) => (
  items.map(item => columns.map(c => <td>{c.render ? c.render(item) : item[c.key]}</td>))
);
```

Setiap `*Service.js` di frontend juga merupakan Strategy — implementasi berbeda untuk setiap modul, dapat diganti tanpa mengubah komponen UI.


---

## 9. Struktur Folder Project

```
puri-asih-cashbook/                    ← Monorepo
├── backend/                           ← Laravel 11 Application
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/Api/       ← Presentation Layer
│   │   │   │   ├── AuthController.php
│   │   │   │   ├── AttendanceController.php
│   │   │   │   ├── KasController.php
│   │   │   │   ├── ExpenseController.php
│   │   │   │   ├── ReservationController.php
│   │   │   │   ├── DepositController.php
│   │   │   │   ├── ShiftController.php
│   │   │   │   ├── PayrollController.php
│   │   │   │   ├── ReportController.php
│   │   │   │   ├── UserController.php
│   │   │   │   ├── ActivityLogController.php
│   │   │   │   └── RoomRateController.php
│   │   │   ├── Middleware/
│   │   │   │   ├── RoleMiddleware.php
│   │   │   │   └── ShiftMiddleware.php
│   │   │   └── Requests/              ← Form Validation
│   │   ├── Models/                    ← Infrastructure Layer
│   │   │   ├── User.php
│   │   │   ├── Shift.php
│   │   │   ├── ShiftSchedule.php
│   │   │   ├── KasTransaction.php
│   │   │   ├── Expense.php
│   │   │   ├── Reservation.php
│   │   │   ├── Deposit.php
│   │   │   ├── Attendance.php
│   │   │   ├── Payroll.php
│   │   │   ├── PayrollSetting.php
│   │   │   ├── Notification.php
│   │   │   ├── ActivityLog.php
│   │   │   └── RoomRate.php
│   │   └── Services/                  ← Business Logic Layer
│   │       ├── AttendanceService.php  ← [Facade] Kalkulasi absensi & keterlambatan
│   │       ├── PayrollService.php     ← [Facade] Kalkulasi penggajian
│   │       ├── ShiftService.php       ← [Facade] Summary & report shift
│   │       ├── MonthlyReportService.php ← [Facade+Template] Laporan bulanan
│   │       ├── ReservationService.php ← Availability kamar & invoice
│   │       ├── ExpenseService.php     ← Auto-approve & notifikasi
│   │       ├── ActivityLogService.php ← Audit trail
│   │       └── KasAutomationService.php
│   ├── database/migrations/
│   ├── resources/views/pdf/           ← PDF Blade Templates
│   │   ├── laporan-kas.blade.php
│   │   ├── laporan-pengeluaran.blade.php
│   │   ├── laporan-deposit.blade.php
│   │   ├── invoice-reservasi.blade.php
│   │   ├── shift-report.blade.php
│   │   ├── daily-report.blade.php
│   │   ├── monthly-report.blade.php
│   │   ├── slip-gaji.blade.php
│   │   └── rekap-penggajian.blade.php
│   └── routes/api.php
│
└── frontend/                          ← React.js Application
    └── src/
        ├── components/
        │   ├── layout/
        │   │   ├── FoLayout.jsx
        │   │   └── ManagerLayout.jsx
        │   └── ui/
        │       ├── ConfirmModal.jsx
        │       ├── StatusBadge.jsx
        │       ├── InlineDropdown.jsx
        │       ├── RupiahInput.jsx
        │       ├── SignatureCanvas.jsx
        │       └── DataTable.jsx
        ├── context/
        │   └── ShiftContext.jsx       ← [Observer] Global shift state
        ├── hooks/
        │   └── useActiveShift.js      ← [Observer] Hook terpusat
        ├── pages/
        │   ├── auth/LoginPage.jsx
        │   ├── fo/                    ← 8 halaman FO
        │   └── manager/               ← 7 halaman Manager
        ├── services/                  ← [Strategy] API Service Layer
        │   ├── authService.js
        │   ├── kasService.js
        │   ├── expenseService.js
        │   ├── reservationService.js
        │   ├── depositService.js
        │   ├── payrollService.js
        │   ├── attendanceService.js
        │   └── shiftService.js
        ├── store/
        │   └── authStore.js           ← [Singleton] Auth state
        └── utils/
            ├── axios.js               ← [Singleton] Axios instance
            ├── queryKeys.js
            └── dateFormatter.js
```


---

## 10. Database Schema

### Daftar Tabel

| Tabel | Deskripsi |
|-------|-----------|
| `users` | Akun FO & Manager (role, shift, status) |
| `shifts` | Sesi kerja per FO (pagi/siang/malam) |
| `shift_schedules` | Jadwal shift mingguan per staff |
| `kas_transactions` | Pemasukan kas per shift (soft delete) |
| `expenses` | Pengeluaran operasional + approval workflow |
| `reservations` | Reservasi tamu OTT + invoice (soft delete) |
| `deposits` | Deposit refundable tamu (soft delete) |
| `attendances` | Absensi harian + tanda tangan digital |
| `payroll_settings` | Konfigurasi tarif gaji harian |
| `payrolls` | Rekap gaji bulanan per staff |
| `notifications` | Notifikasi sistem (deposit expiring, dll) |
| `activity_logs` | Audit trail semua aktivitas staff |
| `room_rates` | Tarif kamar per malam |

### Relasi Utama

```
users
  ├── hasMany → shifts
  ├── hasMany → kas_transactions
  ├── hasMany → expenses
  ├── hasMany → reservations
  ├── hasMany → deposits
  ├── hasMany → attendances
  └── hasMany → payrolls

shifts
  ├── belongsTo → users
  ├── hasMany → kas_transactions
  ├── hasMany → expenses
  ├── hasMany → reservations
  └── hasMany → deposits

attendances
  ├── belongsTo → users
  └── belongsTo → shifts (kolom: attendance_date — bukan 'date', reserved word PostgreSQL)
```

> **Catatan:** Semua tabel transaksi menggunakan **Soft Delete** (`deleted_at`). Deposit tidak masuk ke laporan keuangan — bukan pemasukan hotel.

---

## 11. Cara Menjalankan Project Secara Lokal

### Prasyarat

- PHP 8.2+
- Composer 2.x
- Node.js 18+
- Akun Neon (PostgreSQL serverless) atau PostgreSQL lokal
- wkhtmltopdf (untuk fitur export PDF)

### Langkah Instalasi

```bash
# 1. Clone repositori
git clone https://github.com/Kepin-vyn/Puri-Asih-Cashbook.git
cd Puri-Asih-Cashbook
```

### Setup Backend (Laravel 11)

```bash
cd backend

# Install dependensi PHP
composer install

# Salin file environment
cp .env.example .env

# Generate application key
php artisan key:generate
```

Edit `.env` sesuaikan database:

```env
DB_CONNECTION=pgsql
DB_HOST=ep-green-block-aoke5dyy.c-2.ap-southeast-1.aws.neon.tech
DB_PORT=5432
DB_DATABASE=neondb
DB_USERNAME=neondb_owner
DB_PASSWORD=npg_9vHb6auciPns
DB_SSLMODE=require

SANCTUM_STATEFUL_DOMAINS=localhost:5173
```

```bash
# Jalankan migrasi dan seeder
php artisan migrate:fresh --seed

# Buat symbolic link storage
php artisan storage:link

# Jalankan server
php artisan serve
# → http://localhost:8000
```

### Setup Frontend (React.js)

```bash
cd frontend

# Install dependensi
npm install

# Salin file environment
cp .env.example .env
```

Edit `.env`:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

```bash
# Jalankan development server
npm run dev
# → http://localhost:5173
```

### Akun Default

| Role | Email | Password |
|------|-------|----------|
| Manager | manager@puriasih.com | manager123 |
| Front Office (Kevin) | kevin@puriasih.com | fo123456 |
| Front Office (Awan) | awan@puriasih.com | fo123456 |

### Konfigurasi Database (Neon PostgreSQL — sudah tersedia)

Project ini menggunakan database **Neon Serverless PostgreSQL** yang sudah dikonfigurasi. Untuk menjalankan lokal tanpa setup database sendiri, gunakan konfigurasi berikut di file `backend/.env`:

```env
DB_CONNECTION=pgsql
DB_HOST=ep-green-block-aoke5dyy.c-2.ap-southeast-1.aws.neon.tech
DB_PORT=5432
DB_DATABASE=neondb
DB_USERNAME=neondb_owner
DB_PASSWORD=npg_9vHb6auciPns
DB_SSLMODE=require
```

> Database sudah berisi data demo untuk Juli 2026 (KAS, Reservasi, Pengeluaran, Activity Log).

---

## 12. Linter dan Code Quality

### Backend — Laravel Pint (PHP)

```bash
# Cek tanpa mengubah file
./vendor/bin/pint --test

# Auto-fix semua style issues
./vendor/bin/pint
```

Hasil: **122 files — PASS** (PSR-12 compliant)

### Frontend — ESLint

```bash
# Cek semua file
npm run lint

# Auto-fix yang bisa diperbaiki
npm run lint -- --fix
```

Hasil: **0 errors** (Rules: no-unused-vars, react-hooks/rules-of-hooks, eqeqeq, no-var)

### Konfigurasi ESLint (`frontend/eslint.config.js`)

```javascript
rules: {
  'no-unused-vars':            ['warn', { varsIgnorePattern: '^_' }],
  'react-hooks/rules-of-hooks': 'error',   // Rules of Hooks wajib
  'react-hooks/exhaustive-deps': 'warn',
  'eqeqeq':                    ['error', 'always'],
  'prefer-const':               'warn',
  'no-var':                     'error',
}
```


---

## 13. GitFlow dan Conventional Commits

### Struktur Branch

```
main
  └── develop                          ← Staging (integrasi semua fitur)
        ├── feature/setup-repository
        ├── feature/setup-laravel
        ├── feature/setup-react
        ├── feature/database-migration
        ├── feature/api-auth
        ├── feature/ui-login
        ├── feature/api-kas-harian
        ├── feature/api-pengeluaran
        ├── feature/api-reservasi
        ├── feature/api-deposit
        ├── feature/api-shift-report
        ├── feature/api-monthly-report
        ├── feature/api-absensi-penggajian
        ├── feature/api-notifikasi
        ├── feature/api-usermanagement
        ├── feature/ui-dashboard
        ├── feature/ui-reservasi
        ├── feature/ui-deposit
        ├── feature/ui-pengeluaran
        ├── feature/ui-fo-management
        ├── feature/weekly-shift-schedule
        ├── feature/auto-kas-from-reservation
        ├── fix/security-deposit-authorization
        ├── fix/manager-dashboard-blank-screen
        ├── fix/dashboard-fo-mulai-shift
        └── fix/linter-cleanup
```

### Aturan GitFlow

- ❌ Tidak ada commit langsung ke `main` atau `develop`
- ✅ Setiap fitur dikerjakan di branch `feature/nama-fitur`
- ✅ Setiap perbaikan di branch `fix/nama-bug`
- ✅ Merge ke `develop` wajib melalui Pull Request
- ✅ PR harus di-approve minimal 1 rekan tim sebelum di-merge

### Format Conventional Commits

```bash
feat:     # Fitur baru
fix:      # Perbaikan bug
chore:    # Setup / konfigurasi
style:    # Perubahan UI / styling
docs:     # Dokumentasi
refactor: # Refactor tanpa fitur baru
```

**Contoh commit nyata di project ini:**

```bash
feat: implementasi API KAS Harian lengkap (Closes #7)
feat: implementasi UI Halaman Reservasi OTT (Closes #14)
feat: sistem penjadwalan shift mingguan untuk FO (#33)
fix: perbaiki ReferenceError savedRate di PayrollPage
fix: tambahkan otorisasi shift pada operasi update deposit oleh FO
fix: tambahkan rate limiting login, expirasi token Sanctum 24 jam
docs: tambahkan deployment checklist keamanan ke README
style: terapkan design system baru bergaya minimalis pada seluruh komponen frontend
```

---

## 14. Dokumentasi Video Individu

| Nama | NIM | Role | Link Video |
|------|-----|------|------------|
| Arefcy Theneven Saban | 42430002 | Frontend Developer | [▶ Tonton](https://youtu.be/W_PJZfmpEuE) |
| I Made Obi Pranata | 42430003 | Backend Developer | [▶ Tonton](https://youtu.be/o3iyP4QQUVM?si=Tdy9W3xGHwNIeqn9) |
| Gabriel Jehuda Tamedo | 42430007 | Frontend Developer | [▶ Tonton](https://youtu.be/Js3LiPeyvqw) |
| Rosan Kelvino Andre | 42430025 | Backend Developer | [▶ Tonton](https://youtu.be/DzgDMPAacm0) |
| Cevyn Eduard Imanuel Dapa Talu | 42430055 | Fullstack + PM | [▶ Tonton](https://youtu.be/dOkOfQarpBk) |

> Setiap video menampilkan wajah (webcam) + layar (screencast), mencakup: commit history, branch feature, Pull Request, demo kode, arsitektur, design pattern, dan pembuktian linter.

---

## 15. Status MVP

| Komponen | Status |
|----------|--------|
| Autentikasi & Role-based Redirect | ✅ Selesai |
| Absensi Digital + Tanda Tangan Canvas | ✅ Selesai |
| KAS Harian (CRUD + PDF) | ✅ Selesai |
| Reservasi OTT (3 sumber + invoice) | ✅ Selesai |
| Refundable Deposit (refund + forfeit) | ✅ Selesai |
| Pengeluaran + Approval Workflow | ✅ Selesai |
| Shift Handover + Shift Report PDF | ✅ Selesai |
| Monthly Report + PDF | ✅ Selesai |
| Payroll Otomatis + Slip Gaji PDF | ✅ Selesai |
| FO Management + Jadwal Shift Mingguan | ✅ Selesai |
| Activity Log Audit Trail | ✅ Selesai |
| Tarif Kamar Otomatis | ✅ Selesai |
| Notifikasi Deposit Jatuh Tempo | ✅ Selesai |
| Security (Rate Limiting, Token Expiry) | ✅ Selesai |
| Linter Backend (Laravel Pint) | ✅ PASS |
| Linter Frontend (ESLint) | ✅ 0 Errors |
| GitFlow & Pull Request | ✅ Selesai |

---

## 16. Checklist Pengumpulan UAS

### Kelompok
- [x] Repositori GitHub bersifat Public
- [x] Branch `main` dan `develop` sudah ada
- [x] Setiap fitur dikerjakan di branch `feature/`
- [x] Pull Request dari `feature/` ke `develop` sudah dibuat dan di-review
- [x] ESLint (Frontend) — 0 errors
- [x] Laravel Pint (Backend) — 122 files PASS
- [x] README lengkap (deskripsi, arsitektur, design pattern, kontribusi, video)
- [x] Kode terstruktur rapi sesuai Layered Architecture
- [x] Link video individu diisi di README

### Individu (masing-masing anggota)
- [ ] Video 5-7 menit diunggah ke YouTube (Unlisted)
- [ ] Video menampilkan wajah + layar
- [ ] Video mencakup: commit history, branch feature, PR, demo kode, arsitektur, design pattern, linter

---

## 17. Referensi Arsitektur dan Design Pattern

| Referensi | Link |
|-----------|------|
| Layered Architecture (Clean Architecture) | [refactoring.guru/design-patterns](https://refactoring.guru/design-patterns) |
| Facade Pattern (GoF) | [Refactoring.Guru — Facade](https://refactoring.guru/design-patterns/facade) |
| Singleton Pattern (GoF) | [Refactoring.Guru — Singleton](https://refactoring.guru/design-patterns/singleton) |
| Observer Pattern (GoF) | [Refactoring.Guru — Observer](https://refactoring.guru/design-patterns/observer) |
| Strategy Pattern (GoF) | [Refactoring.Guru — Strategy](https://refactoring.guru/design-patterns/strategy) |
| Laravel Pint (Linter) | [Laravel Pint Docs](https://laravel.com/docs/pint) |
| ESLint React Rules | [ESLint Plugin React Hooks](https://www.npmjs.com/package/eslint-plugin-react-hooks) |
| GitFlow Workflow | [Atlassian GitFlow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow) |
| Conventional Commits | [conventionalcommits.org](https://www.conventionalcommits.org) |

---

*Puri Asih Cashbook — Kelompok ABC, Rekayasa Perangkat Lunak 2025/2026*
*Universitas Pendidikan Nasional Denpasar, Indonesia*
