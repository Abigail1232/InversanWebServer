import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FileText, X, Banknote } from "lucide-react";

export interface ModalEfectuarEntregaProps {
  open: boolean;
  onClose: () => void;
  onVerDetalles: () => void;
  onEntregar?: (comentarios: string) => void;
  tipoPago?: string;
  totalPagar?: string;
  loading?: boolean;
}

export function ModalEfectuarEntrega({
  open,
  onClose,
  onVerDetalles,
  onEntregar,
  tipoPago,
  totalPagar,
  loading = false,
}: ModalEfectuarEntregaProps) {
  const [comentarios, setComentarios] = useState("");
  const requierePago = tipoPago === "efectivo" || tipoPago === "pos";

  useEffect(() => {
    if (!open) setComentarios("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); setComentarios(""); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleClose = () => {
    setComentarios("");
    onClose();
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-3 md:p-4">
      <div
        className="absolute inset-0 bg-black/50 animate-fade-in"
        role="button"
        tabIndex={0}
        onClick={handleClose}
        aria-label="Cerrar modal"
      />
      <div
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col min-h-[450px] md:min-h-0 max-h-[90vh] animate-scale-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-efectuar-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-[#027EB1] to-[#0B4E87] px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
          <h2 id="modal-efectuar-title" className="text-lg md:text-xl font-bold text-white">
            Efectuar Entrega
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
          {requierePago && (
            <div className="mb-4 md:mb-6 p-4 md:p-5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 md:gap-4">
              <div className="flex items-center justify-center shrink-0 w-9 h-9 md:w-12 md:h-12 rounded-full bg-amber-100">
                <Banknote className="w-5 h-5 md:w-6 md:h-6 text-amber-700" />
              </div>
              <div>
                <p className="text-xs md:text-sm font-medium text-amber-800 leading-snug pt-0.5 md:pt-1.5">
                  Debe recibir el pago del cliente antes de confirmar la entrega.
                </p>
                {totalPagar && (
                  <p className="mt-1 text-xs md:text-sm font-semibold text-amber-900">
                    {tipoPago === "efectivo"
                      ? `Monto a recibir en efectivo: ${totalPagar}.`
                      : `Monto a cobrar en POS: ${totalPagar}.`}
                  </p>
                )}
              </div>
            </div>
          )}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4 mb-4 md:mb-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-xl bg-[#027EB1]/10 text-[#027EB1]">
                <FileText className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <div>
                <h3 className="text-sm md:text-lg font-semibold text-[#1a1a1a]">Comentarios de Entrega</h3>
                <p className="text-xs md:text-sm text-[#6b7280]">Opcional: agrega notas para esta entrega</p>
              </div>
            </div>
            <button
              type="button"
              className="h-9 md:h-10 px-4 md:px-5 rounded-xl text-sm md:text-base font-semibold shadow-sm bg-[#027EB1] text-white hover:bg-[#026a9a] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              onClick={onVerDetalles}
            >
              Ver Detalles
            </button>
          </div>
          <textarea
            value={comentarios}
            onChange={(e) => setComentarios(e.target.value)}
            placeholder="Ej: Cliente recibió el pedido en la puerta. Sin incidencias."
            rows={4}
            className="w-full px-3 md:px-4 py-2.5 md:py-3 rounded-xl border border-[#d1d5dc] text-sm md:text-base text-[#1e2939] bg-white placeholder:text-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#027EB1]/40 focus:border-[#027EB1] transition-all duration-200 resize-none"
          />
          <div className="flex flex-col-reverse sm:flex-row gap-2.5 md:gap-3 sm:justify-end mt-4 md:mt-6 pt-4 md:pt-6 border-t border-[#e5e7eb]">
            <button
              type="button"
              onClick={handleClose}
              className="h-9 md:h-11 px-4 md:px-5 rounded-xl border-2 border-[#027EB1] text-[#027EB1] text-sm md:text-base font-semibold hover:bg-[#027EB1]/5 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
            >
              Cancelar
            </button>
            <button
              type="button"
              className="h-9 md:h-11 px-4 md:px-5 bg-[#027EB1] text-white rounded-xl text-sm md:text-base font-semibold shadow-md hover:bg-[#026a9a] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              onClick={() => onEntregar?.(comentarios)}
              disabled={loading}
              aria-disabled={loading}
            >
              {loading ? "Entregando..." : "Entregar"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
