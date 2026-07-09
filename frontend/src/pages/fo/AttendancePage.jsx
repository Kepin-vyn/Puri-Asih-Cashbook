
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Clock, CheckCircle, LogOut, Calendar } from "lucide-react";
import toast from "react-hot-toast";
import attendanceService from "../../services/attendanceService";
import shiftService from "../../services/shiftService";
import authStore from "../../store/authStore";
import SignatureCanvas from "../../components/ui/SignatureCanvas";
import MonthYearPicker from "../../components/ui/MonthYearPicker";
import { formatTime, formatDateShort, formatDuration } from "../../utils/dateFormatter";
import { QUERY_KEYS } from "../../utils/queryKeys";

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatDate = (iso) => formatDateShort(iso);

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
    libur:  { cls: "bg-blue-100 text-black",       label: "Libur" },
    sakit:  { cls: "bg-amber-100 text-amber-700",     label: "Sakit" },
    izin:   { cls: "bg-[#fafafa] text-[#525252]",       label: "Izin" },
    alpha:  { cls: "bg-red-100 text-red-700",         label: "Alpha" },
  };
  const s = map[status] ?? { cls: "bg-[#fafafa] text-[#737373]", label: status ?? "-" };
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
        <div className="h-4 bg-[#e5e5e5] rounded animate-pulse" />
      </td>
    ))}
  </tr>
);

// ── Main Page ─────────────────────────────────────────────────────────────────
const AttendancePage = () => {
  const user        = authStore.getUser();
  const queryClient = useQueryClient();
  const [searchParams]  = useSearchParams();
  const navigate        = useNavigate();

  // Deteksi apakah datang dari "Mulai Shift" di Dashboard
  const isStartShiftFlow = searchParams.get("action") === "start_shift";

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

  // ── Fetch today's shift ───────────────────────────────────────────────────
  const { data: todayShiftData } = useQuery({
    queryKey: ["today-shift"],
    queryFn: attendanceService.getTodayShift,
  });

  const todayShift = todayShiftData?.data?.shift_type;
  const shiftLabel = todayShiftData?.data?.shift_label;
  const shiftHours = todayShiftData?.data?.shift_hours;
  const isOff = todayShiftData?.data?.is_off;
  const isWithinWindow = todayShiftData?.data?.is_within_window ?? true;
  const serverDate = todayShiftData?.data?.server_date;

  // ── Fetch today's attendance (gunakan server_date dari backend) ───────────
  const today = serverDate ?? new Date().toISOString().split("T")[0];
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
    onSuccess: async () => {
      toast.success("Absen masuk berhasil!");
      queryClient.invalidateQueries({ queryKey: ["attendance-today"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-monthly"] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.foDashboard });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activeShift, exact: false, refetchType: "all" });
      setSignature(null);

      // Jika datang dari alur "Mulai Shift", otomatis start shift lalu redirect
      if (isStartShiftFlow) {
        try {
          await shiftService.startShift();
          toast.success("Shift berhasil dimulai!");
          queryClient.invalidateQueries({ queryKey: ["fo-shift-summary"] });
          queryClient.invalidateQueries({ queryKey: ["active-shift"] });
        } catch (e) {
          toast.error(e.response?.data?.message ?? "Absen berhasil, tapi gagal memulai shift.");
        }
        navigate("/fo/dashboard", { replace: true });
      }
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

  const handleCheckin = async () => {
    // Validasi: tanda tangan wajib ada
    if (!signature) {
      toast.error('Tanda tangan wajib diisi sebelum absen masuk');
      return;
    }

    // Validasi: shift harus terdeteksi
    if (!todayShift || todayShift === 'off') {
      toast.error('Shift hari ini tidak terdeteksi. Hubungi Manager.');
      return;
    }

    // Kirim payload yang LENGKAP
    await checkinMutation.mutateAsync({
      shift_type:        todayShift,      // field yang wajib ada
      digital_signature: signature,       // base64 dari canvas
    });
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
        <h1 className="text-2xl font-bold text-black mb-4">Absensi</h1>

        {/* Banner info jika dari alur Mulai Shift */}
        {isStartShiftFlow && !hasCheckin && (
          <div className="bg-blue-50 border border-blue-300 rounded-xl p-4 mb-4 flex items-start gap-3">
            <span className="text-blue-500 text-xl flex-shrink-0">ℹ️</span>
            <div>
              <p className="font-semibold text-blue-800">Absen untuk Memulai Shift</p>
              <p className="text-sm text-blue-600 mt-0.5">
                Setelah tanda tangan dan absen masuk tersimpan, shift kamu akan otomatis dimulai.
              </p>
            </div>
          </div>
        )}

        {todayLoading ? (
          <div className="h-48 bg-[#fafafa] rounded-xl animate-pulse" />
        ) : !hasCheckin ? (
          /* ── KONDISI A: Belum absen ── */
          <div className="space-y-4">
            {/* Info Shift Hari Ini */}
            <div className="bg-[#fafafa] border border-[#e5e5e5] rounded-xl p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl">
                  {todayShift === 'pagi' ? '🌅'
                   : todayShift === 'siang' ? '🌤'
                   : todayShift === 'malam' ? '🌙'
                   : '📅'}
                </div>
                <div>
                  <p className="font-semibold text-blue-800">
                    Shift Hari Ini: {shiftLabel || 'Tidak Diketahui'}
                  </p>
                  <p className="text-sm text-black">
                    Jam: {shiftHours || '-'}
                  </p>
                </div>
              </div>
            </div>

            {isOff ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                <p className="text-4xl mb-2">🎉</p>
                <p className="font-semibold text-green-800">Hari Ini Libur!</p>
                <p className="text-sm text-green-600">
                  Kamu tidak perlu absen hari ini.
                </p>
              </div>
            ) : (
              <div className={`bg-white rounded-xl border-2  p-6 space-y-4 ${
                isWithinWindow ? 'border-amber-300' : 'border-red-300'
              }`}>

            {/* Peringatan jika di luar jam shift */}
            {!isWithinWindow && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                <span className="text-xl">⏰</span>
                <div>
                  <p className="font-semibold text-red-800 text-sm">Di Luar Jam Shift</p>
                  <p className="text-xs text-red-600 mt-0.5">
                    Shift Anda: <strong>{shiftLabel}</strong> ({shiftHours}).
                    Check-in hanya bisa dilakukan pada jam shift Anda.
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-black">Absen Masuk</h2>
                <p className="text-sm text-[#737373] mt-0.5">
                  Shift {shiftInfo.label} · {shiftInfo.time}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-extrabold text-black tabular-nums">
                  {currentTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </p>
                <p className="text-xs text-[#a3a3a3] mt-0.5">
                  {currentTime.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}
                </p>
              </div>
            </div>

            {/* Signature */}
            <div>
              <label className="block text-xs font-semibold text-[#525252] mb-2 uppercase tracking-wide">
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
              disabled={!signature || checkinMutation.isPending || !isWithinWindow}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 "
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
          )}
        </div>

        ) : !hasCheckout ? (
          /* ── KONDISI B: Sudah masuk, belum checkout ── */
          <div className="bg-white rounded-xl border-2 border-emerald-400  p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle size={20} className="text-emerald-600" />
                  <h2 className="font-bold text-emerald-700">Sudah Absen Masuk</h2>
                </div>
                <div className="space-y-1 text-sm text-[#525252]">
                  <p>
                    <span className="font-medium text-[#525252]">Jam Masuk:</span>{" "}
                    {formatTime(todayRecord.actual_start)}
                  </p>
                  <p>
                    <span className="font-medium text-[#525252]">Status:</span>{" "}
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
                <p className="text-2xl font-extrabold text-black tabular-nums">
                  {currentTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </p>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={checkoutMutation.isPending}
              className="mt-5 w-full py-3 bg-black hover:bg-[#090909] text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 "
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
          <div className="bg-white rounded-xl border-2 border-[#e5e5e5]  p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle size={20} className="text-[#737373]" />
              <h2 className="font-bold text-[#525252]">Shift Selesai</h2>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="bg-[#fafafa] rounded-xl p-3">
                <p className="text-xs text-[#737373] font-medium">Jam Masuk</p>
                <p className="text-base font-bold text-black mt-0.5">{formatTime(todayRecord.actual_start)}</p>
              </div>
              <div className="bg-[#fafafa] rounded-xl p-3">
                <p className="text-xs text-[#737373] font-medium">Jam Pulang</p>
                <p className="text-base font-bold text-black mt-0.5">{formatTime(todayRecord.actual_end)}</p>
              </div>
              <div className="bg-[#fafafa] rounded-xl p-3">
                <p className="text-xs text-[#737373] font-medium">Durasi Kerja</p>
                <p className="text-base font-bold text-black mt-0.5">
                  {formatDuration(todayRecord.actual_start, todayRecord.actual_end)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Section 3: Filter Bulan ── */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-[#525252]">Riwayat Absensi</h2>
        <div className="flex items-center gap-2">
          <Calendar size={15} className="text-[#a3a3a3]" />
          <MonthYearPicker value={period} onChange={setPeriod} />
        </div>
      </div>

      {/* ── Section 2: Riwayat Absensi ── */}
      <div className="bg-white rounded-xl border border-[#e5e5e5] ">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#fafafa] text-left">
                {["Tanggal", "Shift", "Jam Masuk", "Jam Pulang", "Status", "Keterangan"].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold text-[#737373] uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e5e5]">
              {monthlyLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[#a3a3a3] text-sm">
                    Tidak ada data absensi untuk periode ini
                  </td>
                </tr>
              ) : (
                records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-[#fafafa] transition-colors">
                    <td className="px-4 py-3 text-[#525252] whitespace-nowrap">{formatDate(rec.actual_start ?? rec.created_at)}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-black">
                        {SHIFT_SCHEDULE[rec.shift_type]?.label ?? rec.shift_type ?? "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#525252] whitespace-nowrap">{formatTime(rec.actual_start)}</td>
                    <td className="px-4 py-3 text-[#525252] whitespace-nowrap">{formatTime(rec.actual_end)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={rec.status} isLate={rec.is_late} />
                    </td>
                    <td className="px-4 py-3 text-[#737373] text-xs max-w-[160px] truncate" title={rec.note ?? ""}>
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
          <div className="px-5 py-4 border-t border-[#e5e5e5] flex flex-wrap gap-4 text-sm">
            <span className="text-[#737373]">
              Hadir: <strong className="text-emerald-700">{summary.hadir}</strong>
            </span>
            <span className="text-[#737373]">
              Libur: <strong className="text-black">{summary.libur}/6</strong>
            </span>
            <span className="text-[#737373]">
              Sakit: <strong className="text-amber-700">{summary.sakit}</strong>
            </span>
            <span className="text-[#737373]">
              Izin: <strong className="text-[#525252]">{summary.izin}</strong>
            </span>
            <span className="text-[#737373]">
              Alpha: <strong className="text-red-700">{summary.alpha}</strong>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendancePage;
