import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
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
import api from "../../utils/axios";
import { formatTime } from "../../utils/dateFormatter";
import { QUERY_KEYS } from "../../utils/queryKeys";
import { useActiveShift } from "../../hooks/useActiveShift";

// ─── Helper: Format Rupiah ──────────────────────────────────────────────────
const formatRp = (val) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })
    .format(val ?? 0)
    .replace("IDR", "Rp");

// ─── Helper: Format relative time ──────────────────────────────────────────
const timeAgo = (dateStr) => {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "baru saja";
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  return `${Math.floor(diff / 86400)} hari lalu`;
};

// ─── Skeleton Component ─────────────────────────────────────────────────────
const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />
);

// ─── Summary Card ───────────────────────────────────────────────────────────
const SummaryCard = ({ icon: Icon, label, value, sublabel, iconBg, iconColor, action }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div className={`p-3 rounded-xl ${iconBg}`}>
        <Icon size={22} className={iconColor} />
      </div>
      {action}
    </div>
    <div>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
      <p className="text-sm font-medium text-gray-500 mt-0.5">{label}</p>
      {sublabel && <p className="text-xs text-gray-400 mt-0.5">{sublabel}</p>}
    </div>
  </div>
);

// ─── Notification Icon ──────────────────────────────────────────────────────
const NotifIcon = ({ type }) => {
  const map = {
    expense_pending: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50" },
    deposit_expiring: { icon: Clock, color: "text-red-500", bg: "bg-red-50" },
    default: { icon: Info, color: "text-blue-500", bg: "bg-blue-50" },
  };
  const { icon: Icon, color, bg } = map[type] ?? map.default;
  return (
    <div className={`p-2 rounded-full ${bg} flex-shrink-0`}>
      <Icon size={14} className={color} />
    </div>
  );
};

// ─── Main Dashboard FO ──────────────────────────────────────────────────────
const DashboardPage = () => {
  const user        = authStore.getUser();
  const queryClient = useQueryClient();
  const { hasActiveShift, activeShift } = useActiveShift();

  // ── DATA KRITIS: polling 2 menit ──────────────────────────────────────────

  // Fetch shift summary
  const {
    data: summaryData,
    isLoading: summaryLoading,
    isError: summaryError,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: QUERY_KEYS.foDashboard,
    queryFn:  dashboardService.getFoDashboard,
    staleTime:       1 * 60 * 1000, // kritis: fresh 1 menit
    refetchInterval: 2 * 60 * 1000, // polling setiap 2 menit
    retry: 1,
  });

  // Fetch notifications
  const { data: notifData, isLoading: notifLoading, refetch: refetchNotif } = useQuery({
    queryKey: ["notifications"],
    queryFn:  dashboardService.getNotifications,
    staleTime:       1 * 60 * 1000, // kritis: fresh 1 menit
    refetchInterval: 2 * 60 * 1000, // polling setiap 2 menit
  });

  // ── DATA TIDAK KRITIS: polling 10 menit ───────────────────────────────────

  // Fetch KAS & Expenses HANYA jika ada shift aktif (hindari 403 Forbidden)
  const today = new Date().toISOString().split("T")[0];

  const { data: kasData, isLoading: kasLoading } = useQuery({
    queryKey: ["kas-today", today],
    queryFn:  () => api.get(`/kas?date=${today}`).then((r) => r.data),
    staleTime:       5 * 60 * 1000,  // tidak kritis: fresh 5 menit
    refetchInterval: 10 * 60 * 1000, // polling setiap 10 menit
    enabled: hasActiveShift,
  });

  const { data: expenseData, isLoading: expenseLoading } = useQuery({
    queryKey: ["expense-today", today],
    queryFn:  () => api.get(`/expenses?date=${today}`).then((r) => r.data),
    staleTime:       5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
    enabled: hasActiveShift,
  });

  // Mark notification as read
  const markReadMutation = useMutation({
    mutationFn: dashboardService.markNotificationRead,
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const summary  = summaryData?.data ?? {};
  const notifs   = (notifData?.data ?? []).slice(0, 5);
  const totalRev = kasData?.meta?.total_amount ?? 0;
  const totalExp = expenseData?.meta?.totals?.total_valid ?? 0;
  const balance  = totalRev - totalExp;

  return (
    <div className="space-y-6">
      {/* ── Greeting ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Selamat datang, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date().toLocaleDateString("id-ID", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <button
          onClick={() => {
            refetchSummary();
            refetchNotif();
          }}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition-colors"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Tampilkan tombol hanya jika belum ada shift aktif */}
      {!summaryLoading && !hasActiveShift && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-5">
          <p className="font-semibold text-yellow-800 mb-1">
            Belum Ada Shift Aktif
          </p>
          <p className="text-sm text-yellow-700 mb-4">
            Lakukan absen masuk dengan tanda tangan digital terlebih dahulu untuk memulai shift.
          </p>
          <Link
            to="/fo/absensi"
            className="block w-full py-3 bg-blue-600 hover:bg-blue-700
                       text-white font-semibold rounded-lg transition-all text-center"
          >
            ✍️ Absen Masuk & Mulai Shift
          </Link>
        </div>
      )}

      {/* Tampilkan info shift jika sudah aktif */}
      {!summaryLoading && hasActiveShift && activeShift && (
        <div className="bg-green-50 border border-green-300 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <p className="font-semibold text-green-800">Shift Aktif</p>
          </div>
          <p className="text-sm text-green-700 mt-1">
            Dimulai: {formatTime(activeShift.started_at)} |
            Tipe: <span className="capitalize">{activeShift.type}</span>
          </p>
        </div>
      )}

      {/* ── Summary Cards ── */}
      {summaryLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      ) : !summaryError ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SummaryCard
            icon={CalendarCheck}
            label="Check-In Hari Ini"
            value={summary.check_in_count ?? 0}
            sublabel={`${summary.check_in_count ?? 0} tamu masuk`}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />
          <SummaryCard
            icon={CalendarX}
            label="Check-Out Hari Ini"
            value={summary.check_out_count ?? 0}
            sublabel={`${summary.check_out_count ?? 0} tamu selesai`}
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
            value={summary.reservation_count ?? 0}
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

      {/* ── Tamu Expected & Deposit Perlu Refund ── */}
      {!summaryLoading && !summaryError && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tamu Expected Hari Ini */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CalendarCheck size={18} className="text-blue-600" />
                <h2 className="font-semibold text-gray-800">Tamu Expected Hari Ini</h2>
                {(summary.expected_arrivals?.length ?? 0) > 0 && (
                  <span className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {summary.expected_arrivals.length}
                  </span>
                )}
              </div>
              <Link
                to="/fo/reservasi"
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                Lihat Semua <ArrowRight size={12} />
              </Link>
            </div>

            {(summary.expected_arrivals?.length ?? 0) === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <CalendarCheck size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Tidak ada tamu expected hari ini</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {summary.expected_arrivals.map((res) => (
                  <div
                    key={res.id}
                    className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-xl"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{res.guest_name}</p>
                      <p className="text-xs text-gray-500">
                        Kamar {res.room_number} • {res.invoice_number}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        DP: {formatRp(res.down_payment)} • Sisa: {formatRp(res.remaining_balance)}
                      </p>
                    </div>
                    <Link
                      to="/fo/reservasi"
                      className="flex-shrink-0 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
                    >
                      Check-In
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Deposit Perlu Refund */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-amber-600" />
                <h2 className="font-semibold text-gray-800">Deposit Perlu Refund</h2>
                {(summary.deposits_due_refund?.length ?? 0) > 0 && (
                  <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {summary.deposits_due_refund.length}
                  </span>
                )}
              </div>
              <Link
                to="/fo/deposit"
                className="text-xs text-amber-600 hover:text-amber-800 flex items-center gap-1"
              >
                Kelola <ArrowRight size={12} />
              </Link>
            </div>

            {(summary.deposits_due_refund?.length ?? 0) === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <ShieldCheck size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Tidak ada deposit perlu refund hari ini</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {summary.deposits_due_refund.map((dep) => (
                  <div
                    key={dep.id}
                    className="flex items-center justify-between p-3 bg-amber-50 border border-amber-100 rounded-xl"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{dep.guest_name}</p>
                      <p className="text-xs text-gray-500">
                        Kamar {dep.room_number} • Checkout hari ini
                      </p>
                      <p className="text-xs font-medium text-amber-700 mt-0.5">
                        Deposit: {formatRp(dep.amount)}
                      </p>
                    </div>
                    <Link
                      to="/fo/deposit"
                      className="flex-shrink-0 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-lg transition-colors"
                    >
                      Refund
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Bottom Grid: Notifications + Shift Cash ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Notifications ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell size={18} className="text-blue-600" />
              <h2 className="font-semibold text-gray-800">Notifications</h2>
              {notifs.filter((n) => !n.read_at).length > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {notifs.filter((n) => !n.read_at).length}
                </span>
              )}
            </div>
          </div>

          {notifLoading ? (
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
          ) : kasLoading || expenseLoading ? (
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
                  <span className="text-sm font-bold text-emerald-600">{formatRp(totalRev)}</span>
                </div>

                {/* Expenses */}
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <TrendingDown size={16} className="text-red-500" />
                    <span className="text-sm font-medium text-gray-700">Total Expenses</span>
                  </div>
                  <span className="text-sm font-bold text-red-500">{formatRp(totalExp)}</span>
                </div>

                {/* Balance */}
                <div className="flex items-center justify-between p-4 rounded-xl border-2 border-blue-200 bg-blue-50">
                  <span className="text-sm font-semibold text-blue-800">Final Balance</span>
                  <span
                    className={`text-base font-extrabold ${
                      balance >= 0 ? "text-blue-700" : "text-red-600"
                    }`}
                  >
                    {formatRp(balance)}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 mt-4">
                <Link
                  to="/fo/kas"
                  className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
                >
                  <Wallet size={14} />
                  View Details
                </Link>
                <Link
                  to="/fo/laporan"
                  className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  <FileText size={14} />
                  Shift Report
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
