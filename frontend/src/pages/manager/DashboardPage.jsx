import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { TrendingUp, Users, Eye, RefreshCw, AlertTriangle, BarChart2 } from "lucide-react";
import api from "../../utils/axios";
import toast from "react-hot-toast";

const formatRp = (val) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })
    .format(val ?? 0).replace("IDR", "Rp");

const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse bg-[#fafafa] rounded-xl ${className}`} />
);

const DonutChart = ({ value, label, color, total = 100 }) => {
  const filled  = Math.min(value, total);
  const pct     = Math.round((filled / total) * 100);
  const data    = [{ value: filled }, { value: total - filled }];
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-28 h-28">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} innerRadius={38} outerRadius={52} startAngle={90} endAngle={-270} dataKey="value" stroke="none">
              <Cell fill={color} />
              <Cell fill="#f5f5f5" />
            </Pie>
            <Tooltip formatter={(v, n, p) => p.dataKey} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[18px] font-[600] text-black">{pct}%</span>
        </div>
      </div>
      <p className="text-[13px] text-[#737373] text-center">{label}</p>
    </div>
  );
};

const DashboardPage = () => {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split("T")[0];

  const { data: pendingData, isLoading: pendingLoading, refetch: refetchPending } = useQuery({
    queryKey: ["pending-expenses"],
    queryFn:  () => api.get("/expenses?status=pending").then(r => r.data),
    staleTime: 1 * 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
  });

  const { data: kasData, isLoading: kasLoading, refetch: refetchKas } = useQuery({
    queryKey: ["kas-today-manager", today],
    queryFn:  () => api.get(`/kas?date=${today}`).then(r => r.data),
    staleTime: 10 * 60 * 1000,
    refetchInterval: 15 * 60 * 1000,
  });

  const { data: expenseData, isLoading: expLoading, refetch: refetchExp } = useQuery({
    queryKey: ["expense-today-manager", today],
    queryFn:  () => api.get(`/expenses?date=${today}`).then(r => r.data),
    staleTime: 10 * 60 * 1000,
    refetchInterval: 15 * 60 * 1000,
  });

  const { data: resvData, isLoading: resvLoading, refetch: refetchResv } = useQuery({
    queryKey: ["reservations-today-manager", today],
    queryFn:  () => api.get(`/reservations?date_from=${today}&date_to=${today}`).then(r => r.data),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });

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
  const totalRooms    = 30;
  const occupiedRooms = resvData?.meta?.summary?.total_reservations ?? 0;
  const occupancyRate = Math.min(Math.round((occupiedRooms / totalRooms) * 100), 100);
  const maxDailyRevenue = 10_000_000;
  const revenueRate = Math.min(Math.round((totalRevenue / maxDailyRevenue) * 100), 100);

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[30px] font-[500] text-black leading-[1.2]"
              style={{ fontFamily: "var(--font-display)" }}>
            Manager Dashboard
          </h1>
          <p className="text-[14px] text-[#737373] mt-1">
            {new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <button
          onClick={() => { refetchKas(); refetchExp(); refetchPending(); refetchResv(); }}
          className="flex items-center gap-2 h-9 px-4 rounded-full border border-[#e5e5e5] text-[13px] font-[500] text-[#525252] hover:border-[#a3a3a3] hover:text-black transition-colors"
        >
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      {kasLoading || expLoading || resvLoading ? (
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Occupancy Rate",        value: `${occupancyRate}%`, sub: `${occupiedRooms} dari ${totalRooms} kamar` },
            { label: "Total Revenue Hari Ini", value: formatRp(totalRevenue), sub: null },
            { label: "Total Expenses Hari Ini",value: formatRp(totalExpenses), sub: null },
          ].map(({ label, value, sub }) => (
            <div key={label} className="border border-[#e5e5e5] rounded-xl p-5">
              <p className="text-[12px] font-[500] text-[#737373] uppercase tracking-wide mb-2">{label}</p>
              <p className="text-[24px] font-[500] text-black" style={{ fontFamily: "var(--font-display)" }}>{value}</p>
              {sub && <p className="text-[13px] text-[#a3a3a3] mt-0.5">{sub}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Middle Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Charts */}
        <div className="border border-[#e5e5e5] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <BarChart2 size={15} className="text-[#737373]" />
            <h2 className="text-[16px] font-[500] text-black">Statistical Overview</h2>
          </div>
          <div className="flex items-center justify-around">
            <DonutChart value={occupancyRate} label="Occupancy Rate" color="#000000" total={100} />
            <DonutChart value={revenueRate}   label="Revenue Rate"  color="#525252" total={100} />
          </div>
          <div className="mt-5 pt-4 border-t border-[#e5e5e5]">
            <div className="flex justify-between items-center">
              <span className="text-[14px] text-[#525252]">Final Balance Hari Ini</span>
              <span className={`text-[16px] font-[600] ${finalBalance >= 0 ? "text-black" : "text-[#b91c1c]"}`}>
                {formatRp(finalBalance)}
              </span>
            </div>
          </div>
        </div>

        {/* Pending Approval */}
        <div className="border border-[#e5e5e5] rounded-xl">
          <div className="flex items-center justify-between p-5 border-b border-[#e5e5e5]">
            <div className="flex items-center gap-2">
              <AlertTriangle size={15} className="text-[#737373]" />
              <h2 className="text-[16px] font-[500] text-black">Pending Approval</h2>
              {pendingCount > 0 && (
                <span className="bg-black text-white text-[10px] font-[600] px-1.5 py-0.5 rounded-full">
                  {pendingCount}
                </span>
              )}
            </div>
          </div>
          <div className="p-3">
            {pendingLoading ? (
              <div className="space-y-2">{[1,2].map(i => <Skeleton key={i} className="h-14" />)}</div>
            ) : pendingItems.length === 0 ? (
              <div className="text-center py-8 text-[#a3a3a3] text-[14px]">Semua pengeluaran sudah diproses</div>
            ) : (
              <>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {pendingItems.map(exp => (
                    <div key={exp.id} className="flex items-center gap-3 p-3 bg-[#fafafa] rounded-xl">
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-[500] text-black truncate">{exp.description}</p>
                        <p className="text-[13px] text-[#737373]">{exp.user?.name} · {exp.total_price_formatted}</p>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => approveMutation.mutate(exp.id)}
                          disabled={approveMutation.isPending}
                          className="h-7 px-3 rounded-full bg-black text-white text-[12px] font-[500] hover:bg-[#090909] transition-colors disabled:opacity-50"
                        >
                          Setujui
                        </button>
                        <Link
                          to="/manager/approval"
                          className="h-7 px-3 rounded-full border border-[#e5e5e5] text-[12px] font-[500] text-[#525252] hover:border-[#a3a3a3] hover:text-black transition-colors flex items-center"
                        >
                          <Eye size={12} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
                <Link
                  to="/manager/approval"
                  className="mt-3 flex items-center justify-center w-full h-9 rounded-full border border-[#e5e5e5] text-[13px] font-[500] text-[#525252] hover:border-[#a3a3a3] hover:text-black transition-colors"
                >
                  Lihat Semua ({pendingCount})
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* FO Statistics */}
      <div className="border border-[#e5e5e5] rounded-xl">
        <div className="flex items-center gap-2 p-5 border-b border-[#e5e5e5]">
          <Users size={15} className="text-[#737373]" />
          <h2 className="text-[16px] font-[500] text-black">Front Office Statistics</h2>
          <span className="text-[12px] text-[#a3a3a3]">Aktivitas hari ini</span>
        </div>
        <div className="p-3">
          {expLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12" />)}</div>
          ) : (expenseData?.data ?? []).length === 0 ? (
            <div className="text-center py-6 text-[#a3a3a3] text-[14px]">Belum ada aktivitas FO hari ini</div>
          ) : (
            <div className="divide-y divide-[#e5e5e5]">
              {(expenseData?.data ?? []).slice(0, 5).map(exp => (
                <div key={exp.id} className="flex items-center gap-4 py-3 px-2 hover:bg-[#fafafa] rounded-xl transition-colors">
                  <div className="w-7 h-7 rounded-full bg-[#fafafa] border border-[#e5e5e5] flex items-center justify-center text-[12px] font-[600] text-black flex-shrink-0">
                    {exp.user?.name?.charAt(0).toUpperCase() ?? "F"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-[500] text-black truncate">{exp.user?.name}</p>
                    <p className="text-[13px] text-[#737373] truncate">{exp.description}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[14px] font-[500] text-black">{exp.total_price_formatted}</p>
                    <span className={`text-[12px] px-2 py-0.5 rounded-full font-[500] ${
                      exp.status === "auto_approved" || exp.status === "approved"
                        ? "bg-[#f0fdf4] text-[#15803d]"
                        : exp.status === "pending"
                        ? "bg-[#fffbeb] text-[#b45309]"
                        : "bg-[#fef2f2] text-[#b91c1c]"
                    }`}>
                      {exp.status_label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
