import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle } from "lucide-react";

export interface ModalRechazarPedidoProps {
  open: boolean;
  onClose: () => void;
  onConfirmar: (motivo: string) => void | Promise<void>;
  loading?: boolean;
}

export function ModalRechazarPedido({
  open,
  onClose,
  onConfirmar,
  loading = false,
}: ModalRechazarPedidoProps) {
  const [motivo, setMotivo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) setMotivo("");
  }, [open]);

  if (!open) return null;

  const handleConfirmar = async () => {
    if (loading || submitting) return;
    if (!motivo.trim()) return;
    setSubmitting(true);
    try {
      await Promise.resolve(onConfirmar(motivo.trim()));
    } finally {
      setSubmitting(false);
    }
    setMotivo("");
    onClose();
  };

  const handleClose = () => {
    setMotivo("");
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/50 animate-fade-in">
      <div
        className="absolute inset-0"
        role="button"
        tabIndex={0}
        onClick={handleClose}
        aria-label="Cerrar"
      />
      <div
        className="relative w-full max-w-[450px] bg-white rounded-2xl shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] overflow-hidden animate-scale-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rechazar-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center pt-8 pb-6 px-8">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[#ffe2e2] mb-6">
            <AlertTriangle className="w-8 h-8 text-[#d61216]" />
          </div>
          <h2 id="rechazar-title" className="text-2xl font-bold text-[#1a1a1a] text-center mb-4">
            Rechazar Pedido
          </h2>
          <p className="text-base text-[#6b7280] text-center leading-[26px] mb-4">
            ¿Estás seguro que deseas rechazar el pedido? Esta acción no se puede deshacer.
          </p>
          <label className="block w-full text-left text-sm font-medium text-[#374151] mb-2">
            Motivo del rechazo
          </label>
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Indique el motivo del rechazo..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-[#d1d5dc] text-[#1e2939] bg-white placeholder:text-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#d61216]/40 focus:border-[#d61216] resize-none"
          />
        </div>
        <div className="h-px bg-[#e5e7eb]" />
        <div className="flex items-center justify-end gap-3 bg-[#f9fafb] px-8 py-5">
          <button
            type="button"
            onClick={handleClose}
            className="h-12 px-6 rounded-[14px] font-medium text-[#4a4a4a] bg-white border border-[#e5e7eb] hover:bg-gray-50 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmar}
            disabled={!motivo.trim() || loading || submitting}
            className="h-11 px-6 rounded-[14px] font-medium text-white bg-[#d61216] hover:bg-[#b80f12] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading || submitting ? "Rechazando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
