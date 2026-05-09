# 📋 PLANNING.md
# Puri Asih Cashbook — Project Planning

---

## 🏨 Tentang Project

**Nama Project:** Puri Asih Cashbook
**Tipe Sistem:** Shift-based Financial Reporting System
**Client:** Hotel Puri Asih
**Tim:** Kelompok ABC — 5 Anggota
**Metode:** Kanban (Lightweight Agile)
**Tools Vibe Coding:** Antigravity

---

## 🎯 Tujuan Sistem

Menggantikan seluruh proses pencatatan manual Hotel Puri Asih yang saat ini menggunakan 5 buku fisik terpisah:

| Buku Manual | Digantikan Oleh |
|-------------|-----------------|
| 📒 Buku KAS | Modul KAS Harian |
| 📒 Buku Pengeluaran | Modul Pengeluaran & Approval |
| 📒 Buku Reservasi OTT | Modul Reservasi OTT |
| 📒 Buku Refundable Deposit | Modul Refundable Deposit |
| 📒 Buku Absensi | Modul Absensi & Penggajian |
| 📋 Kwitansi & Klip Manual | Modul Shift Report & Handover |
| 🗂️ Rekap Manual Bulanan | Modul Monthly Report |

---

## 👥 Tim & Pembagian Tugas

| Nama | NIM | Role |
|------|-----|------|
| Arefcy Theneven Saban | 42430002 | Frontend Developer |
| I Made Obi Pranata | 42430003 | Backend Developer |
| Gabriel Jehuda Tamedo | 42430007 | Frontend Developer |
| Rosan Kelvino Andre | 42430025 | Backend Developer |
| Cevyn Eduard Imanuel Dapa Talu | 42430055 | Fullstack + Database + PM |

---

## 🛠️ Tech Stack

```
Frontend   → React.js + Tailwind CSS + Vite
Backend    → Laravel 11 (PHP)
Database   → MySQL
Auth       → Laravel Sanctum
PDF        → Laravel Snappy (wkhtmltopdf)
API Style  → RESTful API
Vibe Coding → Antigravity
```

---

## 📁 Struktur Repository

```
puri-asih-cashbook/                 ← 1 Repository (Monorepo)
├── frontend/                       ← React.js App
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   ├── layout/
│   │   │   └── ui/
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   ├── fo/
│   │   │   └── manager/
│   │   ├── hooks/
│   │   ├── services/               ← API calls (axios)
│   │   ├── store/                  ← State management
│   │   └── utils/
│   ├── .env.example
│   └── package.json
│
├── backend/                        ← Laravel 11 App
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/
│   │   │   │   └── Api/
│   │   │   ├── Middleware/
│   │   │   └── Requests/
│   │   ├── Models/
│   │   ├── Services/
│   │   └── Policies/
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   ├── resources/views/pdf/        ← Blade PDF templates
│   ├── routes/api.php
│   └── .env.example
│
├── docs/                           ← Dokumentasi
│   ├── planning.md                 ← File ini
│   ├── guideline.md
│   ├── API_DOCS.md
│   └── ERD.png
│
└── README.md
```

---

## 🌿 Branch Strategy

```
main
 └── develop
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
      ├── feature/ui-dashboard-fo
      ├── feature/ui-dashboard-manager
      ├── feature/ui-kas-harian
      ├── feature/ui-reservasi
      ├── feature/ui-deposit
      ├── feature/ui-pengeluaran
      ├── feature/api-shift-report
      ├── feature/api-monthly-report
      ├── feature/api-absensi-penggajian
      ├── feature/ui-shift-report
      ├── feature/ui-monthly-report
      ├── feature/ui-absensi-penggajian
      ├── feature/api-notifikasi
      ├── feature/api-user-management
      ├── feature/ui-fo-management
      ├── feature/pdf-templates
      ├── feature/dokumentasi
      └── fix/integration-bugs
```

**Aturan Branch:**
- ❌ Dilarang push langsung ke `main`
- ❌ Dilarang push langsung ke `develop`
- ✅ Semua fitur wajib lewat branch `feature/xxx`
- ✅ Wajib Pull Request sebelum merge ke `develop`
- ✅ Minimal 1 anggota lain harus review PR

---

## 📅 Timeline & Milestones

### MILESTONE 1 — Foundation & Setup (Hari 1-2)

| Issue | Judul | Assignee | Status |
|-------|-------|----------|--------|
| #1 | Setup Repository & GitHub Project | Cevyn | ⬜ Backlog |
| #2 | Setup Laravel 11 | Obi | ⬜ Backlog |
| #3 | Setup React.js + Tailwind | Arefcy | ⬜ Backlog |
| #4 | Database ERD & Migration | Cevyn | ⬜ Backlog |
| #5 | API Authentication | Obi | ⬜ Backlog |
| #6 | UI Halaman Login | Arefcy | ⬜ Backlog |

---

### MILESTONE 2 — Core Modules (Hari 3-7)

| Issue | Judul | Assignee | Status |
|-------|-------|----------|--------|
| #7 | API KAS Harian | Obi | ⬜ Backlog |
| #8 | API Pengeluaran & Approval | Obi | ⬜ Backlog |
| #9 | API Reservasi OTT | Rosan | ⬜ Backlog |
| #10 | API Refundable Deposit | Rosan | ⬜ Backlog |
| #11 | UI Dashboard FO | Arefcy | ⬜ Backlog |
| #12 | UI Dashboard Manager | Arefcy | ⬜ Backlog |
| #13 | UI KAS Harian | Arefcy | ⬜ Backlog |
| #14 | UI Reservasi OTT | Gabriel | ⬜ Backlog |
| #15 | UI Refundable Deposit | Gabriel | ⬜ Backlog |
| #16 | UI Pengeluaran & Approval | Gabriel | ⬜ Backlog |

---

### MILESTONE 3 — Reporting & HR (Hari 8-12)

| Issue | Judul | Assignee | Status |
|-------|-------|----------|--------|
| #17 | API Shift Report & Handover | Rosan | ⬜ Backlog |
| #18 | API Monthly Report | Obi | ⬜ Backlog |
| #19 | API Absensi & Penggajian | Cevyn | ⬜ Backlog |
| #20 | UI Shift Report & Handover | Gabriel | ⬜ Backlog |
| #21 | UI Monthly Report | Arefcy | ⬜ Backlog |
| #22 | UI Absensi & Penggajian | Gabriel | ⬜ Backlog |

---

### MILESTONE 4 — Finishing & Testing (Hari 13-14)

| Issue | Judul | Assignee | Status |
|-------|-------|----------|--------|
| #23 | API Notifikasi | Rosan | ⬜ Backlog |
| #24 | API User Management | Obi | ⬜ Backlog |
| #25 | UI FO Management | Arefcy | ⬜ Backlog |
| #26 | PDF Semua Template | Cevyn | ⬜ Backlog |
| #27 | Integration Testing & Bug Fix | Semua | ⬜ Backlog |
| #28 | Dokumentasi API & README | Cevyn | ⬜ Backlog |

---

## 🗄️ Database Schema

### Tabel Utama

```
users
├── id
├── name
├── email
├── password
├── role          → fo / manager
├── shift         → pagi / siang / malam
├── status        → active / inactive
└── deleted_at    → soft delete

shifts
├── id
├── user_id       → FK users
├── type          → pagi / siang / malam
├── started_at
├── ended_at
├── handover_to   → FK users
├── handover_note
└── status        → active / closed

kas_transactions
├── id
├── shift_id      → FK shifts
├── user_id       → FK users
├── guest_name
├── transaction_type → reservasi / checkin / pelunasan
├── payment_method   → tunai / transfer / qris / kartu_kredit
├── amount
├── note
├── receipt_photo
└── deleted_at

expenses
├── id
├── shift_id      → FK shifts
├── user_id       → FK users
├── description
├── price_per_item
├── quantity
├── total_price
├── payment_method
├── receipt_photo
├── status        → auto_approved / pending / approved / rejected
├── approved_by   → FK users
├── approved_at
├── rejection_reason
└── deleted_at

reservations
├── id
├── shift_id      → FK shifts
├── user_id       → FK users
├── guest_name
├── room_number
├── reservation_date
├── check_in_date
├── check_out_date
├── room_price
├── down_payment
├── remaining_balance
├── payment_method
├── payment_status  → dp / lunas
├── source          → walk_in / tiket / booking
├── status          → checkin / checkout / cancel / noshow
├── invoice_number
└── deleted_at

deposits
├── id
├── shift_id      → FK shifts
├── user_id       → FK users
├── guest_name
├── room_number
├── check_in_date
├── check_out_date
├── amount
├── payment_method
├── status        → active / refunded / forfeited
├── refund_date
├── note
└── deleted_at

attendances
├── id
├── user_id       → FK users
├── shift_id      → FK shifts
├── shift_type    → pagi / siang / malam
├── actual_start
├── actual_end
├── status        → hadir / libur / sakit / izin / alpha
├── is_late
└── digital_signature

payroll_settings
├── id
├── daily_rate
├── effective_date
└── set_by        → FK users

payrolls
├── id
├── user_id       → FK users
├── month
├── year
├── total_present
├── total_leave
├── total_absent
├── daily_rate
└── total_salary

notifications
├── id
├── user_id       → FK users
├── type
├── title
├── message
├── data          → JSON
└── read_at
```

---

## 🔌 API Endpoints Summary

### Base URL
```
http://localhost:8000/api/v1
```

### Endpoints per Modul

| Modul | Method | Endpoint |
|-------|--------|----------|
| Auth | POST | /auth/login |
| Auth | POST | /auth/logout |
| Auth | GET | /auth/me |
| KAS | GET/POST | /kas |
| KAS | GET/PUT/DELETE | /kas/{id} |
| KAS | GET | /kas/export/pdf |
| Expenses | GET/POST | /expenses |
| Expenses | POST | /expenses/{id}/approve |
| Expenses | POST | /expenses/{id}/reject |
| Reservasi | GET/POST | /reservations |
| Reservasi | GET | /reservations/{id}/invoice |
| Deposit | GET/POST | /deposits |
| Deposit | POST | /deposits/{id}/refund |
| Shift | POST | /shifts/start |
| Shift | POST | /shifts/{id}/handover |
| Shift | GET | /shifts/{id}/report/pdf |
| Report | GET | /reports/monthly |
| Report | GET | /reports/monthly/export/pdf |
| Absensi | POST | /attendance/checkin |
| Absensi | POST | /attendance/checkout |
| Payroll | GET | /payroll/{month} |
| Payroll | GET | /payroll/{month}/{id}/slip |
| Users | GET/POST | /users |
| Notif | GET | /notifications |

---

## 📊 Modul & Functional Requirements

| Modul | FR | Jumlah |
|-------|----|--------|
| Pengeluaran | FR-1 s/d FR-10 | 10 FR |
| KAS Harian | FR-11 s/d FR-18 | 8 FR |
| Reservasi OTT | FR-19 s/d FR-25 | 7 FR |
| Refundable Deposit | FR-26 s/d FR-32 | 7 FR |
| Shift Report & Handover | FR-33 s/d FR-45 | 13 FR |
| Monthly Report | FR-46 s/d FR-51 | 6 FR |
| Absensi & Penggajian | FR-52 s/d FR-61 | 10 FR |
| **TOTAL** | | **61 FR** |

---

## 📄 PDF Templates yang Dibutuhkan

```
1. shift-report.blade.php
2. daily-report.blade.php
3. monthly-report.blade.php
4. invoice-reservasi.blade.php
5. slip-gaji.blade.php
6. laporan-kas.blade.php
7. laporan-pengeluaran.blade.php
8. laporan-deposit.blade.php
9. rekap-penggajian.blade.php
```

---

## 💬 Komunikasi Tim

**Update harian wajib di WhatsApp Group (tiap malam):**
```
[Nama] - Hari ke-X
✅ Selesai  : ...
🔄 Sedang   : ...
❌ Blocker  : ...
```

**Diskusi teknis:** GitHub Issues (comment di issue terkait)

**Code review:** GitHub Pull Request

---

## ✅ Definition of Done

Sebuah Issue dinyatakan selesai jika:
- [ ] Semua task di checklist Issue sudah dikerjakan
- [ ] Semua Acceptance Criteria terpenuhi
- [ ] Kode sudah di-push ke branch feature
- [ ] Pull Request sudah dibuat dengan "Closes #nomor"
- [ ] Minimal 1 anggota sudah review dan approve PR
- [ ] PR sudah di-merge ke develop
- [ ] Issue otomatis tertutup di GitHub
- [ ] Card di Kanban Board sudah pindah ke Done
