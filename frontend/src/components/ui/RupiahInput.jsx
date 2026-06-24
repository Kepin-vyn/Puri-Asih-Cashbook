import { useState, useRef } from "react";

/**
 * RupiahInput — Input number dengan format Rupiah (Ollama Design System)
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
    const raw = e.target.value.replace(/\D/g, "");
    const numeric = raw === "" ? "" : parseInt(raw, 10);
    setDisplayValue(numeric === "" ? "" : formatDisplay(numeric));
    onChange(numeric === "" ? 0 : numeric);
  };

  const handleFocus = () => {
    if (value) setDisplayValue(String(value));
  };

  const handleBlur = () => {
    setDisplayValue(value ? formatDisplay(value) : "");
  };

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a3a3a3] text-[14px] pointer-events-none">
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
