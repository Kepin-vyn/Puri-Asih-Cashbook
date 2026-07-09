import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import {
  CalendarCheck,
  CalendarX,
  BookOpen,
  Bell,
  Wallet,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Plus,
  FileText,
  Info,
  AlertTriangle,
  Clock,
  Users,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import dashboardService from "../../services/dashboardService";
import authStore from "../../store/authStore";
import { formatTime } from "../../utils/dateFormatter";
import { QUERY_KEYS } from "../../utils/queryKeys";
import { useShiftContext } from "../../context/ShiftContext";

const formatRp = (val) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })
    .format(val ?? 0).replace("IDR", "Rp");

const timeAgo = (dateStr) => {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "baru saja";
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  return `${Math.floor(diff / 86400)} hari lalu`;
};

const formatTime = (iso) => {
  if (!iso) return "-";
  return new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
};

const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse bg-[#fafafa] rounded-xl ${className}`} />
);

const DashboardPage = () => {
  const user        = authStore.getUser();
  const queryClient = useQueryClient();
  const { markShiftStarted } = useShiftContext();

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Mutation: mulai shift langsung dari dashboard
  const startShiftMutation = useMutation({
    mutationFn: shiftService.startShift,
    onSuccess: () => {
      markShiftStarted();
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.foDashboard });
      toast.success("✅ Shift berhasil dimulai!");
      setShowConfirmModal(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Gagal memulai shift");
      setShowConfirmModal(false);
    },
  });

  // ── DATA: 1 request ke /dashboard/fo ────────────────────────────────────

  const {
    data: summaryData,
    isLoading: summaryLoading,
    isError: summaryError,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: QUERY_KEYS.foDashboard,
    queryFn:  dashboardService.getFoDashboard,
    staleTime:       1 * 60 * 1000, // fresh 1 menit
    refetchInterval: 2 * 60 * 1000, // polling setiap 2 menit
    retry: 1,
  });

  // Mark notification as read
  const markReadMutation = useMutation({
    mutationFn: dashboardService.markNotificationRead,
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.foDashboard }),
  });

  const dashboard      = summaryData?.data ?? {};
  const hasActiveShift = !!dashboard.has_active_shift;
  const activeShift    = dashboard.active_shift ?? null;
  const summary        = dashboard.shift_summary ?? {};
  const notifs         = (dashboard.notifications ?? []).slice(0, 5);
  const totalRev       = summary.kas?.total ?? 0;
  const totalExp       = summary.expenses?.total ?? 0;
  const balance        = totalRev - totalExp;

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[30px] font-[500] text-black leading-[1.2]"
              style={{ fontFamily: "var(--font-display)" }}>
            Selamat datang, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-[14px] text-[#737373] mt-1">
            {new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <button
          onClick={() => refetchSummary()}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition-colors"
        >
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>

      {/* Banner: belum ada shift */}
      {!summaryLoading && !hasActiveShift && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-5">
          <p className="font-semibold text-yellow-800 mb-1">
            Belum Ada Shift Aktif
          </p>
          <p className="text-sm text-yellow-700 mb-4">
            Lakukan absen terlebih dahulu untuk memulai shift kamu.
          </p>
          <Link
            to="/fo/absensi?action=start_shift"
            className="flex items-center justify-center w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all"
          >
            ▶ Absen & Mulai Shift Sekarang
          </Link>
        </div>
      )}

      {/* Banner: shift aktif */}
      {!summaryLoading && hasActiveShift && activeShift && (
        <div className="border border-[#e5e5e5] rounded-xl p-4 flex items-center gap-3">
          <div className="w-2 h-2 bg-black rounded-full animate-pulse" />
          <div>
            <p className="text-[14px] font-[500] text-black">Shift Aktif</p>
            <p className="text-[13px] text-[#737373]">
              Dimulai: {formatTime(activeShift.started_at)} · Tipe: <span className="capitalize">{activeShift.type}</span>
            </p>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi dihapus — alur sekarang via halaman Attendance */}

      {/* ── Summary Cards ── */}
      {summaryLoading ? (
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : !summaryError ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SummaryCard
            icon={CalendarCheck}
            label="Check-In Hari Ini"
            value={dashboard.check_in_count ?? 0}
            sublabel={`${dashboard.check_in_count ?? 0} tamu masuk`}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />
          <SummaryCard
            icon={CalendarX}
            label="Check-Out Hari Ini"
            value={dashboard.check_out_count ?? 0}
            sublabel={`${dashboard.check_out_count ?? 0} tamu selesai`}
            iconBg="bg-purple-50"
            iconColor="text-purple-600"
          />
          <SummaryCard
            icon={Users}
            label="In-House"
            value={summary.in_house_count ?? 0}
            sublabel="Tamu sedang menginap"
            iconBg="bg-orange-50"
            iconColor="text-orange-600"
          />
          <SummaryCard
            icon={BookOpen}
            label="Reservasi Baru"
            value={dashboard.reservation_count ?? 0}
            sublabel="Hari ini"
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
            action={
              <Link
                to="/fo/reservasi"
                className="p-1.5 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors"
                title="Tambah Reservasi"
              >
                <Plus size={14} className="text-emerald-600" />
              </Link>
            }
          />
        </div>
      ) : null}

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notifications */}
        <div className="border border-[#e5e5e5] rounded-xl">
          <div className="flex items-center justify-between p-5 border-b border-[#e5e5e5]">
            <div className="flex items-center gap-2">
              <Bell size={15} className="text-[#737373]" />
              <h2 className="text-[16px] font-[500] text-black">Notifications</h2>
              {notifs.filter(n => !n.read_at).length > 0 && (
                <span className="bg-black text-white text-[10px] font-[600] px-1.5 py-0.5 rounded-full">
                  {notifs.filter(n => !n.read_at).length}
                </span>
              )}
            </div>
          </div>
          <div className="p-3">
            {notifLoading ? (
              <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12" />)}</div>
            ) : notifs.length === 0 ? (
              <div className="text-center py-8 text-[#a3a3a3] text-[14px]">Tidak ada notifikasi</div>
            ) : (
              <div className="space-y-1">
                {notifs.map(notif => (
                  <button
                    key={notif.id}
                    onClick={() => !notif.read_at && markReadMutation.mutate(notif.id)}
                    className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-colors ${
                      notif.read_at ? "hover:bg-[#fafafa]" : "bg-[#fafafa] hover:bg-[#f5f5f5]"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-[500] text-black truncate">{notif.title}</p>
                      <p className="text-[13px] text-[#737373] truncate">{notif.message}</p>
                    </div>
                    <span className="text-[12px] text-[#a3a3a3] flex-shrink-0">{timeAgo(notif.created_at)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Shift Cash */}
        <div className="border border-[#e5e5e5] rounded-xl">
          <div className="flex items-center gap-2 p-5 border-b border-[#e5e5e5]">
            <Wallet size={15} className="text-[#737373]" />
            <h2 className="text-[16px] font-[500] text-black">Shift Cash</h2>
          </div>

          {summaryLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14" />
              ))}
            </div>
          ) : notifs.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Bell size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Tidak ada notifikasi</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifs.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => !notif.read_at && markReadMutation.mutate(notif.id)}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-colors ${
                    notif.read_at
                      ? "bg-gray-50 hover:bg-gray-100"
                      : "bg-blue-50 hover:bg-blue-100 border border-blue-100"
                  }`}
                >
                  <NotifIcon type={notif.type} />
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium truncate ${
                        notif.read_at ? "text-gray-600" : "text-gray-800"
                      }`}
                    >
                      {notif.title}
                    </p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{notif.message}</p>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0 mt-0.5">
                    {timeAgo(notif.created_at)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Shift Cash ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Wallet size={18} className="text-blue-600" />
            <h2 className="font-semibold text-gray-800">Shift Cash</h2>
          </div>

          {/* Tidak ada shift aktif */}
          {!summaryLoading && !hasActiveShift ? (
            <div className="text-center py-8 text-gray-400">
              <Wallet size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Data kas tersedia setelah shift dimulai</p>
            </div>
          ) : summaryLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {/* Revenue */}
                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-emerald-600" />
                    <span className="text-sm font-medium text-gray-700">Total Revenue</span>
                  </div>
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-[14px] font-[500] text-black">Final Balance</span>
                    <span className={`text-[16px] font-[600] ${balance >= 0 ? "text-black" : "text-[#b91c1c]"}`}>
                      {formatRp(balance)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Link to="/fo/kas" className="flex-1 h-9 rounded-full border border-[#e5e5e5] text-[13px] font-[500] text-[#525252] hover:border-[#a3a3a3] hover:text-black transition-colors flex items-center justify-center gap-1.5">
                    <Wallet size={13} /> View Details
                  </Link>
                  <Link to="/fo/laporan" className="flex-1 h-9 rounded-full border border-[#e5e5e5] text-[13px] font-[500] text-[#525252] hover:border-[#a3a3a3] hover:text-black transition-colors flex items-center justify-center gap-1.5">
                    <FileText size={13} /> Shift Report
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
