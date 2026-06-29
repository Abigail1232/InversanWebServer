import { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { DataTable, type DataTableColumn } from "./DataTable";

export interface DetalleItem {
  inv: string;
  producto: string;
  marca: string;
  cantidad: number;
  subtotal: string;
  total: string;
  imagen?: string;
}

const MOCK_ITEMS: DetalleItem[] = [
  { inv: "INV-001", producto: "Llanta Michelin Primacy 4", marca: "Michelin", cantidad: 4, subtotal: "L 12,000.00", total: "L 13,800.00" },
  { inv: "INV-002", producto: "Llanta Bridgestone Turanza T005", marca: "Bridgestone", cantidad: 2, subtotal: "L 7,500.00", total: "L 8,625.00" },
  { inv: "INV-003", producto: "Llanta Goodyear Assurance", marca: "Goodyear", cantidad: 4, subtotal: "L 9,200.00", total: "L 10,580.00" },
  { inv: "INV-004", producto: "Llanta Pirelli Cinturato P7", marca: "Pirelli", cantidad: 2, subtotal: "L 8,800.00", total: "L 10,120.00" },
];

export interface ModalDetallesEntregaProps {
  open: boolean;
  onClose: () => void;
  codigo?: string;
  persona?: string;
  telefono?: string;
  tipoPago?: string;
  direccion?: string;
  fechaEstimadaEntrega?: string | null;
  items?: DetalleItem[];
  pageSize?: number;
  fromOjo?: boolean;
  costoEnvio?: number;
  subtotalPedido?: number;
  descuentoPedido?: number;
  isvPedido?: number;
  tipoEntrega?: string;
}

function formatFechaEntrega(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
}

function formatMonto(monto: any): string {
  const numero = Number(monto);
  if (isNaN(numero) || !isFinite(numero)) return "L. 0.00";
  const [enteros, decimales] = numero.toFixed(2).split(".");
  const enterosConComas = enteros.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `L. ${enterosConComas}.${decimales}`;
}

export function ModalDetallesEntrega({
  open,
  onClose,
  codigo = "ING-2026-001",
  persona,
  telefono,
  tipoPago,
  direccion,
  fechaEstimadaEntrega,
  items,
  pageSize: pageSizeProp = 5,
  fromOjo: _fromOjo = false,
  costoEnvio = 0,
  subtotalPedido,
  descuentoPedido = 0,
  isvPedido,
  tipoEntrega,
}: ModalDetallesEntregaProps) {
  const displayItems = items ?? MOCK_ITEMS;
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) setPage(1);
  }, [open]);

  const total = displayItems.length;
  const pageSize = Math.max(1, pageSizeProp);
  const totalPages = Math.ceil(total / pageSize) || 1;
  const currentPage = Math.min(page, totalPages);
  const slicedItems = useMemo(
    () => displayItems.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [displayItems, currentPage, pageSize]
  );

  const columns: DataTableColumn<DetalleItem>[] = useMemo(
    () => [
      {
        title: "INV",
        dataIndex: "inv",
        key: "inv",
        width: 100,
      },
      {
        title: "Imagen",
        key: "imagen",
        width: 100,
        render: (_, record) =>
          record.imagen ? (
            <img
              src={`${import.meta.env.VITE_API_URL}/public/${record.imagen}`}
              alt={record.producto}
              className="w-12 h-12 rounded-lg object-cover bg-[#f3f4f6]"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-[#e5e7eb] flex items-center justify-center text-[#9ca3af] text-xs">
              —
            </div>
          ),
      },
      {
        title: "Producto",
        dataIndex: "producto",
        key: "producto",
      },
      {
        title: "Marca",
        dataIndex: "marca",
        key: "marca",
      },
      {
        title: "Cantidad",
        dataIndex: "cantidad",
        key: "cantidad",
        render: (value) => (
          <span className="inline-flex items-center justify-center min-w-[32px] h-7 px-2 rounded-full bg-[#f3f4f6] text-sm font-medium text-[#1a1a1a]">
            {value as number}
          </span>
        ),
      },
      {
        title: "Subtotal",
        dataIndex: "subtotal",
        key: "subtotal",
        render: (value) => <span className="font-medium text-gray-700">{formatMonto(value)}</span>,
      },
      {
        title: "Total (+15% ISV)",
        dataIndex: "total",
        key: "total",
        render: (value) => <span className="font-semibold text-gray-800">{formatMonto(value)}</span>,
      },
    ],
    []
  );

  const totalPedido = useMemo(() => {
    if (!displayItems.length) return "";
    const parseAmount = (value?: string | null): number => {
      if (!value) return 0;
      const clean = value.replace(/[^\d.,-]/g, "");
      if (!clean) return 0;
      const normalized = clean.replace(/,/g, "");
      const num = Number(normalized);
      return Number.isFinite(num) ? num : 0;
    };
    const sum = displayItems.reduce((acc, item) => acc + parseAmount(item.total), 0);
    const first = displayItems[0]?.total ?? "";
    const prefixMatch = first.match(/^(\D+)\s*/);
    const prefix = prefixMatch ? `${prefixMatch[1].trim()} ` : "";
    const formatted = sum.toLocaleString("es-HN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${prefix}${formatted}`;
  }, [displayItems]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 md:p-4">
      <div
        className="absolute z-[200] inset-0 bg-black/50 animate-fade-in"
        role="button"
        tabIndex={0}
        onClick={onClose}
        aria-label="Cerrar"
      />
      <div
        className="relative  w-full z-[2000] max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col min-h-[520px] md:min-h-[550px] max-h-[90vh] animate-scale-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="detalles-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-4 md:px-6 py-4 md:py-5 border-b border-[#e5e7eb] bg-[#fafbfc] shrink-0">
          <div>
            <h2 id="detalles-title" className="text-lg md:text-xl font-semibold text-[#1a1a1a]">
              Detalles de entrega
            </h2>
            <p className="text-xs md:text-sm text-[#6b7280] mt-0.5">{codigo}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-lg text-[#6b7280] hover:bg-[#e5e7eb] hover:text-[#1a1a1a] transition-all duration-200 hover:scale-110 active:scale-95"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-auto scrollbar-hide scroll-smooth scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 flex-1 p-3 md:p-5">
          {(persona ||
            telefono ||
            tipoPago ||
            direccion ||
            fechaEstimadaEntrega !== undefined) && (
            <div className="mb-4 rounded-xl border border-[#e5e7eb] bg-[#f9fafb] px-4 py-3 md:px-5 md:py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                {persona && (
                  <div>
                    <p className="text-[11px] md:text-xs font-medium tracking-wide text-[#6b7280] uppercase">
                      Persona a entregar
                    </p>
                    <p className="mt-0.5 text-[13px] md:text-sm font-semibold text-[#111827] break-words">
                      {persona}
                    </p>
                  </div>
                )}
                {telefono && (
                  <div>
                    <p className="text-[11px] md:text-xs font-medium tracking-wide text-[#6b7280] uppercase">
                      Teléfono
                    </p>
                    <p className="mt-0.5 text-[13px] md:text-sm font-semibold text-[#111827] break-words">
                      {telefono}
                    </p>
                  </div>
                )}
                {tipoPago && (
                  <div>
                    <p className="text-[11px] md:text-xs font-medium tracking-wide text-[#6b7280] uppercase">
                      Tipo de pago
                    </p>
                    <p className="mt-0.5 text-[13px] md:text-sm font-semibold text-[#111827] capitalize">
                      {tipoPago.replace(/_/g, " ")}
                    </p>
                  </div>
                )}
                {direccion && (
                  <div className="md:col-span-2">
                    <p className="text-[11px] md:text-xs font-medium tracking-wide text-[#6b7280] uppercase">
                      Dirección
                    </p>
                    <p className="mt-0.5 text-[13px] md:text-sm font-semibold text-[#111827] break-words">
                      {direccion}
                    </p>
                  </div>
                )}
                {fechaEstimadaEntrega !== undefined && (
                  <div>
                    <p className="text-[11px] md:text-xs font-medium tracking-wide text-[#6b7280] uppercase">
                      Fecha entrega
                    </p>
                    <p className="mt-0.5 text-[13px] md:text-sm font-semibold text-[#111827]">
                      {formatFechaEntrega(fechaEstimadaEntrega)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          {/* Desktop: DataTable */}
          <div className="hidden md:block">
            <DataTable<DetalleItem>
              rowKey="inv"
              columns={columns}
              dataSource={slicedItems}
              pagination={
                totalPages > 1
                  ? {
                      current: currentPage,
                      pageSize,
                      total,
                      onChange: (nextPage) => setPage(nextPage),
                    }
                  : undefined
              }
              emptyMessage="No hay productos en el pedido"
            />
            {subtotalPedido !== undefined ? (
              <div className="mt-4 bg-[#f9fafb] p-6 rounded-2xl border border-[#e5e7eb] shadow-sm max-w-[320px] ml-auto space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#6b7280] font-medium">Subtotal:</span>
                  <span className="text-[#1a1a1a] font-semibold">{formatMonto(subtotalPedido)}</span>
                </div>
                {descuentoPedido > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-red-500 font-medium">Descuento:</span>
                    <span className="text-red-500 font-semibold">- {formatMonto(descuentoPedido)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#6b7280] font-medium">ISV (15%):</span>
                  <span className="text-[#1a1a1a] font-semibold">{formatMonto(isvPedido)}</span>
                </div>
                <div className="flex justify-between items-center text-sm pb-2 border-b border-gray-200">
                  <span className="text-[#6b7280] font-medium">Costo de Envío:</span>
                  <span className={costoEnvio === 0 ? "text-[#027EB1] font-bold" : "text-[#1a1a1a] font-semibold"}>
                    {tipoEntrega === "outside" && costoEnvio === 0 && Number(totalPedido.replace(/[^\d.]/g, '')) < 70000
                      ? "COTIZAR"
                      : costoEnvio === 0
                      ? "GRATIS"
                      : formatMonto(costoEnvio)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-sm font-bold text-[#1a1a1a]">TOTAL:</span>
                  <span className="text-lg font-black text-[#027EB1]">{totalPedido}</span>
                </div>
              </div>
            ) : totalPedido && (
              <div className="mt-3 flex items-center justify-end">
                <div className="inline-flex items-center gap-2 rounded-xl border border-[#e5e7eb] bg-white px-4 py-2">
                  <span className="text-sm font-medium text-[#6b7280]">Total del pedido:</span>
                  <span className="text-sm font-bold text-[#1a1a1a]">{totalPedido}</span>
                </div>
              </div>
            )}
          </div>

          {/* Móvil: cards con scroll */}
          <div className="md:hidden max-h-[60vh] overflow-y-auto space-y-4 pr-1">
            {slicedItems.map((item, i) => (
              <div
                key={item.inv}
                className="bg-[#f9fafb] rounded-xl border border-[#e5e7eb] p-4 flex gap-4 animate-fade-in-up transition-all duration-200 hover:shadow-sm"
                style={{ animationDelay: `${i * 0.04}s`, opacity: 0, animationFillMode: 'forwards' }}
              >
                {item.imagen ? (
                  <img
                    src={`${import.meta.env.VITE_API_URL}/public/${item.imagen}`}
                    alt={item.producto}
                    className="w-20 h-20 rounded-lg object-cover shrink-0 bg-[#f3f4f6]"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-[#e5e7eb] shrink-0 flex items-center justify-center text-[#9ca3af] text-xs">
                    —
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <span className="text-xs font-medium text-[#6b7280]">{item.inv}</span>
                    <span className="inline-flex items-center justify-center min-w-[32px] h-7 px-2 rounded-full bg-[#e5e7eb] text-sm font-medium text-[#1a1a1a]">
                      {item.cantidad}
                    </span>
                  </div>
                  <div className="font-medium text-[#1a1a1a]">{item.producto}</div>
                  <div className="text-sm text-[#6b7280]">{item.marca}</div>
                  <div className="mt-3 flex justify-between text-sm">
                    <span className="text-[#6b7280]">Subtotal</span>
                    <span className="font-medium text-[#1a1a1a]">{formatMonto(item.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-0.5">
                    <span className="text-[#6b7280]">Total (+15% ISV)</span>
                    <span className="font-semibold text-[#1a1a1a]">{formatMonto(item.total)}</span>
                  </div>
                </div>
              </div>
            ))}
            {subtotalPedido !== undefined ? (
              <div className="mt-4 bg-white p-4 rounded-xl border border-[#e5e7eb] space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#6b7280] font-medium">Subtotal</span>
                  <span className="text-[#1a1a1a] font-semibold">{formatMonto(subtotalPedido)}</span>
                </div>
                {descuentoPedido > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-red-500 font-medium">Descuento</span>
                    <span className="text-red-500 font-semibold">- {formatMonto(descuentoPedido)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#6b7280] font-medium">ISV (15%)</span>
                  <span className="text-[#1a1a1a] font-semibold">{formatMonto(isvPedido)}</span>
                </div>
                <div className="flex justify-between items-center text-sm pb-2 border-b border-gray-100">
                  <span className="text-[#6b7280] font-medium">Envío</span>
                  <span className={costoEnvio === 0 ? "text-[#027EB1] font-bold" : "text-[#1a1a1a] font-semibold"}>
                    {tipoEntrega === "outside" && costoEnvio === 0 && Number(totalPedido.replace(/[^\d.]/g, '')) < 70000
                      ? "COTIZAR"
                      : costoEnvio === 0
                      ? "GRATIS"
                      : formatMonto(costoEnvio)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-sm font-bold text-[#1a1a1a]">TOTAL</span>
                  <span className="text-lg font-black text-[#027EB1]">{totalPedido}</span>
                </div>
              </div>
            ) : totalPedido && (
              <div className="mt-1 rounded-xl border border-[#e5e7eb] bg-white px-4 py-3 flex items-center justify-between">
                <span className="text-sm font-medium text-[#6b7280]">Total del pedido</span>
                <span className="text-sm font-bold text-[#1a1a1a]">{totalPedido}</span>
              </div>
            )}
            {totalPages > 1 && (
              <div className="flex flex-col items-center gap-3 pt-2">
                <p className="text-sm text-[#6b7280]">
                  {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, total)} de {total}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="rounded-lg border border-[#d1d5dc] bg-white px-4 py-2 text-sm font-medium text-[#364153] disabled:opacity-40"
                  >
                    Anterior
                  </button>
                  <span className="text-sm text-[#1a1a1a]">
                    Pág. {currentPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="rounded-lg border border-[#d1d5dc] bg-white px-4 py-2 text-sm font-medium text-[#364153] disabled:opacity-40"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
