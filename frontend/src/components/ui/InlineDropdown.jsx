import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

/**
 * InlineDropdown — Dropdown inline di tabel (Ollama Design System)
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
    if (newValue !== value) onChange(newValue);
  };

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => !disabled && !isLoading && setOpen((p) => !p)}
        disabled={disabled || isLoading}
        className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-[#e5e5e5] text-[13px] font-[500] text-black bg-white hover:border-[#a3a3a3] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <span className="w-3 h-3 border-2 border-[#a3a3a3] border-t-black rounded-full animate-spin" />
            <span className="text-[#a3a3a3]">Menyimpan...</span>
          </>
        ) : (
          <>
            <span>{currentLabel}</span>
            <ChevronDown size={11} className={`transition-transform text-[#a3a3a3] ${open ? "rotate-180" : ""}`} />
          </>
        )}
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 bg-white border border-[#e5e5e5] rounded-xl  min-w-[120px] py-1 overflow-hidden">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSelect(opt.value)}
              className={`w-full text-left px-3 py-2 text-[13px] transition-colors ${
                opt.value === value
                  ? "bg-[#fafafa] text-black font-[500]"
                  : "text-[#525252] hover:bg-[#fafafa]"
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
