import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Download, Pencil, Trash2, FileText, X, RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import reservationService from "../../services/reservationService";
import authStore from "../../store/authStore";
import api from "../../utils/axios";
import RupiahInput from "../../components/ui/RupiahInput";
import ConfirmModal from "../../components/ui/ConfirmModal";
import StatusBadge from "../../components/ui/StatusBadge";

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatRp = (v) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", maximumFractionDigits: 0,
  }).format(v ?? 0).replace("IDR", "Rp");

const today = new Date().toISOString().split("T")[0];

// ── Constants ─────────────────────────────────────────────────────────────────
const SOURCES = [
  { value: "walk_in", label: "Walk In" },
  { value: "tiket",   label: "Tiket.com" },
  { value: "booking", label: "Booking.com" },
];

const STATUSES = [
  { value: "checkin",  label: "Check-In" },
  { value: "checkout", label: "Check-Out" },
  { value: "cancel",   label: "Cancel" },
  { value: "noshow",   label: "No Show" },
];

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

// ── Source badge ──────────────────────────────────────────────────────────────
const SourceBadge = ({ source }) => {
  const map = {
    walk_in: { label: "Walk In",     cls: "bg-blue-100 text-blue-700 ring-blue-200" },
    tiket:   { label: "Tiket.com",   cls: "bg-orange-100 text-orange-700 ring-orange-200" },
    booking: { label: "Booking.com", cls: "bg-purple-100 text-purple-700 ring-purple-200" },
  };
  const cfg = map[source] ?? { label: source, cls: "bg-gray-100 text-gray-600 ring-gray-200" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
};

// ── Skeleton row ──────────────────────────────────────────────────────────────
const SkeletonRow = () => (
  <tr>
    {Array.from({ length: 10 }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <div className="h-4 bg-gray-200 rounded animate-pulse" />
      </td>
    ))}
  </tr>
);

// ── Empty form ────────────────────────────────────────────────────────────────
const emptyForm = () => ({
  reservation_date: today,
  guest_name:       "",
  room_number:      "",
  check_in_date:    today,
  check_out_date:   "",
  room_price:       0,
  down_payment:     0,
  source:           "walk_in",
  payment_method:   "tunai",
  payment_status:   "dp",
  remarks:          "",
});

// ── Main Page ─────────────────────────────────────────────────────────────────
const ReservationPage = () => {
  const user        = authStore.getUser();
  const queryClient = useQueryClient();

  // ── UI state ────────────────────────────────────────────────────────────────
  const [modalOpen,        setModalOpen]        = useState(false);
  const [statusModalOpen,  setStatusModalOpen]  = useState(false);
  const [editItem,         setEditItem]         = useState(null);
  const [statusTarget,     setStatusTarget]     = useState(null);
  const [newStatus,        setNewStatus]        = useState("");
  const [deleteTarget,     setDeleteTarget]     = useState(null);
  const [form,             setForm]             = useState(emptyForm());
  const [errors,           setErrors]           = useState({});
  const [exporting,        setExporting]        = useState(false);
  const [downloadingId,    setDownloadingId]    = useState(null);

  // ── Filter state ─────────────────────────────────────────────────────────────
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [page,         setPage]         = useState(1);

  // ── Derived: remaining balance ────────────────────────────────────────────
  const remainingBalance = Math.max(0, (form.room_price ?? 0) - (form.down_payment ?? 0));

  // ── Fetch active shift ────────────────────────────────────────────────────
  const { data: shiftData, isError: shiftError } = useQuery({
    queryKey: ["active-shift"],
    queryFn:  () => api.get("/shifts/active").then(r => r.data),
    retry: false,
  });
  const activeShift = shiftData?.data;
  const hasNoShift  = shiftError || !shiftData?.data;

  // ── Fetch available rooms ─────────────────────────────────────────────────
  const { data: availData } = useQuery({
    queryKey: ["room-availability", form.check_in_date, form.check_out_date],
    queryFn:  () => reservationService.checkAvailability({
      check_in_date:  form.check_in_date,
      check_out_date: form.check_out_date,
    }),
    enabled: !!(form.check_in_date && form.check_out_date && modalOpen),
    retry: false,
  });
  const availableRooms = availData?.data ?? [];

  // ── Fetch reservations ────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ["reservations", filterStatus, filterSource, page],
    queryFn:  () => reservationService.getAll({
      ...(filterStatus && { status: filterStatus }),
      ...(filterSource && { source: filterSource }),
      page,
    }),
    retry: false,
  });

  const reservations = data?.data ?? [];
  const meta         = data?.meta ?? {};


  // ── Mutations ─────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: reservationService.create,
    onSuccess: () => {
      toast.success("Reservasi berhasil dicatat!");
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      closeModal();
    },
    onError: (e) => toast.error(e.response?.data?.message ?? "Gagal menyimpan reservasi."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => reservationService.update(id, data),
    onSuccess: () => {
      toast.success("Reservasi berhasil diperbarui!");
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      closeModal();
    },
    onError: (e) => toast.error(e.response?.data?.message ?? "Gagal memperbarui reservasi."),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => reservationService.updateStatus(id, status),
    onSuccess: () => {
      toast.success("Status reservasi berhasil diperbarui!");
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      setStatusModalOpen(false);
      setStatusTarget(null);
    },
    onError: (e) => toast.error(e.response?.data?.message ?? "Gagal memperbarui status."),
  });

  const deleteMutation = useMutation({
    mutationFn: reservationService.remove,
    onSuccess: () => {
      toast.success("Reservasi berhasil dihapus.");
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      setDeleteTarget(null);
    },
    onError: () => toast.error("Gagal menghapus reservasi."),
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
      reservation_date: item.reservation_date ?? today,
      guest_name:       item.guest_name ?? "",
      room_number:      item.room_number ?? "",
      check_in_date:    item.check_in_date ?? today,
      check_out_date:   item.check_out_date ?? "",
      room_price:       Number(item.room_price) ?? 0,
      down_payment:     Number(item.down_payment) ?? 0,
      source:           item.source ?? "walk_in",
      payment_method:   item.payment_method ?? "tunai",
      payment_status:   item.payment_status ?? "dp",
      remarks:          item.remarks ?? "",
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

  const openStatusModal = (item) => {
    setStatusTarget(item);
    setNewStatus(item.status);
    setStatusModalOpen(true);
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.guest_name.trim())  e.guest_name    = "Nama tamu wajib diisi.";
    if (!form.room_number.trim()) e.room_number   = "Nomor kamar wajib dipilih.";
    if (!form.check_in_date)      e.check_in_date = "Tanggal check-in wajib diisi.";
    if (!form.check_out_date)     e.check_out_date = "Tanggal check-out wajib diisi.";
    if (form.check_out_date && form.check_in_date && form.check_out_date <= form.check_in_date) {
      e.check_out_date = "Check-out harus setelah check-in.";
    }
    if (!form.room_price || form.room_price <= 0) e.room_price = "Harga kamar wajib diisi.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const payload = {
      reservation_date: form.reservation_date,
      guest_name:       form.guest_name,
      room_number:      form.room_number,
      check_in_date:    form.check_in_date,
      check_out_date:   form.check_out_date,
      room_price:       form.room_price,
      down_payment:     form.down_payment,
      remaining_balance: remainingBalance,
      source:           form.source,
      payment_method:   form.payment_method,
      payment_status:   form.payment_status,
      remarks:          form.remarks,
    };
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  // ── Download invoice ──────────────────────────────────────────────────────
  const handleDownloadInvoice = async (item) => {
    setDownloadingId(item.id);
    try {
      const res = await reservationService.downloadInvoice(item.id);
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a   = document.createElement("a");
      a.href    = url;
      a.download = `invoice-${item.invoice_number ?? item.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Invoice berhasil diunduh!");
    } catch {
      toast.error("Gagal mengunduh invoice.");
    } finally {
      setDownloadingId(null);
    }
  };

  // ── Export PDF ────────────────────────────────────────────────────────────
  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await reservationService.exportPdf({
        ...(filterStatus && { status: filterStatus }),
        ...(filterSource && { source: filterSource }),
      });
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a   = document.createElement("a");
      a.href    = url;
      a.download = `laporan-reservasi-${today}.pdf`;
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
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3">
          <span className="text-amber-500 text-xl">⚠️</span>
          <div>
            <p className="font-semibold text-amber-800">Tidak ada shift aktif</p>
            <p className="text-sm text-amber-600 mt-0.5">
              Kamu belum memulai shift. Kembali ke Dashboard dan klik "Mulai Shift" terlebih dahulu.
            </p>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reservation</h1>
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
            id="btn-export-reservasi"
          >
            <Download size={15} />
            {exporting ? "Mengunduh..." : "Export PDF"}
          </button>
          <button
            onClick={() => !hasNoShift && openAdd()}
            disabled={hasNoShift}
            title={hasNoShift ? "Mulai shift terlebih dahulu untuk menambah reservasi" : "Tambah reservasi baru"}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm ${
              hasNoShift
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
            }`}
            id="btn-tambah-reservasi"
          >
            <Plus size={16} />
            Tambah Reservasi
          </button>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="flex flex-wrap items-center gap-3">
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
        <select
          value={filterSource}
          onChange={(e) => { setFilterSource(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Semua Sumber</option>
          {SOURCES.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        {(filterStatus || filterSource) && (
          <button
            onClick={() => { setFilterStatus(""); setFilterSource(""); setPage(1); }}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Reset filter
          </button>
        )}
      </div>

      {/* ── Tabel ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Daftar Reservasi</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                {["No", "Invoice", "Tamu", "Kamar", "Check-In", "Check-Out", "Total", "Sumber", "Status", "Aksi"].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : reservations.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-16 text-gray-400">
                    <FileText size={40} className="mx-auto mb-3 opacity-20" />
                    <p className="text-sm">Belum ada data reservasi</p>
                    <button onClick={openAdd} className="mt-3 text-xs text-blue-600 underline">
                      Tambah reservasi pertama
                    </button>
                  </td>
                </tr>
              ) : (
                reservations.map((res, idx) => (
                  <tr key={res.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-500">
                      {(page - 1) * (meta.per_page ?? 15) + idx + 1}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600 whitespace-nowrap">
                      {res.invoice_number ?? "-"}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">
                      {res.guest_name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{res.room_number}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {res.check_in_date
                        ? new Date(res.check_in_date).toLocaleDateString("id-ID")
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {res.check_out_date
                        ? new Date(res.check_out_date).toLocaleDateString("id-ID")
                        : "-"}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800 whitespace-nowrap">
                      {formatRp(res.room_price)}
                    </td>
                    <td className="px-4 py-3">
                      <SourceBadge source={res.source} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={res.status} type="reservation" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {/* Edit */}
                        <button
                          onClick={() => openEdit(res)}
                          className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        {/* Update Status */}
                        <button
                          onClick={() => openStatusModal(res)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Update Status"
                        >
                          <RefreshCw size={14} />
                        </button>
                        {/* Download Invoice */}
                        <button
                          onClick={() => handleDownloadInvoice(res)}
                          disabled={downloadingId === res.id}
                          className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-40"
                          title="Download Invoice"
                        >
                          {downloadingId === res.id
                            ? <span className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin inline-block" />
                            : <FileText size={14} />
                          }
                        </button>
                        {/* Hapus */}
                        <button
                          onClick={() => setDeleteTarget(res)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {meta.last_page > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Menampilkan {reservations.length} dari {meta.total} data
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
                    <span key={`ellipsis-${i}`} className="px-2 text-gray-400 text-xs">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                        page === p
                          ? "bg-blue-600 text-white"
                          : "text-gray-600 bg-gray-100 hover:bg-gray-200"
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
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="font-bold text-gray-800">
                {editItem ? "Edit Reservasi" : "Tambah Reservasi"}
              </h3>
              <button
                onClick={closeModal}
                disabled={isSaving}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">

              {/* Row 1: Date + Shift */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    value={form.reservation_date}
                    onChange={(e) => setField("reservation_date", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                    Shift
                  </label>
                  <input
                    type="text"
                    value={activeShift ? `Shift #${activeShift.id} (${activeShift.type ?? ""})` : "Tidak ada shift aktif"}
                    readOnly
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Row 2: Staff */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                  Staff
                </label>
                <input
                  type="text"
                  value={user?.name ?? ""}
                  readOnly
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500 cursor-not-allowed"
                />
              </div>

              {/* Row 3: Guest Name */}
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
                {errors.guest_name && (
                  <p className="text-xs text-red-500 mt-1">{errors.guest_name}</p>
                )}
              </div>

              {/* Row 4: Check-In + Check-Out */}
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
                  {errors.check_in_date && (
                    <p className="text-xs text-red-500 mt-1">{errors.check_in_date}</p>
                  )}
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
                  {errors.check_out_date && (
                    <p className="text-xs text-red-500 mt-1">{errors.check_out_date}</p>
                  )}
                </div>
              </div>

              {/* Row 5: Room Number */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">
                  Nomor Kamar <span className="text-red-500">*</span>
                </label>
                {availableRooms.length > 0 ? (
                  <select
                    value={form.room_number}
                    onChange={(e) => setField("room_number", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.room_number ? "border-red-400 bg-red-50" : "border-gray-200"
                    }`}
                  >
                    <option value="">-- Pilih Kamar --</option>
                    {availableRooms.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={form.room_number}
                    onChange={(e) => setField("room_number", e.target.value)}
                    placeholder="Contoh: 101"
                    className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.room_number ? "border-red-400 bg-red-50" : "border-gray-200"
                    }`}
                  />
                )}
                {errors.room_number && (
                  <p className="text-xs text-red-500 mt-1">{errors.room_number}</p>
                )}
              </div>

              {/* Row 6: Room Price + Down Payment */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">
                    Room Price <span className="text-red-500">*</span>
                  </label>
                  <RupiahInput
                    id="room-price"
                    value={form.room_price}
                    onChange={(v) => setField("room_price", v)}
                    className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.room_price ? "border-red-400 bg-red-50" : "border-gray-200"
                    }`}
                  />
                  {errors.room_price && (
                    <p className="text-xs text-red-500 mt-1">{errors.room_price}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">
                    Down Payment
                  </label>
                  <RupiahInput
                    id="down-payment"
                    value={form.down_payment}
                    onChange={(v) => setField("down_payment", v)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Row 7: Remaining Balance (readonly) */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                  Remaining Balance
                </label>
                <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 font-semibold">
                  {formatRp(remainingBalance)}
                </div>
              </div>

              {/* Row 8: Source + Payment Method */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">
                    Sumber
                  </label>
                  <select
                    value={form.source}
                    onChange={(e) => setField("source", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {SOURCES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">
                    Payment Option
                  </label>
                  <select
                    value={form.payment_method}
                    onChange={(e) => setField("payment_method", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {PAYMENT_METHODS.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 9: Payment Status */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">
                  Payment Status
                </label>
                <select
                  value={form.payment_status}
                  onChange={(e) => setField("payment_status", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {PAYMENT_STATUSES.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>

              {/* Row 10: Remarks */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">
                  Remarks
                </label>
                <textarea
                  value={form.remarks}
                  onChange={(e) => setField("remarks", e.target.value)}
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
                  id="btn-save-reservasi"
                >
                  {isSaving ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    editItem ? "Simpan Perubahan" : "Save Reservation"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Update Status ── */}
      {statusModalOpen && statusTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={!statusMutation.isPending ? () => setStatusModalOpen(false) : undefined}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-800">Update Status</h3>
              <button
                onClick={() => setStatusModalOpen(false)}
                disabled={statusMutation.isPending}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Reservasi: <span className="font-semibold text-gray-700">{statusTarget.guest_name}</span>
              {statusTarget.invoice_number && (
                <span className="ml-1 text-xs text-gray-400">({statusTarget.invoice_number})</span>
              )}
            </p>

            <div className="mb-5">
              <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">
                Status Baru
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STATUSES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStatusModalOpen(false)}
                disabled={statusMutation.isPending}
                className="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={() => statusMutation.mutate({ id: statusTarget.id, status: newStatus })}
                disabled={statusMutation.isPending || newStatus === statusTarget.status}
                className="flex-1 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {statusMutation.isPending ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Status"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Delete ── */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Hapus Reservasi"
        message={`Hapus reservasi "${deleteTarget?.guest_name}"${deleteTarget?.invoice_number ? ` (${deleteTarget.invoice_number})` : ""}? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />

    </div>
  );
};

export default ReservationPage;
