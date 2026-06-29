import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Empty, Spin, Table, Tag, message, ConfigProvider } from "antd";
import {
  ShoppingCartOutlined,
  WarningOutlined,
  LineChartOutlined,
  DashboardOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import { getDashboardStats } from "../../api/admin/dashboard";
import {
  getDetalleEntrega,
  getMisPedidosEntregas,
  type DetalleItem,
  type PedidoEnCola,
} from "../../api/delivery/entregas";
import { getPrivilegesUser, type Privilegio } from "../../api/auth/privileges";
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useNavigate } from "react-router-dom";

type Permission =
  | "pedidos.view"
  | "pedidos.entrega"
  | "inventario.ingreso"
  | "inventario.historial"
  | "reportes.sugerencias"
  | "reportes.ventas"
  | "admin.productos";

type PendingOrderRow = {
  id?: number | string;
  id_pedido?: number | string;
  fecha?: string;
  cliente?: string;
  nombre_cliente?: string;
  estado?: string;
  total?: number;
  monto_total?: number;
};

type SalesTrendItem = {
  month: string;
  ventas: number;
};

type BrandChartItem = {
  name: string;
  value: number;
  color: string;
};

const BRANCH_STORAGE_KEY = "selectedBranch";
const BRANCH_CHANGED_EVENT = "branchChanged";

const STORAGE_KEY_ACTUALES = "delivery_pedidos_actuales";
const MAX_PEDIDOS_ACTUALES = 3;
const PAGE_SIZE_DELIVERY_QUEUE = 5;

type PedidoActualLocal = {
  id: string;
  id_pedido: number;
  nombre: string;
  persona?: string;
  telefono?: string;
  tipoPago?: string;
  totalPagar?: string;
  direccion?: string;
  fecha_estimada_entrega?: string | null;
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

const mapPrivilegesToPermissions = (
  privileges: Privilegio[],
): Set<Permission> => {
  const permissions = new Set<Permission>();

  privileges.forEach((privilege) => {
    switch (privilege.nombre) {
      case "PED_PEDIDOS":
        permissions.add("pedidos.view");
        break;
      case "PED_ENTREGA":
        permissions.add("pedidos.entrega");
        break;
      case "INV_INGRESO":
        permissions.add("inventario.ingreso");
        break;
      case "INV_HISTORIAL":
        permissions.add("inventario.historial");
        break;
      case "REP_SUGERENCIAS":
        permissions.add("reportes.sugerencias");
        break;
      case "REP_VENTAS":
        permissions.add("reportes.ventas");
        break;
      case "ADM_PRODUCTOS":
        permissions.add("admin.productos");
        break;
      case "ALL_ACCESS":
        permissions.add("pedidos.view");
        permissions.add("pedidos.entrega");
        permissions.add("inventario.ingreso");
        permissions.add("inventario.historial");
        permissions.add("reportes.sugerencias");
        permissions.add("reportes.ventas");
        permissions.add("admin.productos");
        break;
      default:
        break;
    }
  });

  return permissions;
};

const getStatusTagColor = (estado: string) => {
  const value = String(estado || "")
    .toLowerCase()
    .replaceAll("_", " ");

  if (value.includes("pendiente") && !value.includes("pago")) return "orange";
  if (value.includes("entregado")) return "green";
  if (value.includes("proceso")) return "blue";
  if (value.includes("pago pendiente")) return "gold";
  if (value.includes("cancelado")) return "red";
  if (value.includes("devolucion")) return "default";

  return "default";
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat("es-HN", {
    style: "currency",
    currency: "HNL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const DONUT_COLORS = [
  "#027EB1", // azul principal
  "#036EA0", // azul intermedio
  "#045F8F", // azul medio
  "#054F7E", // azul más oscuro
  "#003E7B", // azul oscuro
  "#4FA3C7", // azul claro suave
  "#7BBED7", // azul muy claro
  "#D61216", // rojo corporativo (acento)
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedBranch, setSelectedBranch] = useState<number>(() => {
    const stored = Number(localStorage.getItem(BRANCH_STORAGE_KEY) || "0");
    return Number.isFinite(stored) && stored > 0 ? stored : 0;
  });

  const [permissions, setPermissions] = useState<Set<Permission>>(new Set());

  const [totals, setTotals] = useState({
    pendingOrders: 0,
    criticalStockCount: 0,
    soldTiresToday: 0,
    soldTiresMonth: 0,
  });

  const [pendingOrdersList, setPendingOrdersList] = useState<PendingOrderRow[]>(
    [],
  );
  const [salesTrendData, setSalesTrendData] = useState<SalesTrendItem[]>([]);
  const [brandChartData, setBrandChartData] = useState<BrandChartItem[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [deliveryQueueLoading, setDeliveryQueueLoading] = useState(false);
  const [deliveryQueue, setDeliveryQueue] = useState<PedidoEnCola[]>([]);
  const [deliveryQueuePage, setDeliveryQueuePage] = useState(1);
  const [deliveryQueueTotal, setDeliveryQueueTotal] = useState(0);
  const [movingPedidoId, setMovingPedidoId] = useState<number | null>(null);

  const today = useMemo(() => new Date(), []);
  const currentMonthLabel = useMemo(
    () => new Intl.DateTimeFormat("es-HN", { month: "long" }).format(today),
    [today],
  );

  const canManageOrders = permissions.has("pedidos.view");
  const canViewDelivery = permissions.has("pedidos.entrega");
  const canViewInventory = permissions.has("admin.productos");
  const canViewSalesTrend = permissions.has("reportes.ventas");

  const canViewAdminSalesCards = canViewSalesTrend;

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getDashboardStats({ id_sucursal: selectedBranch });

      if (!response?.ok) {
        throw new Error("La respuesta del dashboard no fue válida.");
      }

      const stats = response.stats ?? {
        ventasHoy: 0,
        pedidosPendientes: 0,
        productosBajoStock: 0,
        ventasMes: 0,
      };

      const lineChart = Array.isArray(response.graficaLineas)
        ? response.graficaLineas
        : [];

      const donutChart = Array.isArray(response.graficaDona)
        ? response.graficaDona
        : [];

      const latestOrders = Array.isArray(response.ultimosPedidos)
        ? response.ultimosPedidos
        : [];

      setTotals({
        pendingOrders: Number(stats.pedidosPendientes ?? 0),
        criticalStockCount: Number(stats.productosBajoStock ?? 0),
        soldTiresToday: Number(stats.ventasHoy ?? 0),
        soldTiresMonth: Number(stats.ventasMes ?? 0),
      });

      setSalesTrendData(
        lineChart.map((item) => ({
          month: item.name,
          ventas: Number(item.total ?? 0),
        })),
      );

      setBrandChartData(
        donutChart
          .map((item, index) => ({
            name: item.marca || "Sin marca",
            value: Number(item.cantidad ?? 0),
            color: DONUT_COLORS[index % DONUT_COLORS.length],
          }))
          .filter((item) => item.value > 0),
      );

      setPendingOrdersList(latestOrders.slice(0, 5));
    } catch (err) {
      console.error(err);
      setError(
        "No se pudieron cargar los datos del dashboard. Intente nuevamente.",
      );
      setTotals({
        pendingOrders: 0,
        criticalStockCount: 0,
        soldTiresToday: 0,
        soldTiresMonth: 0,
      });
      setSalesTrendData([]);
      setBrandChartData([]);
      setPendingOrdersList([]);
    } finally {
      setLoading(false);
    }
  }, [selectedBranch]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const privileges = await getPrivilegesUser();
        setPermissions(mapPrivilegesToPermissions(privileges));

        const branchesRes = await import("../../api/branches/branches").then(m => m.getAllActiveBranches());
        setBranches(branchesRes);
      } catch {
        setPermissions(new Set());
      }
    };

    void loadInitialData();
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!canViewDelivery) return;

    (async () => {
      setDeliveryQueueLoading(true);
      try {
        const raw = localStorage.getItem(STORAGE_KEY_ACTUALES);
        const parsed = raw ? (JSON.parse(raw) as PedidoActualLocal[]) : [];
        const actuales: PedidoActualLocal[] = Array.isArray(parsed)
          ? parsed
          : [];
        const excludeIds = actuales
          .map((a) => a.id_pedido)
          .filter((id) => Number.isFinite(id));

        const res = await getMisPedidosEntregas(
          deliveryQueuePage,
          PAGE_SIZE_DELIVERY_QUEUE,
          excludeIds,
        );
        if (cancelled) return;
        if (res.ok) {
          setDeliveryQueue(res.pedidos_en_cola ?? []);
          setDeliveryQueueTotal(Number(res.total ?? 0));

          if (
            deliveryQueuePage > 1 &&
            res.total > 0 &&
            (res.pedidos_en_cola?.length ?? 0) === 0
          ) {
            setDeliveryQueuePage(1);
          }
        }
      } catch (e) {
        if (!cancelled) setDeliveryQueue([]);
        if (!cancelled) setDeliveryQueueTotal(0);
        console.error(e);
      } finally {
        if (!cancelled) setDeliveryQueueLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [canViewDelivery, deliveryQueuePage]);

  useEffect(() => {
    void loadDashboard();
    
    // Configurar un intervalo de actualización automática (polling) cada 30 segundos
    const interval = setInterval(() => {
      void loadDashboard();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadDashboard]);

  useEffect(() => {
    const syncBranch = () => {
      const current = Number(localStorage.getItem(BRANCH_STORAGE_KEY) || "0");
      setSelectedBranch(Number.isFinite(current) && current > 0 ? current : 0);
    };

    window.addEventListener(BRANCH_CHANGED_EVENT, syncBranch);
    window.addEventListener("storage", syncBranch);

    return () => {
      window.removeEventListener(BRANCH_CHANGED_EVENT, syncBranch);
      window.removeEventListener("storage", syncBranch);
    };
  }, []);

  const recentOrdersColumns = useMemo(
    () => [
      {
        title: "Pedido",
        dataIndex: "id_pedido",
        key: "id_pedido",
        render: (value: number | string) => (
          <span className="text-[#2563EB] font-semibold">
            {value ? `PED-${String(value).padStart(4, "0")}` : "—"}
          </span>
        ),
      },
      {
        title: "Fecha",
        dataIndex: "fecha",
        key: "fecha",
        render: (value: string) => {
          if (!value) return "—";
          try {
            const date = new Date(value);
            // Usamos el formato local de Honduras (es-HN)
            return new Intl.DateTimeFormat("es-HN", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            }).format(date);
          } catch {
            return value; // Si falla el parseo, muestra el valor original
          }
        },
      },
      {
        title: "Cliente",
        key: "cliente",
        render: (_: unknown, record: PendingOrderRow) =>
          record.cliente || record.nombre_cliente || "Cliente no disponible",
      },
      {
        title: "Estado",
        dataIndex: "estado",
        key: "estado",
        render: (value: string) => (
          <Tag
            color={getStatusTagColor(value)}
            className="rounded-full capitalize"
          >
            {(value || "").replaceAll("_", " ")}
          </Tag>
        ),
      },
      {
        title: "Monto",
        key: "monto",
        align: "right" as const,
        render: (_: unknown, record: PendingOrderRow) => {
          const amount = Number(record.total ?? record.monto_total ?? 0);
          return amount > 0 ? formatMoney(amount) : "—";
        },
      },
    ],
    [],
  );

  const movePedidoToDeliveryActuales = useCallback(
    async (record: PedidoEnCola) => {
      if (movingPedidoId != null) return;
      setMovingPedidoId(record.id_pedido);
      try {
        const detalle = await getDetalleEntrega(record.id_pedido);
        if (!detalle?.ok) {
          message.error("No se pudo obtener el detalle del pedido");
          return;
        }

        const totalPagar = buildTotalDisplayFromItems(detalle.items);
        if (!totalPagar) {
          message.error("No se pudo calcular el total para la entrega");
          return;
        }

        const raw = localStorage.getItem(STORAGE_KEY_ACTUALES);
        const parsed = raw ? (JSON.parse(raw) as PedidoActualLocal[]) : [];
        const actuales: PedidoActualLocal[] = Array.isArray(parsed)
          ? parsed
          : [];

        const exists = actuales.some((a) => a.id_pedido === record.id_pedido);
        const next = exists
          ? actuales
          : (() => {
              const newItem: PedidoActualLocal = {
                id: record.id,
                id_pedido: record.id_pedido,
                nombre: record.nombre,
                persona: detalle.persona,
                telefono: detalle.telefono,
                tipoPago: detalle.tipoPago,
                totalPagar,
                direccion: detalle.direccion ?? record.direccion,
                fecha_estimada_entrega:
                  detalle.fecha_estimada_entrega ??
                  record.fecha_estimada_entrega ??
                  null,
              };

              if (actuales.length >= MAX_PEDIDOS_ACTUALES) {
                return [newItem, actuales[0], actuales[1]];
              }
              return [newItem, ...actuales];
            })();

        localStorage.setItem(STORAGE_KEY_ACTUALES, JSON.stringify(next));
        navigate("/delivery/orders");
      } finally {
        setMovingPedidoId(null);
      }
    },
    [movingPedidoId, navigate],
  );

  const totalBrandsAnalyzed = brandChartData.reduce(
    (acc, item) => acc + item.value,
    0,
  );

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[#F3F4F6] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Spin size="large" />
          <p className="text-slate-500">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <ConfigProvider>
    <div className="min-h-screen w-full bg-[#F3F4F6]">
      <div className="max-w-[1180px] mx-auto px-5 py-7">
        {error && (
          <div className="mb-4">
            <Alert type="warning" showIcon message={error} />
          </div>
        )}

        <div className="mb-7 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-[28px] md:text-[32px] font-bold text-[#111827] leading-none">
              Dashboard
            </h1>
            <p className="text-[15px] text-[#6B7280] mt-2">
              Resumen de tus actividades en la plataforma.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-[#027EB1]/10 px-4 py-2 rounded-xl border border-[#027EB1]/20">
            <EnvironmentOutlined className="text-[#027EB1]" />
            <span className="text-[#027EB1] font-bold text-sm">
              {selectedBranch === 0 
                ? "Todas las Sucursales" 
                : branches.find(b => b.id_sucursal === selectedBranch) 
                  ? `${branches.find(b => b.id_sucursal === selectedBranch).nombre}`
                  : `Sucursal ID: ${selectedBranch}`
              }
            </span>
          </div>
        </div>



        {(canManageOrders || canViewInventory || canViewAdminSalesCards) && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
            {canViewAdminSalesCards && (
              <div 
                onClick={() => navigate("/admin/reportes/ventas")}
                className="bg-white border border-[#E5E7EB] rounded-[18px] px-5 py-4 shadow-sm min-h-[152px] cursor-pointer hover:border-[#EF4444] hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="text-[15px] leading-5 text-[#4B5563] group-hover:text-[#EF4444] transition-colors">
                    Cantidad de
                    <br />
                    llantas vendidas hoy
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[#FCECEC] flex items-center justify-center text-[#EF4444] text-[18px]">
                    <DashboardOutlined />
                  </div>
                </div>

                <div className="text-[19px] md:text-[22px] font-bold text-[#111827]">
                  {totals.soldTiresToday}
                </div>

                <div className="text-[14px] text-[#16A34A] mt-3">
                  Actualizado al día
                </div>
              </div>
            )}

            {canManageOrders && (
              <div
                onClick={() => navigate("/admin/pedidos?estado=pendiente")}
                className="bg-white border border-[#E5E7EB] rounded-[18px] px-5 py-4 shadow-sm min-h-[152px] cursor-pointer hover:border-[#2563EB] hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="text-[15px] leading-5 text-[#4B5563] group-hover:text-[#2563EB] transition-colors">
                    Pedidos
                    <br />
                    pendientes
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[#EEF4FF] flex items-center justify-center text-[#2563EB] text-[18px]">
                    <ShoppingCartOutlined />
                  </div>
                </div>

                <div className="text-[19px] md:text-[22px] font-bold text-[#111827]">
                  {totals.pendingOrders}
                </div>

                <div className="text-[14px] text-[#EF4444] mt-3">
                  ↓ Requiere atención
                </div>
              </div>
            )}

            {canViewInventory && (
              <div
                onClick={() =>
                  navigate("/admin/productos?sortBy=stock&order=asc")
                }
                className="bg-white border border-[#E5E7EB] rounded-[18px] px-5 py-4 shadow-sm min-h-[152px] cursor-pointer hover:border-[#D97706] hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="text-[15px] leading-5 text-[#4B5563] group-hover:text-[#D97706] transition-colors">
                    Productos
                    <br />
                    bajo stock
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[#FEF7E7] flex items-center justify-center text-[#D97706] text-[18px]">
                    <WarningOutlined />
                  </div>
                </div>

                <div className="text-[19px] md:text-[22px] font-bold text-[#111827]">
                  {totals.criticalStockCount}
                </div>

                <div className="text-[14px] text-[#16A34A] mt-3">
                  {totals.criticalStockCount > 0
                    ? "Revisar inventario"
                    : "Sin alertas"}
                </div>
              </div>
            )}

            {canViewAdminSalesCards && (
              <div 
                onClick={() => navigate("/admin/reportes/ventas")}
                className="bg-white border border-[#E5E7EB] rounded-[18px] px-5 py-4 shadow-sm min-h-[152px] cursor-pointer hover:border-[#16A34A] hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="text-[15px] leading-5 text-[#4B5563] group-hover:text-[#16A34A] transition-colors">
                    Cantidad de
                    <br />
                    llantas vendidas al mes
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[#EAF8EF] flex items-center justify-center text-[#16A34A] text-[18px]">
                    <LineChartOutlined />
                  </div>
                </div>

                <div className="text-[19px] md:text-[22px] font-bold text-[#111827]">
                  {totals.soldTiresMonth}
                </div>

                <div className="text-[14px] text-[#16A34A] mt-3 capitalize">
                  {currentMonthLabel}
                </div>
              </div>
            )}
          </div>
        )}

        {canViewSalesTrend && (
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4 mb-5">
            {canViewSalesTrend && (
              <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-5 shadow-sm">
                <div className="mb-1 text-[18px] font-bold text-[#111827]">
                  Ventas mensuales
                </div>
                <div className="text-[14px] text-[#6B7280] mb-4">
                  Últimos meses
                </div>

                {salesTrendData.length === 0 ? (
                  <div className="h-[260px] flex items-center justify-center">
                    <Empty description="No hay datos de ventas." />
                  </div>
                ) : (
                  <div className="h-[270px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={salesTrendData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" />
                        <XAxis
                          dataKey="month"
                          tick={{ fontSize: 12, fill: "#9CA3AF" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          allowDecimals={false}
                          tick={{ fontSize: 12, fill: "#9CA3AF" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="ventas"
                          stroke="#EF4444"
                          strokeWidth={3}
                          dot={{ r: 4, fill: "#EF4444" }}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}

            {canViewSalesTrend && (
              <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-5 shadow-sm">
                <div className="mb-1 text-[18px] font-bold text-[#111827]">
                  Marcas más vendidas
                </div>
                <div className="text-[14px] text-[#6B7280] mb-4">
                  Total analizado: {totalBrandsAnalyzed}
                </div>

                {brandChartData.length === 0 ? (
                  <div className="h-[270px] flex items-center justify-center">
                    <Empty description="No hay datos." />
                  </div>
                ) : (
                  <div className="h-[270px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={brandChartData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={55}
                          outerRadius={90}
                          paddingAngle={2}
                        >
                          {brandChartData.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend
                          verticalAlign="bottom"
                          iconType="circle"
                          wrapperStyle={{ fontSize: "12px" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {canViewDelivery && (
          <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-5 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-3 gap-3">
              <div>
                <div className="text-[18px] font-bold text-[#111827]">
                  Mis pedidos asignados
                </div>
                <div className="text-[14px] text-[#6B7280]">
                  Toca un pedido para enviarlo a “Pedidos a entregar”
                </div>
              </div>

              {deliveryQueueLoading ? (
                <Spin size="small" />
              ) : (
                <span className="text-sm text-[#2563EB] font-medium">
                  {deliveryQueueTotal} en cola
                </span>
              )}
            </div>

            <Table<PedidoEnCola>
              rowKey={(row) => String(row.id_pedido)}
              columns={[
                {
                  title: "Cliente",
                  dataIndex: "nombre",
                  key: "nombre",
                  width: 180,
                  render: (nombre: string) => (
                    <span className="text-sm text-[#1f2937]">
                      {nombre || "Sin cliente"}
                    </span>
                  ),
                },
                {
                  title: "Dirección",
                  dataIndex: "direccion",
                  key: "direccion",
                  width: 240,
                  render: (direccion: string) => (
                    <span className="text-sm text-[#1f2937]">
                      {direccion || "Sin dirección"}
                    </span>
                  ),
                },
              ]}
              dataSource={deliveryQueue}
              pagination={{
                current: deliveryQueuePage,
                pageSize: 5,
                total: deliveryQueueTotal,
                showSizeChanger: false,
                position: ["bottomCenter"],
                onChange: (p) => setDeliveryQueuePage(p),
              }}
              size="small"
              loading={deliveryQueueLoading}
              scroll={{ x: 420 }}
              onRow={(record) => ({
                style: { cursor: "pointer" },
                onClick: () => movePedidoToDeliveryActuales(record),
              })}
              locale={{
                emptyText: (
                  <div className="py-5">
                    <Empty description="No hay pedidos asignados para entregar." />
                  </div>
                ),
              }}
              rowClassName={(record) =>
                movingPedidoId === record.id_pedido ? "!opacity-60" : ""
              }
            />
          </div>
        )}

        {canManageOrders && (
          <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3 gap-3">
              <div>
                <div className="text-[18px] font-bold text-[#111827]">
                  Últimos pedidos
                </div>
                <div className="text-[14px] text-[#6B7280]">
                  Mostrando los más recientes
                </div>
              </div>
              <span
                onClick={() => navigate("/admin/pedidos")}
                className="text-sm text-[#2563EB] font-medium cursor-pointer hover:underline"
              >
                Ver todos
              </span>
            </div>

            <Table
              rowKey={(row) =>
                String(
                  (row as PendingOrderRow).id ??
                    (row as PendingOrderRow).id_pedido,
                )
              }
              columns={recentOrdersColumns}
              dataSource={pendingOrdersList}
              pagination={false}
              size="small"
              scroll={{ x: 800 }}
              className="
                [&_.ant-table]:!bg-transparent
                [&_.ant-table-container]:!border-0
                [&_.ant-table-thead>tr>th]:!bg-transparent
                [&_.ant-table-thead>tr>th]:!text-[#9CA3AF]
                [&_.ant-table-thead>tr>th]:!font-medium
                [&_.ant-table-thead>tr>th]:!text-xs
                [&_.ant-table-thead>tr>th]:!py-2
                [&_.ant-table-tbody>tr>td]:!py-3
                [&_.ant-table-tbody>tr>td]:!border-b-[#EEF2F7]
                [&_.ant-table-tbody>tr:hover>td]:!bg-[#FAFBFC]
              "
              onRow={(record) => ({
                style: { cursor: "pointer" },
                onClick: () => {
                  const r = record as PendingOrderRow;
                  const orderId = r.id_pedido || r.id;
                  if (orderId) {
                    navigate(`/admin/pedidos?id=${orderId}`);
                  }
                },
              })}
              locale={{
                emptyText: (
                  <div className="py-5">
                    <Empty description="No hay pedidos recientes." />
                  </div>
                ),
              }}
            />
          </div>
        )}

        {!canManageOrders && !canViewDelivery && !canViewInventory && !canViewSalesTrend && (
          <Alert
            type="info"
            showIcon
            message="No hay nada para mostrar en este momento."
          />
        )}

        {!selectedBranch && (
          <div className="mt-4">
            <Alert
              type="warning"
              showIcon
              message="Selecciona una sucursal para ver información segmentada."
            />
          </div>
        )}
      </div>
    </div>
  </ConfigProvider>
  );
}
