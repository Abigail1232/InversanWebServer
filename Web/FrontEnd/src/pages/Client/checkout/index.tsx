import { useEffect, useState, useRef } from "react";
import {
  Form,
  Row,
  Col,
  Card,
  Spin,
  Button,
  Typography,
  Divider,
  Alert,
  Grid,
  message as antMessage,
} from "antd";
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";

// Imports de componentes
import CheckoutProgress from "./CheckoutProgress";
import CustomerInfoStep from "./CustomerInfoStep";
import PaymentMethodStep from "./PaymentMethodStep";
import OrderConfirmationStep from "./OrderConfirmationStep";

// Imports de API
import { fetchDepartamentos, fetchMunicipiosByDepartamento } from "../../../api/departments/departments";
import type { Departamento, Municipio } from "../../../api/departments/types";
import { getCart, deleteCart as apiDeleteCart } from "../../../api/cart/cart";
import { finalizarCompra } from "../../../api/orders/finalizarcompra";
import { getMyProfile, type ProfileUserResponse } from "../../../api/profile/profile";
import { uploadPurchaseReceipt } from "../../../api/orders/my-orders";
import { getBranch } from "../../../api/branches/branches";
import { createOrder } from "../../../api/payment/paypal";
import { usePreventDuplicate } from "../../../hooks/usePreventDuplicateRequest";

const { useBreakpoint } = Grid;
const { Title, Text } = Typography;

interface SummaryItem {
  id_producto: number;
  img: string;
  name: string;
  qty: number;
  price: number;
  precio_original?: number;
  descuento_aplicado?: number;
  tipo_descuento?: string;
}

const brandColors = {
  primary: "#027eb1",
  dark: "#003e7b",
  bg: "#f3f4f6",
  cardBg: "#eef9ff",
  success: "#16a34a",
  warning: "#f59e0b",
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [messageApi, contextHolder] = antMessage.useMessage();
  const screens = useBreakpoint();

  // Estados de pasos
  const [currentStep, setCurrentStep] = useState(0);

  // Estados del formulario
  const [form] = Form.useForm();
  const [deliveryType, setDeliveryType] = useState<"home" | "outside" | "branch">("home");
  const [paymentMethod, setPaymentMethod] = useState<"transfer" | "paypal" | "pos" | "link">("transfer");

  // Estados de datos
  const [currentUser, setCurrentUser] = useState<ProfileUserResponse | null>(null);
  const [departaments, setDepartments] = useState<Departamento[]>([]);
  const [municipalities, setMunicipalitites] = useState<Municipio[]>([]);
  const [summaryItems, setSummaryItems] = useState<SummaryItem[]>([]);

  // Estados de carrito
  const [cartBranchId, setCartBranchId] = useState<number>(0);
  const [loadingCart, setLoadingCart] = useState(false);
  const [branchMunicipioId, setBranchMunicipioId] = useState<number>(0);
  const [branchName, setBranchName] = useState("");
  const totalPaypal = useRef<number>(0);

  // Estados de archivo
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Estados de confirmación
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [numeroPedido, setNumeroPedido] = useState<string | null>(null);

  // Datos del comprobante
  const [confirmedFecha, setConfirmedFecha] = useState("");
  const [confirmedCustomerName, setConfirmedCustomerName] = useState("");
  const [confirmedEmail, setConfirmedEmail] = useState("");
  const [confirmedPhone, setConfirmedPhone] = useState("");
  const [confirmedAddress, setConfirmedAddress] = useState("");

  const deptFilter = Form.useWatch("departamento", form) as string | undefined;

  // Cargar departamentos
  const fetchDepartments = async () => {
    const response = await fetchDepartamentos();
    setDepartments(response);
  };

  // Cargar municipios cuando cambia el departamento
  useEffect(() => {
    const loadMunicipalities = async () => {
      if (!deptFilter) {
        setMunicipalitites([]);
        return;
      }

      const deptObj = departaments.find(
        (d) => d.nombre_departamento === deptFilter
      );
      if (!deptObj) return;

      const response = await fetchMunicipiosByDepartamento(
        deptObj.id_departamento
      );
      setMunicipalitites(response);
    };

    loadMunicipalities();
  }, [deptFilter, departaments]);

  // Cargar usuario y departamentos al montar
  useEffect(() => {
    const loadUser = async () => {
      const user = await getMyProfile();
      if (user) {
        setCurrentUser(user);

        const isReorderUrl = new URLSearchParams(location.search).get("reorder") === "1";
        const reorderRaw = isReorderUrl ? localStorage.getItem("reorder_checkout") : null;

        if (!reorderRaw) {
          form.setFieldsValue({
            name: `${user.primer_nombre} ${user.primer_apellido}`,
            email: user.correo,
            phone: formatPhone(user.telefono || ""),
          });
        }
      }
    };
    fetchDepartments();
    loadUser();
  }, [form]);

  // Cargar carrito
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoadingCart(true);
        const isReorderUrl = new URLSearchParams(location.search).get("reorder") === "1";
        
        if (!isReorderUrl) {
          localStorage.removeItem("reorder_checkout");
        }
        
        const reorderRaw = isReorderUrl ? localStorage.getItem("reorder_checkout") : null;

        if (reorderRaw) {
          const reorderData = JSON.parse(reorderRaw);

          if (!alive) return;

          setCartBranchId(Number(reorderData.id_sucursal || 0));
          setBranchMunicipioId(Number(reorderData.id_municipio_sucursal || 0));

          if (reorderData.id_sucursal) {
            getBranch(Number(reorderData.id_sucursal)).then(b => {
              if (b && alive) setBranchName(b.nombre);
            });
          }

          const items: SummaryItem[] = reorderData.productos.map((p: any) => ({
            id_producto: Number(p.id_producto),
            img: p.img || "/images/placeholder.png",
            name: String(p.name || ""),
            qty: Number(p.qty || 0),
            price: Number(p.price || 0),
            precio_original: Number(p.precio_original || 0),
            descuento_aplicado: Number(p.descuento_aplicado || 0),
            tipo_descuento: String(p.tipo_descuento || ""),
          }));

          items.forEach((i) => {
            totalPaypal.current = totalPaypal.current + i.price * i.qty;
          });

          setSummaryItems(items);

          if (reorderData.contacto) {
            form.setFieldsValue({
              name: reorderData.contacto.name || "",
              email: reorderData.contacto.email || "",
              phone: formatPhone(reorderData.contacto.phone || ""),
            });
          }

          return;
        }

        const data = await getCart();

        if (!alive) return;

        if (!data?.exist || !data?.cart?.products?.length) {
          setSummaryItems([]);
          setCartBranchId(0);
          return;
        }

        setCartBranchId(Number(data.cart.branch || 0));

        const branch = await getBranch(data.cart.branch);
        if (!alive) return;

        if (branch) {
          setBranchMunicipioId(branch.id_municipio);
          setBranchName(branch.nombre);
        }

        const items: SummaryItem[] = data.cart.products.map((p: any) => ({
          id_producto: Number(p.id_producto),
          img: p.producto_imagen?.[0]?.imagen_url || "/images/placeholder.png",
          name: String(p.nombre || ""),
          qty: Number(p.amount || 0),
          price: Number(p.precio_mas_bajo || 0),
          precio_original: Number(p.precio_original || 0),
          descuento_aplicado: Number(p.descuento_aplicado || 0),
          tipo_descuento: String(p.tipo_descuento || ""),
        }));

        data.cart.products.forEach((i) => {
          totalPaypal.current = totalPaypal.current + i.precio_mas_bajo;
        });

        setSummaryItems(items);
      } catch {
        setSummaryItems([]);
        setCartBranchId(0);
      } finally {
        if (alive) setLoadingCart(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // Funciones auxiliares
  const formatPhone = (raw: string) => {
    const digits = (raw || "").replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 4) return digits;
    return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  };

  // Cálculos
  const descuentoTotal = Math.round(
    summaryItems.reduce((acc, item) => {
      const precioOriginalConIva = (item.precio_original || 0);
      const precioConDescuentoConIva = item.price;
      const descuentoItem = (precioOriginalConIva - precioConDescuentoConIva) * item.qty;
      return acc + (descuentoItem > 0 ? descuentoItem : 0);
    }, 0) * 100
  ) / 100;

  const totalConDescuento = Math.round(
    summaryItems.reduce((acc, item) => acc + item.price * item.qty, 0) * 100
  ) / 100;
  const subtotal = Math.round((totalConDescuento / 1.15) * 100) / 100;
  const isv = Math.round((totalConDescuento - subtotal) * 100) / 100;
  
  const FREE_SHIPPING_THRESHOLD = 70000;
  const orderValue = totalConDescuento;
  const NATIONAL_SHIPPING_FEE = 0;
  const shippingCost =
    deliveryType === "outside"
      ? orderValue >= FREE_SHIPPING_THRESHOLD
        ? 0
        : NATIONAL_SHIPPING_FEE
      : 0;
  const total = totalConDescuento + shippingCost;

  // Mapeadores
  const mapTipoEntrega = (v: "home" | "outside" | "branch") => {
    if (v === "branch") return "retiro_en_el_local";
    return "a_domicilio";
  };

  const mapTipoPago = (v: "transfer" | "paypal" | "pos" | "link" | "efectivo") => {
    if (v === "transfer") return "transferencia_bancaria";
    if (v === "paypal") return "pay_pal";
    if (v === "pos") return "pos";
    if (v === "efectivo") return "efectivo";
    return "compra_click";
  };

  const ID_SUCURSAL = cartBranchId || 1;

  // Determina el id_municipio según el tipo de entrega:
  // - home/branch → municipio de la sucursal del carrito
  // - outside     → municipio elegido en el formulario por el usuario
  const getIdMunicipio = () => {
    if (deliveryType === "outside") {
      const munName = form.getFieldValue("municipio") as string | undefined;
      const found = municipalities.find((m) => m.nombre === munName);
      return found?.id_municipio ?? branchMunicipioId;
    }
    return branchMunicipioId;
  };

  // Handlers
  const handleNextStep = async () => {
    if (currentStep === 0) {
      try {
        await form.validateFields();
        setCurrentStep(1);
      } catch {
        messageApi.error("Por favor, completa todos los campos requeridos");
      }
    } else if (currentStep === 1) {
      if (paymentMethod === "paypal") {
        messageApi.info("Procede con el pago de PayPal");
      } else {
        if (paymentMethod === "transfer" && !file) {
          messageApi.error(
            "Debes subir el comprobante de transferencia"
          );
          return;
        }
        setCurrentStep(2);
        await handleConfirm();
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const uploadComprobanteForPedido = async (
    pedidoId: number,
    uploadFile: File
  ): Promise<string | null> => {
    try {
      setUploading(true);
      const result = await uploadPurchaseReceipt(String(pedidoId), uploadFile);
      if (result.success) {
        messageApi.success("Comprobante subido correctamente");
        return result.comprobante_url || null;
      }
      throw new Error(result.message);
    } catch (error: any) {
      console.error("Error uploading receipt:", error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const performConfirm = async () => {
    const values = await form.getFieldsValue(true);
    if (paymentMethod === "transfer") {
      if (!file) {
        messageApi.error(
          "Debes subir el comprobante de transferencia"
        );
        return;
      }
      if (!file.type.startsWith("image/")) {
        messageApi.error(
          "El comprobante debe ser una imagen válida (JPG, PNG, etc.)"
        );
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        messageApi.error("El comprobante no debe superar los 5MB");
        return;
      }
    }

    const productos = summaryItems.map((item) => ({
      id_producto: Number(item.id_producto),
      cantidad: Number(item.qty),
      precio: Number(item.price),
    }));

    const direccionMap = {
      branch: "RETIRO EN SUCURSAL",
      home: String(values.address || "").trim(),
      outside: `${String(values.departamento || "").trim()}, ${String(
        values.municipio || ""
      ).trim()}, ${String(values.address || "").trim()}`,
    };

    const payload = {
      id_sucursal: ID_SUCURSAL,
      id_municipio_entrega: getIdMunicipio(),
      direccion: direccionMap[deliveryType],
      tipo_de_entrega: mapTipoEntrega(deliveryType),
      tipo_de_pago: mapTipoPago(paymentMethod),
      comprobante_url: null,
      descuento: descuentoTotal,
      costo_envio: shippingCost,
      productos,
      tipo_cliente: "registrado" as const,
      id_usuario: currentUser?.id_usuario,
      nombre_completo: String(values.name || "").trim(),
      telefono_cliente: String(values.phone || "").trim(),
      correo_cliente: String(values.email || "").trim(),
    };
    const resp = await finalizarCompra(payload);
    const pedidoId = resp.data.pedido.id_pedido;

    let comprobanteOk = true;

    if (paymentMethod === "transfer" && file) {
      try {
        await uploadComprobanteForPedido(pedidoId, file);
      } catch (error: any) {
        comprobanteOk = false;
        messageApi.error(
          "El pedido se creó pero hubo un error al subir el comprobante."
        );
        console.error("Error subiendo comprobante:", error);
      }
    }

    if (comprobanteOk) {
      setNumeroPedido(resp.data.pedido.numero_pedido);
      localStorage.setItem(
        "last_order_id",
        String(resp.data.pedido.id_pedido)
      );
      localStorage.setItem("email", values.email);
      // Guardar datos para el comprobante
      setConfirmedFecha(new Date().toLocaleDateString("es-HN", { year: "numeric", month: "long", day: "numeric" }));
      setConfirmedCustomerName(String(values.name || "").trim());
      setConfirmedEmail(String(values.email || "").trim());
      setConfirmedPhone(String(values.phone || "").trim());
      setConfirmedAddress(direccionMap[deliveryType]);
      setIsConfirmed(true);
      await apiDeleteCart(ID_SUCURSAL);
      localStorage.removeItem("reorder_checkout");
      messageApi.success(resp.msg || "Compra realizada con éxito");
    }
  };

  const { execute: handleConfirm, isLoading: confirmingPurchase } = usePreventDuplicate(performConfirm);

  const handlePayPalApprove = async () => {
    setCurrentStep(2);
    await handleConfirm();
  };

  const handleAnotherPurchase = () => {
    navigate("/search");
  };

  if (loadingCart) {
    return (
      <div
        style={{
          backgroundColor: brandColors.bg,
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Spin size="large" tip="Cargando carrito..." />
      </div>
    );
  }

  if (summaryItems.length === 0 && !isConfirmed) {
    return (
      <div
        style={{
          backgroundColor: brandColors.bg,
          minHeight: "100vh",
          padding: "40px 24px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Card
          style={{
            maxWidth: 400,
            borderRadius: 16,
            textAlign: "center",
            margin: "auto",
            boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
            padding: 12,
          }}
        >
          <Alert
            type="warning"
            message="Tu carrito está vacío"
            description="No hay productos para comprar. Vuelve a la tienda."
            showIcon
            style={{
              marginBottom: 24,
              borderRadius: 10,
              textAlign: "left",
            }}
          />

          <Button
            type="primary"
            size="large"
            onClick={() => navigate("/search")}
            block
            style={{
              height: 50,
              fontWeight: 600,
              borderRadius: 10,
              border: "none",
              background: `linear-gradient(to bottom, ${brandColors.primary}, ${brandColors.dark})`,
            }}
          >
            Ir a la Tienda
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <PayPalScriptProvider
      options={{
        clientId:
          "AdPuusfEwFpgoLjKkn_4T_J4H1RJ0u7SsLbYov51-m5g1rYtr8X64md-mGoNmuz16utbzIXf4wJR5u5j",
        currency: "USD",
        intent: "capture",
      }}
    >
      <div
        style={{
          backgroundColor: brandColors.bg,
          minHeight: "100vh",
          padding: "40px 24px",
        }}
      >
        {contextHolder}

        <main style={{ maxWidth: 1200, margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div style={{ marginBottom: 32 }}>
              <Title level={2} style={{ color: brandColors.dark, margin: 0 }}>
                Finalizar Compra
              </Title>
              <div
                style={{
                  height: 4,
                  width: 60,
                  backgroundColor: brandColors.primary,
                  borderRadius: 2,
                  marginTop: 8,
                }}
              />
            </div>


            <CheckoutProgress
              currentStep={currentStep}
              brandColors={brandColors}
            />
          </motion.div>

          <AnimatePresence mode="wait">
            {!isConfirmed ? (
              <motion.div
                key={`step-${currentStep}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Row gutter={[32, 32]}>
                  <Col xs={24} lg={16}>
                    <Form form={form} layout="vertical">
                      {currentStep === 0 && (
                        <CustomerInfoStep
                          form={form}
                          deliveryType={deliveryType}
                          setDeliveryType={setDeliveryType}
                          departaments={departaments}
                          municipalities={municipalities}
                          deptFilter={deptFilter}
                          orderValue={orderValue}
                          branchMunicipioId={branchMunicipioId}
                          branchName={branchName}
                          shippingCost={shippingCost}
                          brandColors={brandColors}
                        />
                      )}

                      {currentStep === 1 && (
                        <PaymentMethodStep
                          paymentMethod={paymentMethod}
                          setPaymentMethod={setPaymentMethod}
                          file={file}
                          setFile={setFile}
                          uploading={uploading}
                          totalPaypal={totalPaypal}
                          messageApi={messageApi}
                          createOrder={createOrder}
                          onPayPalApprove={handlePayPalApprove}
                          brandColors={brandColors}
                        />
                      )}
                    </Form>
                  </Col>

                  {/* Resumen siempre visible */}
                  <Col xs={24} lg={8}>
                    <Card
                      style={{
                        borderRadius: 14,
                        border: `1px solid ${brandColors.primary}20`,
                        position: "sticky",
                        top: 24,
                      }}
                      bodyStyle={{ padding: 24 }}
                    >
                      <Title level={4} style={{ marginBottom: 24 }}>
                        Resumen
                      </Title>

                      {loadingCart ? (
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            padding: "24px 0",
                          }}
                        >
                          <Spin />
                        </div>
                      ) : summaryItems.length === 0 ? (
                        <Alert
                          type="warning"
                          showIcon
                          message="Tu carrito está vacío."
                        />
                      ) : (
                        summaryItems.map((item) => (
                          <div
                            key={item.id_producto}
                            style={{ display: "flex", gap: 12, marginBottom: 16 }}
                          >
                            <img
                              src={`${import.meta.env.VITE_API_URL}/public/${item.img
                                }`}
                              alt={item.name}
                              style={{
                                width: 60,
                                height: 60,
                                objectFit: "cover",
                                borderRadius: 8,
                                border: "1px solid #eee",
                              }}
                            />
                            <div style={{ flex: 1 }}>
                              <Text
                                strong
                                style={{ fontSize: 12, display: "block" }}
                              >
                                {item.name.toUpperCase()}
                              </Text>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                }}
                              >
                                <Text type="secondary">Cant: {item.qty}</Text>
                                <Text
                                  strong
                                  style={{ color: brandColors.primary }}
                                >
                                  L{" "}
                                  {item.price.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </Text>
                              </div>
                            </div>
                          </div>
                        ))
                      )}

                      <Divider />

                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <Text type="secondary">SUBTOTAL</Text>
                          <Text>
                            L{" "}
                            {subtotal.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </Text>
                        </div>
                        {descuentoTotal > 0 && (
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              color: "#9ca3af",
                              fontWeight: "500",
                            }}
                          >
                            <Text style={{ color: "#9ca3af" }}>DESCUENTO</Text>
                            <Text style={{ color: "#9ca3af", fontWeight: "600" }}>
                              -L{" "}
                              {descuentoTotal.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </Text>
                          </div>
                        )}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <Text type="secondary">ISV (15%)</Text>
                          <Text>
                            L{" "}
                            {isv.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </Text>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <Text type="secondary">ENVÍO</Text>
                          <Text
                            strong
                            style={{
                              color:
                                shippingCost === 0
                                  ? brandColors.success
                                  : brandColors.warning,
                            }}
                          >
                            {deliveryType === "outside" && orderValue < FREE_SHIPPING_THRESHOLD ? "COTIZAR" : "GRATIS"}
                          </Text>
                        </div>
                        {deliveryType === "outside" && shippingCost === 0 && orderValue >= FREE_SHIPPING_THRESHOLD && (
                          <Text style={{ fontSize: 11, color: brandColors.success }}>
                            Envío nacional gratis por compra mayor a L 70,000
                          </Text>
                        )}
                        {deliveryType === "outside" && orderValue < FREE_SHIPPING_THRESHOLD && (
                          <Text style={{ fontSize: 11, color: "#9ca3af" }}>
                            Envío gratis en compras mayores a L 70,000
                          </Text>
                        )}
                        <Divider style={{ margin: "12px 0" }} />
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Text strong style={{ fontSize: 16 }}>
                            TOTAL
                          </Text>
                          <Text
                            strong
                            style={{ fontSize: 22, color: brandColors.primary }}
                          >
                            L{" "}
                            {total.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </Text>
                        </div>
                      </div>
                      {/* Botones de navegación */}
                      <Row gutter={12} justify="center" style={{ marginTop: 24 }}>
                        <Col xs={24} sm={24}>
                          <Button
                            type="primary"
                            icon={
                              currentStep === 1 ? (
                                <CheckOutlined />
                              ) : (
                                <ArrowRightOutlined />
                              )
                            }
                            block
                            loading={confirmingPurchase}
                            onClick={handleNextStep}
                            size="large"
                            style={{
                              height: 50,
                              marginTop: 30,
                              borderRadius: 10,
                              fontWeight: "bold",
                              fontSize: screens.xs ? 14 : 15,
                              background: `linear-gradient(to bottom, ${brandColors.primary}, ${brandColors.dark})`,
                            }}
                          >
                            {currentStep === 0
                              ? "Siguiente"
                              : "Efectuar compra"}
                          </Button>
                        </Col>
                        <Col xs={24} sm={24}>
                          <Button
                            icon={<ArrowLeftOutlined />}
                            block
                            disabled={currentStep === 0}
                            onClick={handlePrevStep}
                            size="large"
                            style={{
                              height: 45,
                              marginTop: 12,
                              borderRadius: 10,
                              fontWeight: "bold",
                              fontSize: screens.xs ? 14 : 15,
                            }}
                          >
                            Atrás
                          </Button>
                        </Col>
                      </Row>
                    </Card>
                  </Col>
                </Row>
              </motion.div>
            ) : (
              <motion.div
                key="confirmation"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <OrderConfirmationStep
                  numeroPedido={numeroPedido}
                  summaryItems={summaryItems}
                  subtotal={subtotal}
                  isv={isv}
                  shippingCost={shippingCost}
                  total={total}
                  descuentoTotal={descuentoTotal}
                  deliveryType={deliveryType}
                  paymentMethod={paymentMethod}
                  customerName={confirmedCustomerName}
                  customerEmail={confirmedEmail}
                  customerPhone={confirmedPhone}
                  deliveryAddress={confirmedAddress}
                  fecha={confirmedFecha}
                  onAnotherPurchase={handleAnotherPurchase}
                  brandColors={brandColors}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </PayPalScriptProvider>
  );
}
