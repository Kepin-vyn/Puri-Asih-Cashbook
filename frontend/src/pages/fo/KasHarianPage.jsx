import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Download, Pencil, Trash2, FileText, X, Upload } from "lucide-react";
import toast from "react-hot-toast";
import kasService from "../../services/kasService";
import authStore from "../../store/authStore";
import api from "../../utils/axios";
import RupiahInput from "../../components/ui/RupiahInput";
import ConfirmModal from "../../components/ui/ConfirmModal";

// ── Helpers ──────────────────────────────────────────────────────────────────
const formatRp = (v) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })
    .format(v ?? 0).replace("IDR", "Rp");

const today = new Date().toISOString().split("T")[0];

const ROOM_NUMBERS = [
  ...Array.from({ length: 10 }, (_, i) => `${101 + i}`),
  ...Array.from({ length: 10 }, (_, i) => `${201 + i}`),
  ...Array.from({ length: 10 }, (_, i) => `${301 + i}`),
];

// Nilai sesuai DB enum: reservasi | checkin | pelunasan
const TRANSACTION_TYPES = [
  { value: "reservasi",  label: "Reservasi" },
  { value: "checkin",    label: "Check-In" },
  { value: "pelunasan",  label: "Pelunasan Reservasi" },
];
const PAYMENT_METHODS   = [
  { value: "tunai",        label: "Cash" },
  { value: "transfer",     label: "Transfer Bank" },
  { value: "qris",         label: "QRIS" },
  { value: "kartu_kredit", label: "Kartu Kredit" },
];
// payment_status tidak ada di DB — dihapus

// ── Empty form ────────────────────────────────────────────────────────────────
const emptyForm = () => ({
  guest_name:       "",
  room_number:      "101",
  transaction_type: "reservasi",
  amount:           0,
  payment_method:   "tunai",
  note:             "",
});

// ── Skeleton row ─────────────────────────────────────────────────────────────
const SkeletonRow = () => (
  <tr>
    {[1,2,3,4,5,6,7,8].map(i => (
      <td key={i} className="px-4 py-3">
        <div className="h-4 bg-gray-200 rounded animate-pulse" />
      </td>
    ))}
  </tr>
);

// ── Main Page ─────────────────────────────────────────────────────────────────
const KasHarianPage = () => {
  const user        = authStore.getUser();
  const queryClient = useQueryClient();

  const [modalOpen,    setModalOpen]    = useState(false);
  const [editItem,     setEditItem]     = useState(null);
  const [form,         setForm]         = useState(emptyForm());
  const [errors,       setErrors]       = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [uploading,    setUploading]    = useState(false);
  const [exporting,    setExporting]    = useState(false);

  // ── Fetch active shift ──────────────────────────────────────────────────────
  const { data: shiftData, isError: shiftError } = useQuery({
    queryKey: ["active-shift"],
    queryFn:  () => api.get("/shifts/active").then(r => r.data),
    retry: false,
  });
  const activeShift  = shiftData?.data;
  const hasNoShift   = shiftError; // 404 = no active shift

  // ── Fetch KAS transactions ──────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ["kas-list", today],
    queryFn:  () => kasService.getAll({ date: today }),
    refetchInterval: 5 * 60 * 1000,
    enabled: !hasNoShift, // jangan fetch jika tidak ada shift
    retry: false,
  });

  const transactions = data?.data ?? [];
  const totalAmount  = data?.meta?.total_amount ?? transactions.reduce((s, t) => s + Number(t.amount ?? 0), 0);

  // ── Mutations ───────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: kasService.create,
    onSuccess: () => {
      toast.success("Transaksi berhasil dicatat!");
      queryClient.invalidateQueries({ queryKey: ["kas-list"] });
      queryClient.invalidateQueries({ queryKey: ["fo-shift-summary"] });
      closeModal();
    },
    onError: (e) => toast.error(e.response?.data?.message ?? "Gagal menyimpan transaksi."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => kasService.update(id, data),
    onSuccess: () => {
      toast.success("Transaksi berhasil diperbarui!");
      queryClient.invalidateQueries({ queryKey: ["kas-list"] });
      closeModal();
    },
    onError: (e) => toast.error(e.response?.data?.message ?? "Gagal memperbarui transaksi."),
  });

  const deleteMutation = useMutation({
    mutationFn: kasService.remove,
    onSuccess: () => {
      toast.success("Transaksi berhasil dihapus.");
      queryClient.invalidateQueries({ queryKey: ["kas-list"] });
      setDeleteTarget(null);
    },
    onError: () => toast.error("Gagal menghapus transaksi."),
  });

  // ── Form helpers ────────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditItem(null);
    setForm(emptyForm());
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      guest_name:       item.guest_name ?? "",
      room_number:      item.room_number ?? "101",
      transaction_type: item.transaction_type ?? "reservasi",
      amount:           Number(item.amount) ?? 0,
      payment_method:   item.payment_method ?? "tunai",
      note:             item.note ?? "",
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

  const validate = () => {
    const e = {};
    if (!form.guest_name.trim()) e.guest_name = "Nama tamu wajib diisi.";
    if (!form.amount || form.amount <= 0) e.amount = "Jumlah wajib diisi dan lebih dari 0.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    // payment_status tidak ada di DB, hanya kirim field yang valid
    const { guest_name, room_number, transaction_type, amount, payment_method, note } = form;
    const payload = { guest_name, room_number, transaction_type, amount, payment_method, note };
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  // ── Upload receipt ──────────────────────────────────────────────────────────
  const handleUpload = async (item, file) => {
    if (!file) return;
    setUploading(true);
    try {
      await kasService.uploadReceipt(item.id, file);
      toast.success("Struk berhasil diupload!");
      queryClient.invalidateQueries({ queryKey: ["kas-list"] });
    } catch {
      toast.error("Gagal upload struk.");
    } finally {
      setUploading(false);
    }
  };

  // ── Export PDF ──────────────────────────────────────────────────────────────
  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await kasService.exportPdf({ date: today });
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a   = document.createElement("a");
      a.href    = url;
      a.download = `laporan-kas-${today}.pdf`;
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

  // ── Status badge ────────────────────────────────────────────────────────────
  const StatusBadge = ({ status }) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
      status === "paid"
        ? "bg-emerald-100 text-emerald-700"
        : "bg-amber-100 text-amber-700"
    }`}>
      {status === "paid" ? "Paid" : "Pending"}
    </span>
  );

  return (
    <div className="space-y-6">
      {/* ── No Shift Warning ── */}
      {hasNoShift && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3">
          <span className="text-amber-500 text-xl">⚠️</span>
          <div>
            <p className="font-semibold text-amber-800">Tidak ada shift aktif</p>
            <p className="text-sm text-amber-600 mt-0.5">Mulai shift terlebih dahulu untuk bisa mencatat transaksi KAS.</p>
          </div>
        </div>
      )}
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Cash Income</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            {activeShift && <span className="ml-2 text-blue-600">· Shift Aktif</span>}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm"
          id="btn-tambah-kas"
        >
          <Plus size={16} />
          Tambah Transaksi
        </button>
      </div>

      {/* ── Summary bar ── */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-5 text-white shadow-lg">
        <p className="text-sm font-medium opacity-80">Total Pemasukan Shift Ini</p>
        <p className="text-3xl font-extrabold mt-1">{formatRp(totalAmount)}</p>
        <p className="text-xs opacity-70 mt-1">{transactions.length} transaksi hari ini</p>
      </div>

      {/* ── Tabel ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Daftar Transaksi</h2>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-xl transition-colors disabled:opacity-50"
            id="btn-export-pdf"
          >
            <Download size={14} />
            {exporting ? "Mengunduh..." : "Export PDF"}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">No</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tanggal</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tamu</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Kamar</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Jenis</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Metode</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Jumlah</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-gray-400">
                    <FileText size={40} className="mx-auto mb-3 opacity-20" />
                    <p className="text-sm">Belum ada transaksi hari ini</p>
                    <button onClick={openAdd} className="mt-3 text-xs text-blue-600 underline">
                      Tambah transaksi pertama
                    </button>
                  </td>
                </tr>
              ) : (
                transactions.map((trx, idx) => {
                  const methodLabel = PAYMENT_METHODS.find(m => m.value === trx.payment_method)?.label ?? trx.payment_method;
                  const typeLabel   = TRANSACTION_TYPES.find(t => t.value === trx.transaction_type)?.label ?? trx.transaction_type;
                  return (
                    <tr key={trx.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {new Date(trx.created_at).toLocaleDateString("id-ID")}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">{trx.guest_name}</td>
                      <td className="px-4 py-3 text-gray-600">{trx.room_number}</td>
                      <td className="px-4 py-3 text-gray-600">{typeLabel}</td>
                      <td className="px-4 py-3 text-gray-600">{methodLabel}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-800">
                        {formatRp(trx.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {/* Upload struk */}
                          <label
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Upload Struk"
                          >
                            <Upload size={14} />
                            <input
                              type="file"
                              accept="image/jpeg,image/png,application/pdf"
                              className="hidden"
                              onChange={(e) => handleUpload(trx, e.target.files[0])}
                            />
                          </label>
                          {/* Lihat struk jika ada */}
                          {trx.receipt_photo && (
                            <a
                              href={trx.receipt_photo}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Lihat Struk"
                            >
                              <FileText size={14} />
                            </a>
                          )}
                          {/* Edit */}
                          <button
                            onClick={() => openEdit(trx)}
                            className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          {/* Hapus */}
                          <button
                            onClick={() => setDeleteTarget(trx)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
      </div>

      {/* ── Modal Tambah/Edit ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={!isSaving ? closeModal : undefined} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-800">
                {editItem ? "Edit Transaksi" : "Tambah Transaksi KAS"}
              </h3>
              <button onClick={closeModal} disabled={isSaving} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Read-only fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Tanggal</label>
                  <input type="date" value={today} readOnly
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Staff</label>
                  <input type="text" value={user?.name ?? ""} readOnly
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500 cursor-not-allowed" />
                </div>
              </div>

              {/* Shift info */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Shift</label>
                <input type="text" value={activeShift ? `Shift #${activeShift.id}` : "Tidak ada shift aktif"} readOnly
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500 cursor-not-allowed" />
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

              {/* Room + Transaction Type */}
              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Jenis Transaksi</label>
                  <select
                    value={form.transaction_type}
                    onChange={(e) => setField("transaction_type", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {TRANSACTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">
                  Jumlah <span className="text-red-500">*</span>
                </label>
                <RupiahInput
                  id="kas-amount"
                  value={form.amount}
                  onChange={(v) => setField("amount", v)}
                  className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.amount ? "border-red-400 bg-red-50" : "border-gray-200"
                  }`}
                />
                {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
              </div>

              {/* Payment method + status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Metode Bayar</label>
                  <select
                    value={form.payment_method}
                    onChange={(e) => setField("payment_method", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Keterangan</label>
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
                <button type="button" onClick={closeModal} disabled={isSaving}
                  className="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50">
                  Batal
                </button>
                <button type="submit" disabled={isSaving}
                  className="flex-1 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  id="btn-save-kas">
                  {isSaving ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Menyimpan...</>
                  ) : (
                    editItem ? "Simpan Perubahan" : "Simpan Transaksi"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Confirm Delete Modal ── */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Hapus Transaksi"
        message={`Hapus transaksi "${deleteTarget?.guest_name}" senilai ${formatRp(deleteTarget?.amount)}? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default KasHarianPage;
