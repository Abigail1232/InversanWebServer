import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { validateReorder } from "../../api/orders/reorder";
import { Modal, Tag, Typography, Row, Col, Steps, Button, message } from "antd";
import { X, Package, MapPin, CreditCard, Truck, XCircle, RefreshCcw } from "lucide-react";

import { type OrderData } from "../../api/orders/my-orders";
import {
  getPedidoDetalle,
  type PedidoResponse,
  type PedidoDetalle,
} from "../../api/orders/order-detail";
const { Title, Text } = Typography;

const fmt = (n: number | string, decimals = 2) =>
  Number(n).toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

const formatFecha = (fecha: string | Date | null | undefined): string => {
  if (!fecha) return "—";
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("es-HN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(d);
};

interface OrderDetailsModalProps {
  order: OrderData | null;
  isOpen: boolean;
  onClose: () => void;
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  if (!order) return null;
  const [products, setProducts] = useState<PedidoDetalle[]>([]);
  const [details, setDetails] = useState<any>(null);
  const navigate = useNavigate();
  const [reordering, setReordering] = useState(false);
  const isCancelled = order.estado === "cancelado";
  const getStepStatus = (status: OrderData["estado"]): number => {
    switch (status) {
      case "entregado":
        return 3;
      case "en_proceso":
        return 1;
      case "pendiente":
        return 0;
      case "cancelado":
        return 0;
      case "devolucion_pendiente":
        return 0;
      case "devolucion_aplicada":
        return 3;
      default:
        return 0;
    }
  };

  const email = localStorage.getItem("email");
  const fetchDetails = async () => {
    const res: PedidoResponse | null = await getPedidoDetalle(
      order.id_pedido,
      email ? email : ""
    );
    if (!res) return;
    setProducts(res.data.productos);
    setDetails(res.data);
  };

  useEffect(() => {
    fetchDetails();
  }, [order]);

  const handleReorder = async () => {
    if (!order) return;

    try {
      setReordering(true);

      const emailCliente = localStorage.getItem("email") || "";

      const reorderData = await validateReorder(order.id_pedido, emailCliente);

      if (!reorderData?.productos?.length) {
        message.warning("No se encontraron productos disponibles para repetir este pedido.");
        return;
      }

      localStorage.setItem("reorder_checkout", JSON.stringify(reorderData));

      onClose();
      navigate("/checkout?reorder=1");
    } catch (error: any) {
      console.log("ERROR REORDER:", error?.response?.data || error);

      const apiMsg =
        error?.response?.data?.msg ||
        error?.response?.data?.error ||
        error?.message ||
        "No se pudo volver a realizar este pedido.";

      message.error(apiMsg);
    } finally {
      setReordering(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      closeIcon={<X size={20} />}
      width={700}
      centered
      style={{ borderRadius: "12px", overflow: "hidden" }}
      // Nota: bodyStyle está deprecado en versiones nuevas de AntD, usa styles={{ body: ... }}
      styles={{ body: { padding: 0 } }}
    >
      {/* HEADER */}
      <div style={{ padding: "24px 24px 10px 24px" }}>
        <Title level={4} style={{ margin: 0 }}>
          Detalles del Pedido
        </Title>
        <Text type="secondary">
          Pedido #{order.id_pedido} • Realizado el {formatFecha(order.fecha)}
        </Text>
      </div>

      <div
        style={{
          padding: "0 24px 24px 24px",
          maxHeight: "70vh",
          overflowY: "auto",
        }}
      >
        {/* ESTADO DEL ENVÍO / CANCELACIÓN */}
        <div
          style={{
            border: "1px solid #f0f0f0",
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "16px",
            marginTop: "10px",
            backgroundColor: isCancelled ? "#fff1f0" : "transparent",
            borderColor: isCancelled ? "#ffa39e" : "#f0f0f0",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {isCancelled ? (
                <XCircle size={18} color="#ff4d4f" />
              ) : (
                <Truck size={18} color="#1890ff" />
              )}
              <Text strong>
                {isCancelled ? "Pedido Cancelado" : "Estado del Envío"}
              </Text>
            </div>
            <Tag
              color={isCancelled ? "red" : "blue"}
              style={{ borderRadius: "10px" }}
            >
              {order?.estado.toUpperCase().replace("_", " ")}
            </Tag>
          </div>

          <Steps
            size="small"
            status={isCancelled ? "error" : "process"}
            current={getStepStatus(order.estado)}
            items={[
              { title: isCancelled ? "CANCELADO" : "PROCESANDO" },
              { title: "EN CAMINO" },
              { title: "ENTREGADO" },
            ]}
          />
        </div>

        {/* RESUMEN DE PRODUCTOS */}
        <div style={{ marginBottom: "16px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "12px",
            }}
          >
            <Package size={18} />
            <Text strong>Resumen de Productos</Text>
          </div>
          {products?.map((item: PedidoDetalle, idx: number) => (
            <div
              key={idx}
              style={{
                display: "flex",
                gap: "12px",
                padding: "12px",
                border: "1px solid #f0f0f0",
                borderRadius: "12px",
                marginBottom: "8px",
              }}
            >
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  background: "#f5f5f5",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {item.imagen_url ? (
                  <img
                    src={`${import.meta.env.VITE_API_URL}/public/${item.imagen_url
                      }`}
                  />
                ) : (
                  <Package size={24} color="#bfbfbf" />
                )}
              </div>
              <div className="flex-1 justidy-center">
                <Text strong>{item.producto}</Text>
                <div className="hidden sm:flex" style={{ justifyContent: 'space-between' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    Cantidad: {item.cantidad} | Unitario: L. {fmt(item.precio_unitario, 2)}
                  </Text>
                  <div className='flex flex-col items-end justify-center'>
                    <Text strong style={{ color: isCancelled ? '#bfbfbf' : '#0071ad' }}>
                      L. {fmt(item.precio_unitario * item.cantidad, 2)}
                    </Text>
                    <Text style={{
                      fontSize: 12,
                      color: isCancelled ? '#d9d9d9' : '#52c41a'
                    }}>
                      ISV (15%) incluido
                    </Text>
                  </div>
                </div>
                <div className="sm:hidden">
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    Cantidad: {item.cantidad} | Unitario: L. {fmt(item.precio_unitario, 2)}
                  </Text>
                  <div style={{ display: 'flex', gap: '12px', marginTop: 4 }}>
                    <Text strong style={{ fontSize: 12, color: isCancelled ? '#bfbfbf' : '#0071ad' }}>
                      L. {fmt(item.precio_unitario * item.cantidad, 2)}
                    </Text>
                    <Text style={{
                      fontSize: 12,
                      color: isCancelled ? '#d9d9d9' : '#52c41a'
                    }}>
                      ISV (15%) incluido
                    </Text>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <div
              style={{
                border: "1px solid #f0f0f0",
                borderRadius: "12px",
                padding: "16px",
                height: "100%",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "8px",
                }}
              >
                <MapPin size={16} color="#ff4d4f" />
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  MÉTODO DE ENTREGA
                </Text>
              </div>
              <Text
                style={{
                  fontSize: "13px",
                  textDecoration: isCancelled ? "line-through" : "none",
                }}
              >
                {(order.entrega ?? order.tipo_de_entrega ?? "").replace(/_/g, " ").toUpperCase()}
              </Text>
              {(details?.direccion_entrega ?? order.direccion) && (
                <div style={{ marginTop: "12px", borderTop: "1px solid #f0f0f0", paddingTop: "8px" }}>
                  <Text type="secondary" style={{ fontSize: "11px", display: "block", marginBottom: "4px" }}>
                    DIRECCIÓN DE ENTREGA
                  </Text>
                  <Text style={{ fontSize: "13px", color: "#595959" }}>
                    {details?.direccion_entrega ?? order.direccion}
                  </Text>
                </div>
              )}
            </div>
          </Col>
          <Col xs={24} md={12}>
            <div
              style={{
                border: "1px solid #f0f0f0",
                borderRadius: "12px",
                padding: "16px",
                height: "100%",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "8px",
                }}
              >
                <CreditCard size={16} color="#1890ff" />
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  MÉTODO DE PAGO
                </Text>
              </div>
              <Text strong style={{ fontSize: "13px" }}>
                {order.tipo_de_pago.replace("_", " ").toUpperCase()}
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: "12px" }}>
                {isCancelled
                  ? "Reembolso en proceso"
                  : "Pago realizado con éxito"}
              </Text>
            </div>
          </Col>
        </Row>

        {/* RESUMEN DE TOTALES */}
        {details && (
          <div
            style={{
              marginTop: "24px",
              padding: "16px",
              backgroundColor: "#f9fafb",
              borderRadius: "12px",
              border: "1px solid #f0f0f0",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <Text type="secondary">Subtotal</Text>
              <Text>L. {fmt(Number(details.subtotal) + Number(details.descuento || 0))}</Text>
            </div>
            {details.descuento > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <Text type="secondary">Descuento</Text>
                <Text type="danger">- L. {fmt(details.descuento)}</Text>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <Text type="secondary">ISV (15%)</Text>
              <Text>L. {fmt(details.IVA)}</Text>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <Text type="secondary">Costo de Envío</Text>
              <Text strong>
                {details.tipo_de_entrega === "outside" && details.costo_envio === 0 && details.total < 70000
                  ? "COTIZAR"
                  : details.costo_envio === 0
                  ? "GRATIS"
                  : `L. ${fmt(details.costo_envio)}`}
              </Text>
            </div>
            <div style={{ borderTop: "1px solid #e5e7eb", marginTop: "8px", paddingTop: "8px", display: "flex", justifyContent: "space-between" }}>
              <Text strong style={{ fontSize: "16px" }}>TOTAL</Text>
              <Text strong style={{ fontSize: "16px", color: "#0071ad" }}>L. {fmt(details.total)}</Text>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div
        style={{
          background: "#0071ad",
          padding: "20px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div>
        <Text
          style={{
            color: "white",
            textTransform: "uppercase",
            fontSize: "12px",
            letterSpacing: "1px",
            display: "block",
          }}
        >
          {isCancelled ? "Total Cancelado" : "Total del Pedido"}
        </Text>

        <Title level={3} style={{ color: "white", margin: 0 }}>
          Lps. {fmt(order.total, 2)}
        </Title>
      </div>

      <Button
        icon={<RefreshCcw size={16} />}
        loading={reordering}
        onClick={handleReorder}
        style={{
          height: 42,
          borderRadius: 10,
          fontWeight: 700,
          color: "#0071ad",
          border: "none",
        }}
      >
        Volver a pedir
      </Button>
      </div>
    </Modal>
  );
};

export default OrderDetailsModal;
