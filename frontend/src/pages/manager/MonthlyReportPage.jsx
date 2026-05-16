
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, X, TrendingUp, TrendingDown, BarChart3, Receipt } from "lucide-react";
import toast from "react-hot-toast";
import reportService from "../../services/reportService";
import userService from "../../services/userService";
import MonthYearPicker from "../../components/ui/MonthYearPicker";
import DataTable from "../../components/ui/DataTable";
import { formatDateShort, formatTime } from "../../utils/dateFormatter";

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatRp = (v) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  })
    .format(v ?? 0)
    .replace("IDR", "Rp");

const formatDate = (iso) => formatDateShort(iso);

const SHIFT_LABEL   = { pagi: "Pagi", siang: "Siang", malam: "Malam" };
const MONTHS_LABEL  = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember",
];

const now = new Date();
const defaultPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

// ── Summary Card ──────────────────────────────────────────────────────────────
const SummaryCard = ({ icon: Icon, label, value, count, countLabel, color }) => {
  const colorMap = {
    green:  { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", icon: "bg-emerald-100 text-emerald-600" },
    blue:   { bg: "bg-blue-50",    border: "border-blue-200",    text: "text-blue-700",    icon: "bg-blue-100 text-blue-600" },
    red:    { bg: "bg-red-50",     border: "border-red-200",     text: "text-red-700",     icon: "bg-red-100 text-red-600" },
    auto:   { bg: "bg-white",      border: "border-gray-200",    text: "text-gray-800",    icon: "bg-gray-100 text-gray-600" },
  };
  const c = colorMap[color] ?? colorMap.auto;
  return (
    <div className={`rounded-2xl p-5 border ${c.bg} ${c.border}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${c.icon}`}>
          <Icon size={18} />
        </div>
        {count != null && (
          <span className="text-xs font-semibold text-gray-400">
            {count} {countLabel}
          </span>
        )}
      </div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-xl font-extrabold ${c.text}`}>{formatRp(value)}</p>
    </div>
  );
};

// ── Drill-down Modal ──────────────────────────────────────────────────────────
const DrillDownModal = ({ date, params, onClose }) => {
  const { data, isLoading } = useQuery({
    queryKey: ["monthly-detail", date, params],
    queryFn: () => reportService.getMonthlyDetail({ ...params, date }),
    enabled: !!date,
  });
  const detail = data?.data ?? {};

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 flex-shrink-0">
          <div>
            <h3 className="font-bold text-gray-800">Detail Transaksi</h3>
            <p className="text-sm text-gray-500 mt-0.5">{formatDate(date)}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-5 space-y-5">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {/* KAS */}
              {(detail.kas ?? []).length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">KAS Harian</h4>
                  <div className="space-y-2">
                    {detail.kas.map((t) => (
                      <div key={t.id} className="flex items-center justify-between bg-emerald-50 rounded-xl px-4 py-2.5">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{t.guest_name}</p>
                          <p className="text-xs text-gray-500">Kamar {t.room_number} · {t.transaction_type}</p>
                        </div>
                        <p className="text-sm font-bold text-emerald-700">{formatRp(t.amount)}</p>
                      </div>
                    ))}
                    <div className="flex justify-between px-4 py-2 bg-emerald-100 rounded-xl">
                      <span className="text-xs font-bold text-emerald-700">Subtotal KAS</span>
                      <span className="text-xs font-bold text-emerald-700">
                        {formatRp(detail.kas.reduce((s, t) => s + Number(t.amount ?? 0), 0))}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Reservasi */}
              {(detail.reservations ?? []).length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Reservasi OTT</h4>
                  <div className="space-y-2">
                    {detail.reservations.map((r) => (
                      <div key={r.id} className="flex items-center justify-between bg-blue-50 rounded-xl px-4 py-2.5">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{r.guest_name}</p>
                          <p className="text-xs text-gray-500">Kamar {r.room_number} · {r.invoice_number ?? "-"}</p>
                        </div>
                        <p className="text-sm font-bold text-blue-700">{formatRp(r.down_payment ?? r.room_price ?? 0)}</p>
                      </div>
                    ))}
                    <div className="flex justify-between px-4 py-2 bg-blue-100 rounded-xl">
                      <span className="text-xs font-bold text-blue-700">Subtotal Reservasi</span>
                      <span className="text-xs font-bold text-blue-700">
                        {formatRp(detail.reservations.reduce((s, r) => s + Number(r.down_payment ?? r.room_price ?? 0), 0))}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Pengeluaran */}
              {(detail.expenses ?? []).length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Pengeluaran</h4>
                  <div className="space-y-2">
                    {detail.expenses.map((e) => (
                      <div key={e.id} className="flex items-center justify-between bg-red-50 rounded-xl px-4 py-2.5">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{e.description}</p>
                          <p className="text-xs text-gray-500">{e.user?.name ?? "-"}</p>
                        </div>
                        <p className="text-sm font-bold text-red-700">{formatRp(e.total_price)}</p>
                      </div>
                    ))}
                    <div className="flex justify-between px-4 py-2 bg-red-100 rounded-xl">
                      <span className="text-xs font-bold text-red-700">Subtotal Pengeluaran</span>
                      <span className="text-xs font-bold text-red-700">
                        {formatRp(detail.expenses.reduce((s, e) => s + Number(e.total_price ?? 0), 0))}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Empty */}
              {!detail.kas?.length && !detail.reservations?.length && !detail.expenses?.length && (
                <p className="text-center text-gray-400 text-sm py-8">Tidak ada transaksi pada tanggal ini.</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const MonthlyReportPage = () => {
  // ── Filter state ──────────────────────────────────────────────────────────
  const [period,       setPeriod]       = useState(defaultPeriod);   // "YYYY-MM"
  const [staffId,      setStaffId]      = useState("");
  const [appliedPeriod, setAppliedPeriod] = useState(defaultPeriod);
  const [appliedStaff,  setAppliedStaff]  = useState("");
  const [activeTab,    setActiveTab]    = useState("kas");
  const [drillDate,    setDrillDate]    = useState(null);
  const [exporting,    setExporting]    = useState(false);

  const [yearStr, monthStr] = appliedPeriod.split("-");

  const queryParams = {
    month:   monthStr,
    year:    yearStr,
    ...(appliedStaff && { user_id: appliedStaff }),
  };

  // ── Fetch FO users for filter ─────────────────────────────────────────────
  const { data: usersData } = useQuery({
    queryKey: ["fo-users"],
    queryFn:  userService.getAllFo,
    retry: false,
  });
  const foUsers = usersData?.data ?? [];

  // ── Fetch summary ─────────────────────────────────────────────────────────
  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ["monthly-summary", queryParams],
    queryFn:  () => reportService.getMonthlySummary(queryParams),
  });
  const summary = summaryData?.data ?? {};

  // ── Fetch monthly data (detail transaksi) ─────────────────────────────────
  const { data: monthlyData, isLoading: dataLoading } = useQuery({
    queryKey: ["monthly-data", queryParams],
    queryFn:  () => reportService.getMonthlyData(queryParams),
  });
  const monthly = monthlyData?.data ?? {};

  // ── Apply filter ──────────────────────────────────────────────────────────
  const handleApply = () => {
    setAppliedPeriod(period);
    setAppliedStaff(staffId);
    setActiveTab("kas");
  };

  // ── Export PDF ────────────────────────────────────────────────────────────
  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await reportService.exportMonthlyPdf(queryParams);
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a   = document.createElement("a");
      a.href    = url;
      a.download = `monthly-report-${appliedPeriod}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF berhasil diunduh!");
    } catch {
      toast.error("Gagal mengunduh PDF.");
    } finally {
      setExporting(false);
    }
  };

  // ── Derived values ────────────────────────────────────────────────────────
  const balance      = Number(summary.balance ?? summary.net_balance ?? 0);
  const isPositive   = balance >= 0;
  const periodLabel  = `${MONTHS_LABEL[Number(monthStr) - 1]} ${yearStr}`;

  // ── Column definitions ────────────────────────────────────────────────────
  const KAS_COLS = [
    {
      key: "created_at", label: "Tanggal", sortable: true,
      render: (r) => (
        <button
          onClick={(e) => { e.stopPropagation(); setDrillDate(r.created_at?.split("T")[0]); }}
          className="text-blue-600 hover:underline font-medium text-left"
        >
          {formatDate(r.created_at)}
        </button>
      ),
    },
    {
      key: "shift_type", label: "Shift",
      render: (r) => (
        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
          {SHIFT_LABEL[r.shift?.type ?? r.shift_type] ?? "-"}
        </span>
      ),
    },
    { key: "user_name",  label: "FO",     sortable: true, render: (r) => r.user?.name ?? r.user_name ?? "-" },
    { key: "guest_name", label: "Tamu",   sortable: true },
    {
      key: "transaction_type", label: "Jenis",
      render: (r) => {
        const map = { reservasi: "Reservasi", checkin: "Check-In", pelunasan: "Pelunasan" };
        return map[r.transaction_type] ?? r.transaction_type ?? "-";
      },
    },
    {
      key: "payment_method", label: "Metode",
      render: (r) => {
        const map = { tunai: "Cash", transfer: "Transfer", qris: "QRIS", kartu_kredit: "Kartu Kredit" };
        return map[r.payment_method] ?? r.payment_method ?? "-";
      },
    },
    {
      key: "amount", label: "Jumlah", sortable: true,
      className: "text-right font-semibold text-gray-800",
      render: (r) => formatRp(r.amount),
    },
  ];

  const RESERVATION_COLS = [
    {
      key: "created_at", label: "Tanggal", sortable: true,
      render: (r) => (
        <button
          onClick={(e) => { e.stopPropagation(); setDrillDate(r.created_at?.split("T")[0]); }}
          className="text-blue-600 hover:underline font-medium text-left"
        >
          {formatDate(r.created_at)}
        </button>
      ),
    },
    { key: "invoice_number", label: "Invoice", render: (r) => r.invoice_number ?? "-" },
    { key: "guest_name",     label: "Tamu",    sortable: true },
    { key: "room_number",    label: "Kamar",   sortable: true },
    {
      key: "source", label: "Sumber",
      render: (r) => {
        const map = { walk_in: "Walk-In", tiket: "Tiket", booking: "Booking" };
        return map[r.source] ?? r.source ?? "-";
      },
    },
    {
      key: "down_payment", label: "Total", sortable: true,
      className: "text-right font-semibold text-gray-800",
      render: (r) => formatRp(r.down_payment ?? r.room_price ?? 0),
    },
    {
      key: "status", label: "Status",
      render: (r) => {
        const map = {
          checkin:  "bg-emerald-100 text-emerald-700",
          checkout: "bg-gray-100 text-gray-600",
          cancel:   "bg-red-100 text-red-700",
          noshow:   "bg-amber-100 text-amber-700",
        };
        return (
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[r.status] ?? "bg-gray-100 text-gray-500"}`}>
            {r.status ?? "-"}
          </span>
        );
      },
    },
  ];

  const EXPENSE_COLS = [
    {
      key: "created_at", label: "Tanggal", sortable: true,
      render: (r) => (
        <button
          onClick={(e) => { e.stopPropagation(); setDrillDate(r.created_at?.split("T")[0]); }}
          className="text-blue-600 hover:underline font-medium text-left"
        >
          {formatDate(r.created_at)}
        </button>
      ),
    },
    { key: "user_name",   label: "FO",          render: (r) => r.user?.name ?? r.user_name ?? "-" },
    { key: "description", label: "Keterangan",  sortable: true },
    {
      key: "total_price", label: "Total", sortable: true,
      className: "text-right font-semibold text-gray-800",
      render: (r) => formatRp(r.total_price),
    },
    {
      key: "status", label: "Status Approval",
      render: (r) => {
        const map = {
          auto_approved: "bg-emerald-100 text-emerald-700",
          approved:      "bg-blue-100 text-blue-700",
        };
        const labels = { auto_approved: "Auto Approved", approved: "Disetujui" };
        return (
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[r.status] ?? "bg-gray-100 text-gray-500"}`}>
            {labels[r.status] ?? r.status ?? "-"}
          </span>
        );
      },
    },
  ];

  // ── Tab config ────────────────────────────────────────────────────────────
  const kasItems         = monthly.kas ?? [];
  const reservationItems = monthly.reservations ?? [];
  // Hanya tampilkan pengeluaran yang approved
  const expenseItems     = (monthly.expenses ?? []).filter(
    (e) => e.status === "approved" || e.status === "auto_approved"
  );

  const kasSubtotal         = kasItems.reduce((s, t) => s + Number(t.amount ?? 0), 0);
  const reservationSubtotal = reservationItems.reduce((s, r) => s + Number(r.down_payment ?? r.room_price ?? 0), 0);
  const expenseSubtotal     = expenseItems.reduce((s, e) => s + Number(e.total_price ?? 0), 0);

  const SubtotalRow = ({ label, value, color }) => (
    <tr className={`${color} font-bold text-sm`}>
      <td colSpan={99} className="px-4 py-2.5">
        <div className="flex justify-between">
          <span>{label}</span>
          <span>{formatRp(value)}</span>
        </div>
      </td>
    </tr>
  );

  const TABS = [
    { key: "kas",          label: "KAS Harian",    count: kasItems.length },
    { key: "reservations", label: "Reservasi OTT", count: reservationItems.length },
    { key: "expenses",     label: "Pengeluaran",   count: expenseItems.length },
  ];

  return (
    <div className="space-y-6 pb-10">

      {/* ── Drill-down Modal ── */}
      {drillDate && (
        <DrillDownModal
          date={drillDate}
          params={queryParams}
          onClose={() => setDrillDate(null)}
        />
      )}

      {/* ── Section 1: Filter Bar ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800 mb-1">Monthly Report</h1>
            <p className="text-sm text-gray-500">Laporan keuangan bulanan Hotel Puri Asih</p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-end gap-3">
            {/* Month + Year */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Periode</label>
              <MonthYearPicker value={period} onChange={setPeriod} />
            </div>

            {/* Staff filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Staff FO</label>
              <select
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Staff</option>
                {foUsers.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleApply}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
              >
                Tampilkan
              </button>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-50"
              >
                <Download size={14} />
                {exporting ? "Mengunduh..." : "Export PDF"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 2: Summary Cards ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-700">Ringkasan — {periodLabel}</h2>
          {appliedStaff && (
            <span className="text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full font-semibold">
              Filter: {foUsers.find((u) => String(u.id) === appliedStaff)?.name ?? "Staff"}
            </span>
          )}
        </div>

        {summaryLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <SummaryCard
                icon={TrendingUp}
                label="Total Pemasukan KAS"
                value={summary.total_kas ?? 0}
                count={summary.kas_count}
                countLabel="transaksi"
                color="green"
              />
              <SummaryCard
                icon={Receipt}
                label="Total Pemasukan Reservasi"
                value={summary.total_reservations ?? 0}
                count={summary.reservation_count}
                countLabel="reservasi"
                color="blue"
              />
              <SummaryCard
                icon={TrendingDown}
                label="Total Pengeluaran"
                value={summary.total_expenses ?? 0}
                count={summary.expense_count}
                countLabel="transaksi"
                color="red"
              />
              {/* Saldo Bersih — hijau jika positif, merah jika negatif */}
              <div className={`rounded-2xl p-5 border ${
                isPositive
                  ? "bg-emerald-600 border-emerald-600 text-white"
                  : "bg-red-600 border-red-600 text-white"
              }`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                    <BarChart3 size={18} />
                  </div>
                  <span className="text-xs font-semibold opacity-70">Saldo</span>
                </div>
                <p className="text-xs font-semibold uppercase tracking-wide opacity-80 mb-1">Saldo Bersih Bulan</p>
                <p className="text-xl font-extrabold">{formatRp(balance)}</p>
              </div>
            </div>

            {/* Catatan deposit */}
            <p className="text-xs text-gray-400 mt-2 italic">
              * Deposit tidak termasuk dalam laporan keuangan
            </p>
          </>
        )}
      </div>

      {/* ── Section 3: Tab Detail ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">Detail Transaksi</h2>
          <p className="text-xs text-gray-400 mt-0.5">Klik tanggal untuk melihat detail transaksi hari tersebut</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-5 gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-colors ${
                activeTab === tab.key
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-bold bg-gray-200 text-gray-600">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-2">
          {activeTab === "kas" && (
            <DataTable
              columns={KAS_COLS}
              data={kasItems}
              isLoading={dataLoading}
              emptyMessage="Tidak ada transaksi KAS pada periode ini"
              footer={
                kasItems.length > 0 && (
                  <SubtotalRow
                    label="Subtotal KAS"
                    value={kasSubtotal}
                    color="bg-emerald-50 text-emerald-700"
                  />
                )
              }
            />
          )}
          {activeTab === "reservations" && (
            <DataTable
              columns={RESERVATION_COLS}
              data={reservationItems}
              isLoading={dataLoading}
              emptyMessage="Tidak ada reservasi pada periode ini"
              footer={
                reservationItems.length > 0 && (
                  <SubtotalRow
                    label="Subtotal Reservasi"
                    value={reservationSubtotal}
                    color="bg-blue-50 text-blue-700"
                  />
                )
              }
            />
          )}
          {activeTab === "expenses" && (
            <DataTable
              columns={EXPENSE_COLS}
              data={expenseItems}
              isLoading={dataLoading}
              emptyMessage="Tidak ada pengeluaran yang disetujui pada periode ini"
              footer={
                expenseItems.length > 0 && (
                  <SubtotalRow
                    label="Subtotal Pengeluaran"
                    value={expenseSubtotal}
                    color="bg-red-50 text-red-700"
                  />
                )
              }
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MonthlyReportPage;
