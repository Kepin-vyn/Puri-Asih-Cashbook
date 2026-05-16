import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Download, Trash2, FileText, X, AlertTriangle, Eye,
  CheckCircle, Ban,
} from "lucide-react";
import toast from "react-hot-toast";
import depositService from "../../services/depositService";
import authStore from "../../store/authStore";
import api from "../../utils/axios";
import RupiahInput from "../../components/ui/RupiahInput";
import ConfirmModal from "../../components/ui/ConfirmModal";
import StatusBadge from "../../components/ui/StatusBadge";
import { formatDateShort } from "../../utils/dateFormatter";
import { QUERY_KEYS } from "../../utils/queryKeys";
import { useActiveShift } from "../../hooks/useActiveShift";

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatRp = (v) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", maximumFractionDigits: 0,
  }).format(v ?? 0).replace("IDR", "Rp");

const formatDate = (d) => formatDateShort(d);

const today = new Date().toISOString().split("T")[0];

// ── Constants ─────────────────────────────────────────────────────────────────
const PAYMENT_METHODS = [
  { value: "tunai",        label: "Cash" },
  { value: "transfer",     label: "Transfer Bank" },
  { value: "qris",         label: "QRIS" },
  { value: "kartu_kredit", label: "Kartu Kredit" },
];

const PAYMENT_STATUSES = [
  { value: "dp",    label: "Down Payment" },
  { value: "lunas", label: "Lunas" },
];

const STATUSES = [
  { value: "active",    label: "Active" },
  { value: "refunded",  label: "Refunded" },
  { value: "forfeited", label: "Forfeited" },
];

const ROOM_NUMBERS = [
  ...Array.from({ length: 10 }, (_, i) => `${101 + i}`),
  ...Array.from({ length: 10 }, (_, i) => `${201 + i}`),
  ...Array.from({ length: 10 }, (_, i) => `${301 + i}`),
];

// ── Empty form ────────────────────────────────────────────────────────────────
const emptyForm = () => ({
  date:           today,
  guest_name:     "",
  room_number:    "101",
  check_in_date:  today,
  check_out_date: "",
  amount:         0,
  payment_method: "tunai",
  payment_status: "dp",
  note:           "",
});

// ── Skeleton row ──────────────────────────────────────────────────────────────
const SkeletonRow = () => (
  <tr>
    {Array.from({ length: 9 }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <div className="h-4 bg-gray-200 rounded animate-pulse" />
      </td>
    ))}
  </tr>
);

// ── Main Page ─────────────────────────────────────────────────────────────────
const DepositPage = () => {
  const user        = authStore.getUser();
  const queryClient = useQueryClient();

  // ── UI state ─────────────────────────────────────────────────────────────
  const [modalOpen,       setModalOpen]       = useState(false);
  const [editItem,        setEditItem]        = useState(null);
  const [viewItem,        setViewItem]        = useState(null);
  const [refundTarget,    setRefundTarget]    = useState(null);
  const [forfeitTarget,   setForfeitTarget]   = useState(null);
  const [forfeitNote,     setForfeitNote]     = useState("");
  const [forfeitNoteErr,  setForfeitNoteErr]  = useState("");
  const [form,            setForm]            = useState(emptyForm());
  const [errors,          setErrors]          = useState({});
  const [exporting,       setExporting]       = useState(false);
  const [filterStatus,    setFilterStatus]    = useState("");
  const [page,            setPage]            = useState(1);

  // ── Active shift via centralized hook ────────────────────────────────────
  const { activeShift, hasNoShift } = useActiveShift();

  // ── Fetch expiring deposits ───────────────────────────────────────────────
  const { data: expiringData } = useQuery({
    queryKey: ["deposits-expiring"],
    queryFn:  depositService.getExpiring,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });
  const expiringDeposits = expiringData?.data ?? [];

  // ── Fetch deposits ────────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ["deposits", filterStatus, page],
    queryFn:  () => depositService.getAll({
      ...(filterStatus && { status: filterStatus }),
      page,
    }),
    retry: false,
  });

  const deposits = data?.data ?? [];
  const meta     = data?.meta ?? {};

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: depositService.create,
    onSuccess: () => {
      toast.success("Deposit berhasil dicatat!");
      queryClient.invalidateQueries({ queryKey: ["deposits"], exact: false });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.expiringDeposits });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.foDashboard });
      closeModal();
    },
    onError: (e) => toast.error(e.response?.data?.message ?? "Gagal menyimpan deposit."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => depositService.update(id, data),
    onSuccess: () => {
      toast.success("Deposit berhasil diperbarui!");
      queryClient.invalidateQueries({ queryKey: ["deposits"], exact: false });
      closeModal();
    },
    onError: (e) => toast.error(e.response?.data?.message ?? "Gagal memperbarui deposit."),
  });

  const refundMutation = useMutation({
    mutationFn: (id) => depositService.refund(id),
    onSuccess: () => {
      toast.success("Deposit berhasil dikembalikan!");
      queryClient.invalidateQueries({ queryKey: ["deposits"], exact: false });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.expiringDeposits });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.foDashboard });
      setRefundTarget(null);
    },
    onError: (e) => toast.error(e.response?.data?.message ?? "Gagal memproses refund."),
  });

  const forfeitMutation = useMutation({
    mutationFn: ({ id, note }) => depositService.forfeit(id, note),
    onSuccess: (response) => {
      const kasAmount = response?.data?.kas_created?.amount;
      const kasFormatted = kasAmount
        ? new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(kasAmount)
        : null;
      toast.success(
        kasFormatted
          ? `✅ Deposit dihanguskan. Rp ${kasFormatted} otomatis tercatat di Kas Harian.`
          : "✅ Deposit berhasil dihanguskan."
      );
      queryClient.invalidateQueries({ queryKey: ["deposits"], exact: false });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.expiringDeposits });
      queryClient.invalidateQueries({ queryKey: ["kas-list"], exact: false });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.foDashboard });
      setForfeitTarget(null);
      setForfeitNote("");
    },
    onError: (e) => toast.error(e.response?.data?.message ?? "Gagal menganguskan deposit."),
  });

  // ── Form helpers ──────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditItem(null);
    setForm(emptyForm());
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      date:           item.created_at?.split("T")[0] ?? today,
      guest_name:     item.guest_name ?? "",
      room_number:    item.room_number ?? "101",
      check_in_date:  item.check_in_date ?? today,
      check_out_date: item.check_out_date ?? "",
      amount:         Number(item.amount) ?? 0,
      payment_method: item.payment_method ?? "tunai",
      payment_status: item.payment_status ?? "dp",
      note:           item.note ?? "",
    });
    setErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditItem(null);
    setForm(emptyForm());
    setErrors({});
  };

  const setField = (key, val) => {
    setForm(p => ({ ...p, [key]: val }));
    if (errors[key]) setErrors(p => ({ ...p, [key]: "" }));
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.guest_name.trim())  e.guest_name    = "Nama tamu wajib diisi.";
    if (!form.check_in_date)      e.check_in_date  = "Tanggal check-in wajib diisi.";
    if (!form.check_out_date)     e.check_out_date = "Tanggal check-out wajib diisi.";
    if (form.check_out_date && form.check_in_date && form.check_out_date <= form.check_in_date) {
      e.check_out_date = "Check-out harus setelah check-in.";
    }
    if (!form.amount || form.amount <= 0) e.amount = "Jumlah deposit wajib diisi.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const payload = {
      guest_name:     form.guest_name,
      room_number:    form.room_number,
      check_in_date:  form.check_in_date,
      check_out_date: form.check_out_date,
      amount:         form.amount,
      payment_method: form.payment_method,
      payment_status: form.payment_status,
      note:           form.note,
    };
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  // ── Forfeit confirm ───────────────────────────────────────────────────────
  const handleForfeitConfirm = () => {
    if (!forfeitNote.trim()) {
      setForfeitNoteErr("Alasan hangus wajib diisi.");
      return;
    }
    forfeitMutation.mutate({ id: forfeitTarget.id, note: forfeitNote });
  };

  // ── Export PDF ────────────────────────────────────────────────────────────
  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await depositService.exportPdf({
        ...(filterStatus && { status: filterStatus }),
      });
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a   = document.createElement("a");
      a.href    = url;
      a.download = `laporan-deposit-${today}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF berhasil diunduh!");
    } catch {
      toast.error("Gagal mengunduh PDF.");
    } finally {
      setExporting(false);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;


  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── No Shift Warning ── */}
      {hasNoShift && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 flex items-start gap-3">
          <span className="text-amber-500 text-xl mt-0.5">⚠️</span>
          <div>
            <p className="font-semibold text-amber-800">Tidak ada shift aktif</p>
            <p className="text-amber-700 text-sm">
              Kamu belum memulai shift hari ini. Kembali ke{' '}
              <a href="/fo/dashboard" className="underline font-medium">
                Dashboard
              </a>{' '}
              dan klik "Mulai Shift Sekarang".
            </p>
          </div>
        </div>
      )}

      {/* ── Expiring Banner ── */}
      {expiringDeposits.length > 0 && (
        <div className="bg-gradient-to-r from-orange-400 to-amber-400 rounded-2xl p-5 flex items-center gap-4 shadow-md">
          <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <AlertTriangle size={22} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-white text-base">
              Perhatian! Ada {expiringDeposits.length} deposit yang akan jatuh tempo hari ini atau besok!
            </p>
            <p className="text-white/80 text-sm mt-0.5">
              Segera proses refund atau hanguskan deposit tersebut.
            </p>
          </div>
          <div className="flex-shrink-0">
            <span className="bg-white/20 text-white text-2xl font-extrabold px-4 py-2 rounded-xl">
              {expiringDeposits.length}
            </span>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Refundable Deposit</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date().toLocaleDateString("id-ID", {
              weekday: "long", year: "numeric", month: "long", day: "numeric",
            })}
            {activeShift && <span className="ml-2 text-blue-600">· Shift Aktif</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 text-sm text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 px-3 py-2.5 rounded-xl transition-colors disabled:opacity-50 shadow-sm"
            id="btn-export-deposit"
          >
            <Download size={15} />
            {exporting ? "Mengunduh..." : "Export PDF"}
          </button>
          <button
            onClick={() => !hasNoShift && openAdd()}
            disabled={hasNoShift}
            title={hasNoShift
              ? 'Mulai shift terlebih dahulu untuk menambah transaksi'
              : 'Tambah transaksi baru'}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              hasNoShift
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
            }`}
            id="btn-tambah-deposit"
          >
            <span className="text-lg">+</span>
            Tambah Transaksi
          </button>
        </div>
      </div>

      {/* ── Filter ── */}
      <div className="flex items-center gap-3">
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Semua Status</option>
          {STATUSES.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        {filterStatus && (
          <button
            onClick={() => { setFilterStatus(""); setPage(1); }}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Reset filter
          </button>
        )}
      </div>

      {/* ── Tabel ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Daftar Deposit</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                {["No", "Tamu", "Kamar", "Check-In", "Check-Out", "Jumlah", "Metode", "Status", "Aksi"].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : deposits.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-gray-400">
                    <FileText size={40} className="mx-auto mb-3 opacity-20" />
                    <p className="text-sm">Belum ada data deposit</p>
                    <button onClick={openAdd} className="mt-3 text-xs text-blue-600 underline">
                      Tambah deposit pertama
                    </button>
                  </td>
                </tr>
              ) : (
                deposits.map((dep, idx) => {
                  const isExpiring = dep.is_expiring_soon === true || dep.is_expiring_soon === 1;
                  const isActive   = dep.status === "active";
                  const methodLabel = PAYMENT_METHODS.find(m => m.value === dep.payment_method)?.label ?? dep.payment_method;

                  return (
                    <tr
                      key={dep.id}
                      className={`transition-colors ${
                        isExpiring && isActive
                          ? "bg-red-50 hover:bg-red-100"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <td className="px-4 py-3 text-gray-500">
                        {(page - 1) * (meta.per_page ?? 15) + idx + 1}
                        {isExpiring && isActive && (
                          <span className="ml-1.5 inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Jatuh tempo segera" />
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">
                        {dep.guest_name}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{dep.room_number}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {formatDate(dep.check_in_date)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={isExpiring && isActive ? "font-semibold text-red-600" : "text-gray-600"}>
                          {formatDate(dep.check_out_date)}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-800 whitespace-nowrap">
                        {formatRp(dep.amount)}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {methodLabel}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={dep.status} type="deposit" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {isActive ? (
                            <>
                              {/* Edit */}
                              <button
                                onClick={() => openEdit(dep)}
                                className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                              </button>
                              {/* Refund */}
                              <button
                                onClick={() => setRefundTarget(dep)}
                                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                                title="Refund"
                              >
                                <CheckCircle size={12} />
                                Refund
                              </button>
                              {/* Hanguskan */}
                              <button
                                onClick={() => { setForfeitTarget(dep); setForfeitNote(""); setForfeitNoteErr(""); }}
                                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                title="Hanguskan"
                              >
                                <Ban size={12} />
                                Hangus
                              </button>
                            </>
                          ) : (
                            /* View only untuk refunded/forfeited */
                            <button
                              onClick={() => setViewItem(dep)}
                              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                              title="Lihat Detail"
                            >
                              <Eye size={12} />
                              View
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {meta.last_page > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Menampilkan {deposits.length} dari {meta.total} data
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-40 transition-colors"
              >
                ← Prev
              </button>
              {Array.from({ length: meta.last_page }, (_, i) => i + 1)
                .filter(p => p === 1 || p === meta.last_page || Math.abs(p - page) <= 1)
                .reduce((acc, p, i, arr) => {
                  if (i > 0 && p - arr[i - 1] > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === "..." ? (
                    <span key={`e-${i}`} className="px-2 text-gray-400 text-xs">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                        page === p ? "bg-blue-600 text-white" : "text-gray-600 bg-gray-100 hover:bg-gray-200"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
              <button
                onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
                disabled={page === meta.last_page}
                className="px-3 py-1.5 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-40 transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>


      {/* ── Modal Tambah / Edit ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={!isSaving ? closeModal : undefined}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="font-bold text-gray-800">
                {editItem ? "Edit Deposit" : "Tambah Deposit"}
              </h3>
              <button onClick={closeModal} disabled={isSaving} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">

              {/* Date + Shift */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Tanggal</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setField("date", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Shift</label>
                  <input
                    type="text"
                    value={activeShift ? `Shift #${activeShift.id} (${activeShift.type ?? ""})` : "Tidak ada shift aktif"}
                    readOnly
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Staff */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Staff</label>
                <input
                  type="text"
                  value={user?.name ?? ""}
                  readOnly
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500 cursor-not-allowed"
                />
              </div>

              {/* Guest Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">
                  Nama Tamu <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.guest_name}
                  onChange={(e) => setField("guest_name", e.target.value)}
                  placeholder="Masukkan nama tamu"
                  className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.guest_name ? "border-red-400 bg-red-50" : "border-gray-200"
                  }`}
                />
                {errors.guest_name && <p className="text-xs text-red-500 mt-1">{errors.guest_name}</p>}
              </div>

              {/* Room Number */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">No. Kamar</label>
                <select
                  value={form.room_number}
                  onChange={(e) => setField("room_number", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {ROOM_NUMBERS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {/* Check-In + Check-Out */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">
                    Check-In Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.check_in_date}
                    onChange={(e) => setField("check_in_date", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.check_in_date ? "border-red-400 bg-red-50" : "border-gray-200"
                    }`}
                  />
                  {errors.check_in_date && <p className="text-xs text-red-500 mt-1">{errors.check_in_date}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">
                    Check-Out Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.check_out_date}
                    min={form.check_in_date || today}
                    onChange={(e) => setField("check_out_date", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.check_out_date ? "border-red-400 bg-red-50" : "border-gray-200"
                    }`}
                  />
                  {errors.check_out_date && <p className="text-xs text-red-500 mt-1">{errors.check_out_date}</p>}
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">
                  Jumlah Deposit <span className="text-red-500">*</span>
                </label>
                <RupiahInput
                  id="deposit-amount"
                  value={form.amount}
                  onChange={(v) => setField("amount", v)}
                  className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.amount ? "border-red-400 bg-red-50" : "border-gray-200"
                  }`}
                />
                {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
              </div>

              {/* Payment Option + Payment Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Payment Option</label>
                  <select
                    value={form.payment_method}
                    onChange={(e) => setField("payment_method", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Payment Status</label>
                  <select
                    value={form.payment_status}
                    onChange={(e) => setField("payment_status", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {PAYMENT_STATUSES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Remarks</label>
                <textarea
                  value={form.note}
                  onChange={(e) => setField("note", e.target.value)}
                  rows={2}
                  placeholder="Catatan tambahan (opsional)"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSaving}
                  className="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  id="btn-save-deposit"
                >
                  {isSaving ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Menyimpan...</>
                  ) : (
                    editItem ? "Simpan Perubahan" : "Save Deposit"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal View Detail ── */}
      {viewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setViewItem(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-800">Detail Deposit</h3>
              <button onClick={() => setViewItem(null)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              {[
                ["Tamu",        viewItem.guest_name],
                ["Kamar",       viewItem.room_number],
                ["Check-In",    formatDate(viewItem.check_in_date)],
                ["Check-Out",   formatDate(viewItem.check_out_date)],
                ["Jumlah",      formatRp(viewItem.amount)],
                ["Metode",      PAYMENT_METHODS.find(m => m.value === viewItem.payment_method)?.label ?? viewItem.payment_method],
                ["Catatan",     viewItem.note || "-"],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-medium text-gray-800 text-right max-w-[60%]">{val}</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-1">
                <span className="text-gray-500">Status</span>
                <StatusBadge status={viewItem.status} type="deposit" />
              </div>
              {viewItem.note && viewItem.status === "forfeited" && (
                <div className="mt-2 p-3 bg-red-50 rounded-xl text-xs text-red-700">
                  <span className="font-semibold">Alasan hangus: </span>{viewItem.note}
                </div>
              )}
            </div>
            <button
              onClick={() => setViewItem(null)}
              className="mt-5 w-full py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* ── Modal Konfirmasi Refund ── */}
      <ConfirmModal
        isOpen={!!refundTarget}
        title="Konfirmasi Refund"
        message={`Konfirmasi pengembalian deposit sebesar ${formatRp(refundTarget?.amount)} kepada ${refundTarget?.guest_name}?`}
        confirmText="Konfirmasi Refund"
        confirmVariant="primary"
        isLoading={refundMutation.isPending}
        onConfirm={() => refundMutation.mutate(refundTarget.id)}
        onCancel={() => setRefundTarget(null)}
      />

      {/* ── Modal Konfirmasi Hanguskan ── */}
      {forfeitTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={!forfeitMutation.isPending ? () => { setForfeitTarget(null); setForfeitNote(""); } : undefined}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800">Konfirmasi Hanguskan Deposit</h3>
              <button
                onClick={() => { setForfeitTarget(null); setForfeitNote(""); }}
                disabled={forfeitMutation.isPending}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl mb-4">
              <Ban size={18} className="text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">
                Deposit sebesar <span className="font-bold">{formatRp(forfeitTarget.amount)}</span> atas nama{" "}
                <span className="font-bold">{forfeitTarget.guest_name}</span> akan dihanguskan.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">
                Alasan Hangus <span className="text-red-500">*</span>
              </label>
              <textarea
                value={forfeitNote}
                onChange={(e) => { setForfeitNote(e.target.value); setForfeitNoteErr(""); }}
                rows={3}
                placeholder="Contoh: Kerusakan fasilitas kamar, biaya tambahan, dll."
                className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none ${
                  forfeitNoteErr ? "border-red-400 bg-red-50" : "border-gray-200"
                }`}
              />
              {forfeitNoteErr && <p className="text-xs text-red-500 mt-1">{forfeitNoteErr}</p>}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setForfeitTarget(null); setForfeitNote(""); }}
                disabled={forfeitMutation.isPending}
                className="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleForfeitConfirm}
                disabled={forfeitMutation.isPending}
                className="flex-1 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {forfeitMutation.isPending ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Memproses...</>
                ) : (
                  "Konfirmasi Hanguskan"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DepositPage;
