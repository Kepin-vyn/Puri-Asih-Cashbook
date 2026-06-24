import { useEffect } from "react";
import { X } from "lucide-react";

/**
 * ConfirmModal — Modal konfirmasi generik (Ollama Design System)
 */
const ConfirmModal = ({
  isOpen,
  title = "Konfirmasi",
  message = "Apakah Anda yakin?",
  onConfirm,
  onCancel,
  confirmText = "Hapus",
  confirmVariant = "danger",
  isLoading = false,
}) => {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape" && isOpen && !isLoading) onCancel();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  const confirmCls = confirmVariant === "danger"
    ? "bg-black text-white hover:bg-[#090909]"
    : "bg-black text-white hover:bg-[#090909]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={!isLoading ? onCancel : undefined}
      />
      <div className="relative bg-white border border-[#e5e5e5] rounded-xl w-full max-w-sm p-6">
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="absolute top-4 right-4 p-1 text-[#a3a3a3] hover:text-black transition-colors"
        >
          <X size={16} />
        </button>

        <h3 className="text-[18px] font-[500] leading-[1.56] text-black mb-2"
            style={{ fontFamily: "var(--font-display)" }}>
          {title}
        </h3>
        <p className="text-[16px] text-[#737373] leading-[1.5] mb-6">{message}</p>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 h-9 px-5 rounded-full border border-[#d4d4d4] text-[14px] font-[500] text-black bg-white hover:bg-[#fafafa] transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 h-9 px-5 rounded-full text-[14px] font-[500] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${confirmCls}`}
          >
            {isLoading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Memproses...
              </>
            ) : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
