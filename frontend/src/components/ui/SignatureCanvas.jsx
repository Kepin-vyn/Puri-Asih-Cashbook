import { useRef, useState, useEffect, useCallback } from "react";
import { Trash2 } from "lucide-react";

/**
 * SignatureCanvas — Komponen tanda tangan digital berbasis HTML Canvas
 *
 * Props:
 *   onSignatureChange : (base64: string | null) => void
 *                       dipanggil setiap kali tanda tangan berubah
 *                       null = canvas kosong
 *   disabled          : boolean (optional)
 *   height            : number  (default 160)
 */
const SignatureCanvas = ({ onSignatureChange, disabled = false, height = 160 }) => {
  const canvasRef   = useRef(null);
  const isDrawing   = useRef(false);
  const lastPos     = useRef({ x: 0, y: 0 });
  const [isEmpty, setIsEmpty] = useState(true);

  // ── Setup canvas context ──────────────────────────────────────────────────
  const getCtx = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth   = 2.5;
    ctx.lineCap     = "round";
    ctx.lineJoin    = "round";
    return ctx;
  };

  // ── Resize canvas to match display size ──────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width  = rect.width;
    canvas.height = rect.height;
  }, []);

  // ── Get position relative to canvas ──────────────────────────────────────
  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect   = canvas.getBoundingClientRect();
    if (e.touches) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  // ── Draw handlers ─────────────────────────────────────────────────────────
  const startDraw = useCallback((e) => {
    if (disabled) return;
    e.preventDefault();
    isDrawing.current = true;
    lastPos.current   = getPos(e);
  }, [disabled]);

  const draw = useCallback((e) => {
    if (!isDrawing.current || disabled) return;
    e.preventDefault();
    const ctx = getCtx();
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;

    if (isEmpty) {
      setIsEmpty(false);
      onSignatureChange?.(canvasRef.current.toDataURL("image/png"));
    } else {
      onSignatureChange?.(canvasRef.current.toDataURL("image/png"));
    }
  }, [disabled, isEmpty, onSignatureChange]);

  const stopDraw = useCallback(() => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    if (!isEmpty) {
      onSignatureChange?.(canvasRef.current?.toDataURL("image/png") ?? null);
    }
  }, [isEmpty, onSignatureChange]);

  // ── Clear ─────────────────────────────────────────────────────────────────
  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
    onSignatureChange?.(null);
  };

  // ── Public method via ref (getSignatureBase64) ────────────────────────────
  // Exposed via the component's imperative handle if needed
  const getSignatureBase64 = () => {
    if (isEmpty) return null;
    return canvasRef.current?.toDataURL("image/png") ?? null;
  };

  return (
    <div className="space-y-2">
      {/* Canvas wrapper */}
      <div
        className={`relative rounded-xl border-2 transition-colors overflow-hidden bg-white ${
          disabled
            ? "border-gray-200 bg-gray-50 cursor-not-allowed"
            : isEmpty
            ? "border-dashed border-gray-300 cursor-crosshair"
            : "border-solid border-blue-400 cursor-crosshair"
        }`}
        style={{ height }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full touch-none"
          style={{ display: "block" }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />

        {/* Placeholder */}
        {isEmpty && !disabled && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-sm text-gray-300 select-none">Tanda tangan di sini</p>
          </div>
        )}

        {/* Disabled overlay */}
        {disabled && (
          <div className="absolute inset-0 bg-gray-100/60 flex items-center justify-center">
            <p className="text-xs text-gray-400">Tanda tangan tidak tersedia</p>
          </div>
        )}
      </div>

      {/* Clear button */}
      {!isEmpty && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 transition-colors"
        >
          <Trash2 size={13} />
          Hapus tanda tangan
        </button>
      )}
    </div>
  );
};

export default SignatureCanvas;
