/**
 * StatusBadge — Badge generik untuk status berbagai modul
 *
 * Props:
 *   status: string  — nilai status dari DB
 *   type: "reservation" | "deposit" | "expense"  — menentukan palet warna
 */

const CONFIGS = {
  reservation: {
    checkin:  { label: "Check-In",  cls: "bg-emerald-100 text-emerald-700 ring-emerald-200" },
    checkout: { label: "Check-Out", cls: "bg-gray-100 text-gray-600 ring-gray-200" },
    cancel:   { label: "Cancel",    cls: "bg-red-100 text-red-700 ring-red-200" },
    noshow:   { label: "No Show",   cls: "bg-amber-100 text-amber-700 ring-amber-200" },
  },
  deposit: {
    active:    { label: "Aktif",      cls: "bg-emerald-100 text-emerald-700 ring-emerald-200" },
    refunded:  { label: "Refunded",   cls: "bg-blue-100 text-blue-700 ring-blue-200" },
    forfeited: { label: "Forfeited",  cls: "bg-red-100 text-red-700 ring-red-200" },
  },
  expense: {
    auto_approved: { label: "Auto Approved", cls: "bg-emerald-100 text-emerald-700 ring-emerald-200" },
    pending:       { label: "Pending",       cls: "bg-amber-100 text-amber-700 ring-amber-200" },
    approved:      { label: "Approved",      cls: "bg-blue-100 text-blue-700 ring-blue-200" },
    rejected:      { label: "Rejected",      cls: "bg-red-100 text-red-700 ring-red-200" },
  },
};

const StatusBadge = ({ status, type = "reservation" }) => {
  const config = CONFIGS[type]?.[status];

  if (!config) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 bg-gray-100 text-gray-500 ring-gray-200">
        {status ?? "-"}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ${config.cls}`}
    >
      {config.label}
    </span>
  );
};

export default StatusBadge;
