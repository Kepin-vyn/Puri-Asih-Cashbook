import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Download, CheckCircle, Clock, AlertTriangle, ArrowRightLeft } from "lucide-react";
import toast from "react-hot-toast";
import shiftService from "../../services/shiftService";
import userService from "../../services/userService";
import authStore from "../../store/authStore";
import { formatTime, formatDateLong, formatDuration } from "../../utils/dateFormatter";
import { QUERY_KEYS } from "../../utils/queryKeys";
import { useShiftContext } from "../../context/ShiftContext";

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatRp = (v) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  })
    .format(v ?? 0)
    .replace("IDR", "Rp");

const SHIFT_LABEL = { pagi: "Pagi", siang: "Siang", malam: "Malam" };

// ── Skeleton ──────────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="bg-white rounded-2xl p-5 border border-gray-100 animate-pulse">
    <div className="h-3 bg-gray-200 rounded w-1/2 mb-3" />
    <div className="h-7 bg-gray-200 rounded w-3/4" />
  </div>
);

const SkeletonRow = () => (
  <tr>
    {[1, 2, 3, 4].map((i) => (
      <td key={i} className="px-4 py-3">
        <div className="h-4 bg-gray-200 rounded animate-pulse" />
      </td>
    ))}
  </tr>
);

// ── Summary Card ──────────────────────────────────────────────────────────────
const SummaryCard = ({ label, value, color, bold }) => {
  const colorMap = {
    green: "bg-emerald-50 border-emerald-200 text-emerald-700",
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    red: "bg-red-50 border-red-200 text-red-700",
    navy: "bg-indigo-600 border-indigo-600 text-white",
  };
  return (
    <div className={`rounded-2xl p-5 border ${colorMap[color]}`}>
      <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${color === "navy" ? "opacity-80" : "opacity-70"}`}>
        {label}
      </p>
      <p className={`text-xl ${bold ? "font-extrabold" : "font-bold"}`}>{formatRp(value)}</p>
    </div>
  );
};

// ── Tab Transaction Table ─────────────────────────────────────────────────────
const TransactionTab = ({ items = [], columns, emptyMsg, isLoading }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-gray-50 text-left">
          {columns.map((c) => (
            <th key={c.key} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
        ) : items.length === 0 ? (
          <tr>
            <td colSpan={columns.length} className="text-center py-10 text-gray-400 text-sm">
              {emptyMsg}
            </td>
          </tr>
        ) : (
          items.map((item, idx) => (
            <tr key={item.id ?? idx} className="hover:bg-gray-50 transition-colors">
              {columns.map((c) => (
                <td key={c.key} className={`px-4 py-3 ${c.className ?? "text-gray-700"}`}>
                  {c.render ? c.render(item) : item[c.key] ?? "-"}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

// ── Success Modal ─────────────────────────────────────────────────────────────
const SuccessModal = ({ shiftId, onDownload, onFinish, isDownloading }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle size={36} className="text-emerald-600" />
      </div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">Handover Berhasil!</h2>
      <p className="text-gray-500 text-sm mb-6">
        Shift Report sudah dibuat dan tersimpan. Silakan unduh laporan atau selesaikan sesi ini.
      </p>
      <div className="space-y-3">
        <button
          onClick={onDownload}
          disabled={isDownloading}
          className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-60"
        >
          <Download size={16} />
          {isDownloading ? "Mengunduh..." : "Download Shift Report PDF"}
        </button>
        <button
          onClick={onFinish}
          className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
        >
          Selesai (Logout)
        </button>
      </div>
    </div>
  </div>
);

// ── Main Page ─────────────────────────────────────────────────────────────────
const HandoverPage = () => {
  const user = authStore.getUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { markShiftEnded } = useShiftContext();

  const [activeTab, setActiveTab] = useState("kas");
  const [handoverTo, setHandoverTo] = useState("");
  const [handoverNote, setHandoverNote] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [completedShiftId, setCompletedShiftId] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // ── Fetch active shift ────────────────────────────────────────────────────
  const {
    data: shiftData,
    isLoading: shiftLoading,
    isError: shiftError,
  } = useQuery({
    queryKey: QUERY_KEYS.activeShift,
    queryFn: shiftService.getActive,
    retry: false,
  });
  const activeShift = shiftData?.data;

  // ── Fetch shift summary ───────────────────────────────────────────────────
  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ["shift-summary", activeShift?.id],
    queryFn: () => shiftService.getSummary(activeShift.id),
    enabled: !!activeShift?.id,
  });
  const summary = summaryData?.data ?? {};

  // ── Fetch shift report (detail transaksi) ─────────────────────────────────
  const { data: reportData, isLoading: reportLoading } = useQuery({
    queryKey: ["shift-report", activeShift?.id],
    queryFn: () => shiftService.getReport(activeShift.id),
    enabled: !!activeShift?.id,
  });
  const report = reportData?.data ?? {};

  // ── Fetch FO users for dropdown ───────────────────────────────────────────
  const { data: usersData } = useQuery({
    queryKey: ["fo-users"],
    queryFn: userService.getAllFo,
    retry: false,
  });
  const foUsers = (usersData?.data ?? []).filter((u) => u.id !== user?.id);

  // ── Pending expenses check ────────────────────────────────────────────────
  const pendingExpenses = (report?.expenses ?? []).filter((e) => e.status === "pending");
  const hasPending = pendingExpenses.length > 0;

  // ── Handover mutation ─────────────────────────────────────────────────────
  const handoverMutation = useMutation({
    mutationFn: ({ id, data }) => shiftService.handover(id, data),
    onSuccess: (res) => {
      const closedShiftId = res?.data?.shift?.id ?? activeShift?.id;
      setCompletedShiftId(closedShiftId);
      setShowSuccess(true);
      // Update context global agar semua halaman tahu shift sudah berakhir
      markShiftEnded();
      // Invalidate semua query active-shift di seluruh aplikasi
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.activeShift,
        exact: false,
        refetchType: "all",
      });
    },
    onError: (e) =>
      toast.error(e.response?.data?.message ?? "Handover gagal. Coba lagi."),
  });

  const handleHandover = () => {
    if (!handoverTo) {
      toast.error("Pilih staff FO penerima shift terlebih dahulu.");
      return;
    }
    if (hasPending) {
      toast.error("Selesaikan semua pengeluaran pending sebelum handover.");
      return;
    }
    handoverMutation.mutate({
      id: activeShift.id,
      data: {
        handover_to: Number(handoverTo),
        handover_note: handoverNote.trim() || undefined,
      },
    });
  };

  const handleDownloadPdf = async () => {
    if (!completedShiftId) return;
    setIsDownloading(true);
    try {
      const res = await shiftService.downloadReportPdf(completedShiftId);
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `shift-report-${completedShiftId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF berhasil diunduh!");
    } catch {
      toast.error("Gagal mengunduh PDF.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleFinish = () => {
    authStore.logout();
    navigate("/login", { replace: true });
  };

  // ── Tab config ────────────────────────────────────────────────────────────
  const TABS = [
    { key: "kas", label: "KAS" },
    { key: "expenses", label: "Pengeluaran" },
    { key: "reservations", label: "Reservasi" },
    { key: "deposits", label: "Deposit" },
  ];

  const KAS_COLS = [
    { key: "no", label: "No", render: (_, i) => i + 1 },
    { key: "guest_name", label: "Tamu" },
    {
      key: "transaction_type",
      label: "Jenis",
      render: (r) => {
        const map = { reservasi: "Reservasi", checkin: "Check-In", pelunasan: "Pelunasan" };
        return map[r.transaction_type] ?? r.transaction_type;
      },
    },
    {
      key: "amount",
      label: "Jumlah",
      className: "text-right font-semibold text-gray-800",
      render: (r) => formatRp(r.amount),
    },
  ];

  const EXPENSE_COLS = [
    { key: "no", label: "No", render: (_, i) => i + 1 },
    { key: "description", label: "Keterangan" },
    {
      key: "total_price",
      label: "Total",
      className: "text-right font-semibold text-gray-800",
      render: (r) => formatRp(r.total_price),
    },
    {
      key: "status",
      label: "Status",
      render: (r) => {
        const map = {
          auto_approved: "bg-emerald-100 text-emerald-700",
          pending: "bg-amber-100 text-amber-700",
          approved: "bg-blue-100 text-blue-700",
          rejected: "bg-red-100 text-red-700",
        };
        const labels = {
          auto_approved: "Auto Approved",
          pending: "Pending",
          approved: "Disetujui",
          rejected: "Ditolak",
        };
        return (
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[r.status] ?? "bg-gray-100 text-gray-500"}`}>
            {labels[r.status] ?? r.status}
          </span>
        );
      },
    },
  ];

  const RESERVATION_COLS = [
    { key: "no", label: "No", render: (_, i) => i + 1 },
    { key: "guest_name", label: "Tamu" },
    { key: "room_number", label: "Kamar" },
    {
      key: "amount",
      label: "Jumlah",
      className: "text-right font-semibold text-gray-800",
      render: (r) => formatRp(r.down_payment ?? r.amount ?? 0),
    },
  ];

  const DEPOSIT_COLS = [
    { key: "no", label: "No", render: (_, i) => i + 1 },
    { key: "guest_name", label: "Tamu" },
    { key: "room_number", label: "Kamar" },
    {
      key: "amount",
      label: "Jumlah",
      className: "text-right font-semibold text-gray-800",
      render: (r) => formatRp(r.amount),
    },
  ];

  const tabData = {
    kas: { items: report?.kas ?? [], columns: KAS_COLS, emptyMsg: "Tidak ada transaksi KAS di shift ini" },
    expenses: { items: report?.expenses ?? [], columns: EXPENSE_COLS, emptyMsg: "Tidak ada pengeluaran di shift ini" },
    reservations: { items: report?.reservations ?? [], columns: RESERVATION_COLS, emptyMsg: "Tidak ada reservasi di shift ini" },
    deposits: { items: report?.deposits ?? [], columns: DEPOSIT_COLS, emptyMsg: "Tidak ada deposit di shift ini" },
  };

  // ── No active shift ───────────────────────────────────────────────────────
  if (!shiftLoading && (shiftError || !activeShift)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
          <Clock size={32} className="text-amber-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Tidak Ada Shift Aktif</h2>
        <p className="text-gray-500 text-sm max-w-sm">
          Kamu belum memulai shift. Mulai shift terlebih dahulu dari halaman Dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">

      {/* ── Success Modal ── */}
      {showSuccess && (
        <SuccessModal
          shiftId={completedShiftId}
          onDownload={handleDownloadPdf}
          onFinish={handleFinish}
          isDownloading={isDownloading}
        />
      )}

      {/* ── Section 1: Header ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <ArrowRightLeft size={20} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Shift Handover</h1>
              <p className="text-sm text-gray-500 mt-0.5">{formatDateLong(activeShift?.started_at)}</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Shift Aktif
          </span>
        </div>

        {shiftLoading ? (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 font-medium">Staff FO</p>
              <p className="text-sm font-bold text-gray-800 mt-0.5 truncate">{activeShift?.user?.name ?? user?.name ?? "-"}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 font-medium">Tipe Shift</p>
              <p className="text-sm font-bold text-gray-800 mt-0.5">
                {SHIFT_LABEL[activeShift?.type] ?? activeShift?.type ?? "-"}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 font-medium">Jam Mulai</p>
              <p className="text-sm font-bold text-gray-800 mt-0.5">{formatTime(activeShift?.started_at)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 font-medium">Durasi</p>
              <p className="text-sm font-bold text-gray-800 mt-0.5">{formatDuration(activeShift?.started_at)}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Section 2: Ringkasan Shift ── */}
      <div>
        <h2 className="text-base font-bold text-gray-700 mb-3">Ringkasan Shift</h2>
        {summaryLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard label="Total Pemasukan KAS" value={summary.total_kas ?? 0} color="green" />
            <SummaryCard label="Total Pemasukan Reservasi" value={summary.total_reservations ?? 0} color="blue" />
            <SummaryCard label="Total Pengeluaran" value={summary.total_expenses ?? 0} color="red" />
            <SummaryCard label="Saldo Akhir Shift" value={summary.balance ?? 0} color="navy" bold />
          </div>
        )}
      </div>

      {/* ── Section 3: Detail Transaksi per Tab ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">Detail Transaksi Shift Ini</h2>
        </div>

        {/* Pending Expenses Warning */}
        {hasPending && (
          <div className="mx-5 mt-4 bg-red-50 border-2 border-red-400 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-700 text-sm">
                ⚠️ Masih ada {pendingExpenses.length} pengeluaran menunggu persetujuan Manager.
              </p>
              <p className="text-red-600 text-xs mt-1">
                Handover tidak bisa dilakukan sampai semua pengeluaran disetujui atau ditolak oleh Manager.
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-5 mt-4 gap-1">
          {TABS.map((tab) => {
            const count = (report?.[tab.key] ?? []).length;
            const isPendingTab = tab.key === "expenses" && hasPending;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-colors relative ${
                  activeTab === tab.key
                    ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-bold ${
                    isPendingTab ? "bg-red-500 text-white" : "bg-gray-200 text-gray-600"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="p-2">
          <TransactionTab
            items={tabData[activeTab]?.items}
            columns={tabData[activeTab]?.columns}
            emptyMsg={tabData[activeTab]?.emptyMsg}
            isLoading={reportLoading}
          />
        </div>
      </div>

      {/* ── Section 4: Form Handover ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-bold text-gray-800 mb-4">Serahkan Shift ke:</h2>

        <div className="space-y-4">
          {/* Dropdown FO */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
              Staff FO Penerima <span className="text-red-500">*</span>
            </label>
            <select
              value={handoverTo}
              onChange={(e) => setHandoverTo(e.target.value)}
              disabled={hasPending || handoverMutation.isPending}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              <option value="">-- Pilih Staff FO --</option>
              {foUsers.map((fo) => (
                <option key={fo.id} value={fo.id}>
                  {fo.name} {fo.shift ? `(Shift ${SHIFT_LABEL[fo.shift] ?? fo.shift})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Catatan */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
              Catatan Handover <span className="text-gray-400 font-normal">(opsional)</span>
            </label>
            <textarea
              value={handoverNote}
              onChange={(e) => setHandoverNote(e.target.value)}
              disabled={hasPending || handoverMutation.isPending}
              rows={3}
              placeholder="Contoh: Ada tamu kamar 205 yang belum check-out, deposit belum dikembalikan..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
            />
          </div>

          {/* Tombol Handover */}
          <button
            onClick={handleHandover}
            disabled={hasPending || !handoverTo || handoverMutation.isPending}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
            id="btn-konfirmasi-handover"
          >
            {handoverMutation.isPending ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Memproses Handover...
              </>
            ) : (
              <>
                <ArrowRightLeft size={16} />
                Konfirmasi Handover
              </>
            )}
          </button>

          {hasPending && (
            <p className="text-center text-xs text-red-500 font-medium">
              Tombol dinonaktifkan — selesaikan {pendingExpenses.length} pengeluaran pending terlebih dahulu.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default HandoverPage;
