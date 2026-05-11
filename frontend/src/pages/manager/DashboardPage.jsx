import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Users,
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
  Bell,
  Wallet,
  BarChart2,
  AlertTriangle,
  Building2,
} from "lucide-react";
import dashboardService from "../../services/dashboardService";
import api from "../../utils/axios";
import toast from "react-hot-toast";

// ─── Helper: Format Rupiah ──────────────────────────────────────────────────
const formatRp = (val) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })
    .format(val ?? 0)
    .replace("IDR", "Rp");

// ─── Skeleton ───────────────────────────────────────────────────────────────
const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />
);

// ─── Trend Badge ─────────────────────────────────────────────────────────────
const TrendBadge = ({ value }) => {
  if (value > 0) return (
    <span className="flex items-center gap-0.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
      <TrendingUp size={11} /> +{value}%
    </span>
  );
  if (value < 0) return (
    <span className="flex items-center gap-0.5 text-xs font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
      <TrendingDown size={11} /> {value}%
    </span>
  );
  return (
    <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">—</span>
  );
};

// ─── Donut Chart ─────────────────────────────────────────────────────────────
const DonutChart = ({ value, label, color, total = 100 }) => {
  const filled   = Math.min(value, total);
  const empty    = total - filled;
  const pct      = Math.round((filled / total) * 100);
  const chartData = [{ value: filled }, { value: empty }];

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-32 h-32">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              innerRadius={42}
              outerRadius={58}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              stroke="none"
            >
              <Cell fill={color} />
              <Cell fill="#F3F4F6" />
            </Pie>
            <Tooltip formatter={(v, n, p) => p.dataKey} />
          </PieChart>
        </ResponsiveContainer>
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-extrabold text-gray-800">{pct}%</span>
        </div>
      </div>
      <p className="text-sm font-medium text-gray-600 text-center">{label}</p>
    </div>
  );
};

// ─── Main Dashboard Manager ─────────────────────────────────────────────────
const DashboardPage = () => {
  const queryClient = useQueryClient();
  const today       = new Date().toISOString().split("T")[0];

  // KAS today
  const { data: kasData, isLoading: kasLoading, refetch: refetchKas } = useQuery({
    queryKey: ["kas-today-manager", today],
    queryFn:  () => api.get(`/kas?date=${today}`).then(r => r.data),
    refetchInterval: 5 * 60 * 1000,
  });

  // Expenses today
  const { data: expenseData, isLoading: expLoading, refetch: refetchExp } = useQuery({
    queryKey: ["expense-today-manager", today],
    queryFn:  () => api.get(`/expenses?date=${today}`).then(r => r.data),
    refetchInterval: 5 * 60 * 1000,
  });

  // Pending expenses
  const { data: pendingData, isLoading: pendingLoading, refetch: refetchPending } = useQuery({
    queryKey: ["pending-expenses"],
    queryFn:  () => api.get("/expenses?status=pending").then(r => r.data),
    refetchInterval: 5 * 60 * 1000,
  });

  // Reservations today
  const { data: resvData, isLoading: resvLoading, refetch: refetchResv } = useQuery({
    queryKey: ["reservations-today-manager", today],
    queryFn:  () => api.get(`/reservations?date_from=${today}&date_to=${today}`).then(r => r.data),
    refetchInterval: 5 * 60 * 1000,
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: (id) => api.post(`/expenses/${id}/approve`),
    onSuccess: () => {
      toast.success("Pengeluaran berhasil disetujui.");
      queryClient.invalidateQueries({ queryKey: ["pending-expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense-today-manager"] });
    },
    onError: () => toast.error("Gagal menyetujui pengeluaran."),
  });

  const totalRevenue  = kasData?.meta?.total_amount ?? 0;
  const totalExpenses = expenseData?.meta?.totals?.total_valid ?? 0;
  const finalBalance  = totalRevenue - totalExpenses;
  const pendingItems  = pendingData?.data ?? [];
  const pendingCount  = pendingItems.length;

  const totalRooms    = 30; // 101-110, 201-210, 301-310
  const occupiedRooms = resvData?.meta?.summary?.total_reservations ?? 0;
  const occupancyRate = Math.min(Math.round((occupiedRooms / totalRooms) * 100), 100);

  const maxDailyRevenue = 10_000_000; // Target pendapatan harian (bisa disesuaikan)
  const revenueRate     = Math.min(Math.round((totalRevenue / maxDailyRevenue) * 100), 100);

  const handleRefreshAll = () => {
    refetchKas(); refetchExp(); refetchPending(); refetchResv();
  };

  return (
    <div className="space-y-6">

      {/* ── Greeting ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manager Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <button
          onClick={handleRefreshAll}
          className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-lg transition-colors"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* ── Summary Cards ── */}
      {kasLoading || expLoading || resvLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Occupancy Rate */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2.5 bg-indigo-50 rounded-xl">
                <Building2 size={20} className="text-indigo-600" />
              </div>
              <TrendBadge value={0} />
            </div>
            <p className="text-3xl font-bold text-gray-800">{occupancyRate}%</p>
            <p className="text-sm text-gray-500 mt-0.5">Occupancy Rate</p>
            <p className="text-xs text-gray-400 mt-0.5">{occupiedRooms} dari {totalRooms} kamar</p>
          </div>

          {/* Total Revenue */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2.5 bg-emerald-50 rounded-xl">
                <TrendingUp size={20} className="text-emerald-600" />
              </div>
              <TrendBadge value={0} />
            </div>
            <p className="text-2xl font-bold text-gray-800">{formatRp(totalRevenue)}</p>
            <p className="text-sm text-gray-500 mt-0.5">Total Revenue Hari Ini</p>
          </div>

          {/* Total Expenses */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2.5 bg-red-50 rounded-xl">
                <TrendingDown size={20} className="text-red-500" />
              </div>
              <TrendBadge value={0} />
            </div>
            <p className="text-2xl font-bold text-gray-800">{formatRp(totalExpenses)}</p>
            <p className="text-sm text-gray-500 mt-0.5">Total Expenses Hari Ini</p>
          </div>
        </div>
      )}

      {/* ── Middle Grid: Charts + Pending Approval ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Statistical Charts ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-6">
            <BarChart2 size={18} className="text-indigo-600" />
            <h2 className="font-semibold text-gray-800">Statistical Overview</h2>
          </div>
          <div className="flex items-center justify-around">
            <DonutChart
              value={occupancyRate}
              label="Occupancy Rate"
              color="#4F46E5"
              total={100}
            />
            <DonutChart
              value={revenueRate}
              label="7 Days Revenue"
              color="#10B981"
              total={100}
            />
          </div>
          {/* Balance summary */}
          <div className="mt-5 p-4 rounded-xl bg-gray-50 border border-gray-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Final Balance Hari Ini</span>
              <span className={`text-base font-extrabold ${finalBalance >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                {formatRp(finalBalance)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${revenueRate}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">{revenueRate}% dari target harian</p>
          </div>
        </div>

        {/* ── Pending Approval ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-500" />
              <h2 className="font-semibold text-gray-800">Pending Approval</h2>
              {pendingCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {pendingCount}
                </span>
              )}
            </div>
          </div>

          {pendingLoading ? (
            <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-14" />)}</div>
          ) : pendingItems.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <CheckCircle size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Semua pengeluaran sudah diproses</p>
            </div>
          ) : (
            <>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {pendingItems.map(exp => (
                  <div key={exp.id} className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{exp.description}</p>
                      <p className="text-xs text-gray-500">
                        {exp.user?.name} · {exp.total_price_formatted}
                      </p>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => approveMutation.mutate(exp.id)}
                        disabled={approveMutation.isPending}
                        className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg transition-colors"
                        title="Setujui"
                      >
                        <CheckCircle size={15} />
                      </button>
                      <Link
                        to="/manager/approval"
                        className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
                        title="Lihat Detail"
                      >
                        <Eye size={15} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                to="/manager/approval"
                className="mt-3 flex items-center justify-center w-full py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
              >
                Lihat Semua ({pendingCount})
              </Link>
            </>
          )}
        </div>
      </div>

      {/* ── FO Statistics (Recent Transactions) ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users size={18} className="text-indigo-600" />
          <h2 className="font-semibold text-gray-800">Front Office Statistics</h2>
          <span className="text-xs text-gray-400 ml-1">Aktivitas hari ini</span>
        </div>

        {expLoading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12" />)}</div>
        ) : (expenseData?.data ?? []).length === 0 ? (
          <div className="text-center py-6 text-gray-400">
            <Users size={28} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Belum ada aktivitas FO hari ini</p>
          </div>
        ) : (
          <div className="space-y-2">
            {(expenseData?.data ?? []).slice(0, 5).map(exp => (
              <div key={exp.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm flex-shrink-0">
                  {exp.user?.name?.charAt(0).toUpperCase() ?? "F"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{exp.user?.name}</p>
                  <p className="text-xs text-gray-500 truncate">{exp.description}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-red-500">{exp.total_price_formatted}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    exp.status === "auto_approved" || exp.status === "approved"
                      ? "bg-emerald-50 text-emerald-700"
                      : exp.status === "pending"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-red-50 text-red-700"
                  }`}>
                    {exp.status_label}
                  </span>
                </div>
                {exp.status === "pending" && (
                  <button
                    onClick={() => approveMutation.mutate(exp.id)}
                    disabled={approveMutation.isPending}
                    className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg transition-colors flex-shrink-0"
                    title="Setujui"
                  >
                    <CheckCircle size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
