# Puri Asih Cashbook

Sistem pencatatan dan pelaporan keuangan berbasis shift (Shift-based Financial Reporting System) untuk Hotel Puri Asih. Sistem ini menggantikan proses pencatatan manual yang sebelumnya menggunakan 5 buku fisik menjadi satu sistem digital yang terintegrasi.

## 🛠️ Tech Stack

- **Frontend**: React.js, Tailwind CSS, Vite
- **Backend**: Laravel 11 (PHP), Laravel Sanctum (Auth)
- **Database**: MySQL
- **PDF Generation**: Laravel Snappy (wkhtmltopdf)

## 👥 Tim Pengembang (Kelompok ABC)

| Nama | NIM | Role |
|------|-----|------|
| Arefcy Theneven Saban | 42430002 | Frontend Developer |
| I Made Obi Pranata | 42430003 | Backend Developer |
| Gabriel Jehuda Tamedo | 42430007 | Frontend Developer |
| Rosan Kelvino Andre | 42430025 | Backend Developer |
| Cevyn Eduard Imanuel Dapa Talu | 42430055 | Fullstack + Database + PM |

## 🚀 Cara Instalasi & Setup

Proyek ini adalah sebuah monorepo yang terbagi menjadi dua bagian utama: `backend` dan `frontend`.

### 1. Setup Database

1. Pastikan server MySQL berjalan (misal menggunakan XAMPP, Herd, atau Laragon).
2. Buat database baru dengan nama: `puri_asih_cashbook`

### 2. Instalasi Backend (Laravel 11)

1. Buka terminal dan masuk ke folder backend:
   ```bash
   cd backend
   ```
2. Salin file environment:
   ```bash
   cp .env.example .env
   ```
3. Install dependensi PHP menggunakan Composer:
   ```bash
   composer install
   ```
4. Generate APP_KEY:
   ```bash
   php artisan key:generate
   ```
5. Sesuaikan konfigurasi database pada file `.env` (pastikan nama database sesuai `DB_DATABASE=puri_asih_cashbook`).
6. Jalankan migrasi dan seeder:
   ```bash
   php artisan migrate:fresh --seed
   ```
7. Buat symbolic link untuk storage:
   ```bash
   php artisan storage:link
   ```
8. Jalankan local server:
   ```bash
   php artisan serve
   ```
   Backend akan berjalan di `http://localhost:8000`.

### 3. Instalasi Frontend (React.js)

1. Buka tab terminal baru dan masuk ke folder frontend:
   ```bash
   cd frontend
   ```
2. Salin file environment:
   ```bash
   cp .env.example .env
   ```
3. Install dependensi Node.js:
   ```bash
   npm install
   ```
4. Jalankan local development server:
   ```bash
   npm run dev
   ```
   Frontend akan berjalan di `http://localhost:5173`.

## 🔐 Default Credentials

Gunakan akun berikut untuk login ke dalam sistem (hasil dari database seeder):

**1. Manager:**
- **Email:** manager@puriasih.com
- **Password:** password

**2. Front Office (FO) 1:**
- **Email:** fo1@puriasih.com
- **Password:** password

**3. Front Office (FO) 2:**
- **Email:** fo2@puriasih.com
- **Password:** password
