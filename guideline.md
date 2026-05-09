# 📖 GUIDELINE.md
# Puri Asih Cashbook — Development Guideline

---

## 1. ALUR KERJA HARIAN (WAJIB DIIKUTI)

```
Setiap hari sebelum mulai kerja:
1. git checkout develop
2. git pull origin develop
3. git checkout -b feature/nama-fitur

Selama coding:
4. git status
5. git add .
6. git commit -m "tipe: deskripsi singkat"
   → Ulangi 4-6 sesering mungkin

Selesai fitur:
7. git push origin feature/nama-fitur
8. Buat Pull Request di GitHub → Closes #nomor-issue
9. Minta review minimal 1 anggota
10. Merge setelah diapprove
11. git checkout develop && git pull
12. git branch -d feature/nama-fitur
```

---

## 2. ATURAN BRANCH

```
✅ BOLEH
- Buat branch baru dari develop
- Push ke branch feature milik sendiri
- Merge ke develop via Pull Request

❌ DILARANG
- Push langsung ke main
- Push langsung ke develop
- Merge tanpa Pull Request
- Merge tanpa review dari anggota lain
```

### Naming Convention Branch
```
feature/setup-repository
feature/setup-laravel
feature/setup-react
feature/database-migration
feature/api-auth
feature/api-kas-harian
feature/api-pengeluaran
feature/api-reservasi
feature/api-deposit
feature/api-shift-report
feature/api-monthly-report
feature/api-absensi-penggajian
feature/api-notifikasi
feature/api-user-management
feature/ui-login
feature/ui-dashboard-fo
feature/ui-dashboard-manager
feature/ui-kas-harian
feature/ui-reservasi
feature/ui-deposit
feature/ui-pengeluaran
feature/ui-shift-report
feature/ui-monthly-report
feature/ui-absensi-penggajian
feature/ui-fo-management
feature/pdf-templates
feature/dokumentasi
fix/nama-bug
```

---

## 3. FORMAT COMMIT MESSAGE

```
feat     → Fitur baru
fix      → Perbaikan bug
chore    → Setup / konfigurasi
style    → Perubahan UI / styling
db       → Migration / seeder database
docs     → Dokumentasi
refactor → Refactor kode tanpa fitur baru
test     → Penambahan test
```

### Contoh Penggunaan
```bash
git commit -m "feat: tambah API endpoint input transaksi KAS"
git commit -m "fix: perbaiki kalkulasi saldo akhir shift"
git commit -m "chore: setup Laravel Sanctum dan konfigurasi CORS"
git commit -m "style: update warna sidebar dashboard FO"
git commit -m "db: tambah migration tabel kas_transactions"
git commit -m "docs: tambah dokumentasi endpoint API auth"
git commit -m "refactor: pisahkan logic approval ke ExpenseService"
```

---

## 4. STANDAR KODE BACKEND (LARAVEL)

### Struktur Controller
```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class KasController extends Controller
{
    // Constructor — inject service jika diperlukan
    public function __construct(
        private KasService $kasService
    ) {}

    // Index — list data
    public function index(Request $request): JsonResponse
    {
        //
    }

    // Store — simpan data baru
    public function store(Request $request): JsonResponse
    {
        //
    }

    // Show — detail satu data
    public function show(int $id): JsonResponse
    {
        //
    }

    // Update — edit data
    public function update(Request $request, int $id): JsonResponse
    {
        //
    }

    // Destroy — soft delete
    public function destroy(int $id): JsonResponse
    {
        //
    }
}
```

### Format Response Standar
```php
// Response sukses
return response()->json([
    'success' => true,
    'message' => 'Transaksi berhasil disimpan',
    'data'    => $data,
    'meta'    => [
        'page'     => $paginator->currentPage(),
        'per_page' => $paginator->perPage(),
        'total'    => $paginator->total(),
    ]
], 200);

// Response error validasi
return response()->json([
    'success' => false,
    'message' => 'Data tidak valid',
    'errors'  => $validator->errors()
], 422);

// Response error tidak ditemukan
return response()->json([
    'success' => false,
    'message' => 'Data tidak ditemukan',
], 404);

// Response error tidak diizinkan
return response()->json([
    'success' => false,
    'message' => 'Akses ditolak',
], 403);
```

### Naming Convention Laravel
```
Model          → PascalCase singular    → KasTransaction
Controller     → PascalCase + Controller → KasController
Service        → PascalCase + Service   → KasService
Migration      → snake_case             → create_kas_transactions_table
Tabel DB       → snake_case plural      → kas_transactions
Route          → kebab-case             → /kas-transactions
Variable       → camelCase              → $kasTransaction
Method         → camelCase              → getMonthlyReport()
```

### Struktur Route API
```php
// routes/api.php

Route::prefix('v1')->group(function () {

    // Public routes (tanpa auth)
    Route::post('/auth/login', [AuthController::class, 'login']);

    // Protected routes (wajib login)
    Route::middleware('auth:sanctum')->group(function () {

        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'me']);

        // FO & Manager routes
        Route::apiResource('kas', KasController::class);
        Route::post('kas/{id}/upload', [KasController::class, 'upload']);

        // Manager only routes
        Route::middleware('role:manager')->group(function () {
            Route::post('expenses/{id}/approve', [ExpenseController::class, 'approve']);
            Route::post('expenses/{id}/reject', [ExpenseController::class, 'reject']);
            Route::apiResource('users', UserController::class);
        });
    });
});
```

### Validasi Request
```php
// Selalu gunakan Form Request untuk validasi
// Buat file: app/Http/Requests/StoreKasRequest.php

public function rules(): array
{
    return [
        'guest_name'       => 'required|string|max:255',
        'transaction_type' => 'required|in:reservasi,checkin,pelunasan',
        'payment_method'   => 'required|in:tunai,transfer,qris,kartu_kredit',
        'amount'           => 'required|numeric|min:1',
        'note'             => 'nullable|string|max:500',
    ];
}

public function messages(): array
{
    return [
        'guest_name.required'       => 'Nama tamu wajib diisi',
        'transaction_type.required' => 'Jenis transaksi wajib dipilih',
        'amount.required'           => 'Jumlah transaksi wajib diisi',
        'amount.numeric'            => 'Jumlah transaksi harus berupa angka',
    ];
}
```

### Model
```php
class KasTransaction extends Model
{
    use SoftDeletes;  // ← WAJIB untuk semua model transaksi

    protected $fillable = [
        'shift_id',
        'user_id',
        'guest_name',
        'transaction_type',
        'payment_method',
        'amount',
        'note',
        'receipt_photo',
    ];

    protected $casts = [
        'amount'     => 'decimal:2',
        'created_at' => 'datetime',
    ];

    // Relasi
    public function shift(): BelongsTo
    {
        return $this->belongsTo(Shift::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
```

---

## 5. STANDAR KODE FRONTEND (REACT)

### Struktur Komponen
```jsx
// Selalu gunakan functional component + arrow function
// Nama file: KasHarianPage.jsx

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { kasService } from "../../services/kasService";

const KasHarianPage = () => {
  // 1. State declarations
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 2. Query / API calls
  const { data, isLoading, error } = useQuery({
    queryKey: ["kas-transactions"],
    queryFn: kasService.getAll,
  });

  // 3. Mutations
  const createMutation = useMutation({
    mutationFn: kasService.create,
    onSuccess: () => {
      toast.success("Transaksi berhasil disimpan");
      setIsModalOpen(false);
    },
    onError: () => {
      toast.error("Gagal menyimpan transaksi");
    },
  });

  // 4. Event handlers
  const handleSubmit = (formData) => {
    createMutation.mutate(formData);
  };

  // 5. Render
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage />;

  return (
    <div>
      {/* JSX */}
    </div>
  );
};

export default KasHarianPage;
```

### Struktur Service (API Calls)
```javascript
// src/services/kasService.js

import api from "../utils/axios";

export const kasService = {
  // GET semua transaksi
  getAll: async (params) => {
    const response = await api.get("/kas", { params });
    return response.data;
  },

  // GET satu transaksi
  getById: async (id) => {
    const response = await api.get(`/kas/${id}`);
    return response.data;
  },

  // POST buat transaksi baru
  create: async (data) => {
    const response = await api.post("/kas", data);
    return response.data;
  },

  // PUT update transaksi
  update: async (id, data) => {
    const response = await api.put(`/kas/${id}`, data);
    return response.data;
  },

  // DELETE soft delete
  delete: async (id) => {
    const response = await api.delete(`/kas/${id}`);
    return response.data;
  },

  // Upload bukti struk
  uploadReceipt: async (id, file) => {
    const formData = new FormData();
    formData.append("receipt", file);
    const response = await api.post(`/kas/${id}/upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // Export PDF
  exportPdf: async (params) => {
    const response = await api.get("/kas/export/pdf", {
      params,
      responseType: "blob",
    });
    return response.data;
  },
};
```

### Axios Instance
```javascript
// src/utils/axios.js

import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request interceptor — otomatis tambah token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle error global
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Naming Convention React
```
Komponen       → PascalCase       → KasHarianPage.jsx
Halaman        → PascalCase + Page → DashboardPage.jsx
Service        → camelCase + Service → kasService.js
Hook custom    → use + PascalCase → useShiftActive.js
CSS class      → Tailwind utility class
State variable → camelCase        → isModalOpen
Handler        → handle + Event   → handleSubmit
```

### Struktur Folder Halaman
```
src/pages/
├── auth/
│   └── LoginPage.jsx
├── fo/
│   ├── DashboardPage.jsx
│   ├── KasHarianPage.jsx
│   ├── ReservationPage.jsx
│   ├── DepositPage.jsx
│   ├── ExpensesPage.jsx
│   ├── AttendancePage.jsx
│   ├── ReportPage.jsx
│   └── HandoverPage.jsx
└── manager/
    ├── DashboardPage.jsx
    ├── FoManagementPage.jsx
    ├── ApprovalPage.jsx
    ├── ReportPage.jsx
    ├── MonthlyReportPage.jsx
    └── PayrollPage.jsx
```

---

## 6. STANDAR DATABASE

### Wajib Ada di Setiap Tabel Transaksi
```php
// Semua tabel transaksi WAJIB punya:
$table->id();
$table->timestamps();     // created_at, updated_at
$table->softDeletes();    // deleted_at → untuk soft delete
```

### Foreign Key
```php
// Selalu definisikan foreign key dengan constraint
$table->foreignId('user_id')
      ->constrained('users')
      ->onDelete('restrict');

$table->foreignId('shift_id')
      ->constrained('shifts')
      ->onDelete('restrict');
```

### Format Angka Uang
```php
// Di migration, gunakan decimal bukan float
$table->decimal('amount', 15, 2);
$table->decimal('total_price', 15, 2);
$table->decimal('daily_rate', 15, 2);
```

---

## 7. STANDAR PDF TEMPLATE

### Setiap Template Blade PDF Wajib Punya
```html
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <style>
        /* Reset */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 12px; }

        /* Header */
        .header { text-align: center; margin-bottom: 20px; }
        .hotel-name { font-size: 18px; font-weight: bold; }
        .report-title { font-size: 14px; margin-top: 5px; }

        /* Tabel */
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th { background-color: #2E74B5; color: white; padding: 8px; text-align: left; }
        td { padding: 6px 8px; border-bottom: 1px solid #ddd; }
        tr:nth-child(even) { background-color: #f5f9ff; }

        /* Footer */
        .footer { margin-top: 30px; }
        .signature-box { display: flex; justify-content: space-between; }

        /* Format Rupiah */
        .currency { text-align: right; }
    </style>
</head>
<body>
    <!-- HEADER -->
    <div class="header">
        <div class="hotel-name">HOTEL PURI ASIH</div>
        <div>Jl. [Alamat Hotel]</div>
        <hr style="margin-top: 10px;">
        <div class="report-title">{{ $reportTitle }}</div>
        <div>Periode: {{ $period }}</div>
    </div>

    <!-- CONTENT -->
    <div class="content">
        <!-- Data tabel -->
    </div>

    <!-- FOOTER -->
    <div class="footer">
        <div>Dicetak pada: {{ now()->format('d/m/Y H:i') }}</div>
        <div class="signature-box">
            <div>
                <p>Front Office</p>
                <br><br><br>
                <p>( ________________ )</p>
            </div>
            <div>
                <p>Manager</p>
                <br><br><br>
                <p>( ________________ )</p>
            </div>
        </div>
    </div>
</body>
</html>
```

---

## 8. CARA PENGGUNAAN ANTIGRAVITY (VIBE CODING)

### Prinsip Utama
```
1. Gunakan prompt yang sudah disediakan di docs/prompts/
2. Satu prompt = satu Issue/fitur
3. Review hasil kode sebelum di-commit
4. Jangan langsung accept semua — pahami dulu
5. Test setelah setiap fitur selesai
```

### Alur Vibe Coding per Issue
```
1. Buka prompt yang sesuai dengan Issue yang dikerjakan
2. Paste prompt ke Antigravity
3. Review kode yang dihasilkan
4. Sesuaikan dengan kondisi project (nama tabel, dll)
5. Test secara manual
6. Commit ke branch feature
7. Buat Pull Request
```

### Yang Harus Selalu Dicek Setelah Generate
```
Backend:
✅ Namespace sudah benar
✅ Import/use sudah lengkap
✅ Nama tabel sesuai migration
✅ Relasi model sudah benar
✅ Response format sesuai standar
✅ Validasi sudah ada

Frontend:
✅ Import komponen sudah benar
✅ API endpoint sudah sesuai
✅ Error handling sudah ada
✅ Loading state sudah ada
✅ Tampilan responsif
```

---

## 9. ENVIRONMENT VARIABLES

### Backend (.env)
```env
APP_NAME="Puri Asih Cashbook"
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=puri_asih_cashbook
DB_USERNAME=root
DB_PASSWORD=

SANCTUM_STATEFUL_DOMAINS=localhost:5173
SESSION_LIFETIME=30

FILESYSTEM_DISK=public
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_APP_NAME="Puri Asih Cashbook"
```

---

## 10. CHECKLIST SEBELUM PULL REQUEST

Sebelum membuat Pull Request, pastikan:

```
[ ] Kode sudah berjalan tanpa error
[ ] Sudah test manual semua fitur di Issue
[ ] Semua Acceptance Criteria terpenuhi
[ ] Tidak ada console.log atau dd() yang tertinggal
[ ] Tidak ada kredensial/password hardcoded
[ ] File .env tidak ikut di-commit
[ ] Pesan commit sudah menggunakan format yang benar
[ ] Deskripsi PR sudah mencantumkan "Closes #nomor"
[ ] Sudah assign reviewer
```

---

## 11. TROUBLESHOOTING UMUM

### Backend
```bash
# Error: Class not found
composer dump-autoload

# Error: Key not found
php artisan key:generate

# Error: Migration failed
php artisan migrate:fresh --seed

# Error: Permission denied storage
chmod -R 775 storage bootstrap/cache

# Clear semua cache
php artisan optimize:clear
```

### Frontend
```bash
# Error: Module not found
npm install

# Error: Port sudah dipakai
npm run dev -- --port 5174

# Clear cache Vite
rm -rf node_modules/.vite
npm run dev
```

### Git
```bash
# Undo commit terakhir (perubahan tetap ada)
git reset --soft HEAD~1

# Simpan perubahan sementara
git stash
git stash pop

# Lihat semua branch
git branch -a

# Paksa update branch local dengan remote
git fetch origin
git reset --hard origin/develop
```
