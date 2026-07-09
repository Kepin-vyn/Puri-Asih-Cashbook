import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Download, Pencil, Trash2, FileText, X, Upload, Image,
} from "lucide-react";
import toast from "react-hot-toast";
import expenseService from "../../services/expenseService";
import authStore from "../../store/authStore";
import RupiahInput from "../../components/ui/RupiahInput";
import ConfirmModal from "../../components/ui/ConfirmModal";
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
const AUTO_APPROVE_LIMIT = 500000;

// ── Constants ─────────────────────────────────────────────────────────────────
const PAYMENT_METHODS = [
  { value: "tunai",        label: "Cash" },
  { value: "transfer",     label: "Transfer Bank" },
  { value: "qris",         label: "QRIS" },
  { value: "kartu_kredit", label: "Kartu Kredit" },
];

// ── Status badge config (extended labels for expense) ─────────────────────────
const EXPENSE_STATUS_LABELS = {
  auto_approved: "Auto Approved",
  pending:       "Menunggu Persetujuan",
  approved:      "Disetujui Manager",
  rejected:      "Ditolak",
};

const ExpenseStatusBadge = ({ status, rejectionReason }) => {
  const map = {
    auto_approved: "bg-emerald-100 text-emerald-700 ring-emerald-200",
    pending:       "bg-amber-100 text-amber-700 ring-amber-200",
    approved:      "bg-blue-100 text-black ring-[#e5e5e5]",
    rejected:      "bg-red-100 text-red-700 ring-red-200",
  };
  const cls   = map[status] ?? "bg-[#fafafa] text-[#737373] ring-gray-200";
  const label = EXPENSE_STATUS_LABELS[status] ?? status;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold  cursor-default ${cls}`}
      title={status === "rejected" && rejectionReason ? `Alasan: ${rejectionReason}` : undefined}
    >
      {label}
      {status === "rejected" && rejectionReason && (
        <span className="ml-1 opacity-60">ⓘ</span>
      )}
    </span>
  );
};

// ── Skeleton row ──────────────────────────────────────────────────────────────
const SkeletonRow = () => (
  <tr>
    {Array.from({ length: 9 }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <div className="h-4 bg-[#e5e5e5] rounded animate-pulse" />
      </td>
    ))}
  </tr>
);

// ── Empty form ────────────────────────────────────────────────────────────────
const emptyForm = () => ({
  description:    "",
  price_per_item: 0,
  quantity:       1,
  payment_method: "tunai",
});

// ── Main Page ─────────────────────────────────────────────────────────────────
const ExpensesPage = () => {
  const user        = authStore.getUser();
  const queryClient = useQueryClient();
  const fileRef     = useRef(null);

  // ── UI state ─────────────────────────────────────────────────────────────
  const [modalOpen,    setModalOpen]    = useState(false);
  const [editItem,     setEditItem]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form,         setForm]         = useState(emptyForm());
  const [errors,       setErrors]       = useState({});
  const [receiptFile,  setReceiptFile]  = useState(null);
  const [uploading,    setUploading]    = useState(false);
  const [exporting,    setExporting]    = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [page,         setPage]         = useState(1);

  // ── Derived ───────────────────────────────────────────────────────────────
  const totalPrice   = (form.price_per_item ?? 0) * (form.quantity ?? 1);
  const isAutoApprove = totalPrice <= AUTO_APPROVE_LIMIT && totalPrice > 0;

  // ── Active shift via centralized hook ────────────────────────────────────
  const { activeShift, hasNoShift } = useActiveShift();

  // ── Fetch expenses ────────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ["expenses", filterStatus, page],
    queryFn:  () => expenseService.getAll({
      ...(filterStatus && { status: filterStatus }),
      page,
    }),
    retry: false,
  });

  const expenses = data?.data ?? [];
  const meta     = data?.meta ?? {};

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: expenseService.create,
    onSuccess: async (res) => {
      // Upload struk jika ada file
      if (receiptFile && res?.data?.id) {
        setUploading(true);
        try {
          await expenseService.uploadReceipt(res.data.id, receiptFile);
        } catch {
          toast.error("Pengeluaran tersimpan, tapi gagal upload struk.");
        } finally {
          setUploading(false);
        }
      }
      toast.success("Pengeluaran berhasil dicatat!");
      queryClient.invalidateQueries({ queryKey: ["expenses"], exact: false });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pendingCount });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.foDashboard });
      closeModal();
    },
    onError: (e) => toast.error(e.response?.data?.message ?? "Gagal menyimpan pengeluaran."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => expenseService.update(id, data),
    onSuccess: async (_, vars) => {
      if (receiptFile) {
        setUploading(true);
        try {
          await expenseService.uploadReceipt(vars.id, receiptFile);
        } catch {
          toast.error("Pengeluaran diperbarui, tapi gagal upload struk.");
        } finally {
          setUploading(false);
        }
      }
      toast.success("Pengeluaran berhasil diperbarui!");
      queryClient.invalidateQueries({ queryKey: ["expenses"], exact: false });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.foDashboard });
      closeModal();
    },
    onError: (e) => toast.error(e.response?.data?.message ?? "Gagal memperbarui pengeluaran."),
  });

  const deleteMutation = useMutation({
    mutationFn: expenseService.remove,
    onSuccess: () => {
      toast.success("Pengeluaran berhasil dihapus.");
      queryClient.invalidateQueries({ queryKey: ["expenses"], exact: false });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pendingCount });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.foDashboard });
      setDeleteTarget(null);
    },
    onError: () => toast.error("Gagal menghapus pengeluaran."),
  });

  // ── Form helpers ──────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditItem(null);
    setForm(emptyForm());
    setReceiptFile(null);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      description:    item.description ?? "",
      price_per_item: Number(item.price_per_item) || 0,
      quantity:       Number(item.quantity) || 1,
      payment_method: item.payment_method ?? "tunai",
    });
    setReceiptFile(null);
    setErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditItem(null);
    setForm(emptyForm());
    setReceiptFile(null);
    setErrors({});
  };

  const setField = (key, val) => {
    setForm(p => ({ ...p, [key]: val }));
    if (errors[key]) setErrors(p => ({ ...p, [key]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.description.trim())          e.description    = "Keterangan wajib diisi.";
    if (!form.price_per_item || form.price_per_item <= 0) e.price_per_item = "Harga wajib diisi.";
    if (!form.quantity || form.quantity < 1) e.quantity = "Jumlah minimal 1.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const payload = {
      description:    form.description,
      price_per_item: form.price_per_item,
      quantity:       form.quantity,
      total_price:    totalPrice,
      payment_method: form.payment_method,
    };
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  // ── Upload struk standalone ───────────────────────────────────────────────
  const handleUploadStandalone = async (item, file) => {
    if (!file) return;
    setUploading(true);
    try {
      await expenseService.uploadReceipt(item.id, file);
      toast.success("Struk berhasil diupload!");
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    } catch {
      toast.error("Gagal upload struk.");
    } finally {
      setUploading(false);
    }
  };

  // ── Export PDF ────────────────────────────────────────────────────────────
  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await expenseService.exportPdf({
        ...(filterStatus && { status: filterStatus }),
      });
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a   = document.createElement("a");
      a.href    = url;
      a.download = `laporan-pengeluaran-${today}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF berhasil diunduh!");
    } catch {
      toast.error("Gagal mengunduh PDF.");
    } finally {
      setExporting(false);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending || uploading;


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

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-black">Expenses</h1>
          <p className="text-sm text-[#737373] mt-0.5">
            {new Date().toLocaleDateString("id-ID", {
              weekday: "long", year: "numeric", month: "long", day: "numeric",
            })}
            {activeShift && <span className="ml-2 text-black">· Shift Aktif</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 text-sm text-[#525252] bg-white border border-[#e5e5e5] hover:bg-[#fafafa] px-3 py-2.5 rounded-xl transition-colors disabled:opacity-50 "
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
                ? 'bg-[#e5e5e5] text-[#a3a3a3] cursor-not-allowed'
                : 'bg-black text-white hover:bg-[#090909] cursor-pointer'
            }`}
            id="btn-tambah-expense"
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
          className="px-3 py-2 text-sm border border-[#e5e5e5] rounded-xl bg-white focus:outline-none  focus:ring-0"
        >
          <option value="">Semua Status</option>
          <option value="auto_approved">Auto Approved</option>
          <option value="pending">Menunggu Persetujuan</option>
          <option value="approved">Disetujui</option>
          <option value="rejected">Ditolak</option>
        </select>
        {filterStatus && (
          <button onClick={() => { setFilterStatus(""); setPage(1); }} className="text-xs text-[#737373] hover:text-[#525252] underline">
            Reset filter
          </button>
        )}
      </div>

      {/* ── Tabel ── */}
      <div className="bg-white rounded-xl  border border-[#e5e5e5]">
        <div className="p-5 border-b border-[#e5e5e5]">
          <h2 className="font-semibold text-black">Daftar Pengeluaran</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#fafafa] text-left">
                {["No", "Tanggal", "Keterangan", "Qty", "Harga/Item", "Total", "Metode", "Status", "Aksi"].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold text-[#737373] uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e5e5]">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-[#a3a3a3]">
                    <FileText size={40} className="mx-auto mb-3 opacity-20" />
                    <p className="text-sm">Belum ada data pengeluaran</p>
                    <button onClick={openAdd} className="mt-3 text-xs text-black underline">Tambah pengeluaran pertama</button>
                  </td>
                </tr>
              ) : (
                expenses.map((exp, idx) => {
                  const methodLabel = PAYMENT_METHODS.find(m => m.value === exp.payment_method)?.label ?? exp.payment_method;
                  const canEdit     = exp.status === "pending";
                  return (
                    <tr key={exp.id} className="hover:bg-[#fafafa] transition-colors">
                      <td className="px-4 py-3 text-[#737373]">{(page - 1) * (meta.per_page ?? 15) + idx + 1}</td>
                      <td className="px-4 py-3 text-[#525252] whitespace-nowrap">{formatDate(exp.created_at)}</td>
                      <td className="px-4 py-3 text-black max-w-[200px] truncate" title={exp.description}>{exp.description}</td>
                      <td className="px-4 py-3 text-[#525252] text-center">{exp.quantity}</td>
                      <td className="px-4 py-3 text-[#525252] whitespace-nowrap">{formatRp(exp.price_per_item)}</td>
                      <td className="px-4 py-3 font-semibold text-black whitespace-nowrap">{formatRp(exp.total_price)}</td>
                      <td className="px-4 py-3 text-[#525252] whitespace-nowrap">{methodLabel}</td>
                      <td className="px-4 py-3">
                        <ExpenseStatusBadge status={exp.status} rejectionReason={exp.rejection_reason} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {/* Edit — hanya jika pending */}
                          {canEdit && (
                            <button
                              onClick={() => openEdit(exp)}
                              className="p-1.5 text-[#737373] hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Pencil size={14} />
                            </button>
                          )}
                          {/* Upload / Lihat Struk */}
                          {exp.receipt_photo_url ? (
                            <a
                              href={exp.receipt_photo_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Lihat Struk"
                            >
                              <Image size={14} />
                            </a>
                          ) : (
                            <label className="p-1.5 text-[#737373] hover:text-black hover:bg-[#fafafa] rounded-lg transition-colors cursor-pointer" title="Upload Struk">
                              <Upload size={14} />
                              <input
                                type="file"
                                accept="image/jpeg,image/png,application/pdf"
                                className="hidden"
                                onChange={(e) => handleUploadStandalone(exp, e.target.files[0])}
                              />
                            </label>
                          )}
                          {/* Hapus */}
                          <button
                            onClick={() => setDeleteTarget(exp)}
                            className="p-1.5 text-[#737373] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.last_page > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-[#e5e5e5]">
            <p className="text-xs text-[#737373]">Menampilkan {expenses.length} dari {meta.total} data</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-xs text-[#525252] bg-[#fafafa] hover:bg-[#e5e5e5] rounded-lg disabled:opacity-40 transition-colors">← Prev</button>
              {Array.from({ length: meta.last_page }, (_, i) => i + 1)
                .filter(p => p === 1 || p === meta.last_page || Math.abs(p - page) <= 1)
                .reduce((acc, p, i, arr) => { if (i > 0 && p - arr[i-1] > 1) acc.push("..."); acc.push(p); return acc; }, [])
                .map((p, i) => p === "..." ? (
                  <span key={`e-${i}`} className="px-2 text-[#a3a3a3] text-xs">…</span>
                ) : (
                  <button key={p} onClick={() => setPage(p)}
                    className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${page === p ? "bg-black text-white" : "text-[#525252] bg-[#fafafa] hover:bg-[#e5e5e5]"}`}>
                    {p}
                  </button>
                ))}
              <button onClick={() => setPage(p => Math.min(meta.last_page, p + 1))} disabled={page === meta.last_page}
                className="px-3 py-1.5 text-xs text-[#525252] bg-[#fafafa] hover:bg-[#e5e5e5] rounded-lg disabled:opacity-40 transition-colors">Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal Tambah / Edit ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={!isSaving ? closeModal : undefined} />
          <div className="relative bg-white rounded-xl  w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-[#e5e5e5] sticky top-0 bg-white z-10">
              <h3 className="font-bold text-black">{editItem ? "Edit Pengeluaran" : "Tambah Pengeluaran"}</h3>
              <button onClick={closeModal} disabled={isSaving} className="p-1 text-[#a3a3a3] hover:text-[#525252] rounded-lg"><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">

              {/* Date + Shift */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#737373] mb-1 uppercase tracking-wide">Tanggal</label>
                  <input type="date" value={today} readOnly
                    className="w-full px-3 py-2 bg-[#fafafa] border border-[#e5e5e5] rounded-xl text-sm text-[#737373] cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#737373] mb-1 uppercase tracking-wide">Shift</label>
                  <input type="text" readOnly
                    value={activeShift ? `Shift #${activeShift.id} (${activeShift.type ?? ""})` : "Tidak ada shift aktif"}
                    className="w-full px-3 py-2 bg-[#fafafa] border border-[#e5e5e5] rounded-xl text-sm text-[#737373] cursor-not-allowed" />
                </div>
              </div>

              {/* Staff */}
              <div>
                <label className="block text-xs font-semibold text-[#737373] mb-1 uppercase tracking-wide">Staff</label>
                <input type="text" value={user?.name ?? ""} readOnly
                  className="w-full px-3 py-2 bg-[#fafafa] border border-[#e5e5e5] rounded-xl text-sm text-[#737373] cursor-not-allowed" />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-[#525252] mb-1 uppercase tracking-wide">
                  Keterangan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                  placeholder="Contoh: Pembelian sabun mandi, dll."
                  className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none  focus:ring-0 ${
                    errors.description ? "border-red-400 bg-red-50" : "border-[#e5e5e5]"
                  }`}
                />
                {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
              </div>

              {/* Price Per Item + Quantity */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#525252] mb-1 uppercase tracking-wide">
                    Harga / Item <span className="text-red-500">*</span>
                  </label>
                  <RupiahInput
                    id="price-per-item"
                    value={form.price_per_item}
                    onChange={(v) => setField("price_per_item", v)}
                    className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none  focus:ring-0 ${
                      errors.price_per_item ? "border-red-400 bg-red-50" : "border-[#e5e5e5]"
                    }`}
                  />
                  {errors.price_per_item && <p className="text-xs text-red-500 mt-1">{errors.price_per_item}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#525252] mb-1 uppercase tracking-wide">
                    Jumlah <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.quantity}
                    onChange={(e) => setField("quantity", Math.max(1, parseInt(e.target.value) || 1))}
                    className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none  focus:ring-0 ${
                      errors.quantity ? "border-red-400 bg-red-50" : "border-[#e5e5e5]"
                    }`}
                  />
                  {errors.quantity && <p className="text-xs text-red-500 mt-1">{errors.quantity}</p>}
                </div>
              </div>

              {/* Total Price (readonly) + Approval Indicator */}
              <div>
                <label className="block text-xs font-semibold text-[#737373] mb-1 uppercase tracking-wide">Total Harga</label>
                <div className="w-full px-3 py-3 bg-[#fafafa] border border-[#e5e5e5] rounded-xl text-lg font-extrabold text-black">
                  {formatRp(totalPrice)}
                </div>
                {totalPrice > 0 && (
                  <div className={`mt-2 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold ${
                    isAutoApprove
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}>
                    <span>{isAutoApprove ? "✓" : "⚠"}</span>
                    <span>
                      {isAutoApprove
                        ? "Akan disetujui otomatis (≤ Rp 500.000)"
                        : "Membutuhkan persetujuan Manager (> Rp 500.000)"}
                    </span>
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-semibold text-[#525252] mb-1 uppercase tracking-wide">Payment Option</label>
                <select
                  value={form.payment_method}
                  onChange={(e) => setField("payment_method", e.target.value)}
                  className="w-full px-3 py-2 border border-[#e5e5e5] rounded-xl text-sm focus:outline-none  focus:ring-0"
                >
                  {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>

              {/* Upload Struk */}
              <div>
                <label className="block text-xs font-semibold text-[#525252] mb-1 uppercase tracking-wide">Upload Struk</label>
                <label className={`flex items-center gap-3 px-3 py-2.5 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                  receiptFile ? "border-blue-400 bg-[#fafafa]" : "border-[#e5e5e5] hover:border-gray-300"
                }`}>
                  <Upload size={16} className={receiptFile ? "text-blue-500" : "text-[#a3a3a3]"} />
                  <span className={`text-sm ${receiptFile ? "text-black font-medium" : "text-[#a3a3a3]"}`}>
                    {receiptFile ? receiptFile.name : "Pilih file (JPG, PNG, PDF)"}
                  </span>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,application/pdf"
                    className="hidden"
                    onChange={(e) => setReceiptFile(e.target.files[0] ?? null)}
                  />
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} disabled={isSaving}
                  className="flex-1 py-2.5 text-sm font-medium text-[#525252] bg-[#fafafa] hover:bg-[#e5e5e5] rounded-xl transition-colors disabled:opacity-50">
                  Cancel
                </button>
                <button type="submit" disabled={isSaving}
                  className="flex-1 py-2.5 text-sm font-medium text-white bg-black hover:bg-[#090909] rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  id="btn-save-expense">
                  {isSaving ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Menyimpan...</>
                  ) : (
                    editItem ? "Simpan Perubahan" : "Save Expense"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Confirm Delete ── */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Hapus Pengeluaran"
        message={`Hapus pengeluaran "${deleteTarget?.description}" senilai ${formatRp(deleteTarget?.total_price)}? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />

    </div>
  );
};

export default ExpensesPage;
