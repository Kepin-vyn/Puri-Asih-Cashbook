
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock, CheckCircle, LogOut, Calendar } from "lucide-react";
import toast from "react-hot-toast";
import attendanceService from "../../services/attendanceService";
import authStore from "../../store/authStore";
import SignatureCanvas from "../../components/ui/SignatureCanvas";
import MonthYearPicker from "../../components/ui/MonthYearPicker";

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatTime = (iso) =>
  iso ? new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-";

const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
    : "-";

const getDuration = (start, end) => {
  if (!start || !end) return "-";
  const diff = Math.floor((new Date(end) - new Date(start)) / 1000);
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  return `${h} jam ${m} menit`;
};

const now = new Date();
const defaultPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

const SHIFT_SCHEDULE = {
  pagi:   { label: "Pagi",   time: "08:00 - 15:00" },
  siang:  { label: "Siang",  time: "15:00 - 22:00" },
  malam:  { label: "Malam",  time: "22:00 - 08:00" },
};

// ── Status Badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status, isLate }) => {
  const map = {
    hadir:  { cls: "bg-emerald-100 text-emerald-700", label: "Hadir" },
    libur:  { cls: "bg-blue-100 text-blue-700",       label: "Libur" },
    sakit:  { cls: "bg-amber-100 text-amber-700",     label: "Sakit" },
    izin:   { cls: "bg-gray-100 text-gray-600",       label: "Izin" },
    alpha:  { cls: "bg-red-100 text-red-700",         label: "Alpha" },
  };
  const s = map[status] ?? { cls: "bg-gray-100 text-gray-500", label: status ?? "-" };
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${s.cls}`}>{s.label}</span>
      {isLate && (
        <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-red-500 text-white">TERLAMBAT</span>
      )}
    </span>
  );
};

// ── Skeleton Row ──────────────────────────────────────────────────────────────
const SkeletonRow = () => (
  <tr>
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <td key={i} className="px-4 py-3">
        <div className="h-4 bg-gray-200 rounded animate-pulse" />
      </td>
    ))}
  </tr>
);

// ── Main Page ─────────────────────────────────────────────────────────────────
const AttendancePage = () => {
  const user        = authStore.getUser();
  const queryClient = useQueryClient();

  const [currentTime,   setCurrentTime]   = useState(new Date());
  const [signature,     setSignature]     = useState(null);
  const [period,        setPeriod]        = useState(defaultPeriod);
  const signatureRef = useRef(null);

  // ── Real-time clock (update setiap detik) ─────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [yearStr, monthStr] = period.split("-");

  // ── Fetch today's attendance ──────────────────────────────────────────────
  const today = new Date().toISOString().split("T")[0];
  const { data: todayData, isLoading: todayLoading } = useQuery({
    queryKey: ["attendance-today", today],
    queryFn:  () => attendanceService.getAll({ date: today }),
    retry: false,
  });
  const todayRecord = todayData?.data?.[0] ?? null;

  // ── Fetch monthly attendance ──────────────────────────────────────────────
  const { data: monthlyData, isLoading: monthlyLoading } = useQuery({
    queryKey: ["attendance-monthly", yearStr, monthStr, user?.id],
    queryFn:  () => attendanceService.getAll({ month: monthStr, year: yearStr }),
    retry: false,
  });
  const records = monthlyData?.data ?? [];

  // ── Summary counts ────────────────────────────────────────────────────────
  const summary = records.reduce(
    (acc, r) => {
      acc[r.status] = (acc[r.status] ?? 0) + 1;
      return acc;
    },
    { hadir: 0, libur: 0, sakit: 0, izin: 0, alpha: 0 }
  );

  // ── Checkin mutation ──────────────────────────────────────────────────────
  const checkinMutation = useMutation({
    mutationFn: attendanceService.checkin,
    onSuccess: () => {
      toast.success("Absen masuk berhasil!");
      queryClient.invalidateQueries({ queryKey: ["attendance-today"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-monthly"] });
      setSignature(null);
    },
    onError: (e) => toast.error(e.response?.data?.message ?? "Gagal absen masuk."),
  });

  // ── Checkout mutation ─────────────────────────────────────────────────────
  const checkoutMutation = useMutation({
    mutationFn: attendanceService.checkout,
    onSuccess: () => {
      toast.success("Absen pulang berhasil!");
      queryClient.invalidateQueries({ queryKey: ["attendance-today"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-monthly"] });
    },
    onError: (e) => toast.error(e.response?.data?.message ?? "Gagal absen pulang."),
  });

  const handleCheckin = () => {
    if (!signature) {
      toast.error("Tanda tangan wajib diisi sebelum absen masuk.");
      return;
    }
    checkinMutation.mutate({ digital_signature: signature });
  };

  const handleCheckout = () => {
    checkoutMutation.mutate();
  };

  // ── Shift info ────────────────────────────────────────────────────────────
  const userShift   = user?.shift ?? "pagi";
  const shiftInfo   = SHIFT_SCHEDULE[userShift] ?? SHIFT_SCHEDULE.pagi;

  // ── Determine condition ───────────────────────────────────────────────────
  const hasCheckin  = !!todayRecord?.actual_start;
  const hasCheckout = !!todayRecord?.actual_end;

  // ── Late info ─────────────────────────────────────────────────────────────
  const lateMinutes = (() => {
    if (!todayRecord?.actual_start || !todayRecord?.is_late) return 0;
    // Hitung selisih dari jam mulai shift
    const [shiftH] = shiftInfo.time.split(" - ")[0].split(":").map(Number);
    const checkinTime = new Date(todayRecord.actual_start);
    const shiftStart  = new Date(checkinTime);
    shiftStart.setHours(shiftH, 0, 0, 0);
    return Math.max(0, Math.floor((checkinTime - shiftStart) / 60000));
  })();

  return (
    <div className="space-y-6">

      {/* ── Section 1: Status Absensi Hari Ini ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Absensi</h1>

        {todayLoading ? (
          <div className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
        ) : !hasCheckin ? (
          /* ── KONDISI A: Belum absen ── */
          <div className="bg-white rounded-2xl border-2 border-amber-300 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-gray-800">Absen Masuk</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Shift {shiftInfo.label} · {shiftInfo.time}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-extrabold text-gray-800 tabular-nums">
                  {currentTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {currentTime.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}
                </p>
              </div>
            </div>

            {/* Signature */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                Tanda Tangan Digital <span className="text-red-500">*</span>
              </label>
              <SignatureCanvas
                ref={signatureRef}
                onSignatureChange={setSignature}
                disabled={checkinMutation.isPending}
                height={150}
              />
              {!signature && (
                <p className="text-xs text-amber-600 mt-1.5 font-medium">
                  ⚠ Tanda tangan wajib diisi sebelum absen masuk
                </p>
              )}
            </div>

            <button
              onClick={handleCheckin}
              disabled={!signature || checkinMutation.isPending}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
              id="btn-absen-masuk"
            >
              {checkinMutation.isPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  ✓ Absen Masuk
                </>
              )}
            </button>
          </div>

        ) : !hasCheckout ? (
          /* ── KONDISI B: Sudah masuk, belum checkout ── */
          <div className="bg-white rounded-2xl border-2 border-emerald-400 shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle size={20} className="text-emerald-600" />
                  <h2 className="font-bold text-emerald-700">Sudah Absen Masuk</h2>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>
                    <span className="font-medium text-gray-700">Jam Masuk:</span>{" "}
                    {formatTime(todayRecord.actual_start)}
                  </p>
                  <p>
                    <span className="font-medium text-gray-700">Status:</span>{" "}
                    {todayRecord.is_late ? (
                      <span className="text-red-600 font-semibold">
                        Terlambat {lateMinutes > 0 ? `${lateMinutes} menit` : ""}
                      </span>
                    ) : (
                      <span className="text-emerald-600 font-semibold">Tepat Waktu</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-extrabold text-gray-800 tabular-nums">
                  {currentTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </p>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={checkoutMutation.isPending}
              className="mt-5 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
              id="btn-absen-pulang"
            >
              {checkoutMutation.isPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <LogOut size={16} />
                  Absen Pulang
                </>
              )}
            </button>
          </div>

        ) : (
          /* ── KONDISI C: Sudah checkout ── */
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle size={20} className="text-gray-500" />
              <h2 className="font-bold text-gray-600">Shift Selesai</h2>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 font-medium">Jam Masuk</p>
                <p className="text-base font-bold text-gray-800 mt-0.5">{formatTime(todayRecord.actual_start)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 font-medium">Jam Pulang</p>
                <p className="text-base font-bold text-gray-800 mt-0.5">{formatTime(todayRecord.actual_end)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 font-medium">Durasi Kerja</p>
                <p className="text-base font-bold text-gray-800 mt-0.5">
                  {getDuration(todayRecord.actual_start, todayRecord.actual_end)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Section 3: Filter Bulan ── */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-700">Riwayat Absensi</h2>
        <div className="flex items-center gap-2">
          <Calendar size={15} className="text-gray-400" />
          <MonthYearPicker value={period} onChange={setPeriod} />
        </div>
      </div>

      {/* ── Section 2: Riwayat Absensi ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                {["Tanggal", "Shift", "Jam Masuk", "Jam Pulang", "Status", "Keterangan"].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {monthlyLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400 text-sm">
                    Tidak ada data absensi untuk periode ini
                  </td>
                </tr>
              ) : (
                records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{formatDate(rec.actual_start ?? rec.created_at)}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                        {SHIFT_SCHEDULE[rec.shift_type]?.label ?? rec.shift_type ?? "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatTime(rec.actual_start)}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatTime(rec.actual_end)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={rec.status} isLate={rec.is_late} />
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-[160px] truncate" title={rec.note ?? ""}>
                      {rec.note ?? "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        {!monthlyLoading && records.length > 0 && (
          <div className="px-5 py-4 border-t border-gray-100 flex flex-wrap gap-4 text-sm">
            <span className="text-gray-500">
              Hadir: <strong className="text-emerald-700">{summary.hadir}</strong>
            </span>
            <span className="text-gray-500">
              Libur: <strong className="text-blue-700">{summary.libur}/6</strong>
            </span>
            <span className="text-gray-500">
              Sakit: <strong className="text-amber-700">{summary.sakit}</strong>
            </span>
            <span className="text-gray-500">
              Izin: <strong className="text-gray-700">{summary.izin}</strong>
            </span>
            <span className="text-gray-500">
              Alpha: <strong className="text-red-700">{summary.alpha}</strong>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendancePage;
