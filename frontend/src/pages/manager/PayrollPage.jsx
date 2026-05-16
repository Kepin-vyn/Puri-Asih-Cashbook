
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, Users, X, Settings, Calculator } from "lucide-react";
import toast from "react-hot-toast";
import payrollService from "../../services/payrollService";
import attendanceService from "../../services/attendanceService";
import MonthYearPicker from "../../components/ui/MonthYearPicker";
import ConfirmModal from "../../components/ui/ConfirmModal";
import RupiahInput from "../../components/ui/RupiahInput";
import { formatDateShort, formatTime } from "../../utils/dateFormatter";

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatRp = (v) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  })
    .format(v ?? 0)
    .replace("IDR", "Rp");

const formatDate = (iso) => formatDateShort(iso);

const now = new Date();
const defaultPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

const SHIFT_LABEL = { pagi: "Pagi", siang: "Siang", malam: "Malam" };

// ── Status Badge ──────────────────────────────────────────────────────────────
const AttStatusBadge = ({ status }) => {
  const map = {
    hadir: "bg-emerald-100 text-emerald-700",
    libur: "bg-blue-100 text-blue-700",
    sakit: "bg-amber-100 text-amber-700",
    izin:  "bg-gray-100 text-gray-600",
    alpha: "bg-red-100 text-red-700",
  };
  const labels = { hadir: "Hadir", libur: "Libur", sakit: "Sakit", izin: "Izin", alpha: "Alpha" };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[status] ?? "bg-gray-100 text-gray-500"}`}>
      {labels[status] ?? status ?? "-"}
    </span>
  );
};

// ── Skeleton Row ──────────────────────────────────────────────────────────────
const SkeletonRow = ({ cols = 8 }) => (
  <tr>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <div className="h-4 bg-gray-200 rounded animate-pulse" />
      </td>
    ))}
  </tr>
);

// ── Staff Detail Modal ────────────────────────────────────────────────────────
const StaffDetailModal = ({ staff, month, onClose }) => {
  const queryClient = useQueryClient();
  const [confirmTarget, setConfirmTarget] = useState(null); // { id, newStatus }

  const { data, isLoading } = useQuery({
    queryKey: ["staff-attendance-monthly", staff?.id, month],
    queryFn:  () => attendanceService.getMonthly(staff.id, {
      month: month.split("-")[1],
      year:  month.split("-")[0],
    }),
    enabled: !!staff?.id,
  });
  const records = data?.data ?? [];

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => attendanceService.updateStatus(id, status),
    onSuccess: () => {
      toast.success("Status absensi berhasil diperbarui.");
      queryClient.invalidateQueries({ queryKey: ["staff-attendance-monthly"] });
      queryClient.invalidateQueries({ queryKey: ["payroll-monthly"] });
      setConfirmTarget(null);
    },
    onError: (e) => toast.error(e.response?.data?.message ?? "Gagal memperbarui status."),
  });

  const summary = records.reduce(
    (acc, r) => { acc[r.status] = (acc[r.status] ?? 0) + 1; return acc; },
    { hadir: 0, libur: 0, sakit: 0, izin: 0, alpha: 0 }
  );

  const STATUS_OPTIONS = ["hadir", "libur", "sakit", "izin", "alpha"];

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[85vh] flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-100 flex-shrink-0">
            <div>
              <h3 className="font-bold text-gray-800">Detail Absensi — {staff?.name}</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                Shift {SHIFT_LABEL[staff?.shift] ?? staff?.shift ?? "-"} ·{" "}
                {month.split("-")[1]}/{month.split("-")[0]}
              </p>
            </div>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    {["Tanggal", "Jam Masuk", "Jam Pulang", "Status", "Ubah Status"].map((h) => (
                      <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={5} />)
                  ) : records.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-gray-400 text-sm">
                        Tidak ada data absensi
                      </td>
                    </tr>
                  ) : (
                    records.map((rec) => (
                      <tr key={rec.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{formatDate(rec.actual_start ?? rec.created_at)}</td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatTime(rec.actual_start)}</td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatTime(rec.actual_end)}</td>
                        <td className="px-4 py-3"><AttStatusBadge status={rec.status} /></td>
                        <td className="px-4 py-3">
                          <select
                            value={rec.status ?? ""}
                            onChange={(e) => setConfirmTarget({ id: rec.id, newStatus: e.target.value, oldStatus: rec.status })}
                            className="px-2 py-1 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            {!isLoading && records.length > 0 && (
              <div className="px-5 py-4 border-t border-gray-100 flex flex-wrap gap-4 text-sm">
                <span className="text-gray-500">Hadir: <strong className="text-emerald-700">{summary.hadir}</strong></span>
                <span className="text-gray-500">Libur: <strong className="text-blue-700">{summary.libur}/6</strong></span>
                <span className="text-gray-500">Sakit: <strong className="text-amber-700">{summary.sakit}</strong></span>
                <span className="text-gray-500">Izin: <strong className="text-gray-700">{summary.izin}</strong></span>
                <span className="text-gray-500">Alpha: <strong className="text-red-700">{summary.alpha}</strong></span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirm update status */}
      <ConfirmModal
        isOpen={!!confirmTarget}
        title="Ubah Status Absensi"
        message={`Ubah status dari "${confirmTarget?.oldStatus}" menjadi "${confirmTarget?.newStatus}"?`}
        confirmText="Ya, Ubah"
        isLoading={updateMutation.isPending}
        onConfirm={() => updateMutation.mutate({ id: confirmTarget.id, status: confirmTarget.newStatus })}
        onCancel={() => setConfirmTarget(null)}
      />
    </>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const PayrollPage = () => {
  const queryClient = useQueryClient();

  const [period,        setPeriod]        = useState(defaultPeriod);
  const [dailyRate,     setDailyRate]     = useState(0);
  const [rateChanged,   setRateChanged]   = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [exporting,     setExporting]     = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  const [yearStr, monthStr] = period.split("-");

  // ── Fetch settings (gaji harian terkini) ─────────────────────────────────
  const { data: settingsData } = useQuery({
    queryKey: ["payroll-settings"],
    queryFn:  payrollService.getSettings,
    retry: false,
  });
  const currentDailyRate = Number(settingsData?.data?.daily_rate ?? 0);

  // ── Fetch payroll data ────────────────────────────────────────────────────
  const { data: payrollData, isLoading } = useQuery({
    queryKey: ["payroll-monthly", period],
    queryFn:  () => payrollService.getMonthly(period),
    retry: false,
  });

  const payrolls  = payrollData?.data?.payrolls ?? payrollData?.data ?? [];
  const totalGaji = payrolls.reduce((s, p) => s + Number(p.total_salary ?? 0), 0);

  // ── Calculate mutation ────────────────────────────────────────────────────
  const calculateMutation = useMutation({
    mutationFn: () => payrollService.calculate(period),
    onSuccess: () => {
      toast.success("Gaji berhasil dihitung!");
      queryClient.invalidateQueries({ queryKey: ["payroll-monthly"] });
    },
    onError: (e) => toast.error(e.response?.data?.message ?? "Gagal menghitung gaji."),
  });

  // ── Set daily rate mutation ───────────────────────────────────────────────
  const setRateMutation = useMutation({
    mutationFn: (rate) => payrollService.setDailyRate(rate),
    onSuccess: () => {
      toast.success("Gaji harian berhasil disimpan!");
      // Invalidate settings agar "Saat ini: Rp X" langsung berubah
      queryClient.invalidateQueries({ queryKey: ["payroll-settings"] });
      queryClient.invalidateQueries({ queryKey: ["payroll-monthly"] });
      setRateChanged(false);
    },
    onError: (e) => toast.error(e.response?.data?.message ?? "Gagal menyimpan gaji harian."),
  });

  // ── Export PDF ────────────────────────────────────────────────────────────
  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await payrollService.exportPdf(period);
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a   = document.createElement("a");
      a.href    = url;
      a.download = `rekap-gaji-${period}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF berhasil diunduh!");
    } catch {
      toast.error("Gagal mengunduh PDF.");
    } finally {
      setExporting(false);
    }
  };

  // ── Download slip ─────────────────────────────────────────────────────────
  const handleDownloadSlip = async (payroll) => {
    setDownloadingId(payroll.user_id ?? payroll.id);
    try {
      const res = await payrollService.downloadSlip(period, payroll.user_id ?? payroll.id);
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a   = document.createElement("a");
      a.href    = url;
      a.download = `slip-gaji-${payroll.user?.name ?? payroll.user_id}-${period}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Slip gaji berhasil diunduh!");
    } catch {
      toast.error("Gagal mengunduh slip gaji.");
    } finally {
      setDownloadingId(null);
    }
  };

  const MONTHS_LABEL = [
    "Januari","Februari","Maret","April","Mei","Juni",
    "Juli","Agustus","September","Oktober","November","Desember",
  ];
  const periodLabel = `${MONTHS_LABEL[Number(monthStr) - 1]} ${yearStr}`;

  return (
    <div className="space-y-6 pb-10">

      {/* ── Staff Detail Modal ── */}
      {selectedStaff && (
        <StaffDetailModal
          staff={selectedStaff}
          month={period}
          onClose={() => setSelectedStaff(null)}
        />
      )}

      {/* ── Section 1: Header & Filter ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Penggajian Staff</h1>
            <p className="text-sm text-gray-500 mt-0.5">Rekap gaji bulanan seluruh staff FO</p>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            {/* Period picker */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Periode</label>
              <MonthYearPicker value={period} onChange={setPeriod} />
            </div>

            {/* Buttons */}
            <button
              onClick={() => calculateMutation.mutate()}
              disabled={calculateMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-60"
              id="btn-hitung-gaji"
            >
              <Calculator size={14} />
              {calculateMutation.isPending ? "Menghitung..." : "Hitung Gaji"}
            </button>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-50"
            >
              <Download size={14} />
              {exporting ? "Mengunduh..." : "Export Rekap PDF"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Section 2: Setting Gaji Harian ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
              <Settings size={16} className="text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-700">Setting Gaji Harian</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Saat ini: <span className="font-semibold text-gray-700">{formatRp(currentDailyRate)}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-48">
              <RupiahInput
                id="daily-rate-input"
                value={dailyRate}
                onChange={(v) => {
                  setDailyRate(v);
                  setRateChanged(v !== savedRate);
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => setRateMutation.mutate(dailyRate)}
              disabled={!rateChanged || setRateMutation.isPending}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {setRateMutation.isPending ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Section 3: Tabel Rekap Gaji ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-800">
            Rekap Gaji — {periodLabel}
          </h2>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Users size={13} />
            {payrolls.length} staff
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                {["No", "Nama", "Shift", "Hadir", "Libur", "Alpha", "Gaji", "Aksi"].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={8} />)
              ) : payrolls.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-14 text-gray-400 text-sm">
                    Belum ada data gaji untuk {periodLabel}. Klik "Hitung Gaji" untuk memulai.
                  </td>
                </tr>
              ) : (
                payrolls.map((p, idx) => {
                  // Hadir = total_present (termasuk libur yang dihitung)
                  const hadir  = p.total_present ?? 0;
                  const libur  = p.total_leave   ?? 0;
                  // Alpha = sakit + izin + alpha (tidak dihitung sebagai hari kerja)
                  const alpha  = p.total_absent  ?? 0;
                  const isDownloading = downloadingId === (p.user_id ?? p.id);

                  return (
                    <tr key={p.id ?? p.user_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedStaff(p.user ?? { id: p.user_id, name: p.user_name, shift: p.shift })}
                          className="font-semibold text-blue-600 hover:underline text-left"
                        >
                          {p.user?.name ?? p.user_name ?? "-"}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                          {SHIFT_LABEL[p.user?.shift ?? p.shift] ?? "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-emerald-700">{hadir}</td>
                      <td className="px-4 py-3 text-center text-blue-700">
                        <span className="font-semibold">{libur}</span>
                        <span className="text-gray-400">/6</span>
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-red-600">{alpha}</td>
                      <td className="px-4 py-3 font-bold text-gray-800 whitespace-nowrap">
                        {formatRp(p.total_salary)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDownloadSlip(p)}
                          disabled={isDownloading}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
                        >
                          <Download size={12} />
                          {isDownloading ? "..." : "Slip"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Total row */}
            {!isLoading && payrolls.length > 0 && (
              <tfoot>
                <tr className="bg-gray-50 font-bold">
                  <td colSpan={6} className="px-4 py-3 text-sm text-gray-700">
                    Total Gaji Semua Staff
                  </td>
                  <td className="px-4 py-3 text-base font-extrabold text-gray-900 whitespace-nowrap">
                    {formatRp(totalGaji)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default PayrollPage;
