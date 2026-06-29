import { useState, useEffect, useMemo, useCallback } from "react";
import { Typography, message, Button, Input, Select, DatePicker } from "antd";
import { ConfigProvider } from "antd";
import {
  Eye,
  Filter,
  Search,
  Calendar,
  FilterX,
  CreditCard,
  User,
  Clock,
  MapPin
} from "lucide-react";
import { type Dayjs } from "dayjs";
import DeliveryDetailModal from "../../components/modal/DeliveryDetailModal";
import {
  getDeliveryHistory,
  getDeliveryDetail,
  type DeliveryRecord,
  type DeliveryDetail,
} from "../../api/deliveries/delivery-history";
import { getPrivilegesUser, type Privilegio } from "../../api/auth/privileges";
import { getAllActiveBranches } from "../../api/branches/branches";
import type { Sucursal } from "../../types/branch";
import { DataTable, type DataTableColumn } from "../../components/DataTable";
import { Badge } from "../../components/ui/badge";
import { cn } from "../../components/ui/utils";
import { usePreventDuplicate } from "../../hooks/usePreventDuplicateRequest";

const { Title, Text } = Typography;

const PAGE_SIZE = 6;

function mapEstadoToBackend(label: string): string | undefined {
  switch (label) {
    case "Entregado":
      return "entregado";
    case "En proceso":
      return "en_proceso";
    case "Pendiente":
      return "pendiente";
    case "Cancelado":
      return "cancelado";
    default:
      return undefined;
  }
}

function formatTelefono(telefono: string | null | undefined): string {
  if (!telefono) return "—";

  // Eliminar todos los caracteres no numéricos
  const numeros = telefono.replace(/\D/g, "");

  // Si no hay suficientes números, devolver el original
  if (numeros.length < 4) return telefono;

  // Formato para Honduras: XXXX-XXXX
  if (numeros.length === 7) {
    return `${numeros.slice(0, 4)}-${numeros.slice(4)}`;
  }

  // Formato para 8 dígitos: XXXX-XXXX
  if (numeros.length === 8) {
    return `${numeros.slice(0, 4)}-${numeros.slice(4)}`;
  }

  // Formato para otros casos: XXXX-XXXX-XXXX
  if (numeros.length > 8) {
    return `${numeros.slice(0, 4)}-${numeros.slice(4, 8)}${numeros.slice(8) ? "-" + numeros.slice(8) : ""}`;
  }

  return telefono;
}

function formatMonto(monto: any): string {
  // Convertir a número si no lo es
  const numero = Number(monto);

  // Verificar si es un número válido
  if (isNaN(numero) || !isFinite(numero)) {
    return "L. 0.00";
  }

  // Formatear con comas como separador de miles y 2 decimales
  const [enteros, decimales] = numero.toFixed(2).split(".");
  const enterosConComas = enteros.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `L. ${enterosConComas}.${decimales}`;
}

function formatFecha(fecha: string | Date | null | undefined): string {
  if (!fecha) return "—";
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return "—";

  // Formato local: DD/MM/YYYY HH:mm
  return new Intl.DateTimeFormat("es-HN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

export default function DeliveryHistoryPage() {
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Estados de filtros individuales al estilo de history.tsx
  const [searchTerm, setSearchTerm] = useState("");
  const [estado, setEstado] = useState("Todos");
  const [tipoPago, setTipoPago] = useState("Todos");
  const [fechaPedido, setFechaPedido] = useState<Dayjs | null>(null);
  const [fechaEntrega, setFechaEntrega] = useState<Dayjs | null>(null);
  const [selectedSucursal, setSelectedSucursal] = useState("todos");
  const [selectedRepartidor, setSelectedRepartidor] = useState<number>(0);

  const resetFilters = () => {
    setSearchTerm("");
    setEstado("Todos");
    setTipoPago("Todos");
    setFechaPedido(null);
    setFechaEntrega(null);
    setSelectedSucursal("todos");
    setSelectedRepartidor(0);
    setPage(1);
  };

  const [selectedDetail, setSelectedDetail] = useState<DeliveryDetail | null>(
    null,
  );
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [canSeeAll, setCanSeeAll] = useState(false);
  const [privilegesLoaded, setPrivilegesLoaded] = useState(false);
  const [repartidores, setRepartidores] = useState<
    { id: number; name: string }[]
  >([]);
  const [branches, setBranches] = useState<Sucursal[]>([]);

  const loadHistory = useCallback(
    async (pageToLoad: number) => {
      if (accessDenied) return;
      setLoading(true);
      try {
        const apiFilters: any = {
          page: pageToLoad,
          limit: PAGE_SIZE,
        };

        if (fechaPedido) {
          apiFilters.fecha = fechaPedido.format("YYYY-MM-DD");
        }
        if (fechaEntrega) {
          apiFilters.fecha_entrega = fechaEntrega.format("YYYY-MM-DD");
        }

        if (estado !== "Todos") {
          const estadoBackend = mapEstadoToBackend(estado);
          if (estadoBackend) {
            apiFilters.estado = estadoBackend;
          }
        }

        if (tipoPago !== "Todos") {
          apiFilters.tipo_pago = tipoPago;
        }

        if (searchTerm.trim()) {
          apiFilters.buscar = searchTerm.trim();
        }

        if (
          canSeeAll &&
          selectedRepartidor !== 0
        ) {
          apiFilters.id_repartidor = selectedRepartidor;
        }

        const {
          rows,
          totalPages,
          totalRows,
          page: backendPage,
        } = await getDeliveryHistory(apiFilters);

        let filteredRows = rows;

        // Frontend-side branch filtering
        if (
          canSeeAll &&
          selectedSucursal !== "todos"
        ) {
          filteredRows = filteredRows.filter(
            (r) => String(r.id_sucursal) === String(selectedSucursal),
          );
        }

        if (fechaPedido) {
          const selectedStr = fechaPedido.format("YYYY-MM-DD");
          filteredRows = filteredRows.filter((r) => {
            const d = new Date(r.fecha);
            const fechaBackend =
              d.getFullYear() +
              "-" +
              String(d.getMonth() + 1).padStart(2, "0") +
              "-" +
              String(d.getDate()).padStart(2, "0");

            return fechaBackend === selectedStr;
          });
        }

        if (fechaEntrega) {
          const selectedStr = fechaEntrega.format("YYYY-MM-DD");
          filteredRows = filteredRows.filter((r) => {
            if (!r.fecha_entrega) return false;
            const d = new Date(r.fecha_entrega);
            const fechaBackend =
              d.getFullYear() +
              "-" +
              String(d.getMonth() + 1).padStart(2, "0") +
              "-" +
              String(d.getDate()).padStart(2, "0");
            return fechaBackend === selectedStr;
          });
        }

        setDeliveries(filteredRows);
        if (canSeeAll && selectedSucursal !== "todos") {
          setTotalRows(filteredRows.length);
          setTotalPages(Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE)));
        } else {
          setTotalPages(Math.max(1, totalPages));
          setTotalRows(totalRows);
        }
        setPage(backendPage);

        if (canSeeAll) {
          setRepartidores((prev) => {
            const map = new Map(prev.map((r) => [r.id, r.name]));
            rows.forEach((r) => {
              if (r.repartidor) {
                const id = r.repartidor.id_usuario;
                const name = `${r.repartidor.primer_nombre} ${r.repartidor.primer_apellido}`;
                if (!map.has(id)) map.set(id, name);
              }
            });
            return Array.from(map.entries()).map(([id, name]) => ({
              id,
              name,
            }));
          });
        }
      } catch {
        message.error("No se pudo cargar el historial de entregas");
        setDeliveries([]);
      } finally {
        setLoading(false);
      }
    },
    [
      accessDenied,
      canSeeAll,
      searchTerm,
      estado,
      tipoPago,
      fechaPedido,
      fechaEntrega,
      selectedSucursal,
      selectedRepartidor
    ],
  );

  useEffect(() => {
    (async () => {
      try {
        const privs = await getPrivilegesUser();
        const nombres = privs.map((p: Privilegio) => p.nombre);
        const hasAll =
          nombres.includes("PED_HISTORIAL_ALL") ||
          nombres.includes("ALL_ACCESS");
        const hasOwn = nombres.includes("PED_HISTORIAL");
        if (!hasAll && !hasOwn) {
          setAccessDenied(true);
          return;
        }
        setCanSeeAll(hasAll);

        // Fetch branches if user can see all
        if (hasAll) {
          const branchesRes = await getAllActiveBranches();
          setBranches(branchesRes);
        }
      } catch {
        setAccessDenied(true);
      } finally {
        setPrivilegesLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (privilegesLoaded && !accessDenied) {
      void loadHistory(page);
    }
  }, [
    privilegesLoaded,
    accessDenied,
    loadHistory,
    page
  ]);

  const performViewDetail = async (record: DeliveryRecord) => {
    setDetailModalOpen(true);
    setSelectedDetail(null);
    const detail = await getDeliveryDetail(record.id_pedido);
    setSelectedDetail(detail);
  };

  const { execute: handleViewDetail } = usePreventDuplicate(performViewDetail);

  const handleCloseDetail = () => {
    setDetailModalOpen(false);
    setSelectedDetail(null);
  };

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    setPage(nextPage);
  };

  const columns: DataTableColumn<DeliveryRecord>[] = useMemo(() => {
    const base: DataTableColumn<DeliveryRecord>[] = [
      {
        title: "ID_ENTREGA",
        dataIndex: "id_pedido",
        key: "id_pedido",
        width: 110,
      },
      {
        title: "FECHA PEDIDO",
        dataIndex: "fecha",
        key: "fecha_pedido",
        width: 160,
        render: (_, record) => formatFecha(record.fecha),
      },
      {
        title: "FECHA ENTREGA",
        dataIndex: "fecha_entrega",
        key: "fecha_entrega",
        width: 160,
        render: (_, record) => formatFecha(record.fecha_entrega),
      },
      {
        title: "CLIENTE",
        key: "cliente",
        width: 200,
        render: (_, record) => record.cliente.nombre ?? "—",
      },
      {
        title: "TELÉFONO",
        key: "telefono",
        width: 150,
        render: (_, record) => formatTelefono(record.cliente.telefono),
      },
      {
        title: "CORREO",
        key: "correo",
        ellipsis: true,
        render: (_, record) => record.cliente.correo ?? "—",
      },
    ];

    if (canSeeAll) {
      base.push({
        title: "REPARTIDOR",
        key: "repartidor",
        width: 190,
        render: (_, record) =>
          record.repartidor
            ? `${record.repartidor.primer_nombre} ${record.repartidor.primer_apellido}`
            : "—",
      });
    }

    base.push(
      {
        title: "ESTADO",
        key: "estado",
        width: 140,
        render: (_, record) => {
          const estado = String(record.estado).toLowerCase();
          let colorClass = "bg-gray-100 text-gray-800 border-0";
          let displayText = String(record.estado).toUpperCase();

          switch (estado) {
            case "entregado":
              colorClass = "bg-green-100 text-green-800 border-0";
              break;
            case "en_proceso":
              colorClass = "bg-blue-100 text-blue-800 border-0";
              displayText = "EN PROCESO";
              break;
            case "pendiente":
              colorClass = "bg-yellow-100 text-yellow-800 border-0";
              break;
            case "cancelado":
              colorClass = "bg-red-100 text-red-800 border-0";
              break;
          }

          return (
            <Badge className={cn("rounded-full font-semibold", colorClass)}>
              {displayText}
            </Badge>
          );
        },
      },
      {
        title: "TOTAL",
        key: "total",
        width: 140,
        render: (_, record) => formatMonto(record.resumen.total),
      },
      {
        title: "ACCIONES",
        key: "acciones",
        width: 130,
        render: (_, record) => (
          <Button
            type="text"
            className="text-[#027EB1] hover:bg-[#E7F2FA] hover:text-[#026a96]"
            onClick={() => handleViewDetail(record)}
            aria-label="Ver detalles"
          >
            <Eye className="w-5 h-5" />
          </Button>
        ),
      },
    );

    return base;
  }, [canSeeAll]);

  const paginatedForMobile = deliveries;

  if (accessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f8fa]">
        <div className="text-sm md:text-base text-gray-500">
          No tienes permisos para ver el historial de entregas.
        </div>
      </div>
    );
  }

  return (
    <ConfigProvider>
      <div className="min-h-screen bg-[#f7f8fa] px-4 md:px-6 py-6 md:py-8">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-8">
            <div>
              <Title level={2} className="!mb-1 !text-gray-800">
                Historial de Entregas
              </Title>
              <Text type="secondary">
                Consulta el detalle de entregas realizadas.
              </Text>
            </div>
            <Button
              onClick={() => setFiltersOpen(!filtersOpen)}
              icon={<Filter size={16} />}
              className={`rounded-xl h-10 md:h-12 px-4 md:px-6 font-semibold shadow-sm 
            ${filtersOpen ? "!text-[#027EB1]" : "!bg-[#027EB1] !text-white"}`}
            >
              {filtersOpen ? "Ocultar Filtros" : "Mostrar Filtros"}
            </Button>
          </div>

          {filtersOpen && (
            <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-5 mb-5 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex-grow min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#027EB1] pointer-events-none z-10" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setPage(1);
                      }}
                      placeholder="Buscar pedido o cliente..."
                      className="!h-10 !w-full !rounded-xl !bg-white !border !border-[#D7E3F0] hover:!border-[#027EB1] focus:!border-[#027EB1] !pl-9 !text-slate-700 placeholder:!text-slate-400"
                    />
                  </div>
                </div>

                <div className="flex-grow min-w-[160px]">
                  <Select
                    value={estado}
                    onChange={(val) => {
                      setEstado(val);
                      setPage(1);
                    }}
                    className="w-full h-10 rounded-xl"
                    placeholder="Estado"
                    suffixIcon={<Clock className="h-4 w-4 text-[#027EB1]" />}
                  >
                    <Select.Option value="Todos">Todos los estados</Select.Option>
                    <Select.Option value="Pendiente">Pendiente</Select.Option>
                    <Select.Option value="En proceso">En proceso</Select.Option>
                    <Select.Option value="Entregado">Entregado</Select.Option>
                    <Select.Option value="Cancelado">Cancelado</Select.Option>
                  </Select>
                </div>

                <div className="flex-grow min-w-[160px]">
                  <Select
                    value={tipoPago}
                    onChange={(val) => {
                      setTipoPago(val);
                      setPage(1);
                    }}
                    className="w-full h-10 rounded-xl"
                    placeholder="Método de pago"
                    suffixIcon={<CreditCard className="h-4 w-4 text-[#027EB1]" />}
                  >
                    <Select.Option value="Todos">Todos los pagos</Select.Option>
                    <Select.Option value="efectivo">Efectivo</Select.Option>
                    <Select.Option value="transferencia_bancaria">Transferencia</Select.Option>
                    <Select.Option value="pos">POS</Select.Option>
                    <Select.Option value="pay_pal">PayPal</Select.Option>
                    <Select.Option value="compra_click">Link de Pago</Select.Option>
                  </Select>
                </div>

                <div className="flex-shrink-0 min-w-[160px]">
                  <DatePicker
                    value={fechaPedido}
                    onChange={(date) => {
                      setFechaPedido(date);
                      setPage(1);
                    }}
                    placeholder="Fecha Pedido"
                    format="DD-MM-YYYY"
                    suffixIcon={<Calendar className="h-4 w-4 text-[#027EB1]" />}
                    className="w-full h-10 rounded-xl bg-white border border-[#D7E3F0] hover:border-[#027EB1]"
                  />
                </div>

                <div className="flex-shrink-0 min-w-[160px]">
                  <DatePicker
                    value={fechaEntrega}
                    onChange={(date) => {
                      setFechaEntrega(date);
                      setPage(1);
                    }}
                    placeholder="Fecha Entrega"
                    format="DD-MM-YYYY"
                    suffixIcon={<Calendar className="h-4 w-4 text-[#027EB1]" />}
                    className="w-full h-10 rounded-xl bg-white border border-[#D7E3F0] hover:border-[#027EB1]"
                  />
                </div>

                {canSeeAll && (
                  <>
                    <div className="flex-grow min-w-[200px]">
                      <Select
                        value={selectedSucursal}
                        onChange={(val) => {
                          setSelectedSucursal(val);
                          setPage(1);
                        }}
                        className="w-full h-10 rounded-xl"
                        placeholder="Sucursal"
                        suffixIcon={<MapPin className="h-4 w-4 text-[#027EB1]" />}
                      >
                        <Select.Option value="todos">Todas las sucursales</Select.Option>
                        {branches.map((b) => (
                          <Select.Option key={b.id_sucursal} value={String(b.id_sucursal)}>
                            {b.nombre}
                          </Select.Option>
                        ))}
                      </Select>
                    </div>

                    <div className="flex-grow min-w-[200px]">
                      <Select
                        value={selectedRepartidor}
                        onChange={(val) => {
                          setSelectedRepartidor(val);
                          setPage(1);
                        }}
                        className="w-full h-10 rounded-xl"
                        placeholder="Repartidor"
                        suffixIcon={<User className="h-4 w-4 text-[#027EB1]" />}
                      >
                        <Select.Option value={0}>Todos los repartidores</Select.Option>
                        {repartidores.map((r) => (
                          <Select.Option key={r.id} value={r.id}>
                            {r.name}
                          </Select.Option>
                        ))}
                      </Select>
                    </div>
                  </>
                )}

                <button
                  type="button"
                  onClick={resetFilters}
                  title="Limpiar filtros"
                  className="flex items-center justify-center h-10 min-w-[40px] rounded-xl border border-[#D7E3F0] bg-white text-slate-600 hover:text-[#D61216] hover:border-[#D61216] transition-all group flex-shrink-0"
                >
                  <FilterX className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
              </div>
            </div>
          )}

          {/* Desktop: DataTable */}
          <div className="hidden md:block">
            <DataTable<DeliveryRecord>
              rowKey="id_pedido"
              columns={columns}
              dataSource={deliveries}
              loading={loading}
              pagination={{
                current: page,
                pageSize: PAGE_SIZE,
                total: totalRows,
                onChange: (nextPage) => handlePageChange(nextPage),
              }}
              emptyMessage="No hay entregas registradas"
            />
          </div>

          {/* Mobile: tarjetas */}
          <div className="md:hidden flex flex-col gap-3">
            {loading ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 text-center text-gray-500">
                Cargando...
              </div>
            ) : paginatedForMobile.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 text-center text-gray-500">
                No hay resultados
              </div>
            ) : (
              paginatedForMobile.map((row) => (
                <div
                  key={row.id_pedido}
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="text-xs text-slate-500 font-medium uppercase">
                        Cliente
                      </div>
                      <div className="text-sm font-bold text-slate-800 mt-0.5">
                        {row.cliente.nombre}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        ID entrega {row.id_pedido}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Fecha pedido: {formatFecha(row.fecha)}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Fecha entrega: {formatFecha(row.fecha_entrega)}
                      </div>
                    </div>
                    <Badge
                      className={cn(
                        "rounded-full font-semibold text-[11px] px-3 py-0.5",
                        (() => {
                          const estado = String(row.estado).toLowerCase();
                          switch (estado) {
                            case "entregado":
                              return "bg-green-100 text-green-800 border-0";
                            case "en_proceso":
                              return "bg-blue-100 text-blue-800 border-0";
                            case "pendiente":
                              return "bg-yellow-100 text-yellow-800 border-0";
                            case "cancelado":
                              return "bg-red-100 text-red-800 border-0";
                            default:
                              return "bg-gray-100 text-gray-800 border-0";
                          }
                        })(),
                      )}
                    >
                      {(() => {
                        const estado = String(row.estado).toLowerCase();
                        switch (estado) {
                          case "en_proceso":
                            return "EN PROCESO";
                          default:
                            return String(row.estado).toUpperCase();
                        }
                      })()}
                    </Badge>
                  </div>

                  <div className="mt-3 space-y-1 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500">Total</span>
                      <span className="text-right text-slate-700 font-bold">
                        {formatMonto(row.resumen.total)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500">Correo</span>
                      <span className="text-right text-slate-700 break-all">
                        {row.cliente.correo}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500">Teléfono</span>
                      <span className="text-right text-slate-700">
                        {formatTelefono(row.cliente.telefono)}
                      </span>
                    </div>
                    {canSeeAll && row.repartidor && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500">Repartidor</span>
                        <span className="text-right text-slate-700">
                          {row.repartidor.primer_nombre}{" "}
                          {row.repartidor.primer_apellido}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Acciones</span>
                    <Button
                      type="text"
                      className="text-[#027EB1] hover:bg-[#E7F2FA] hover:text-[#026a96] px-2"
                      onClick={() => handleViewDetail(row)}
                      aria-label="Ver detalles"
                    >
                      <Eye className="w-5 h-5" />
                      <span className="ml-1">Ver detalles</span>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex justify-center items-center gap-3 md:hidden">
              <button
                type="button"
                className="rounded-lg border border-[#d1d5dc] bg-white px-3 py-1.5 text-xs font-medium text-[#364153] disabled:opacity-40"
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
              >
                Anterior
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handlePageChange(p)}
                    className={cn(
                      "h-8 w-8 rounded-lg text-xs font-medium",
                      p === page
                        ? "bg-[#0B4E87] text-white"
                        : "border border-[#d1d5dc] bg-white text-[#364153]",
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="rounded-lg border border-[#d1d5dc] bg-white px-3 py-1.5 text-xs font-medium text-[#364153] disabled:opacity-40"
                disabled={page >= totalPages}
                onClick={() => handlePageChange(page + 1)}
              >
                Siguiente
              </button>
            </div>
          )}
        </div>

        <DeliveryDetailModal
          delivery={selectedDetail}
          isOpen={detailModalOpen}
          onClose={handleCloseDetail}
        />
      </div>
    </ConfigProvider>
  );
}
