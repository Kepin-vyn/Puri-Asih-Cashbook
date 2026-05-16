/**
 * dateFormatter.js
 * Utility terpusat untuk format tanggal/waktu di seluruh aplikasi.
 * Menghindari "Invalid Date" dan "NaN jam NaN menit" dari perbedaan
 * format yang dikirim backend (PostgreSQL/Laravel).
 */

/**
 * Parse tanggal secara aman dari berbagai format.
 * Mengembalikan Date object atau null jika tidak valid.
 *
 * Handles:
 *   - ISO 8601 full:  "2026-05-10T08:30:00.000000Z"
 *   - Date only:      "2026-05-10"  → tambah T00:00:00 agar tidak timezone-shift
 *   - Laravel format: "10/05/2026"  → parse manual dd/mm/yyyy
 *   - null / undefined / ""         → return null
 */
const safeParseDate = (dateString) => {
  if (!dateString) return null;

  // Sudah berupa Date object
  if (dateString instanceof Date) {
    return isNaN(dateString.getTime()) ? null : dateString;
  }

  const str = String(dateString).trim();

  // Date-only string "YYYY-MM-DD" — tambah waktu agar tidak timezone-shift
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const d = new Date(`${str}T00:00:00`);
    return isNaN(d.getTime()) ? null : d;
  }

  // ISO 8601 dengan waktu — parse langsung
  let date = new Date(str);
  if (!isNaN(date.getTime())) return date;

  // Format dd/mm/yyyy (dari beberapa Laravel resource)
  const parts = str.split("/");
  if (parts.length === 3) {
    date = new Date(`${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}T00:00:00`);
    if (!isNaN(date.getTime())) return date;
  }

  return null;
};

/**
 * Format: "10 Mei 2026"
 */
export const formatDate = (dateString) => {
  const date = safeParseDate(dateString);
  if (!date) return "-";
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

/**
 * Format: "10 Mei 2026" dengan nama hari
 * Contoh: "Sabtu, 10 Mei 2026"
 */
export const formatDateLong = (dateString) => {
  const date = safeParseDate(dateString);
  if (!date) return "-";
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

/**
 * Format: "10 Mei 2026" (short month)
 * Contoh: "10 Mei 2026"
 */
export const formatDateShort = (dateString) => {
  const date = safeParseDate(dateString);
  if (!date) return "-";
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/**
 * Format: "10 Mei 2026, 08:30"
 */
export const formatDateTime = (dateString) => {
  const date = safeParseDate(dateString);
  if (!date) return "-";
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Format: "08:30"
 */
export const formatTime = (dateString) => {
  const date = safeParseDate(dateString);
  if (!date) return "-";
  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Format durasi antara dua waktu: "3 jam 25 menit"
 * Jika endString null, gunakan waktu sekarang.
 * INI YANG MEMPERBAIKI "NaN jam NaN menit" DI HANDOVER.
 */
export const formatDuration = (startString, endString = null) => {
  const start = safeParseDate(startString);
  if (!start) return "-";

  const end = endString ? safeParseDate(endString) : new Date();
  if (!end) return "-";

  const diffMs = end.getTime() - start.getTime();

  // Guard: harus angka positif yang valid
  if (isNaN(diffMs) || diffMs < 0) return "-";

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const hours        = Math.floor(totalMinutes / 60);
  const minutes      = totalMinutes % 60;

  if (hours === 0) return `${minutes} menit`;
  if (minutes === 0) return `${hours} jam`;
  return `${hours} jam ${minutes} menit`;
};

/**
 * Format waktu relatif: "5 menit yang lalu"
 */
export const formatTimeAgo = (dateString) => {
  const date = safeParseDate(dateString);
  if (!date) return "-";

  const diffMs = new Date().getTime() - date.getTime();
  if (isNaN(diffMs)) return "-";

  const mins  = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days  = Math.floor(diffMs / 86400000);

  if (mins < 1)   return "Baru saja";
  if (mins < 60)  return `${mins} menit yang lalu`;
  if (hours < 24) return `${hours} jam yang lalu`;
  if (days === 1) return "Kemarin";
  return `${days} hari yang lalu`;
};

/**
 * Format rupiah: "Rp 150.000"
 */
export const formatRupiah = (amount) => {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return "Rp 0";
  }
  return (
    "Rp " +
    Number(amount).toLocaleString("id-ID", { maximumFractionDigits: 0 })
  );
};
