import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { RefreshCw, Bell, Wallet, TrendingUp, TrendingDown, Plus, FileText, AlertTriangle, Clock, CalendarCheck, CalendarX, BookOpen } from "lucide-react";
import toast from "react-hot-toast";
import dashboardService from "../../services/dashboardService";
import shiftService from "../../services/shiftService";
import authStore from "../../store/authStore";
import api from "../../utils/axios";
import { QUERY_KEYS } from "../../utils/queryKeys";
import { useShiftContext } from "../../context/ShiftContext";
import { useActiveShift } from "../../hooks/useActiveShift";

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
  const navigate    = useNavigate();
  const { markShiftStarted } = useShiftContext();
  const { hasActiveShift, activeShift } = useActiveShift();

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const startShiftMutation = useMutation({
    mutationFn: shiftService.startShift,
    onSuccess: () => {
      markShiftStarted();
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activeShift, exact: false, refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.foDashboard });
      toast.success("Shift berhasil dimulai!");
      setShowConfirmModal(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Gagal memulai shift");
      setShowConfirmModal(false);
    },
  });

  const { data: summaryData, isLoading: summaryLoading, isError: summaryError, refetch: refetchSummary } = useQuery({
    queryKey: QUERY_KEYS.foDashboard,
    queryFn:  dashboardService.getFoSummary,
    staleTime: 1 * 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
    retry: 1,
  });

  const { data: notifData, isLoading: notifLoading, refetch: refetchNotif } = useQuery({
    queryKey: ["notifications"],
    queryFn:  dashboardService.getNotifications,
    staleTime: 1 * 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
  });

  const today = new Date().toISOString().split("T")[0];
  const { data: kasData, isLoading: kasLoading } = useQuery({
    queryKey: ["kas-today", today],
    queryFn:  () => api.get(`/kas?date=${today}`).then(r => r.data),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
    enabled: hasActiveShift,
  });
  const { data: expenseData, isLoading: expenseLoading } = useQuery({
    queryKey: ["expense-today", today],
    queryFn:  () => api.get(`/expenses?date=${today}`).then(r => r.data),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
    enabled: hasActiveShift,
  });

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
          onClick={() => { refetchSummary(); refetchNotif(); }}
          className="flex items-center gap-2 h-9 px-4 rounded-full border border-[#e5e5e5] text-[13px] font-[500] text-[#525252] hover:border-[#a3a3a3] hover:text-black transition-colors"
        >
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>

      {/* Banner: belum ada shift */}
      {!summaryLoading && !hasActiveShift && (
        <>
          <div className="border border-[#e5e5e5] rounded-xl p-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-[16px] font-[500] text-black mb-1">Belum Ada Shift Aktif</p>
              <p className="text-[14px] text-[#737373]">
                Lakukan absen terlebih dahulu untuk memulai shift kamu.
              </p>
            </div>
            <Link
              to="/fo/absensi?action=start_shift"
              className="flex-shrink-0 h-9 px-4 rounded-full bg-black text-white text-[14px] font-[500] hover:bg-[#090909] transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              ▶ Absen & Mulai Shift
            </Link>
          </div>
        </>
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

      {/* Summary cards */}
      {summaryLoading ? (
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : !summaryError ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: CalendarCheck, label: "Check-In Hari Ini", value: summary.check_in_count ?? 0 },
            { icon: CalendarX,     label: "Check-Out Hari Ini", value: summary.check_out_count ?? 0 },
            { icon: BookOpen,      label: "Reservasi Baru", value: summary.reservation_count ?? 0 },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="border border-[#e5e5e5] rounded-xl p-5">
              <p className="text-[12px] font-[500] text-[#737373] uppercase tracking-wide mb-2">{label}</p>
              <p className="text-[30px] font-[500] text-black" style={{ fontFamily: "var(--font-display)" }}>{value}</p>
            </div>
          ))}
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
          <div className="p-5">
            {!summaryLoading && !hasActiveShift ? (
              <div className="text-center py-8 text-[#a3a3a3] text-[14px]">
                Data kas tersedia setelah shift dimulai
              </div>
            ) : kasLoading || expenseLoading ? (
              <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-10" />)}</div>
            ) : (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2.5 border-b border-[#e5e5e5]">
                    <span className="text-[14px] text-[#525252]">Total Revenue</span>
                    <span className="text-[14px] font-[500] text-black">{formatRp(totalRev)}</span>
                  </div>
                  <div className="flex items-center justify-between py-2.5 border-b border-[#e5e5e5]">
                    <span className="text-[14px] text-[#525252]">Total Expenses</span>
                    <span className="text-[14px] font-[500] text-black">{formatRp(totalExp)}</span>
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
