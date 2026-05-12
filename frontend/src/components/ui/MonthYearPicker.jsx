/**
 * MonthYearPicker — Reusable komponen pilih bulan & tahun
 *
 * Props:
 *   value    : string "YYYY-MM"  (e.g. "2025-05")
 *   onChange : (newValue: string) => void
 *   disabled : boolean (optional)
 */

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

const MonthYearPicker = ({ value = "", onChange, disabled = false }) => {
  const now = new Date();

  // Parse value "YYYY-MM"
  const [year, month] = value
    ? value.split("-")
    : [String(now.getFullYear()), String(now.getMonth() + 1).padStart(2, "0")];

  // Year options: tahun ini sampai 2 tahun ke belakang
  const yearOptions = Array.from({ length: 3 }, (_, i) =>
    String(now.getFullYear() - i)
  );

  const handleMonthChange = (e) => {
    onChange(`${year}-${e.target.value}`);
  };

  const handleYearChange = (e) => {
    onChange(`${e.target.value}-${month}`);
  };

  const selectClass = `px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white
    focus:outline-none focus:ring-2 focus:ring-blue-500
    disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed`;

  return (
    <div className="flex items-center gap-2">
      {/* Bulan */}
      <select
        value={month}
        onChange={handleMonthChange}
        disabled={disabled}
        className={selectClass}
        aria-label="Pilih bulan"
      >
        {MONTHS.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>

      {/* Tahun */}
      <select
        value={year}
        onChange={handleYearChange}
        disabled={disabled}
        className={selectClass}
        aria-label="Pilih tahun"
      >
        {yearOptions.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
};

export default MonthYearPicker;
