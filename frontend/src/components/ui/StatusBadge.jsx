/**
 * StatusBadge — Badge status fungsional (warna dipertahankan untuk UX)
 * Menggunakan token semantic dari Ollama Design System
 */

const CONFIGS = {
  reservation: {
    checkin:  { label: "Check-In",  cls: "bg-[#f0fdf4] text-[#15803d]" },
    checkout: { label: "Check-Out", cls: "bg-[#f9fafb] text-[#6b7280]" },
    cancel:   { label: "Cancel",    cls: "bg-[#fef2f2] text-[#b91c1c]" },
    noshow:   { label: "No Show",   cls: "bg-[#fffbeb] text-[#b45309]" },
  },
  deposit: {
    active:    { label: "Aktif",     cls: "bg-[#f0fdf4] text-[#15803d]" },
    refunded:  { label: "Refunded",  cls: "bg-[#eff6ff] text-[#1d4ed8]" },
    forfeited: { label: "Forfeited", cls: "bg-[#fef2f2] text-[#b91c1c]" },
  },
  expense: {
    auto_approved: { label: "Auto Approved", cls: "bg-[#f0fdf4] text-[#15803d]" },
    pending:       { label: "Pending",       cls: "bg-[#fffbeb] text-[#b45309]" },
    approved:      { label: "Approved",      cls: "bg-[#eff6ff] text-[#1d4ed8]" },
    rejected:      { label: "Rejected",      cls: "bg-[#fef2f2] text-[#b91c1c]" },
  },
};

const StatusBadge = ({ status, type = "reservation" }) => {
  const config = CONFIGS[type]?.[status];

  if (!config) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-[500] bg-[#f9fafb] text-[#6b7280]">
        {status ?? "-"}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-[500] ${config.cls}`}>
      {config.label}
    </span>
  );
};

export default StatusBadge;
