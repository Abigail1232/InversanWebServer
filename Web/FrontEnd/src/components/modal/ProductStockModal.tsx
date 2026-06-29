import { Warehouse, X } from "lucide-react";

export interface ProductoStock {
  id: number;
  nombre: string;
  sucursales?: {
    id_sucursal: number;
    nombre_sucursal: string;
    bodega: string;
    existencias: number;
  }[];
}

interface ProductStockModalProps {
  product: ProductoStock;
  onClose: () => void;
}

export function ProductStockModal({ product, onClose }: ProductStockModalProps) {
  const sucursales = product.sucursales || [];

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-end md:items-center justify-center z-50 p-0 md:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full md:w-auto md:max-w-2xl rounded-t-2xl md:rounded-xl shadow-xl p-0 md:p-6 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col">
          <div className="px-6 pt-6 pb-4 md:p-0 md:pb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[22px] md:text-xl font-bold text-[#1a1a1a] mb-1 flex items-center gap-2">
                <Warehouse className="w-5 h-5 text-[#0B4E87]" />
                Stock por bodega
              </h2>
              <p className="text-sm text-[#6b7280]">
                Producto: <span className="font-semibold text-[#111827]">{product.nombre}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="h-[1px] w-full bg-[#e5e7eb]" />

          <div className="px-6 py-4 max-h-[380px] overflow-y-auto">
            {sucursales.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">
                No hay información de stock por bodega.
              </p>
            ) : (
              <div className="space-y-3">
                {sucursales.map((sucursal) => (
                  <div
                    key={`${sucursal.id_sucursal}-${sucursal.bodega}`}
                    className="flex flex-col md:flex-row md:items-center md:justify-between border border-[#e5e7eb] rounded-xl px-5 py-4 bg-[#f9fafb] gap-3 w-full"
                  >
                    <div className="flex flex-col md:flex-1">
                      <span className="text-sm font-semibold text-[#111827] break-words">
                        Bodega {sucursal.bodega}
                      </span>
                      <span className="text-xs text-[#6b7280] break-words">
                        Sucursal: {sucursal.nombre_sucursal}
                      </span>
                    </div>
                    <div className="text-left md:text-right md:min-w-[140px]">
                      <p className="text-sm font-bold text-[#0B4E87]">
                        {sucursal.existencias} unidades
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-[#f9fafb] md:bg-white px-6 py-4 flex items-center justify-end gap-3 w-full border-t border-[#e5e7eb]">
            <button
              onClick={onClose}
              className="w-full md:w-auto px-6 py-2.5 bg-white border border-[#e5e7eb] text-[#4a4a4a] md:text-gray-700 font-medium text-[15px] rounded-[12px] hover:bg-gray-50 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

