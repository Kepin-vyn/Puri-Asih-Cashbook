import { useState } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown, FileText } from "lucide-react";

/**
 * DataTable — Reusable tabel dengan sort, skeleton, empty state, pagination
 *
 * Props:
 *   columns      : Array<{ key, label, render?, className?, sortable? }>
 *   data         : Array<object>
 *   isLoading    : boolean
 *   emptyMessage : string
 *   pageSize     : number (default 15)
 *   onRowClick   : (row) => void  (optional)
 *   footer       : ReactNode      (optional — untuk subtotal row)
 */

const SkeletonRow = ({ colCount }) => (
  <tr>
    {Array.from({ length: colCount }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <div className="h-4 bg-gray-200 rounded animate-pulse" />
      </td>
    ))}
  </tr>
);

const SortIcon = ({ direction }) => {
  if (direction === "asc")  return <ChevronUp size={13} className="text-blue-600" />;
  if (direction === "desc") return <ChevronDown size={13} className="text-blue-600" />;
  return <ChevronsUpDown size={13} className="text-gray-300" />;
};

const DataTable = ({
  columns = [],
  data = [],
  isLoading = false,
  emptyMessage = "Tidak ada data",
  pageSize = 15,
  onRowClick,
  footer,
}) => {
  const [sortKey, setSortKey]       = useState(null);
  const [sortDir, setSortDir]       = useState("asc");
  const [page, setPage]             = useState(1);

  // ── Sort ──────────────────────────────────────────────────────────────────
  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  };

  const sorted = [...data].sort((a, b) => {
    if (!sortKey) return 0;
    const va = a[sortKey] ?? "";
    const vb = b[sortKey] ?? "";
    const cmp =
      typeof va === "number" && typeof vb === "number"
        ? va - vb
        : String(va).localeCompare(String(vb), "id");
    return sortDir === "asc" ? cmp : -cmp;
  });

  // ── Pagination ────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated  = sorted.slice((page - 1) * pageSize, page * pageSize);

  // Page numbers to show (max 5 buttons)
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
  );

  return (
    <div>
      {/* ── Table ── */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap select-none ${
                    col.sortable ? "cursor-pointer hover:text-gray-700" : ""
                  } ${col.headerClassName ?? ""}`}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable && (
                      <SortIcon direction={sortKey === col.key ? sortDir : null} />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={i} colCount={columns.length} />
              ))
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-14 text-gray-400">
                  <FileText size={36} className="mx-auto mb-3 opacity-20" />
                  <p className="text-sm">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              paginated.map((row, idx) => (
                <tr
                  key={row.id ?? idx}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`hover:bg-gray-50 transition-colors ${
                    onRowClick ? "cursor-pointer" : ""
                  }`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3 text-gray-700 ${col.className ?? ""}`}
                    >
                      {col.render
                        ? col.render(row, (page - 1) * pageSize + idx)
                        : (row[col.key] ?? "-")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>

          {/* Optional footer (subtotal row) */}
          {footer && !isLoading && data.length > 0 && (
            <tfoot>{footer}</tfoot>
          )}
        </table>
      </div>

      {/* ── Pagination ── */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, sorted.length)} dari{" "}
            {sorted.length} data
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-40 transition-colors"
            >
              ← Prev
            </button>
            {pageNumbers.reduce((acc, p, i, arr) => {
              if (i > 0 && p - arr[i - 1] > 1) acc.push("...");
              acc.push(p);
              return acc;
            }, []).map((p, i) =>
              p === "..." ? (
                <span key={`e-${i}`} className="px-2 text-gray-400 text-xs">…</span>
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
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-40 transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
