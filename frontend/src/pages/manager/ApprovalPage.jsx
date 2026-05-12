import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle, XCircle, Eye, FileText, X, Image as ImageIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import expenseService from "../../services/expenseService";
import ConfirmModal from "../../components/ui/ConfirmModal";

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatRp = (v) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", maximumFractionDigits: 0,
  }).format(v ?? 0).replace("IDR", "Rp");

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("id-ID", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  }) : "-";

// ── Status badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    auto_approved: { label: "Auto Approved",        cls: "bg-emerald-100 text-emerald-700 ring-emerald-200" },
    pending:       { label: "Menunggu Persetujuan", cls: "bg-amber-100 text-amber-700 ring-amber-200" },
    approved:      { label: "Disetujui",            cls: "bg-blue-100 text-blue-700 ring-blue-200" },
    rejected:      { label: "Ditolak",              cls: "bg-red-100 text-red-700 ring-red-200" },
  };
  const cfg = map[status] ?? { label: status, cls: "bg-gray-100 text-gray-500 ring-gray-200" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
};

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
const ApprovalPage = () => {
  const queryClient = useQueryClient();

  // ── UI state ─────────────────────────────────────────────────────────────
  const [filterStatus,   setFilterStatus]   = useState("pending");
  const [page,           setPage]           = useState(1);
  const [detailItem,     setDetailItem]     = useState(null);
  const [approveTarget,  setApproveTarget]  = useState(null);
  const [rejectTarget,   setRejectTarget]   = useState(null);
  const [rejectReason,   setRejectReason]   = useState("");
  const [rejectReasonErr,setRejectReasonErr]= useState("");

  // ── Fetch pending count (untuk badge) ────────────────────────────────────
  const { data: countData } = useQuery({
    queryKey: ["pending-approval-count"],
    queryFn:  async () => {
      try {
        const res = await expenseService.getAll({ status: "pending", per_page: 1 });
        return res?.meta?.total ?? 0;
      } catch { return 0; }
    },
    refetchInterval: 30000,
  });
  const pendingCount = countData ?? 0;

  // ── Fetch expenses ────────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ["expenses-approval", filterStatus, page],
    queryFn:  () => expenseService.getAll({
      ...(filterStatus && { status: filterStatus }),
      page,
    }),
    retry: false,
  });

  const expenses = data?.data ?? [];
  const meta     = data?.meta ?? {};

  // ── Mutations ─────────────────────────────────────────────────────────────
  const approveMutation = useMutation({
    mutationFn: (id) => expenseService.approve(id),
    onSuccess: () => {
      toast.success("Pengeluaran berhasil disetujui!");
      queryClient.invalidateQueries({ queryKey: ["expenses-approval"] });
      queryClient.invalidateQueries({ queryKey: ["pending-approval-count"] });
      setApproveTarget(null);
      setDetailItem(null);
    },
    onError: (e) => toast.error(e.response?.data?.message ?? "Gagal menyetujui pengeluaran."),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => expenseService.reject(id, reason),
    onSuccess: () => {
      toast.success("Pengeluaran berhasil ditolak.");
      queryClient.invalidateQueries({ queryKey: ["expenses-approval"] });
      queryClient.invalidateQueries({ queryKey: ["pending-approval-count"] });
      setRejectTarget(null);
      setRejectReason("");
      setDetailItem(null);
    },
    onError: (e) => toast.error(e.response?.data?.message ?? "Gagal menolak pengeluaran."),
  });

  // ── Reject confirm ────────────────────────────────────────────────────────
  const handleRejectConfirm = () => {
    if (!rejectReason.trim()) {
      setRejectReasonErr("Alasan penolakan wajib diisi.");
      return;
    }
    if (rejectReason.trim().length < 10) {
      setRejectReasonErr("Alasan minimal 10 karakter.");
      return;
    }
    rejectMutation.mutate({ id: rejectTarget.id, reason: rejectReason });
  };

  const openReject = (item) => {
    setRejectTarget(item);
    setRejectReason("");
    setRejectReasonErr("");
  };

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-800">Approval Pengeluaran</h1>
          {pendingCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              {pendingCount > 99 ? "99+" : pendingCount} pending
            </span>
          )}
        </div>
      </div>

      {/* ── Filter ── */}
      <div className="flex items-center gap-3">
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Semua Status</option>
          <option value="pending">Menunggu Persetujuan</option>
          <option value="approved">Disetujui</option>
          <option value="auto_approved">Auto Approved</option>
          <option value="rejected">Ditolak</option>
        </select>
        {filterStatus && filterStatus !== "pending" && (
          <button onClick={() => { setFilterStatus("pending"); setPage(1); }} className="text-xs text-gray-500 hover:text-gray-700 underline">
            Kembali ke Pending
          </button>
        )}
      </div>

      {/* ── Tabel ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Daftar Pengeluaran</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                {["No", "Tanggal", "FO", "Shift", "Keterangan", "Total", "Metode", "Status", "Aksi"].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-gray-400">
                    <CheckCircle size={40} className="mx-auto mb-3 opacity-20" />
                    <p className="text-sm">
                      {filterStatus === "pending" ? "Tidak ada pengeluaran yang menunggu persetujuan" : "Tidak ada data"}
                    </p>
                  </td>
                </tr>
              ) : (
                expenses.map((exp, idx) => {
                  const isPending   = exp.status === "pending";
                  const methodLabel = {
                    tunai: "Cash", transfer: "Transfer", qris: "QRIS", kartu_kredit: "Kartu Kredit",
                  }[exp.payment_method] ?? exp.payment_method;

                  return (
                    <tr key={exp.id} className={`transition-colors ${isPending ? "bg-amber-50/40 hover:bg-amber-50" : "hover:bg-gray-50"}`}>
                      <td className="px-4 py-3 text-gray-500">{(page - 1) * (meta.per_page ?? 15) + idx + 1}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(exp.created_at)}</td>
                      <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{exp.user?.name ?? "-"}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap capitalize">{exp.shift?.type ?? "-"}</td>
                      <td className="px-4 py-3 text-gray-800 max-w-[180px] truncate" title={exp.description}>{exp.description}</td>
                      <td className="px-4 py-3 font-semibold text-gray-800 whitespace-nowrap">{formatRp(exp.total_price)}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{methodLabel}</td>
                      <td className="px-4 py-3"><StatusBadge status={exp.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {/* Lihat Detail */}
                          <button
                            onClick={() => setDetailItem(exp)}
                            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Lihat Detail"
                          >
                            <Eye size={12} />
                            Detail
                          </button>
                          {isPending && (
                            <>
                              {/* Setujui */}
                              <button
                                onClick={() => setApproveTarget(exp)}
                                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                                title="Setujui"
                              >
                                <CheckCircle size={12} />
                                Setujui
                              </button>
                              {/* Tolak */}
                              <button
                                onClick={() => openReject(exp)}
                                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                title="Tolak"
                              >
                                <XCircle size={12} />
                                Tolak
                              </button>
                            </>
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

        {/* Pagination */}
        {meta.last_page > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">Menampilkan {expenses.length} dari {meta.total} data</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-40 transition-colors">← Prev</button>
              {Array.from({ length: meta.last_page }, (_, i) => i + 1)
                .filter(p => p === 1 || p === meta.last_page || Math.abs(p - page) <= 1)
                .reduce((acc, p, i, arr) => { if (i > 0 && p - arr[i-1] > 1) acc.push("..."); acc.push(p); return acc; }, [])
                .map((p, i) => p === "..." ? (
                  <span key={`e-${i}`} className="px-2 text-gray-400 text-xs">…</span>
                ) : (
                  <button key={p} onClick={() => setPage(p)}
                    className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${page === p ? "bg-indigo-600 text-white" : "text-gray-600 bg-gray-100 hover:bg-gray-200"}`}>
                    {p}
                  </button>
                ))}
              <button onClick={() => setPage(p => Math.min(meta.last_page, p + 1))} disabled={page === meta.last_page}
                className="px-3 py-1.5 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-40 transition-colors">Next →</button>
            </div>
          </div>
        )}
      </div>


      {/* ── Modal Detail ── */}
      {detailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDetailItem(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="font-bold text-gray-800">Detail Pengeluaran</h3>
              <button onClick={() => setDetailItem(null)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3 text-sm">
              {[
                ["Tanggal",     formatDate(detailItem.created_at)],
                ["Staff (FO)",  detailItem.user?.name ?? "-"],
                ["Shift",       detailItem.shift?.type ?? "-"],
                ["Keterangan",  detailItem.description],
                ["Harga/Item",  formatRp(detailItem.price_per_item)],
                ["Jumlah",      detailItem.quantity],
                ["Total",       formatRp(detailItem.total_price)],
                ["Metode",      { tunai: "Cash", transfer: "Transfer", qris: "QRIS", kartu_kredit: "Kartu Kredit" }[detailItem.payment_method] ?? detailItem.payment_method],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-medium text-gray-800 text-right max-w-[60%]">{val}</span>
                </div>
              ))}
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Status</span>
                <StatusBadge status={detailItem.status} />
              </div>
              {detailItem.rejection_reason && (
                <div className="p-3 bg-red-50 rounded-xl text-xs text-red-700">
                  <span className="font-semibold">Alasan penolakan: </span>{detailItem.rejection_reason}
                </div>
              )}

              {/* Foto Struk */}
              {detailItem.receipt_photo ? (
                <div className="mt-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Bukti Struk</p>
                  {detailItem.receipt_photo.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    <img
                      src={detailItem.receipt_photo}
                      alt="Bukti struk"
                      className="w-full rounded-xl border border-gray-200 object-contain max-h-64"
                    />
                  ) : (
                    <a
                      href={detailItem.receipt_photo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <FileText size={16} />
                      Lihat Dokumen Struk
                    </a>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl text-xs text-gray-400">
                  <ImageIcon size={14} />
                  Tidak ada bukti struk
                </div>
              )}
            </div>

            {/* Action buttons di modal detail */}
            {detailItem.status === "pending" && (
              <div className="flex gap-3 p-5 border-t border-gray-100">
                <button
                  onClick={() => openReject(detailItem)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                >
                  <XCircle size={15} />
                  Tolak
                </button>
                <button
                  onClick={() => setApproveTarget(detailItem)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors"
                >
                  <CheckCircle size={15} />
                  Setujui
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modal Konfirmasi Setujui ── */}
      <ConfirmModal
        isOpen={!!approveTarget}
        title="Setujui Pengeluaran"
        message={`Setujui pengeluaran "${approveTarget?.description}" sebesar ${formatRp(approveTarget?.total_price)}?`}
        confirmText="Setujui"
        confirmVariant="primary"
        isLoading={approveMutation.isPending}
        onConfirm={() => approveMutation.mutate(approveTarget.id)}
        onCancel={() => setApproveTarget(null)}
      />

      {/* ── Modal Tolak (dengan alasan) ── */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={!rejectMutation.isPending ? () => { setRejectTarget(null); setRejectReason(""); } : undefined}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800">Tolak Pengeluaran</h3>
              <button
                onClick={() => { setRejectTarget(null); setRejectReason(""); }}
                disabled={rejectMutation.isPending}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex items-start gap-3 p-3 bg-red-50 rounded-xl mb-4">
              <XCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-800">{rejectTarget.description}</p>
                <p className="text-sm text-red-600">{formatRp(rejectTarget.total_price)}</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">
                Alasan Penolakan <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => { setRejectReason(e.target.value); setRejectReasonErr(""); }}
                rows={3}
                placeholder="Jelaskan alasan penolakan (min. 10 karakter)"
                className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none ${
                  rejectReasonErr ? "border-red-400 bg-red-50" : "border-gray-200"
                }`}
              />
              {rejectReasonErr && <p className="text-xs text-red-500 mt-1">{rejectReasonErr}</p>}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setRejectTarget(null); setRejectReason(""); }}
                disabled={rejectMutation.isPending}
                className="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={rejectMutation.isPending}
                className="flex-1 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {rejectMutation.isPending ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Memproses...</>
                ) : (
                  "Tolak Pengeluaran"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ApprovalPage;
