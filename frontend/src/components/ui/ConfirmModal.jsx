import { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";

/**
 * ConfirmModal — Modal konfirmasi generik
 * Props:
 *   isOpen: boolean
 *   title: string
 *   message: string
 *   onConfirm: () => void
 *   onCancel: () => void
 *   confirmText: string (default: "Hapus")
 *   confirmVariant: "danger" | "primary" (default: "danger")
 *   isLoading: boolean
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
  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape" && isOpen && !isLoading) onCancel();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  const confirmBtnClass =
    confirmVariant === "danger"
      ? "bg-red-600 hover:bg-red-700 text-white"
      : "bg-blue-600 hover:bg-blue-700 text-white";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={!isLoading ? onCancel : undefined}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
        >
          <X size={18} />
        </button>

        {/* Icon + Title */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className={`p-3 rounded-full mb-3 ${
            confirmVariant === "danger" ? "bg-red-100" : "bg-blue-100"
          }`}>
            <AlertTriangle
              size={28}
              className={confirmVariant === "danger" ? "text-red-600" : "text-blue-600"}
            />
          </div>
          <h3 className="text-lg font-bold text-gray-800">{title}</h3>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-2.5 px-4 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${confirmBtnClass}`}
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Memproses...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
