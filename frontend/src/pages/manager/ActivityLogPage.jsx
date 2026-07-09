import { useState, useEffect, useRef } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  FileText,
  Search,
 
  Calendar,
 
 
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { activityLogService } from "../../services/activityLogService";

// ─── Module Labels & Colors ─────────────────────────────────────────────────
const moduleConfig = {
  reservation: { label: "Reservasi", color: "bg-blue-100 text-black" },
  kas:         { label: "KAS", color: "bg-emerald-100 text-emerald-700" },
  deposit:     { label: "Deposit", color: "bg-amber-100 text-amber-700" },
  expense:     { label: "Pengeluaran", color: "bg-red-100 text-red-700" },
  shift:       { label: "Shift", color: "bg-purple-100 text-purple-700" },
  attendance:  { label: "Absensi", color: "bg-indigo-100 text-black" },
};

const actionLabels = {
  create: "Buat",
  update: "Ubah",
  delete: "Hapus",
  checkin: "Check-In",
  checkout: "Check-Out",
  refund: "Refund",
  forfeit: "Hangus",
  handover: "Handover",
  approve: "Approve",
  reject: "Reject",
  update_status: "Ubah Status",
};

// ─── Format helpers ─────────────────────────────────────────────────────────
const formatTime = (isoStr) => {
  if (!isoStr) return "-";
  const d = new Date(isoStr);
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ─── Skeleton ───────────────────────────────────────────────────────────────
const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse bg-[#e5e5e5] rounded-lg ${className}`} />
);

// ─── Component ──────────────────────────────────────────────────────────────
export default function ActivityLogPage() {
  const [filters, setFilters] = useState({
    date: "",
    module: "",
    search: "",
    user_id: "",
    page: 1,
  });
  const [searchInput, setSearchInput] = useState("");
  const [metaCache, setMetaCache] = useState({}); // id -> meta
  const debounceRef = useRef(null);

  // Debounce search input (400ms)
  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      setFilters((f) => ({ ...f, search: searchInput, page: 1 }));
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [searchInput]);

  const {
    data: logsData,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["activity-logs"],
    queryFn: async () => {
      const params = {};
      if (filters.date) params.date = filters.date;
      if (filters.module) params.module = filters.module;
      if (filters.search) params.search = filters.search;
      if (filters.user_id) params.user_id = filters.user_id;
      params.page = filters.page;
      params.per_page = 30;
      const res = await activityLogService.getLogs(params);
      return res;
    },
    placeholderData: keepPreviousData,
  });

  const logs = logsData?.data || [];
  const pagination = logsData?.meta || {};

  const handlePageChange = (newPage) => {
    setFilters((f) => ({ ...f, page: newPage }));
  };

  const handleReset = () => {
    setFilters({ date: "", module: "", search: "", user_id: "", page: 1 });
    setSearchInput("");
  };

  // Lazy load meta for a specific log
  const loadMeta = async (logId) => {
    if (metaCache[logId] !== undefined) return; // already loaded
    try {
      const res = await activityLogService.getLogDetail(logId);
      setMetaCache((c) => ({ ...c, [logId]: res?.data?.meta ?? null }));
    } catch {
      setMetaCache((c) => ({ ...c, [logId]: null }));
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 rounded-xl">
              <FileText className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Activity Log</h1>
              <p className="text-sm text-[#737373]">
                Log aktivitas staff untuk audit trail dan akuntabilitas
              </p>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-[#e5e5e5] rounded-lg hover:bg-[#fafafa] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl  border border-[#e5e5e5] mb-6">
          <div className="p-4 flex flex-wrap items-center gap-3">
            {/* Date filter */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#a3a3a3]" />
              <input
                type="date"
                value={filters.date}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, date: e.target.value, page: 1 }))
                }
                className="px-3 py-1.5 border border-[#e5e5e5] rounded-lg text-sm focus:outline-none  focus:ring-0"
              />
            </div>

            {/* Module filter */}
            <select
              value={filters.module}
              onChange={(e) =>
                setFilters((f) => ({ ...f, module: e.target.value, page: 1 }))
              }
              className="px-3 py-1.5 border border-[#e5e5e5] rounded-lg text-sm focus:outline-none  focus:ring-0"
            >
              <option value="">Semua Modul</option>
              {Object.entries(moduleConfig).map(([key, { label }]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>

            {/* Search */}
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a3a3a3]" />
              <input
                type="text"
                placeholder="Cari aktivitas..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-[#e5e5e5] rounded-lg text-sm focus:outline-none  focus:ring-0"
              />
            </div>

            {/* Reset */}
            <button
              onClick={handleReset}
              className="px-3 py-1.5 text-sm text-[#737373] hover:text-[#525252] hover:bg-[#fafafa] rounded-lg transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl  border border-[#e5e5e5] overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-[#737373]">Belum ada aktivitas tercatat.</p>
              <p className="text-sm text-[#a3a3a3] mt-1">
                Log akan muncul setelah staff melakukan aksi.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#fafafa] border-b border-[#e5e5e5]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#737373] uppercase">
                        Waktu
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#737373] uppercase">
                        Staff
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#737373] uppercase">
                        Modul
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#737373] uppercase">
                        Aksi
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#737373] uppercase">
                        Deskripsi
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#737373] uppercase">
                        Detail
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5e5e5]">
                    {logs.map((log) => {
                      const modCfg = moduleConfig[log.module] || {
                        label: log.module,
                        color: "bg-[#fafafa] text-[#525252]",
                      };
                      return (
                        <tr key={log.id} className="hover:bg-[#fafafa] transition-colors">
                          <td className="px-4 py-3 text-sm text-[#525252] whitespace-nowrap">
                            {formatTime(log.created_at)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-[#e5e5e5] flex items-center justify-center text-xs font-semibold text-[#525252]">
                                {log.user?.name?.[0]?.toUpperCase() || "?"}
                              </div>
                              <span className="text-sm font-medium text-black">
                                {log.user?.name || "-"}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${modCfg.color}`}
                            >
                              {modCfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-[#525252]">
                            {actionLabels[log.action] || log.action}
                          </td>
                          <td className="px-4 py-3 text-sm text-[#525252] max-w-md">
                            {log.description}
                          </td>
                          <td className="px-4 py-3 text-xs text-[#737373]">
                            {(() => {
                              const cached = metaCache[log.id];
                              if (cached === undefined) {
                                return (
                                  <button
                                    onClick={() => loadMeta(log.id)}
                                    className="text-blue-500 hover:text-black text-xs"
                                  >
                                    Lihat detail
                                  </button>
                                );
                              }
                              if (cached === null) return <span className="text-[#a3a3a3]">-</span>;
                              return (
                                <details className="cursor-pointer">
                                  <summary className="text-blue-500 hover:text-black">
                                    Lihat detail
                                  </summary>
                                  <pre className="mt-1 p-2 bg-[#fafafa] rounded text-xs overflow-x-auto max-w-xs">
                                    {JSON.stringify(cached, null, 2)}
                                  </pre>
                                </details>
                              );
                            })()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.last_page > 1 && (
                <div className="p-4 border-t border-[#e5e5e5] flex items-center justify-between">
                  <p className="text-sm text-[#737373]">
                    Halaman {pagination.current_page} dari {pagination.last_page} (
                    {pagination.total} total)
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(filters.page - 1)}
                      disabled={filters.page <= 1}
                      className="p-2 rounded-lg hover:bg-[#fafafa] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handlePageChange(filters.page + 1)}
                      disabled={filters.page >= pagination.last_page}
                      className="p-2 rounded-lg hover:bg-[#fafafa] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
