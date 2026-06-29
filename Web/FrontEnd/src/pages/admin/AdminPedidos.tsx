import { useState, useEffect, useCallback, useMemo } from "react";
import dayjs from "dayjs";
import {
  Button as AntButton,
  Input,
  Select,
  Space,
  Modal,
  Form,
  message,
  Spin,
  DatePicker,
  ConfigProvider,
} from "antd";
import {
  EnvironmentOutlined,
  EyeOutlined,
  PlusOutlined,
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { useLocation } from "react-router-dom";
import { AlertTriangle, Pencil } from "lucide-react";
import { DataTable, type DataTableColumn } from "../../components/DataTable";
import { FilterBar } from "../../components/FilterBar";
import { Card, CardContent } from "../../components/ui/card";
import {
  buscarPedidosAdmin,
  asignarPedido,
  type PedidoAdmin,
} from "../../api/admin/pedidos";
import { getPedidoDetalle } from "../../api/orders/order-detail";
import {
  getRepartidores,
  type UsuarioAdmin,
} from "../../api/admin/usuarios";
import {
  getMyProfile,
  type ProfileUserResponse,
} from "../../api/profile/profile";
import { cancelOrderAdmin } from "../../api/orders/cancel-order";

const { TextArea } = Input;

export interface UIProductDetail {
  id_producto: number | string;
  nombre: string;
  diseno: string;
  cantidad: number;
  descuento: string;
  subtotal: string;
  total: string;
  precio_unitario: number;
}

interface ExtendedOrderRow extends PedidoAdmin {
  key: string;
  usuarioDisplay: string;
  correoDisplay: string;
  productosDetalle: UIProductDetail[];
  isLoadingDetails: boolean;
  fullDetails?: any;
}

const PAGE_SIZE = 10;

export default function AdminPedidos() {
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [detailsLoadingId, setDetailsLoadingId] = useState<
    number | string | null
  >(null);
  const [pedidos, setPedidos] = useState<ExtendedOrderRow[]>([]);
  const [repartidores, setRepartidores] = useState<UsuarioAdmin[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<ProfileUserResponse | null>(
    null,
  );

  // pagination & filters
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [filtroPago, setFiltroPago] = useState<string>("todos");
  const [filtroEntrega, setFiltroEntrega] = useState<string>("todos");
  const [filtroSucursal, setFiltroSucursal] = useState<string>(() => {
    const saved = localStorage.getItem("selectedBranch");
    return saved === "0" ? "todos" : (saved || "todos");
  });

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ExtendedOrderRow | null>(
    null,
  );
  const [form] = Form.useForm();

  const fetchInitialData = async () => {
    try {
      const [profileObj, repartidoresRes, branchesRes] = await Promise.all([
        getMyProfile(),
        getRepartidores(),
        import("../../api/branches/branches").then(m => m.getAllActiveBranches())
      ]);
      setCurrentUser(profileObj);
      setBranches(branchesRes);
      setRepartidores(repartidoresRes);
    } catch (error) {
      console.error("Error al obtener datos iniciales", error);
    }
  };

  const fetchPedidos = useCallback(
    async (currentPage = 1) => {
      try {
        setLoading(true);
        const res = await buscarPedidosAdmin({
          page: currentPage,
          limit: PAGE_SIZE,
          busqueda: busqueda || undefined,
          estado: filtroEstado === "todos" ? undefined : filtroEstado,
          tipo_de_pago: filtroPago === "todos" ? undefined : filtroPago,
          tipo_de_entrega: filtroEntrega === "todos" ? undefined : filtroEntrega,
          id_sucursal: filtroSucursal === "todos" ? undefined : filtroSucursal,
        });

        const pedidosFormateados = res.data.map((p: PedidoAdmin) => {
          const cliente = p.pedido_usuario && p.pedido_usuario[0];
          return {
            ...p,
            key: String(p.id_pedido),
            usuarioDisplay: cliente?.nombre_completo || "Desconocido",
            correoDisplay: cliente?.correo_cliente || "Desconocido",
            productosDetalle: [],
            isLoadingDetails: false,
          };
        });

        if (
          currentPage > 1 &&
          res.pagination?.total > 0 &&
          pedidosFormateados.length === 0
        ) {
          setPage(1);
          return;
        }

        setPedidos(pedidosFormateados);
        setTotalRecords(res.pagination?.total || 0);
      } catch (error) {
        message.error("Error al obtener la lista de pedidos");
      } finally {
        setLoading(false);
      }
    },
    [busqueda, filtroEstado, filtroPago, filtroEntrega, filtroSucursal],
  );

  useEffect(() => {
    const handleBranchChange = () => {
      const saved = localStorage.getItem("selectedBranch");
      if (saved !== null) {
        setFiltroSucursal(saved === "0" ? "todos" : saved);
        setPage(1);
      }
    };

    window.addEventListener("branchChanged", handleBranchChange);
    return () => window.removeEventListener("branchChanged", handleBranchChange);
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const estadoParam = params.get("estado");
    const idParam = params.get("id");

    if (estadoParam) {
      setFiltroEstado(estadoParam);
    }
    
    if (idParam) {
      setBusqueda(idParam);
      setFiltroEstado("todos");
      setPage(1);
    }
  }, [location.search]);

  useEffect(() => {
    fetchPedidos(page);
  }, [fetchPedidos, page]);

  const clearFilters = () => {
    setBusqueda("");
    setFiltroEstado("todos");
    setFiltroPago("todos");
    setFiltroEntrega("todos");
    // No limpiamos sucursal ya que es un filtro global del header
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));
  const desde = totalRecords === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const hasta = Math.min(page * PAGE_SIZE, totalRecords);

  const sucursalActivaNombre = useMemo(() => {
    if (filtroSucursal === "todos") return "Todas las Sucursales";
    const sucursal = branches.find(b => String(b.id_sucursal) === String(filtroSucursal));
    return sucursal ? `${sucursal.nombre}` : `Sucursal ID: ${filtroSucursal}`;
  }, [filtroSucursal, branches]);

  const handleOpenAssignModal = (record: ExtendedOrderRow) => {
    setSelectedOrder(record);
    const asignacionActiva = record.pedido_asignacion?.[0];
    if (asignacionActiva) {
      form.setFieldsValue({
        repartidor: asignacionActiva.id_repartidor,
        detalles: asignacionActiva.observacion,
        fechaEntrega: asignacionActiva.fecha_estimada_entrega
          ? dayjs(asignacionActiva.fecha_estimada_entrega)
          : null,
      });
    } else {
      form.resetFields();
    }
    setIsAssignModalOpen(true);
  };

  const handleOpenDetailsModal = async (record: ExtendedOrderRow) => {
    setDetailsLoadingId(record.id_pedido);
    setSelectedOrder({ ...record, isLoadingDetails: true });
    setIsDetailsModalOpen(true);
    try {
      const detalleRes = await getPedidoDetalle(record.id_pedido);
      if (detalleRes && detalleRes.ok) {
        const productos = detalleRes.data.productos.map((prod: any) => {
          const precioUnitario = Number(prod.precio_unitario) || 0;
          const cantidad = Number(prod.cantidad) || 0;
          const totalNum = precioUnitario * cantidad;
          const subtotalNum = totalNum / 1.15;
          return {
            id_producto: prod.id_producto || "N/A",
            nombre: prod.producto,
            diseno: prod.version || "N/A",
            cantidad: cantidad,
            descuento: "Lps. 0.00",
            subtotal: `Lps. ${subtotalNum.toLocaleString("es-HN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`,
            total: `Lps. ${totalNum.toLocaleString("es-HN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`,
            precio_unitario: precioUnitario,
          } as UIProductDetail;
        });
        setSelectedOrder((prev) =>
          prev
            ? {
              ...prev,
              productosDetalle: productos as any,
              fullDetails: detalleRes.data,
              isLoadingDetails: false,
            }
            : null,
        );
      } else {
        setSelectedOrder((prev) =>
          prev
            ? { ...prev, productosDetalle: [], isLoadingDetails: false }
            : null,
        );
        message.error("No se pudo obtener el detalle del pedido");
      }
    } catch (error) {
      setSelectedOrder((prev) =>
        prev
          ? { ...prev, productosDetalle: [], isLoadingDetails: false }
          : null,
      );
      message.error("Error al obtener detalle");
      console.error("Error GetPedidoDetalle:", error);
    } finally {
      setDetailsLoadingId(null);
    }
  };

  const handleAssign = async (values: any) => {
    if (!currentUser) return message.error("No se encontró usuario actual");
    if (!selectedOrder)
      return message.error("No se encontró el pedido seleccionado");

    setAssignLoading(true);
    try {
      await asignarPedido({
        id_pedido: selectedOrder.id_pedido,
        id_repartidor: values.repartidor,
        asignado_por: currentUser.id_usuario,
        fecha_estimada_entrega: values.fechaEntrega
          ? values.fechaEntrega.toISOString()
          : undefined,
        observacion: values.detalles || "Asignación desde Admin",
      });
      message.success("Pedido asignado exitosamente");
      setIsAssignModalOpen(false);
      form.resetFields();
      fetchPedidos(page);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.msg || "Ocurrió un error al asignar el pedido";
      message.error(errorMessage);
      console.error("Asignar Pedido Error:", error);
    } finally {
      setAssignLoading(false);
    }
  };

  const handleRechazarPedido = async () => {
    if (!selectedOrder) return;

    setLoading(true);

    try {
      await cancelOrderAdmin(selectedOrder.id_pedido);
      message.success("Pedido rechazado y stock devuelto correctamente");
      setIsRejectModalOpen(false);
      setIsDetailsModalOpen(false);
      setIsAssignModalOpen(false);
      setIsReceiptModalOpen(false);

      fetchPedidos(page);
    } catch (error: any) {
      const msg =
        error.response?.data?.msg || "Error al rechazar el pedido";
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const capitalizeFormat = (text: string) => {
    if (!text) return "";
    const lower = text.toLowerCase().replace(/_/g, " ");
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  };

  const formatEntrega = (text: string) => {
    if (!text) return "";
    if (text === "a_domicilio") return "Domicilio";
    if (text === "retiro_en_el_local") return "Sucursal";
    return capitalizeFormat(text);
  };

  const formatPago = (text: string) => {
    if (!text) return "";
    if (text === "transferencia_bancaria") return "Transferencia";
    return capitalizeFormat(text);
  };

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case "en_proceso":
        return "bg-blue-100 font-bold text-blue-800 border-0 uppercase";
      case "pendiente":
        return "bg-yellow-100 text-yellow-800 border-0 uppercase";
      case "entregado":
        return "bg-green-100 text-green-800 border-0";
      case "cancelado":
      case "rechazado":
        return "bg-red-100 text-red-800 border-0 uppercase";
      default:
        return "bg-gray-100 text-gray-800 border-0 uppercase";
    }
  };

  const columns: DataTableColumn<ExtendedOrderRow>[] = [
    {
      title: "ID PEDIDO",
      dataIndex: "id_pedido",
      key: "id_pedido",
      width: 100,
      render: (text) => (
        <span className="font-bold text-[#027EB1]">{String(text)}</span>
      ),
    },
    {
      title: "FECHA / HORA",
      dataIndex: "fecha",
      key: "fecha",
      width: 180,
      className:
        "hidden lg:table-cell px-4 py-4 text-center text-sm uppercase tracking-wide text-white",
      render: (text) => (
        <span className="text-gray-600">
          {dayjs(text as string).format("DD/MM/YYYY hh:mm A")}
        </span>
      ),
    },
    {
      title: "USUARIO",
      dataIndex: "usuarioDisplay",
      key: "usuarioDisplay",
      render: (text) => (
        <span className="text-gray-700">
          {capitalizeFormat(text as string)}
        </span>
      ),
    },
    {
      title: "ESTADO",
      dataIndex: "estado",
      key: "estado",
      render: (text) => (
        <span
          className={`inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold ${getStatusStyle(
            text as string,
          )}`}
        >
          {capitalizeFormat(text as string)}
        </span>
      ),
    },
    {
      title: "TIPO DE ENTREGA",
      dataIndex: "tipo_de_entrega",
      key: "tipo_de_entrega",
      className:
        "hidden lg:table-cell px-4 py-4 text-center text-sm uppercase tracking-wide text-white",
      render: (text) => (
        <span className="text-gray-600">{formatEntrega(text as string)}</span>
      ),
    },
    {
      title: "TIPO DE PAGO",
      dataIndex: "tipo_de_pago",
      key: "tipo_de_pago",
      className:
        "hidden lg:table-cell px-4 py-4 text-center text-sm uppercase tracking-wide text-white",
      render: (text, record) => (
        <Space size="small">
          <span className="text-gray-600">{formatPago(text as string)}</span>
          {record.comprobante_url && (
            <AntButton
              type="link"
              size="small"
              icon={<EyeOutlined style={{ color: "#027EB1" }} />}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedOrder(record);
                setIsReceiptModalOpen(true);
              }}
              title="Ver Comprobante"
            />
          )}
        </Space>
      ),
    },
    {
      title: "VALOR",
      dataIndex: "total",
      key: "total",
      render: (val) => (
        <span className="text-gray-900 font-medium">
          Lps.{" "}
          {Number(val).toLocaleString("es-HN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      ),
    },
    {
      title: "ACCIONES",
      key: "acciones",
      render: (_, record) => (
        <Space size="middle">
          <AntButton
            type="text"
            loading={detailsLoadingId === record.id_pedido}
            disabled={detailsLoadingId === record.id_pedido}
            icon={
              <EyeOutlined style={{ color: "#027EB1", fontSize: "20px" }} />
            }
            onClick={() => handleOpenDetailsModal(record)}
          />
          <AntButton
            type="text"
            icon={
              record.pedido_asignacion &&
                record.pedido_asignacion.length > 0 ? (
                <Pencil style={{ color: "#027EB1", fontSize: "16px" }} />
              ) : (
                <PlusOutlined style={{ color: "#027EB1", fontSize: "18px" }} />
              )
            }
            onClick={() => handleOpenAssignModal(record)}
          />
        </Space>
      ),
    },
  ];

  const productColumns: DataTableColumn<UIProductDetail>[] = [
    { title: "ID", dataIndex: "id_producto", key: "id_producto" },
    {
      title: "PRODUCTO",
      dataIndex: "nombre",
      key: "nombre",
      render: (text) => <span>{capitalizeFormat(text as string)}</span>,
    },
    {
      title: "DISEÑO",
      dataIndex: "diseno",
      key: "diseno",
      render: (text) => <span>{capitalizeFormat(text as string)}</span>,
    },
    { title: "CANTIDAD", dataIndex: "cantidad", key: "cantidad" },
    { title: "DESCUENTO", dataIndex: "descuento", key: "descuento" },
    { title: "SUBTOTAL", dataIndex: "subtotal", key: "subtotal" },
    { title: "TOTAL (+ISV 15%)", dataIndex: "total", key: "total" },
  ];

  return (
    <ConfigProvider>
      <div className="min-h-screen bg-[#F3F4F6] px-4 py-6 md:px-8">
        <style>{`
          .orders-table-wrapper table thead th:first-child {
            text-align: left !important;
            padding-left: 24px !important;
          }
          .orders-table-wrapper table tbody td:first-child > div {
            justify-content: flex-start !important;
            width: 100%;
            padding-left: 8px !important;
          }
        `}</style>

        <div className="mx-auto max-w-[1240px]">
          {/* Título y Subtítulo */}
          <div className="mb-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold leading-8 text-[#1A1A1A] md:text-[32px] md:leading-10">
                Gestión de Pedidos
              </h1>
              <p className="mt-1 text-sm text-[#6B7280]">
                Administra y supervisa todos los pedidos realizados, asigna repartidores.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-[#027EB1]/10 px-4 py-2 rounded-xl border border-[#027EB1]/20">
              <EnvironmentOutlined className="text-[#027EB1]" />
              <span className="text-[#027EB1] font-bold text-sm">
                {sucursalActivaNombre}
              </span>
            </div>
          </div>

          {/* Barra de Filtros */}
          <div className="mb-4 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
            <FilterBar
              className="items-center justify-between"
              search={{
                value: busqueda,
                onChange: (v) => {
                  setBusqueda(v);
                  setPage(1);
                },
                placeholder: "Buscar por número de pedido o nombre...",
              }}
              filters={[
                {
                  placeholder: "Filtrar por Estado",
                  value: filtroEstado,
                  onChange: (v) => {
                    setFiltroEstado((v as string) || "todos");
                    setPage(1);
                  },
                  options: [
                    { label: "Todos los Estados", value: "todos" },
                    { label: "Pendiente", value: "pendiente" },
                    { label: "Procesando", value: "en_proceso" },
                    { label: "Pago Pendiente", value: "pago_pendiente" },
                  ],
                },
                {
                  placeholder: "Filtrar por Pago",
                  value: filtroPago,
                  onChange: (v) => {
                    setFiltroPago((v as string) || "todos");
                    setPage(1);
                  },
                  options: [
                    { label: "Todos los Pagos", value: "todos" },
                    { label: "Efectivo", value: "efectivo" },
                    { label: "Transferencia", value: "transferencia_bancaria" },
                    { label: "POS", value: "pos" },
                    { label: "Compra Click", value: "compra_click" },
                    { label: "PayPal", value: "pay_pal" },
                  ],
                },
                {
                  placeholder: "Filtrar por Entrega",
                  value: filtroEntrega,
                  onChange: (v) => {
                    setFiltroEntrega((v as string) || "todos");
                    setPage(1);
                  },
                  options: [
                    { label: "Todas las Entregas", value: "todos" },
                    { label: "Domicilio", value: "a_domicilio" },
                    { label: "Sucursal", value: "retiro_en_el_local" },
                  ],
                },
              ]}
              onClear={clearFilters}
            />
          </div>

          {/* Contenedor de Tabla Desktop */}
          <div className="hidden md:block orders-table-wrapper">
            <DataTable
              rowKey="key"
              columns={columns as any}
              dataSource={pedidos}
              loading={loading}
              emptyMessage="No se encontraron pedidos."
              pagination={{
                current: page,
                pageSize: PAGE_SIZE,
                total: totalRecords,
                onChange: (nextPage) => setPage(nextPage),
              }}
            />
          </div>

          {/* Vista Móvil */}
          <div className="space-y-4 md:hidden">
            <div className="mb-3 text-sm text-[#6B7280]">
              Mostrando {desde}-{hasta} de {totalRecords} resultados
            </div>

            {loading ? (
              <div className="rounded-2xl border border-[#E5E7EB] bg-white px-4 py-8 text-center text-sm text-[#6B7280] shadow-sm">
                Cargando pedidos...
              </div>
            ) : pedidos.length > 0 ? (
              pedidos.map((pedido) => (
                <Card
                  key={pedido.key}
                  className="rounded-2xl border border-[#E5E7EB] bg-white shadow-sm"
                >
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Pedido
                        </span>
                        <span className="text-lg font-extrabold text-[#027EB1]">
                          #{pedido.id_pedido}
                        </span>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wide ${getStatusStyle(pedido.estado)}`}
                      >
                        {capitalizeFormat(pedido.estado)}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-sm font-medium">Cliente</span>
                        <span className="text-slate-800 text-sm font-semibold">{capitalizeFormat(pedido.usuarioDisplay)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-sm font-medium">Entrega</span>
                        <span className="text-slate-700 text-sm">{formatEntrega(pedido.tipo_de_entrega)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-sm font-medium">Pago</span>
                        <div className="flex items-center gap-1">
                          <span className="text-slate-700 text-sm">{formatPago(pedido.tipo_de_pago)}</span>
                          {pedido.comprobante_url && (
                            <AntButton
                              type="link"
                              size="small"
                              className="p-0 h-auto"
                              icon={<EyeOutlined style={{ color: "#027EB1", fontSize: "14px" }} />}
                              onClick={() => {
                                setSelectedOrder(pedido);
                                setIsReceiptModalOpen(true);
                              }}
                            />
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                        <span className="text-slate-500 text-sm font-medium">Valor Total</span>
                        <span className="text-[#111827] text-base font-extrabold">
                          Lps. {Number(pedido.total).toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                      <AntButton
                        className="flex-1 h-12 rounded-2xl border-[#027EB1] text-[#027EB1] font-bold flex items-center justify-center gap-2"
                        onClick={() => handleOpenDetailsModal(pedido)}
                        loading={detailsLoadingId === pedido.id_pedido}
                      >
                        <EyeOutlined /> Detalles
                      </AntButton>
                      <AntButton
                        type="primary"
                        className="flex-1 h-12 rounded-2xl bg-[#027EB1] border-none font-bold flex items-center justify-center gap-2 shadow-md"
                        onClick={() => handleOpenAssignModal(pedido)}
                      >
                        {pedido.pedido_asignacion && pedido.pedido_asignacion.length > 0 ? <Pencil size={16} /> : <PlusOutlined />}
                        {pedido.pedido_asignacion && pedido.pedido_asignacion.length > 0 ? "Editar" : "Asignar"}
                      </AntButton>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="rounded-2xl border border-[#E5E7EB] bg-white px-4 py-8 text-center text-sm text-[#6B7280] shadow-sm">
                No se encontraron pedidos.
              </div>
            )}

            {/* Paginación Móvil */}
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-3 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <AntButton
                  icon={<LeftOutlined />}
                  disabled={page === 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                >
                  Anterior
                </AntButton>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Pág. {page} de {totalPages}
                  </span>
                </div>

                <AntButton
                  icon={<RightOutlined />}
                  iconPosition="end"
                  disabled={page === totalPages}
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                >
                  Siguiente
                </AntButton>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Detalles de Pedido */}
        <Modal
          title={null}
          open={isDetailsModalOpen}
          onCancel={() => setIsDetailsModalOpen(false)}
          footer={null}
          centered
          width={850}
          zIndex={2000}
          className="exact-design-modal"
          closeIcon={<span className="text-gray-400 text-2xl">×</span>}
        >
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-8">
              <h2 className="text-[28px] font-semibold text-[#111827] m-0">
                Detalles
              </h2>
            </div>

            <Spin spinning={!!selectedOrder?.isLoadingDetails}>
              <div className="px-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-10">
                  <div>
                    <label className="block text-[#111827] text-[16px] font-medium mb-2">
                      Cliente
                    </label>
                    <Input
                      value={selectedOrder?.usuarioDisplay}
                      readOnly
                      className="w-full h-[54px] custom-input-field !bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[#111827] text-[16px] font-medium mb-2">
                      Correo Electronico
                    </label>
                    <Input
                      value={selectedOrder?.correoDisplay}
                      readOnly
                      className="w-full h-[54px] custom-input-field !bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[#111827] text-[16px] font-medium mb-2">
                      Tipo de Pago
                    </label>
                    <Input
                      value={formatPago(selectedOrder?.tipo_de_pago as string)}
                      readOnly
                      className="w-full h-[54px] custom-input-field !bg-white"
                      suffix={
                        selectedOrder?.comprobante_url ? (
                          <AntButton
                            type="link"
                            icon={<EyeOutlined />}
                            onClick={() => setIsReceiptModalOpen(true)}
                          >
                            Ver
                          </AntButton>
                        ) : null
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-[#111827] text-[16px] font-medium mb-2">
                      Dirección de Entrega
                    </label>
                    <Input
                      value={selectedOrder?.direccion}
                      readOnly
                      className="w-full h-[54px] custom-input-field !bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[#111827] text-[16px] font-medium mb-2">
                      Fecha y hora
                    </label>
                    <Input
                      value={
                        selectedOrder?.fecha
                          ? dayjs(selectedOrder.fecha as string).format(
                            "DD/MM/YYYY hh:mm A",
                          )
                          : ""
                      }
                      readOnly
                      className="w-full h-[54px] custom-input-field !bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[#111827] text-[16px] font-medium mb-2">
                      Fecha de entrega
                    </label>
                    <Input
                      value={
                        selectedOrder?.pedido_asignacion?.[0]
                          ?.fecha_estimada_entrega
                          ? dayjs(
                            selectedOrder.pedido_asignacion[0]
                              .fecha_estimada_entrega as string,
                          ).format("DD/MM/YYYY hh:mm A")
                          : ""
                      }
                      readOnly
                      className="w-full h-[54px] custom-input-field !bg-white"
                    />
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className="text-lg font-bold text-[#003E7B] mb-4 flex items-center gap-2 uppercase tracking-tight">
                    Detalles del Pedido
                  </h3>

                  <div className="hidden md:block">
                    <DataTable
                      rowKey="id_producto"
                      columns={productColumns}
                      dataSource={selectedOrder?.productosDetalle || []}
                      pagination={undefined}
                      showSummary={false}
                      className="custom-admin-table-clean border border-slate-100 rounded-xl overflow-hidden"
                    />
                  </div>

                  <div className="md:hidden flex flex-col gap-4">
                    {selectedOrder?.productosDetalle.map((producto) => (
                      <div
                        key={producto.id_producto}
                        className="bg-slate-50 rounded-2xl p-5 border border-slate-100 shadow-sm"
                      >
                        <div className="flex justify-between items-start mb-3 border-b border-slate-200 pb-2">
                          <span className="text-[#003E7B] font-extrabold text-sm uppercase">
                            {producto.nombre}
                          </span>
                          <span className="bg-[#027EB1] text-white text-[10px] font-bold px-2 py-1 rounded-lg">
                            Cant: {producto.cantidad}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-y-3 gap-x-2">
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              Diseño
                            </p>
                            <p className="text-slate-700 font-medium text-sm">
                              {producto.diseno || "N/A"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              Precio Unit.
                            </p>
                            <p className="text-slate-700 font-medium text-sm">
                              L. {producto.precio_unitario}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              Descuento
                            </p>
                            <p className="text-red-500 font-bold text-sm">
                              {producto.descuento}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              Total
                            </p>
                            <p className="text-[#027EB1] font-black text-base">
                              {producto.total}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}

                    {(!selectedOrder?.productosDetalle ||
                      selectedOrder.productosDetalle.length === 0) && (
                        <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-400">
                          No hay productos registrados
                        </div>
                      )}
                  </div>
                </div>

                {selectedOrder?.fullDetails && (
                  <div className="mt-8 pt-8 border-t border-slate-100 w-full font-sans">
                    <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 shadow-sm max-w-sm ml-auto space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-medium text-base">Subtotal:</span>
                        <span className="text-slate-800 font-semibold text-base">L. {(Number(selectedOrder.fullDetails.subtotal) + Number(selectedOrder.fullDetails.descuento || 0)).toLocaleString('es-HN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      {Number(selectedOrder.fullDetails.descuento) > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-red-500 font-medium text-base">Descuento:</span>
                          <span className="text-red-500 font-bold text-base">- L. {Number(selectedOrder.fullDetails.descuento).toLocaleString('es-HN', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}
                      <div className="flex justify-between w-full items-center">
                        <span className="text-slate-500 font-medium text-base">ISV (15%):</span>
                        <span className="text-slate-800 font-semibold text-base">L. {Number(selectedOrder.fullDetails.IVA).toLocaleString('es-HN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                        <span className="text-slate-500 font-medium text-base">Costo de Envío:</span>
                        <span className="text-[#027EB1] font-bold text-base uppercase">
                          {selectedOrder.fullDetails.tipo_de_entrega === "outside" && Number(selectedOrder.fullDetails.costo_envio) === 0 && Number(selectedOrder.fullDetails.total) < 70000
                            ? "COTIZAR"
                            : Number(selectedOrder.fullDetails.costo_envio) === 0
                              ? "GRATIS"
                              : `L. ${Number(selectedOrder.fullDetails.costo_envio).toLocaleString('es-HN', { minimumFractionDigits: 2 })}`}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-[#003E7B] font-black text-xl">TOTAL:</span>
                        <span className="text-[#003E7B] font-black text-2xl">L. {Number(selectedOrder.fullDetails.total).toLocaleString('es-HN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-6 border-t border-gray-100 flex items-center justify-between mt-10">
                  {(selectedOrder?.tipo_de_pago === "transferencia_bancaria" ||
                    selectedOrder?.tipo_de_pago === "pay_pal") && (
                      <AntButton
                        onClick={() => setIsReceiptModalOpen(true)}
                        className="h-[52px] px-8 rounded-xl border border-[#027EB1] text-[#027EB1] font-medium text-[16px] hover:bg-[#f0f9ff]"
                      >
                        Comprobante
                      </AntButton>
                    )}
                  <div className="flex-1"></div>
                  <div className="flex items-center gap-4">
                    <AntButton
                      type="primary"
                      onClick={() => setIsRejectModalOpen(true)}
                      className="h-[52px] px-8 rounded-xl bg-[#027EB1] border-none font-medium text-[16px] shadow-sm hover:bg-[#026a9a] transition-all"
                    >
                      Rechazar Pedido
                    </AntButton>
                  </div>
                </div>
              </div>
            </Spin>
          </div>
        </Modal>

        {/* Modal Asignar Pedido */}
        <Modal
          title={null}
          open={isAssignModalOpen}
          onCancel={() => setIsAssignModalOpen(false)}
          footer={null}
          centered
          width={650}
          zIndex={1000}
          className="exact-design-modal"
          closeIcon={<span className="text-gray-400 text-2xl">×</span>}
        >
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-8">
              <h2 className="text-[28px] font-semibold text-[#111827] m-0">
                {selectedOrder?.pedido_asignacion &&
                  selectedOrder.pedido_asignacion.length > 0
                  ? "Editar Asignación"
                  : "Asignar Pedido"}
              </h2>
            </div>

            <Form
              form={form}
              layout="vertical"
              onFinish={handleAssign}
              className="px-2"
            >
              <div className="mb-6">
                <label className="block text-[#111827] text-[16px] font-medium mb-2">
                  Dirección de Entrega
                </label>
                <Input
                  value={selectedOrder?.direccion || "Dirección no disponible"}
                  readOnly
                  className="w-full h-[54px] custom-input-field !bg-gray-50"
                />
              </div>

              <div className="mb-6">
                <label className="block text-[#111827] text-[16px] font-medium mb-2">
                  Repartidor
                </label>
                <Form.Item
                  name="repartidor"
                  rules={[{ required: true, message: "Seleccione un usuario" }]}
                  className="!mb-0"
                >
                  <Select
                    placeholder="Seleccione un usuario"
                    className="w-full h-[54px] custom-input-field"
                  >
                    {repartidores.map((r) => {
                      const sucursalesArr = r.empleado_sucursal?.map(s => s.sucursal?.nombre) || [];
                      const sucursalTexto = sucursalesArr.length > 0
                        ? ` - (${sucursalesArr.join(", ")})`
                        : " - (Sin sucursal asignada)";

                      return (
                        <Select.Option key={r.id_usuario} value={r.id_usuario}>
                          {r.primer_nombre} {r.primer_apellido}{sucursalTexto}
                        </Select.Option>
                      );
                    })}
                  </Select>
                </Form.Item>
              </div>

              <div className="mb-6">
                <label className="block text-[#111827] text-[16px] font-medium mb-2">
                  Fecha Aproximada de Entrega
                </label>
                <Form.Item
                  name="fechaEntrega"
                  className="!mb-0"
                  rules={[
                    {
                      required: true,
                      message: "Seleccione una fecha y hora estimada de entrega",
                    },
                    {
                      validator: (_, value) => {
                        if (!value) return Promise.resolve();
                        const now = dayjs();
                        if (value.isAfter(now)) return Promise.resolve();
                        return Promise.reject(
                          new Error("La fecha y hora debe ser mayor a la actual"),
                        );
                      },
                    },
                  ]}
                >
                  <DatePicker
                    format="DD-MM-YYYY hh:mm A"
                    showTime={{
                      format: "hh:mm A",
                      use12Hours: true,
                    }}
                    placeholder="DD-MM-AAAA 12:00 AM"
                    className="w-full h-[54px] custom-input-field"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </div>

              <div className="mb-10">
                <label className="block text-[#111827] text-[16px] font-medium mb-2">
                  Detalles de Entrega
                </label>
                <Form.Item name="detalles" className="!mb-0">
                  <TextArea
                    placeholder="Describe los detalles..."
                    rows={4}
                    className="w-full rounded-xl border-gray-200 custom-input-field p-4"
                  />
                </Form.Item>
              </div>

              <div className="pt-6 border-t border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between mt-10 gap-4">
                <AntButton
                  onClick={() => {
                    if (selectedOrder) {
                      handleOpenDetailsModal(selectedOrder);
                    }
                  }}
                  disabled={assignLoading}
                  className="h-[52px] w-full md:w-auto px-8 rounded-xl border border-[#027EB1] text-[#027EB1] font-medium text-[16px] hover:bg-[#f0f9ff]"
                >
                  Detalles
                </AntButton>

                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                  <AntButton
                    onClick={() => setIsAssignModalOpen(false)}
                    className="h-[50px] w-full md:w-auto px-8 rounded-xl border border-gray-200 text-gray-800 font-medium text-[16px] hover:bg-gray-50 order-2 md:order-1"
                  >
                    Cancelar
                  </AntButton>

                  <AntButton
                    type="primary"
                    htmlType="submit"
                    loading={assignLoading}
                    disabled={assignLoading}
                    className="h-[50px] w-full md:w-auto px-10 rounded-xl bg-[#027EB1] border-none font-medium text-[16px] shadow-sm order-1 md:order-2"
                  >
                    Asignar
                  </AntButton>
                </div>
              </div>
            </Form>
          </div>
        </Modal>

        {/* Modal para visualizar el Comprobante */}
        <Modal
          title={null}
          open={isReceiptModalOpen}
          onCancel={() => setIsReceiptModalOpen(false)}
          footer={null}
          centered
          width={700}
          zIndex={3000}
          className="exact-design-modal"
          closeIcon={<span className="text-gray-400 text-2xl">×</span>}
        >
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-8">
              <h2 className="text-[28px] font-semibold text-[#111827] m-0">
                Comprobante de Pago
              </h2>
            </div>

            <div className="flex flex-col items-center bg-gray-50 rounded-2xl p-4 border border-gray-100">
              {selectedOrder?.comprobante_url ? (
                <img
                  src={
                    selectedOrder.comprobante_url.startsWith("http")
                      ? selectedOrder.comprobante_url
                      : `${import.meta.env.VITE_API_URL || "http://localhost:3000"}${selectedOrder.comprobante_url.startsWith("/") ? "" : "/"}${selectedOrder.comprobante_url}`
                  }
                  alt="Comprobante de Pago"
                  className="max-w-full max-h-[60vh] rounded-xl shadow-lg object-contain"
                />
              ) : (
                <div className="py-32 flex flex-col items-center text-gray-400">
                  <EyeOutlined
                    style={{
                      fontSize: "48px",
                      marginBottom: "16px",
                      opacity: 0.3,
                    }}
                  />
                  <p className="text-lg font-medium">
                    No se ha cargado ningún comprobante
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-8">
              <AntButton
                type="primary"
                onClick={() => setIsReceiptModalOpen(false)}
                className="h-[50px] px-12 rounded-xl bg-[#027EB1] border-none font-medium text-[16px] shadow-sm"
              >
                Cerrar
              </AntButton>
            </div>
          </div>
        </Modal>

        {/* Modal de Confirmación de Rechazo */}
        <Modal
          title={null}
          open={isRejectModalOpen}
          onCancel={() => setIsRejectModalOpen(false)}
          footer={null}
          closable={false}
          centered
          width={420}
          zIndex={4000}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-auto p-6 md:p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center bg-red-50">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
            </div>

            <h2 className="text-gray-900 font-bold text-lg mb-2">
              Rechazar Pedido
            </h2>

            <p className="text-sm text-gray-600 mb-1">
              ¿Estás seguro que deseas rechazar el pedido
              <span className="text-gray-900 font-semibold mx-1">
                {selectedOrder?.id_pedido}
              </span>
              ?
            </p>

            <p className="text-sm text-gray-500 mb-6">
              Esta acción marcará el pedido como cancelado y no se podrá revertir.
            </p>

            <div className="flex flex-col md:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="w-full md:w-auto px-6 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors order-2 md:order-1 font-medium"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleRechazarPedido}
                disabled={loading}
                className="w-full md:w-auto px-6 py-2.5 text-white rounded-lg text-sm transition-colors order-1 md:order-2 font-medium bg-[#DC2626] hover:bg-red-700 disabled:opacity-70"
              >
                {loading ? "Rechazando..." : "Rechazar Pedido"}
              </button>
            </div>
          </div>
        </Modal>

        <style>{`
          .exact-design-modal .ant-modal-content {
            border-radius: 24px !important;
            padding: 32px !important;
          }
          .custom-input-field {
            border-radius: 12px !important;
            border: 1px solid #E5E7EB !important;
            font-size: 16px !important;
            color: #111827 !important;
          }
          .custom-admin-table-clean .ant-table-thead > tr > th {
            background-color: #003E7B !important;
            color: white !important;
            font-weight: 700 !important;
            text-transform: uppercase;
            padding: 18px 24px !important;
            border: none !important;
          }
          .custom-admin-table-clean .ant-table-tbody > tr > td {
            padding: 18px 24px !important;
            border-bottom: 1px solid #f1f5f9 !important;
          }
          @media (max-width: 640px) {
            .ant-picker-dropdown {
              left: 50% !important;
              transform: translateX(-50%) scale(0.85) !important;
              position: fixed !important;
              top: 50% !important;
              margin-top: -150px !important;
            }
          }
        `}</style>
      </div>
    </ConfigProvider>
  );
}
