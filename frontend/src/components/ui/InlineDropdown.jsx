import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

/**
 * InlineDropdown — Dropdown yang bisa diedit langsung di dalam tabel
 *
 * Props:
 *   value:     string  — nilai yang sedang aktif
 *   options:   Array<{ value: string, label: string }>
 *   onChange:  (newValue: string) => void
 *   isLoading: boolean — tampilkan spinner saat menyimpan
 *   disabled:  boolean
 */
const InlineDropdown = ({
  value,
  options = [],
  onChange,
  isLoading = false,
  disabled = false,
}) => {
  const [open, setOpen]   = useState(false);
  const containerRef      = useRef(null);

  const currentLabel = options.find((o) => o.value === value)?.label ?? value;

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (newValue) => {
    setOpen(false);
    if (newValue !== value) {
      onChange(newValue);
    }
  };

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => !disabled && !isLoading && setOpen((p) => !p)}
        disabled={disabled || isLoading}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors
          ${disabled || isLoading
            ? "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
            : "bg-white border-gray-200 text-gray-700 hover:border-blue-400 hover:text-blue-600 cursor-pointer"
          }`}
      >
        {isLoading ? (
          <>
            <span className="w-3 h-3 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
            <span className="text-gray-400">Menyimpan...</span>
          </>
        ) : (
          <>
            <span>{currentLabel}</span>
            <ChevronDown
              size={12}
              className={`transition-transform ${open ? "rotate-180" : ""}`}
            />
          </>
        )}
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg min-w-[120px] py-1 overflow-hidden">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSelect(opt.value)}
              className={`w-full text-left px-3 py-2 text-xs transition-colors
                ${opt.value === value
                  ? "bg-blue-50 text-blue-700 font-semibold"
                  : "text-gray-700 hover:bg-gray-50"
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default InlineDropdown;
