import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, FileText, Calendar } from "lucide-react";
import toast from "react-hot-toast";
import shiftService from "../../services/shiftService";
import authStore from "../../store/authStore";

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatRp = (v) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  })
    .format(v ?? 0)
    .replace("IDR", "Rp");

const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";

const formatTime = (iso) =>
  iso
    ? new Date(iso).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

const SHIFT_LABEL = { pagi: "Pagi", siang: "Siang", malam: "Malam" };

// ── Skeleton Row ──────────────────────────────────────────────────────────────
const SkeletonRow = () => (
  <tr>
    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
      <td key={i} className="px-4 py-3">
        <div className="h-4 bg-gray-200 rounded animate-pulse" />
      </td>
    ))}
  </tr>
);

// ── Main Page ─────────────────────────────────────────────────────────────────
const ReportPage = () => {
  const user = authStore.getUser();

  // Filter: bulan & tahun
  const now = new Date();
  const [filterMonth, setFilterMonth] = useState(
    String(now.getMonth() + 1).padStart(2, "0")
  );
  const [filterYear, setFilterYear] = useState(String(now.getFullYear()));
  const [downloadingId, setDownloadingId] = useState(null);

  // ── Fetch shift list ──────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ["fo-shift-reports", filterMonth, filterYear, user?.id],
    queryFn: () =>
      shiftService.getAll({
        user_id: user?.id,
        month: filterMonth,
        year: filterYear,
      }),
    retry: false,
  });

  const shifts = data?.data ?? [];
  const meta = data?.meta ?? {};

  // ── Download PDF ──────────────────────────────────────────────────────────
  const handleDownload = async (shift) => {
    setDownloadingId(shift.id);
    try {
      const res = await shiftService.downloadReportPdf(shift.id);
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `shift-report-${shift.id}-${formatDate(shift.started_at).replace(/ /g, "-")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF berhasil diunduh!");
    } catch {
      toast.error("Gagal mengunduh PDF.");
    } finally {
      setDownloadingId(null);
    }
  };

  // ── Year options (last 3 years) ───────────────────────────────────────────
  const yearOptions = Array.from({ length: 3 }, (_, i) => String(now.getFullYear() - i));

  const MONTHS = [
    { value: "01", label: "Januari" },
    { value: "02", label: "Februari" },
    { value: "03", label: "Maret" },
    { value: "04", label: "April" },
    { value: "05", label: "Mei" },
    { value: "06", label: "Juni" },
    { value: "07", label: "Juli" },
    { value: "08", label: "Agustus" },
    { value: "09", label: "September" },
    { value: "10", label: "Oktober" },
    { value: "11", label: "November" },
    { value: "12", label: "Desember" },
  ];

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Laporan Shift</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Riwayat shift report milik {user?.name ?? "Anda"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-gray-400" />
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Summary bar ── */}
      {!isLoading && shifts.length > 0 && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-5 text-white shadow-lg">
          <p className="text-sm font-medium opacity-80">
            Total Shift — {MONTHS.find((m) => m.value === filterMonth)?.label} {filterYear}
          </p>
          <p className="text-3xl font-extrabold mt-1">{shifts.length} Shift</p>
          <p className="text-xs opacity-70 mt-1">
            Saldo total:{" "}
            {formatRp(
              shifts.reduce((sum, s) => sum + Number(s.balance ?? s.summary?.balance ?? 0), 0)
            )}
          </p>
        </div>
      )}

      {/* ── Tabel ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">
            Daftar Shift Report
            {meta.total != null && (
              <span className="ml-2 text-sm font-normal text-gray-400">
                ({meta.total} shift)
              </span>
            )}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                {[
                  "No",
                  "Tanggal",
                  "Shift",
                  "Jam Mulai",
                  "Jam Selesai",
                  "Saldo Akhir",
                  "Aksi",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : shifts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-gray-400">
                    <FileText size={40} className="mx-auto mb-3 opacity-20" />
                    <p className="text-sm">
                      Tidak ada shift report untuk{" "}
                      {MONTHS.find((m) => m.value === filterMonth)?.label} {filterYear}
                    </p>
                  </td>
                </tr>
              ) : (
                shifts.map((shift, idx) => {
                  const balance =
                    shift.balance ?? shift.summary?.balance ?? 0;
                  const isPositive = Number(balance) >= 0;
                  return (
                    <tr key={shift.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                        {formatDate(shift.started_at)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                          {SHIFT_LABEL[shift.type] ?? shift.type ?? "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {formatTime(shift.started_at)}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {shift.ended_at ? formatTime(shift.ended_at) : (
                          <span className="text-emerald-600 font-medium text-xs">Aktif</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`font-bold ${isPositive ? "text-gray-800" : "text-red-600"}`}>
                          {formatRp(balance)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {shift.status === "closed" ? (
                          <button
                            onClick={() => handleDownload(shift)}
                            disabled={downloadingId === shift.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
                            title="Download Shift Report PDF"
                          >
                            <Download size={13} />
                            {downloadingId === shift.id ? "Mengunduh..." : "Download PDF"}
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Shift aktif</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportPage;
