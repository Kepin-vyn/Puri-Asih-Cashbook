import { useState, useRef } from "react";

/**
 * RupiahInput — Input number yang auto-format ke Rupiah
 * Props:
 *   value: number (nilai numerik dari parent)
 *   onChange: (numericValue) => void
 *   placeholder: string
 *   className: string
 *   disabled: boolean
 *   id: string
 */
const RupiahInput = ({
  value,
  onChange,
  placeholder = "0",
  className = "",
  disabled = false,
  id,
}) => {
  const [displayValue, setDisplayValue] = useState(
    value ? formatDisplay(value) : ""
  );
  const inputRef = useRef(null);

  function formatDisplay(num) {
    if (!num && num !== 0) return "";
    return new Intl.NumberFormat("id-ID").format(num);
  }

  const handleChange = (e) => {
    // Ambil hanya angka dari input
    const raw = e.target.value.replace(/\D/g, "");
    const numeric = raw === "" ? "" : parseInt(raw, 10);

    // Format untuk display
    setDisplayValue(numeric === "" ? "" : formatDisplay(numeric));

    // Kembalikan nilai numerik ke parent
    onChange(numeric === "" ? 0 : numeric);
  };

  const handleFocus = () => {
    // Saat focus, hilangkan format agar lebih mudah edit
    if (value) {
      setDisplayValue(String(value));
    }
  };

  const handleBlur = () => {
    // Saat blur, format ulang
    setDisplayValue(value ? formatDisplay(value) : "");
  };

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium pointer-events-none">
        Rp
      </span>
      <input
        ref={inputRef}
        id={id}
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={`pl-9 ${className}`}
      />
    </div>
  );
};

export default RupiahInput;
