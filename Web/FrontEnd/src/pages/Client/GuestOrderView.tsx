import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Typography,
  Row,
  Col,
  Spin,
  Alert,
  Button,
  Divider,
} from "antd";
import {
  Package,
  MapPin,
  CreditCard,
  XCircle,
  CheckCircle,
  Clock,
  Calendar,
  User,
  Phone,
  Mail,
  Truck,
} from "lucide-react";
import {
  getGuestOrder,
  type GuestOrder,
  formatCurrency,
  formatDate,
} from "../../api/orders/guest-order";
import ShoppingHeader from "../../components/Header";
import Footer from "../../components/footer";
import { getAllActiveBranches } from "../../api/branches/branches";
import type { Sucursal } from "../../types/branch";

const LOCAL_STORAGE_KEY = "selectedBranch";

const { Title, Text } = Typography;

// Badge de icono de color para la sección de información de entrega
function IconBadge({
  icon,
  color,
}: {
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div
      className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
      style={{ backgroundColor: color }}
    >
      {icon}
    </div>
  );
}

// Paso del seguimiento vertical
function TrackingStep({
  icon,
  title,
  description,
  active,
  isLast,
  isCancelled,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  active: boolean;
  isLast?: boolean;
  isCancelled?: boolean;
}) {
  const circleColor = isCancelled
    ? "border-red-400 bg-red-50"
    : active
      ? "border-[#027EB1] bg-[#027EB1]/10"
      : "border-gray-200 bg-white";

  const iconColor = isCancelled
    ? "text-red-400"
    : active
      ? "text-[#027EB1]"
      : "text-gray-300";

  const dotColor = active && !isCancelled ? "bg-[#e07b2b]" : "bg-transparent";

  return (
    <div className={`flex-1 flex flex-row sm:flex-col items-start sm:items-center relative w-full sm:w-auto ${!isLast ? 'pb-8 sm:pb-0' : ''}`}>
      {/* Icon circle */}
      <div
        className={`relative w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 z-10 ${circleColor}`}
      >
        <span className={iconColor}>{icon}</span>
        {/* Orange active dot */}
        {active && !isCancelled && (
          <span
            className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${dotColor}`}
          />
        )}
      </div>

      {/* Vertical Line (Mobile) */}
      {!isLast && (
        <div className="sm:hidden absolute top-10 bottom-0 left-5 w-px bg-gray-200 -z-0" />
      )}

      {/* Horizontal Line (Desktop) */}
      {!isLast && (
        <div
          className="hidden sm:block absolute top-5 left-[50%] w-full h-px bg-gray-200 -z-0"
        />
      )}

      {/* Text */}
      <div className="ml-4 sm:ml-0 sm:mt-3 text-left sm:text-center px-1 flex-1 py-1 sm:py-0">
        <Text
          className={`block font-bold text-xs uppercase tracking-tight ${active ? "text-gray-800" : "text-gray-400"
            }`}
        >
          {title}
        </Text>
        <Text className="block text-[10px] text-gray-400 leading-tight mt-0.5">{description}</Text>
      </div>
    </div>
  );
}

export default function GuestOrderView() {
  const [branches, setBranches] = useState<Sucursal[]>([]);
  const [initBranch, setInitBranch] = useState<number>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    return saved ? Number(saved) : 0;
  });

  const handleBranchChange = (id: number) => {
    setInitBranch(id);
    localStorage.setItem(LOCAL_STORAGE_KEY, String(id));
    window.dispatchEvent(new Event("branchChanged"));
  };
  const { numeroPedido } = useParams<{ numeroPedido: string }>();
  const fetchBranches = async () => {
    try {
      const response = await getAllActiveBranches();
      if (response.length === 0) return;
      setBranches(response);
      if (!localStorage.getItem(LOCAL_STORAGE_KEY)) {
        setInitBranch(response[0].id_sucursal);
        localStorage.setItem(LOCAL_STORAGE_KEY, String(response[0].id_sucursal));
      }
    } catch {
      // silently fail – header will still render
    }
  };
  const navigate = useNavigate();
  const [order, setOrder] = useState<GuestOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchBranches();
  }, []);

  useEffect(() => {
    if (!numeroPedido) {
      setError("Número de pedido no proporcionado");
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const response = await getGuestOrder(numeroPedido);
        if (response.ok && response.data) {
          setOrder(response.data);
        } else {
          setError(response.msg || "No se pudo encontrar el pedido");
        }
      } catch (err) {
        setError("Error al cargar el pedido. Por favor, intenta nuevamente.");
        console.error("Error fetching guest order:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [numeroPedido]);

  const getStepStatus = (estado: string): number => {
    switch (estado.toLowerCase()) {
      case "entregado":
        return 2;
      case "en_proceso":
        return 1;
      case "pendiente":
        return 0;
      case "cancelado":
      case "rechazado":
        return 1;
      default:
        return 0;
    }
  };

  // Función para formatear el tipo de entrega
  const formatTipoEntrega = (tipo: string) => {
    switch (tipo?.toLowerCase()) {
      case "a_domicilio":
        return "A domicilio";
      case "en_sucursal":
        return "En sucursal";
      case "recoger_en_tienda":
        return "Recoger en tienda";
      default:
        return (
          tipo?.replace(/_/g, " ")?.replace(/\b\w/g, (l) => l.toUpperCase()) ||
          tipo
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f8fa]">
        <ShoppingHeader
          branches={branches}
          initBranch={initBranch}
          setInitBranch={handleBranchChange}
        />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Spin size="large" className="mb-4" />
            <Text className="text-gray-500 block">
              Cargando información del pedido...
            </Text>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#f7f8fa]">
        <ShoppingHeader
          branches={branches}
          initBranch={initBranch}
          setInitBranch={handleBranchChange}
        />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <Alert
              message="Pedido no encontrado"
              description={
                error || "No se pudo encontrar la información del pedido"
              }
              type="error"
              showIcon
              className="mb-6"
              action={
                <Button size="small" onClick={() => navigate("/")}>
                  Ir al inicio
                </Button>
              }
            />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const isCancelled =
    order.estado.toLowerCase() === "cancelado" ||
    order.estado.toLowerCase() === "rechazado";

  const stepStatus = getStepStatus(order.estado);

  const trackingSteps = [
    {
      icon: <Clock size={18} />,
      title: "Pendiente",
      description: "Validando y preparando",
      active: stepStatus >= 0,
    },
    {
      icon: <Package size={18} />,
      title: "En Proceso",
      description: "Tu pedido está siendo procesado",
      active: stepStatus >= 1,
    },
    {
      icon: isCancelled ? <XCircle size={18} /> : <CheckCircle size={18} />,
      title: isCancelled ? "Rechazado" : "Entregado",
      description: isCancelled ? "El pedido fue rechazado" : "Pedido entregado",
      active: stepStatus >= 2,
      isCancelled: isCancelled && stepStatus >= 1,
    },
  ];

  const deliveryInfoItems = [
    {
      label: "NÚMERO DE PEDIDO",
      value: `#${order.numero_pedido}`,
      icon: <Package size={18} className="text-white" />,
      badgeColor: "#027EB1",
    },
    {
      label: "CLIENTE",
      value: order.cliente.nombre_completo,
      icon: <User size={18} className="text-white" />,
      badgeColor: "#027EB1",
    },
    {
      label: "TELÉFONO",
      value: order.cliente.telefono,
      icon: <Phone size={18} className="text-white" />,
      badgeColor: "#027EB1",
    },
    {
      label: "CORREO",
      value: order.cliente.correo,
      icon: <Mail size={18} className="text-white" />,
      badgeColor: "#027EB1",
    },
    {
      label: "TIPO DE ENTREGA",
      value: formatTipoEntrega(order.tipo_de_entrega),
      icon: <Truck size={18} className="text-white" />,
      badgeColor: "#027EB1",
    },
    {
      label: "MÉTODO DE ENVÍO",
      value: order.tipo_de_pago,
      icon: <CreditCard size={18} className="text-white" />,
      badgeColor: "#027EB1",
    },
    {
      label: "DIRECCIÓN DE ENTREGA",
      value: `${order.direccion}${order.municipio_entrega ? `, ${order.municipio_entrega}` : ""}`,
      icon: <MapPin size={18} className="text-white" />,
      badgeColor: "#027EB1",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f7f8fa] flex flex-col">
      <ShoppingHeader
        branches={branches}
        initBranch={initBranch}
        setInitBranch={handleBranchChange}
      />

      {/* ── Main content ── */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Delivery Information Horizontal Bar */}
        <Card
          className="mb-8 shadow-sm border-0 rounded-xl"
          bodyStyle={{ padding: "20px 24px" }}
        >
          <div className="flex items-center gap-2 mb-6">
            <Truck size={18} className="text-[#027EB1]" />
            <Title
              level={5}
              className="mb-0 text-gray-800 font-semibold"
              style={{ margin: 0 }}
            >
              Información de Entrega
            </Title>
          </div>

          <Row gutter={[20, 20]}>
            {deliveryInfoItems.map((item, idx) => (
              <Col
                key={idx}
                xs={24}
                sm={12}
                md={8}
                lg={idx === 6 ? 24 : 8}
              >
                <div className="flex items-start gap-3">
                  <IconBadge icon={item.icon} color={item.badgeColor} />
                  <div className="min-w-0">
                    <Text className="block text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-0.5">
                      {item.label}
                    </Text>
                    <Text className="block text-sm text-gray-700 font-medium leading-tight">
                      {item.value}
                    </Text>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Card>

        <Row gutter={[24, 24]}>
          {/* ─── LEFT COLUMN ─── */}
          <Col xs={24} lg={16}>
            {/* Order Tracking */}
            <Card
              className="mb-6 shadow-sm border-0 rounded-xl"
              bodyStyle={{ padding: "24px" }}
            >
              <div className="flex items-center gap-2 mb-6">
                <Package size={18} className="text-[#027EB1]" />
                <Title
                  level={5}
                  className="mb-0 text-gray-800 font-semibold"
                  style={{ margin: 0 }}
                >
                  Seguimiento del Pedido
                </Title>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start w-full py-2">
                {trackingSteps.map((step, idx) => (
                  <TrackingStep
                    key={idx}
                    icon={step.icon}
                    title={step.title}
                    description={step.description}
                    active={step.active}
                    isLast={idx === trackingSteps.length - 1}
                    isCancelled={step.isCancelled}
                  />
                ))}
              </div>

              {isCancelled && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <Text
                    type="danger"
                    className="flex items-center text-sm font-medium mb-2"
                  >
                    <XCircle size={16} className="mr-2" />
                    Algo ocurrió con tu pedido
                  </Text>
                  <Text type="secondary" className="block text-sm mb-2">
                    Por favor, contacta con nuestro equipo de soporte:
                  </Text>
                  <div className="bg-white p-3 rounded border border-red-100 space-y-1">
                    <Text className="block text-sm">
                      <strong>Email:</strong> davidsanchezflores@hotmail.com
                    </Text>
                    <Text className="block text-sm">
                      <strong>Teléfono:</strong> +504 9524-0039
                    </Text>
                  </div>
                </div>
              )}
            </Card>

            {/* Products */}
            <Card
              className="shadow-sm border-0 rounded-xl"
              bodyStyle={{ padding: "24px" }}
            >
              <div className="flex items-center gap-2 mb-6">
                <Package size={18} className="text-[#027EB1]" />
                <Title
                  level={5}
                  className="mb-0 text-gray-800 font-semibold"
                  style={{ margin: 0 }}
                >
                  Productos del Pedido
                </Title>
              </div>

              <div className="space-y-3 max-h-[420px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 pr-2">
                {order.productos.map((product, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors"
                  >
                    {/* Product image */}
                    {product.imagen ? (
                      <img
                        src={`${import.meta.env.VITE_API_URL}${product.imagen}`}
                        alt={product.nombre}
                        width={64}
                        height={64}
                        className="rounded-lg object-cover border border-gray-200 flex-shrink-0"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          const parent = target.parentElement;
                          if (parent && !parent.querySelector(".placeholder")) {
                            const placeholder = document.createElement("div");
                            placeholder.className =
                              "placeholder w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center border border-gray-200";
                            placeholder.innerHTML =
                              '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>';
                            parent.insertBefore(placeholder, target);
                          }
                        }}
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center border border-gray-200 flex-shrink-0">
                        <Package size={20} className="text-gray-400" />
                      </div>
                    )}

                    {/* Product info */}
                    <div className="flex-1 min-w-0">
                      <Text className="block font-semibold text-gray-800 text-sm truncate">
                        {product.nombre}
                      </Text>
                      <Text className="block text-xs text-gray-400 mb-1">
                        {product.marca}
                      </Text>
                      <Text className="text-xs text-gray-500">
                        Cantidad:{" "}
                        <span className="font-semibold text-gray-700">
                          {product.cantidad}
                        </span>
                      </Text>
                    </div>

                    {/* Price */}
                    <div className="text-right flex-shrink-0">
                      <Text className="block text-xs text-gray-400 mb-0.5">
                        {formatCurrency(product.precio_unitario)} c/u
                      </Text>
                      <Text className="block font-bold text-[#027EB1] text-sm">
                        {formatCurrency(product.total)}
                      </Text>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </Col>

          {/* ─── RIGHT COLUMN ─── */}
          <Col xs={24} lg={8}>
            <div className="relative lg:sticky lg:top-48 lg:self-start">
              {/* Invoice Summary */}
              <Card
                className="mb-6 shadow-sm border-0 rounded-xl"
                bodyStyle={{ padding: "24px" }}
              >
                <Title
                  level={5}
                  className="mb-4 text-gray-800 font-semibold"
                  style={{ margin: 0, marginBottom: 16 }}
                >
                  Resumen de Factura
                </Title>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Text className="text-gray-500 text-sm">Subtotal:</Text>
                    <Text className="text-gray-700 text-sm">
                      {formatCurrency(order.resumen_factura.subtotal + (order.resumen_factura.descuento || 0))}
                    </Text>
                  </div>

                  {order.resumen_factura.descuento > 0 && (
                    <div className="flex justify-between">
                      <Text className="text-red-500 text-sm">Descuento:</Text>
                      <Text className="text-red-500 text-sm">
                        -{formatCurrency(order.resumen_factura.descuento)}
                      </Text>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <Text className="text-gray-500 text-sm">IVA (15%):</Text>
                    <Text className="text-gray-700 text-sm">
                      {formatCurrency(order.resumen_factura.iva)}
                    </Text>
                  </div>

                  <div className="flex justify-between">
                    <Text className="text-gray-500 text-sm">Costo de Envío:</Text>
                    <Text className="text-gray-700 text-sm">
                      {order.tipo_de_entrega === "outside" && order.resumen_factura.costo_envio === 0 && order.resumen_factura.total < 70000
                        ? "COTIZAR"
                        : order.resumen_factura.costo_envio === 0
                        ? "GRATIS"
                        : formatCurrency(order.resumen_factura.costo_envio)}
                    </Text>
                  </div>

                  <Divider className="my-3" />

                  <div className="flex justify-between items-center">
                    <Text className="text-gray-700 font-semibold text-sm">
                      Total:
                    </Text>
                    <Text className="font-bold text-[#027EB1] text-base">
                      {formatCurrency(order.resumen_factura.total)}
                    </Text>
                  </div>
                </div>

                {/* Footer info */}
                <div className="mt-4 pt-4 border-t border-gray-100 text-center space-y-1">
                  <div className="flex items-center justify-center gap-1 text-gray-400">
                    <Calendar size={12} />
                    <Text className="text-xs text-gray-400">
                      Pedido realizado el {formatDate(String(order.fecha))}
                    </Text>
                  </div>
                  <Text className="block text-xs text-gray-400">
                    Sucursal: {order.sucursal}
                  </Text>
                </div>
              </Card>
            </div>
          </Col>
        </Row>
      </div>

      <Footer />
    </div>
  );
}
