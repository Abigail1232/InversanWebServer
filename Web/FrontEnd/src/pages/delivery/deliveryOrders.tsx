import { useState, useEffect, useCallback, useRef } from "react";
import { message } from "antd";
import { Eye, Trash2, ArrowUp } from "lucide-react";
import { DataTable, type DataTableColumn } from "../../components/DataTable";
import { ModalEfectuarEntrega } from "../../components/ModalEfectuarEntrega";
import { ModalDetallesEntrega } from "../../components/ModalDetallesEntrega";
import { ModalRechazarPedido } from "../../components/ModalRechazarPedido";
import {
  getMisPedidosEntregas,
  getDetalleEntrega,
  efectuarEntrega as apiEfectuarEntrega,
  rechazarPedido as apiRechazarPedido,
  type PedidoEnCola,
  type DetalleItem,
} from "../../api/delivery/entregas";

const PAGE_SIZE = 8;
const MAX_PEDIDOS_ACTUALES = 3;
const STORAGE_KEY_ACTUALES = "delivery_pedidos_actuales";

type PedidoActualItem = PedidoEnCola & {
  persona?: string;
  telefono?: string;
  tipoPago?: string;
  totalPagar?: string;
};

function parseAmountFromDisplay(value?: string | null): number {
  if (!value) return 0;
  const clean = value.replace(/[^\d.,-]/g, "");
  if (!clean) return 0;
  const normalized = clean.replace(/,/g, "");
  const num = Number(normalized);
  return Number.isFinite(num) ? num : 0;
}

function buildTotalDisplayFromItems(items?: DetalleItem[]): string | undefined {
  if (!items || items.length === 0) return undefined;
  const sum = items.reduce(
    (acc, item) => acc + parseAmountFromDisplay(item.total),
    0,
  );
  const first = items[0]?.total ?? "";
  const prefixMatch = first.match(/^(\D+)\s*/);
  const prefix = prefixMatch ? `${prefixMatch[1].trim()} ` : "";
  const formatted = sum.toLocaleString("es-HN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${prefix}${formatted}`;
}

function formatTelefono(t: string): string {
  const digits = (t || "").replace(/\D/g, "");
  if (digits.length >= 8) return `${digits.slice(0, 4)}-${digits.slice(4, 8)}`;
  if (digits.length >= 4) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return t || "";
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

export default function PedidosAEntregar() {
  const [page, setPage] = useState(1);
  const [pedidosEnCola, setPedidosEnCola] = useState<PedidoEnCola[]>([]);
  const [totalCola, setTotalCola] = useState(0);
  const [pedidosActuales, setPedidosActuales] = useState<PedidoActualItem[]>(
    () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY_ACTUALES);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as PedidoActualItem[];
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    },
  );
  const pedidosActualesRef = useRef(pedidosActuales);
  useEffect(() => {
    pedidosActualesRef.current = pedidosActuales;
  }, [pedidosActuales]);

  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [efectuarEntregaLoading, setEfectuarEntregaLoading] = useState(false);
  const [rechazarPedidoLoading, setRechazarPedidoLoading] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY_ACTUALES,
        JSON.stringify(pedidosActuales),
      );
    } catch {
      // ignore
    }
  }, [pedidosActuales]);

  const [modalEfectuarOpen, setModalEfectuarOpen] = useState(false);
  const [modalDetallesOpen, setModalDetallesOpen] = useState(false);
  const [detallesFromEfectuar, setDetallesFromEfectuar] = useState(false);
  const [rechazarPedidoId, setRechazarPedidoId] = useState<number | null>(null);
  const [pedidoParaDetalles, setPedidoParaDetalles] =
    useState<PedidoEnCola | null>(null);
  const [detalleData, setDetalleData] = useState<{
    id_pedido: number;
    codigo: string;
    persona: string;
    telefono: string;
    tipoPago: string;
    direccion: string;
    fecha_estimada_entrega?: string | null;
    items: DetalleItem[];
    subtotal: number;
    descuento: number;
    isv: number;
    costo_envio: number;
    tipoEntrega?: string;
  } | null>(null);
  const [totalPagarModal, setTotalPagarModal] = useState<string | undefined>();

  const fetchPedidos = useCallback(
    async (customExcludeIds?: number[]) => {
      setLoading(true);
      try {
        const excludeIds =
          customExcludeIds ??
          pedidosActualesRef.current.map((a) => a.id_pedido);
        const res = await getMisPedidosEntregas(page, PAGE_SIZE, excludeIds);
        if (res.ok) {
          const list = res.pedidos_en_cola ?? [];
          const idsActuales = new Set(excludeIds);
          if (res.pedido_actual) {
            idsActuales.add(res.pedido_actual.id_pedido);
          }
          const filtrados = list.filter((p) => !idsActuales.has(p.id_pedido));

          setPedidosEnCola(filtrados);
          setTotalCola(res.total);

          // Sincronizar pedido actual del backend (solo actualizar fecha y totalPagar)
          if (res.pedido_actual) {
            // Obtener detalle del pedido actual para calcular totalPagar
            const detalleBackend = await getDetalleEntrega(
              res.pedido_actual.id_pedido,
            );
            const totalPagarBackend = buildTotalDisplayFromItems(
              detalleBackend?.items,
            );
            setPedidosActuales((prev) => {
              // Mantener los pedidos actuales que no son el actual del backend
              const filtered = prev.filter(
                (p) => p.id_pedido !== res.pedido_actual!.id_pedido,
              );
              const updatedItem = {
                id: res.pedido_actual!.id,
                id_pedido: res.pedido_actual!.id_pedido,
                nombre: res.pedido_actual!.nombre,
                direccion: res.pedido_actual!.direccion,
                telefono: res.pedido_actual!.telefono ?? undefined,
                tipoPago: res.pedido_actual!.tipoPago,
                fecha_estimada_entrega:
                  res.pedido_actual!.fecha_estimada_entrega ?? null,
                totalPagar: totalPagarBackend,
              } as any;
              const newList = [updatedItem, ...filtered];
              // Respetar el límite máximo de pedidos actuales
              return newList.slice(0, MAX_PEDIDOS_ACTUALES);
            });
          }

          setHasLoadedOnce(true);

          if (page > 1 && res.total > 0 && filtrados.length === 0) {
            setPage(1);
          }
        }
      } finally {
        setLoading(false);
      }
    },
    [page],
  );

  useEffect(() => {
    fetchPedidos();
  }, [fetchPedidos]);

  const openDetallesFromOjo = async (record: PedidoEnCola) => {
    setPedidoParaDetalles(record);
    const data = await getDetalleEntrega(record.id_pedido);
    if (data?.ok)
      setDetalleData({
        id_pedido: record.id_pedido,
        codigo: data.codigo,
        persona: data.persona,
        telefono: data.telefono,
        tipoPago: data.tipoPago,
        direccion: data.direccion,
        fecha_estimada_entrega: data.fecha_estimada_entrega ?? null,
        items: data.items,
        subtotal: data.subtotal,
        descuento: data.descuento ?? 0,
        isv: data.isv,
        costo_envio: data.costo_envio,
        tipoEntrega: data.tipoEntrega,
      });
    setModalDetallesOpen(true);
  };

  const openDetallesFromEfectuar = async () => {
    const primero = pedidosActuales[0];
    if (!primero) return;
    setDetallesFromEfectuar(true);
    setModalEfectuarOpen(false);
    const data = await getDetalleEntrega(primero.id_pedido);
    if (data?.ok)
      setDetalleData({
        id_pedido: primero.id_pedido,
        codigo: data.codigo,
        persona: data.persona,
        telefono: data.telefono,
        tipoPago: data.tipoPago,
        direccion: data.direccion,
        fecha_estimada_entrega: data.fecha_estimada_entrega ?? null,
        items: data.items,
        subtotal: data.subtotal,
        descuento: data.descuento ?? 0,
        isv: data.isv,
        costo_envio: data.costo_envio,
        tipoEntrega: data.tipoEntrega,
      });
    setPedidoParaDetalles(null);
    setTimeout(() => setModalDetallesOpen(true), 120);
  };

  const handleEfectuarEntrega = async (comentarios: string) => {
    const primero = pedidosActuales[0];
    if (!primero) return;
    setEfectuarEntregaLoading(true);
    try {
      const ok = await apiEfectuarEntrega(primero.id_pedido, comentarios);
      if (ok) {
        message.success("Entrega registrada correctamente");
        setModalEfectuarOpen(false);
        setPedidosActuales((prev) => prev.slice(1));
        fetchPedidos();
      } else {
        message.error("No se pudo registrar la entrega");
      }
    } finally {
      setEfectuarEntregaLoading(false);
    }
  };

  const llevarAPrimero = (index: number) => {
    if (index <= 0 || index >= pedidosActuales.length) return;
    const next = [...pedidosActuales];
    const [item] = next.splice(index, 1);
    next.unshift(item);
    setPedidosActuales(next);
  };

  const handleEntregar = async (index: number) => {
    const pedido = pedidosActuales[index];
    if (!pedido) return;

    let totalPagar = pedido.totalPagar;
    if (!totalPagar) {
      const data = await getDetalleEntrega(pedido.id_pedido);
      if (data?.ok) {
        totalPagar = buildTotalDisplayFromItems(data.items);
        if (totalPagar) {
          setPedidosActuales((prev) =>
            prev.map((p) =>
              p.id_pedido === pedido.id_pedido ? { ...p, totalPagar } : p,
            ),
          );
        }
      }
    }

    if (index > 0) llevarAPrimero(index);
    setTotalPagarModal(totalPagar);
    setModalEfectuarOpen(true);
  };

  const moverAActuales = async (record: PedidoEnCola) => {
    const detalle = await getDetalleEntrega(record.id_pedido);
    const totalPagar = buildTotalDisplayFromItems(detalle?.items);
    const item: PedidoActualItem = {
      ...record,
      persona: detalle?.persona ?? record.nombre,
      telefono: detalle?.telefono,
      tipoPago: detalle?.tipoPago,
      totalPagar,
      fecha_estimada_entrega:
        detalle?.fecha_estimada_entrega ??
        record.fecha_estimada_entrega ??
        null,
      ...(detalle?.direccion != null && { direccion: detalle.direccion }),
    };
    const nextActuales = await new Promise<PedidoActualItem[]>((resolve) => {
      setPedidosActuales((prev) => {
        const exists = prev.some((p) => p.id_pedido === item.id_pedido);
        if (exists) {
          resolve(prev);
          return prev;
        }
        const updated =
          prev.length >= MAX_PEDIDOS_ACTUALES
            ? [item, prev[0], prev[1]]
            : [item, ...prev];
        resolve(updated);
        return updated;
      });
    });

    fetchPedidos(nextActuales.map((a) => a.id_pedido));
  };

  const handleConfirmarRechazo = async (motivo: string) => {
    if (rechazarPedidoId == null) return;
    setRechazarPedidoLoading(true);
    try {
      const ok = await apiRechazarPedido(rechazarPedidoId, motivo);
      if (ok) {
        message.success("Pedido rechazado y stock devuelto correctamente");

        setPedidosActuales((prev) =>
          prev.filter((p) => p.id_pedido !== rechazarPedidoId),
        );
        setRechazarPedidoId(null);
        setModalDetallesOpen(false);
        setDetalleData(null);
        setPedidoParaDetalles(null);
        fetchPedidos();
      } else {
        message.error("No se pudo rechazar el pedido");
      }
    } catch (error: any) {
      message.error("No se pudo rechazar el pedido");
    } finally {
      setRechazarPedidoLoading(false);
    }
  };

  const columns: DataTableColumn<PedidoEnCola>[] = [
    {
      title: "ID_PEDIDO",
      dataIndex: "id_pedido",
      key: "id_pedido",
      width: 120,
    },
    { title: "NOMBRE", dataIndex: "nombre", key: "nombre", width: 200 },
    {
      title: "TELÉFONO",
      dataIndex: "telefono",
      key: "telefono",
      width: 140,
      render: (value: unknown) => {
        const telefono = value as string | undefined;

        return telefono ? (
          <span>{formatTelefono(telefono)}</span>
        ) : (
          <span>—</span>
        );
      },
    },
    {
      title: "DIRECCIÓN",
      dataIndex: "direccion",
      key: "direccion",
      ellipsis: true,
    },
    {
      title: "FECHA ENTREGA",
      dataIndex: "fecha_estimada_entrega",
      key: "fecha_estimada_entrega",
      ellipsis: true,
      width: 190,
      render: (value: unknown) => (
        <span className="text-[#6b7280]">
          {formatFechaEntrega(value as string | null)}
        </span>
      ),
    },
    {
      title: "TIPO DE PAGO",
      dataIndex: "tipoPago",
      key: "tipoPago",
      width: 160,
      render: (value: unknown) => {
        const tipoPago = value as string | undefined;

        if (!tipoPago) return "—";

        const label = tipoPago.replace(/_/g, " ");
        const highlight = tipoPago === "efectivo" || tipoPago === "pos";

        if (!highlight) {
          return (
            <span className="text-md font-medium capitalize text-[#1a1a1a]">
              {label}
            </span>
          );
        }

        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-md font-semibold bg-amber-50 text-amber-800 border border-amber-200 capitalize">
            {label}
          </span>
        );
      },
    },
    {
      title: "ACCIONES",
      key: "actions",
      width: 180,
      render: (_, record) => (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            className="p-1.5 text-[#0B4E87] hover:bg-[#0B4E87]/10 rounded-lg transition-all duration-200 hover:scale-110"
            aria-label="Subir a pedidos actuales"
            onClick={() => moverAActuales(record)}
          >
            <ArrowUp className="w-5 h-5" />
          </button>
          <button
            type="button"
            className="p-1.5 text-[#027EB1] hover:bg-[#027EB1]/10 rounded-lg transition-all duration-200 hover:scale-110"
            aria-label="Ver detalles"
            onClick={() => openDetallesFromOjo(record)}
          >
            <Eye className="w-5 h-5" />
          </button>
          <button
            type="button"
            className="p-1.5 text-[#d61216] hover:bg-[#d61216]/10 rounded-lg transition-all duration-200 hover:scale-110"
            aria-label="Rechazar pedido"
            onClick={() => setRechazarPedidoId(record.id_pedido)}
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full bg-[#F5F7FB] min-h-screen animate-fade-in">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6">
        <h1
          className="text-2xl md:text-[32px] font-semibold text-[#1A1A1A] leading-8 md:leading-10 mb-4 md:mb-6 animate-fade-in-up"
          style={{
            animationDelay: "0.05s",
            opacity: 0,
            animationFillMode: "forwards",
          }}
        >
          Entrega de pedidos
        </h1>

        <div
          className="bg-white rounded-[14px] border border-[#e5e7eb] shadow-sm p-3 md:p-6 mb-6 md:mb-8 transition-all duration-300 animate-fade-in-up"
          style={{
            animationDelay: "0.1s",
            opacity: 0,
            animationFillMode: "forwards",
          }}
        >
          <h2 className="text-xl md:text-2xl text-[#1a1a1a] font-normal border-b border-[#e5e7eb] pb-2 mb-4">
            Pedidos actuales
          </h2>
          {pedidosActuales.length > 0 ? (
            <>
              <div className="md:block max-md:max-h-[55vh] max-md:overflow-y-auto max-md:pr-1 space-y-3 md:space-y-4">
                {pedidosActuales
                  .slice(0, MAX_PEDIDOS_ACTUALES)
                  .map((item, index) => (
                    <div
                      key={item.id}
                      className="flex flex-col md:flex-row md:flex-nowrap items-start md:items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl border border-[#e5e7eb] bg-[#fafbfc] transition-all duration-200 hover:shadow-md hover:border-[#d1d5dc] animate-fade-in-up"
                      style={{
                        animationDelay: `${0.15 + index * 0.06}s`,
                        opacity: 0,
                        animationFillMode: "forwards",
                      }}
                    >
                      <div className="flex items-center justify-center shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-lg bg-[#027EB1] text-white font-bold text-base md:text-lg leading-none">
                        {index + 1}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-3 gap-y-1.5 md:gap-x-4 md:gap-y-1 min-w-0 flex-1 w-full">
                        <div>
                          <div className="text-[11px] md:text-xs text-[#6b7280]">
                            Persona a Entregar
                          </div>
                          <div className="text-sm md:text-[15px] font-medium text-[#1a1a1a]">
                            {item.persona ?? item.nombre}
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] md:text-xs text-[#6b7280]">
                            Teléfono
                          </div>
                          <div className="text-sm md:text-[15px] font-medium text-[#1a1a1a]">
                            {item.telefono
                              ? formatTelefono(item.telefono)
                              : "—"}
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] md:text-xs text-[#6b7280]">
                            Tipo de Pago
                          </div>
                          <div className="text-sm md:text-[15px] font-medium text-[#1a1a1a]">
                            {item.tipoPago ? (
                              item.tipoPago === "efectivo" ||
                              item.tipoPago === "pos" ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-md font-semibold bg-amber-50 text-amber-800 border border-amber-200 capitalize">
                                  {item.tipoPago.replace(/_/g, " ")}
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-md font-semibold bg-green-50 text-green-800 border border-green-200 capitalize">
                                  {item.tipoPago.replace(/_/g, " ")}
                                </span>
                              )
                            ) : (
                              "—"
                            )}
                          </div>
                        </div>
                        <div className="col-span-2 md:col-span-1 relative group">
                          <div className="text-[11px] md:text-xs text-[#6b7280]">
                            Dirección
                          </div>

                          <div className="text-sm md:text-[15px] font-medium text-[#1a1a1a] line-clamp-2 cursor-pointer">
                            {item.direccion}
                          </div>

                          <div className="absolute left-0 bottom-full mb-1 hidden w-max max-w-xs rounded bg-white p-2 text-black border border-[#e5e7eb] text-xs group-hover:block z-10">
                            {item.direccion}
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] md:text-xs text-[#6b7280]">
                            Fecha entrega
                          </div>
                          <div className="text-sm md:text-[15px] font-medium text-[#1a1a1a]">
                            {formatFechaEntrega(item.fecha_estimada_entrega)}
                          </div>
                        </div>
                      </div>
                      {(item.tipoPago === "efectivo" ||
                        item.tipoPago === "pos") &&
                        item.totalPagar && (
                          <div className="w-full md:w-auto md:ml-4 pt-3 md:pt-0 mt-2 md:mt-0 border-t md:border-t-0 md:border-l md:pl-4 px-3 border-[#e5e7eb]">
                            <div className="mt-1 md:mt-0 text-xs md:text-sm font-semibold text-[#1a1a1a] bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                              {item.tipoPago === "efectivo"
                                ? `Monto: ${item.totalPagar}`
                                : `Monto: ${item.totalPagar}`}
                            </div>
                          </div>
                        )}
                      <div
                        className="hidden md:block shrink-0 w-px h-12 bg-[#e5e7eb]"
                        aria-hidden
                      />
                      <div className="flex flex-wrap items-center gap-2 shrink-0 w-full md:w-auto justify-end md:justify-start">
                        <button
                          type="button"
                          className="h-8 md:h-9 px-2 md:px-3 rounded-lg flex items-center justify-center text-[#027EB1] border-2 border-[#e5e7eb] hover:bg-[#027EB1]/10 hover:border-[#027EB1]/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                          aria-label="Ver detalles"
                          onClick={() => openDetallesFromOjo(item)}
                        >
                          <Eye className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                        <button
                          type="button"
                          className="h-8 md:h-9 px-3 md:px-5 rounded-lg font-bold text-xs md:text-sm shadow-sm bg-[#027EB1] text-white hover:bg-[#026a9a] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                          onClick={() => handleEntregar(index)}
                        >
                          Entregar
                        </button>
                        <button
                          type="button"
                          className="h-8 md:h-9 px-3 md:px-5 rounded-lg text-xs md:text-sm font-semibold border-2 border-[#d61216] text-[#d61216] hover:bg-[#d61216]/10 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                          onClick={() => setRechazarPedidoId(item.id_pedido)}
                        >
                          Rechazar
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
              <div className="mt-4 flex justify-end">
                <span className="text-xs md:text-sm bg-[#f3f4f6] border border-[#e5e7eb] rounded-lg px-3 py-1.5 text-[#374151]">
                  Mostrando{" "}
                  <span className="font-semibold">
                    {pedidosActuales.length}
                  </span>{" "}
                  de{" "}
                  <span className="font-semibold">{MAX_PEDIDOS_ACTUALES}</span>
                </span>
              </div>
            </>
          ) : loading && !hasLoadedOnce ? (
            <p className="text-[#6b7280]">Cargando...</p>
          ) : (
            <p className="text-[#6b7280]">
              No hay pedidos actuales. Usa el icono ↑ en la tabla para subir
              pedidos.
            </p>
          )}
        </div>

        <h2
          className="text-[32px] font-normal text-[#1a1a1a] leading-10 mb-4 animate-fade-in-up"
          style={{
            animationDelay: "0.12s",
            opacity: 0,
            animationFillMode: "forwards",
          }}
        >
          Pedidos en cola
        </h2>

        {/* Desktop: tabla */}
        <div
          className="hidden md:block animate-fade-in-up"
          style={{
            animationDelay: "0.18s",
            opacity: 0,
            animationFillMode: "forwards",
          }}
        >
          {!hasLoadedOnce && loading ? (
            <div className="rounded-[10px] border border-[#d1d5dc] bg-white shadow-sm p-6 text-center text-[#6b7280]">
              Cargando...
            </div>
          ) : (
            <div className="min-h-[420px]">
              <DataTable<PedidoEnCola>
                rowKey="id"
                columns={columns}
                dataSource={pedidosEnCola}
                loading={loading}
                emptyMessage={
                  totalCola === 0
                    ? "No hay pedidos"
                    : "Sin resultados en esta página"
                }
                pagination={
                  totalCola > 0
                    ? {
                        current: page,
                        pageSize: PAGE_SIZE,
                        total: totalCola,
                        onChange: (p) => setPage(p),
                      }
                    : undefined
                }
              />
            </div>
          )}
        </div>

        {/* Móvil: cards con paginación */}
        <div
          className="md:hidden animate-fade-in-up"
          style={{
            animationDelay: "0.18s",
            opacity: 0,
            animationFillMode: "forwards",
          }}
        >
          {!hasLoadedOnce && loading ? (
            <p className="text-[#6b7280] py-4">Cargando...</p>
          ) : totalCola === 0 ? (
            <div className="rounded-[10px] border border-[#d1d5dc] bg-white shadow-sm p-8 text-center text-[#6b7280]">
              No hay pedidos
            </div>
          ) : (
            <div className="rounded-[14px] border border-[#d1d5dc] bg-white shadow-sm p-3 space-y-4">
              <div className="max-h-[55vh] overflow-y-auto pr-1 space-y-4">
                {pedidosEnCola.map((pedido, index) => (
                  <div
                    key={pedido.id}
                    className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm p-4 transition-all duration-200 hover:shadow-md hover:border-[#d1d5dc] animate-fade-in-up"
                    style={{
                      animationDelay: `${0.22 + index * 0.04}s`,
                      opacity: 0,
                      animationFillMode: "forwards",
                    }}
                  >
                    <div className="flex justify-between items-start gap-2 mb-3">
                      <div>
                        <div className="text-xs text-[#6b7280]">ID Pedido</div>
                        <div className="font-semibold text-[#1a1a1a]">
                          {pedido.id_pedido}
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          type="button"
                          className="p-2 text-[#0B4E87] bg-[#0B4E87]/10 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                          aria-label="Subir a pedidos actuales"
                          onClick={() => moverAActuales(pedido)}
                        >
                          <ArrowUp className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          className="p-2 text-[#027EB1] bg-[#027EB1]/10 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                          aria-label="Ver detalles"
                          onClick={() => openDetallesFromOjo(pedido)}
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          className="p-2 text-[#d61216] bg-[#d61216]/10 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                          aria-label="Rechazar"
                          onClick={() => setRechazarPedidoId(pedido.id_pedido)}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <div className="text-sm">
                      <div className="text-[#6b7280]">Nombre</div>
                      <div className="font-medium text-[#1a1a1a]">
                        {pedido.nombre}
                      </div>
                    </div>
                    <div className="text-sm mt-2">
                      <div className="text-[#6b7280]">Dirección</div>
                      <div className="text-[#1a1a1a] line-clamp-2">
                        {pedido.direccion}
                      </div>
                    </div>
                    <div className="text-sm mt-2">
                      <div className="text-[#6b7280]">Fecha entrega</div>
                      <div className="text-[#1a1a1a]">
                        {formatFechaEntrega(pedido.fecha_estimada_entrega)}
                      </div>
                    </div>
                    <div className="text-sm mt-2">
                      <div className="text-[#6b7280]">Tipo de pago</div>
                      <div className="mt-0.5">
                        {pedido.tipoPago ? (
                          pedido.tipoPago === "efectivo" ||
                          pedido.tipoPago === "pos" ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 capitalize">
                              {pedido.tipoPago.replace(/_/g, " ")}
                            </span>
                          ) : (
                            <span className="text-[#1a1a1a] capitalize">
                              {pedido.tipoPago.replace(/_/g, " ")}
                            </span>
                          )
                        ) : (
                          <span className="text-[#9ca3af]">—</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {totalCola > 0 &&
                (() => {
                  const totalPages = Math.ceil(totalCola / PAGE_SIZE);
                  const start = (page - 1) * PAGE_SIZE + 1;
                  const end = Math.min(page * PAGE_SIZE, totalCola);
                  return (
                    <div className="mt-2 flex flex-col items-center gap-3">
                      <p className="text-sm text-[#6b7280]">
                        Mostrando {start}-{end} de {totalCola}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={page <= 1}
                          onClick={() => setPage((p) => p - 1)}
                          className="rounded-lg border border-[#d1d5dc] bg-white px-4 py-2 text-sm font-medium text-[#364153] disabled:opacity-40 transition-all duration-200 hover:bg-gray-50 active:scale-[0.98]"
                        >
                          Anterior
                        </button>
                        <span className="text-sm text-[#1a1a1a]">
                          Pág. {page} / {totalPages || 1}
                        </span>
                        <button
                          type="button"
                          disabled={page >= totalPages}
                          onClick={() => setPage((p) => p + 1)}
                          className="rounded-lg border border-[#d1d5dc] bg-white px-4 py-2 text-sm font-medium text-[#364153] disabled:opacity-40 transition-all duration-200 hover:bg-gray-50 active:scale-[0.98]"
                        >
                          Siguiente
                        </button>
                      </div>
                    </div>
                  );
                })()}
            </div>
          )}
        </div>
      </div>

      <ModalEfectuarEntrega
        open={modalEfectuarOpen}
        onClose={() => setModalEfectuarOpen(false)}
        onVerDetalles={openDetallesFromEfectuar}
        onEntregar={handleEfectuarEntrega}
        tipoPago={pedidosActuales[0]?.tipoPago}
        totalPagar={totalPagarModal}
        loading={efectuarEntregaLoading}
      />

      <ModalDetallesEntrega
        open={modalDetallesOpen}
        onClose={() => {
          const wasFromEfectuar = detallesFromEfectuar;
          setModalDetallesOpen(false);
          setPedidoParaDetalles(null);
          setDetalleData(null);
          setDetallesFromEfectuar(false);
          if (wasFromEfectuar) setModalEfectuarOpen(true);
        }}
        codigo={detalleData?.codigo}
        persona={detalleData?.persona}
        telefono={detalleData?.telefono}
        tipoPago={detalleData?.tipoPago}
        direccion={detalleData?.direccion}
        fechaEstimadaEntrega={detalleData?.fecha_estimada_entrega}
        items={detalleData?.items}
        subtotalPedido={
          detalleData?.subtotal !== undefined
            ? detalleData.subtotal + (detalleData.descuento ?? 0)
            : undefined
        }
        descuentoPedido={detalleData?.descuento}
        isvPedido={detalleData?.isv}
        costoEnvio={detalleData?.costo_envio}
        tipoEntrega={detalleData?.tipoEntrega}
        fromOjo={!!pedidoParaDetalles}
      />

      <ModalRechazarPedido
        open={rechazarPedidoId != null}
        onClose={() => setRechazarPedidoId(null)}
        onConfirmar={handleConfirmarRechazo}
        loading={rechazarPedidoLoading}
      />
    </div>
  );
}
