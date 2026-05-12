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
} from "lucide-react";
import dashboardService from "../../services/dashboardService";
import authStore from "../../store/authStore";
import api from "../../utils/axios";

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

  // Fetch shift summary — penentu apakah ada shift aktif
  const {
    data: summaryData,
    isLoading: summaryLoading,
    isError: summaryError,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: ["fo-shift-summary"],
    queryFn:  dashboardService.getFoSummary,
    refetchInterval: 5 * 60 * 1000,
    retry: 1,
  });

  // Ada shift aktif hanya jika summary berhasil dan data ada
  const hasActiveShift = !summaryError && summaryData?.data != null;

  // Fetch notifications
  const { data: notifData, isLoading: notifLoading, refetch: refetchNotif } = useQuery({
    queryKey: ["notifications"],
    queryFn:  dashboardService.getNotifications,
    refetchInterval: 5 * 60 * 1000,
  });

  // Fetch KAS & Expenses HANYA jika ada shift aktif (hindari 403 Forbidden)
  const today = new Date().toISOString().split("T")[0];

  const { data: kasData, isLoading: kasLoading } = useQuery({
    queryKey: ["kas-today", today],
    queryFn:  () => api.get(`/kas?date=${today}`).then((r) => r.data),
    refetchInterval: 5 * 60 * 1000,
    enabled: hasActiveShift,
  });

  const { data: expenseData, isLoading: expenseLoading } = useQuery({
    queryKey: ["expense-today", today],
    queryFn:  () => api.get(`/expenses?date=${today}`).then((r) => r.data),
    refetchInterval: 5 * 60 * 1000,
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

      {/* ── Banner: Belum Ada Shift Aktif ── */}
      {!summaryLoading && summaryError && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
          <div className="p-2.5 bg-amber-100 rounded-xl flex-shrink-0">
            <AlertTriangle size={20} className="text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-amber-800">Belum ada shift aktif</p>
            <p className="text-sm text-amber-700 mt-0.5">
              Mulai shift terlebih dahulu untuk mencatat transaksi dan melihat data hari ini.
            </p>
          </div>
          <Link
            to="/fo/handover"
            className="flex-shrink-0 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-xl transition-colors"
          >
            Mulai Shift
          </Link>
        </div>
      )}

      {/* ── Summary Cards ── */}
      {summaryLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      ) : !summaryError ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
