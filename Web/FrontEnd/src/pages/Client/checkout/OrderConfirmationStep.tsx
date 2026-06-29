import { useEffect, useRef } from "react";
import { Result, Button, Card, Col, Typography, Divider, Alert, Space, QRCode } from "antd";
import { CheckCircleOutlined, ShoppingOutlined, PrinterOutlined } from "@ant-design/icons";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

interface OrderSummaryItem {
  id_producto: number;
  img: string;
  name: string;
  qty: number;
  price: number;
}

interface OrderConfirmationStepProps {
  numeroPedido: string | null;
  summaryItems: OrderSummaryItem[];
  subtotal: number;
  isv: number;
  shippingCost: number;
  total: number;
  descuentoTotal: number;
  deliveryType: "home" | "outside" | "branch";
  paymentMethod: "transfer" | "paypal" | "pos" | "link" | "efectivo";
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  fecha: string;
  isFreeNationalShipping?: boolean;
  onAnotherPurchase: () => void;
  brandColors: {
    primary: string;
    dark: string;
    bg: string;
    cardBg: string;
    success: string;
    warning: string;
  };
}

const { Text, Title, Paragraph } = Typography;

const fmt = (n: any) => {
  if (n === null || n === undefined || isNaN(Number(n))) return "0.00";
  return Number(n).toLocaleString("es-HN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const DELIVERY_LABEL: Record<string, string> = {
  home: "Domicilio Local (Gratis)",
  outside: "Envío Nacional",
  branch: "Retiro en Sucursal",
};

const PAYMENT_LABEL: Record<string, string> = {
  transfer: "Transferencia Bancaria",
  paypal: "PayPal / Tarjeta de Crédito",
  pos: "POS",
  efectivo: "Efectivo",
  link: "Pago con Link (WhatsApp)",
};

export default function OrderConfirmationStep({
  numeroPedido,
  summaryItems,
  subtotal,
  isv,
  shippingCost,
  total,
  descuentoTotal,
  deliveryType,
  paymentMethod,
  customerName,
  customerEmail,
  customerPhone,
  deliveryAddress,
  fecha,
  onAnotherPurchase,
  brandColors,
}: OrderConfirmationStepProps) {
  // Asegurar que brandColors tenga valores por defecto si llega undefined
  const colors = brandColors || {
    primary: "#027eb1",
    dark: "#003e7b",
    bg: "#f3f4f6",
    cardBg: "#eef9ff",
    success: "#16a34a",
    warning: "#f59e0b",
  };

  const receiptRef = useRef<HTMLDivElement>(null);
  const verificationUrl = `${window.location.origin}/admin/pedidos`;

  const generatePDF = async () => {
    if (!receiptRef.current) return;

    try {
      // Esperar a que el QRCode y estilos se rendericen
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`comprobante-${numeroPedido || "pedido"}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  useEffect(() => {
    // Descarga automática con delay para asegurar renderizado
    const timer = setTimeout(() => {
      generatePDF();
    }, 1000);
    return () => clearTimeout(timer);
  }, [numeroPedido]);

  const getDeliveryTypeText = (type: string) =>
    DELIVERY_LABEL[type] || type;

  const getPaymentMethodText = (method: string) =>
    PAYMENT_LABEL[method] || method;

  const handlePrint = () => {
    const productRows = summaryItems
      .map(
        (item, idx) => `
        <tr style="background:${idx % 2 === 0 ? "#ffffff" : "#f9fafb"}">
          <td style="padding:8px 10px;border-bottom:1px solid #f0f0f0">${(item?.name || "PRODUCTO").toUpperCase()}</td>
          <td style="padding:8px 10px;text-align:center;border-bottom:1px solid #f0f0f0">${item.qty}</td>
          <td style="padding:8px 10px;text-align:right;border-bottom:1px solid #f0f0f0">L ${fmt(item.price)}</td>
          <td style="padding:8px 10px;text-align:right;font-weight:600;border-bottom:1px solid #f0f0f0">L ${fmt(item.price * item.qty)}</td>
        </tr>`
      )
      .join("");

    const discountRow =
      descuentoTotal > 0
        ? `<tr><td style="color:#6b7280">Descuento</td><td style="text-align:right;color:#16a34a">-L ${fmt(descuentoTotal)}</td></tr>`
        : "";

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Comprobante ${numeroPedido || ""}</title>
  <style>
    @page { margin: 12mm; size: A4; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 13px; color: #1f2937; background: #fff; padding: 20px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start;
              border-bottom: 2px solid #003e7b; padding-bottom: 12px; margin-bottom: 20px; }
    .header-left .label { font-size: 10px; letter-spacing: 2px; color: #6b7280; margin-bottom: 4px; }
    .header-left .order { font-size: 20px; font-weight: 700; color: #003e7b; }
    .header-right { text-align: right; font-size: 12px; }
    .header-right .date { font-weight: 600; font-size: 14px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 20px;
                 background: #eef9ff; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; font-size: 12px; }
    .info-grid .lbl { font-size: 9px; color: #9ca3af; text-transform: uppercase; margin-bottom: 2px; }
    .info-grid .val { font-weight: 600; }
    .section-title { font-weight: 700; color: #003e7b; margin-bottom: 10px; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 10px; }
    thead tr { background: #003e7b; color: #fff; }
    thead th { padding: 8px 10px; text-align: left; font-weight: 600; }
    .totals-container { display: flex; justify-content: space-between; align-items: flex-start; margin-top: 10px; }
    .qr-box { width: 120px; text-align: center; }
    .qr-box img { width: 100px; height: 100px; margin-bottom: 4px; }
    .qr-box .qr-label { font-size: 8px; color: #9ca3af; }
    .totals { width: 280px; font-size: 12px; }
    .totals table { width: 100%; margin-bottom: 0; }
    .totals td { padding: 4px 0; }
    .total-row { background: #003e7b; color: #fff; border-radius: 6px;
                 padding: 8px 12px; font-weight: 700; font-size: 14px;
                 display: flex; justify-content: space-between; margin-top: 8px; }
    .footer { text-align: center; margin-top: 40px; font-size: 11px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <div class="label">COMPROBANTE DE COMPRA</div>
      <div class="order">${numeroPedido || "—"}</div>
    </div>
    <div class="header-right">
      <div>Fecha de emisión</div>
      <div class="date">${fecha || new Date().toLocaleDateString("es-HN")}</div>
    </div>
  </div>

  <div class="info-grid">
    <div><div class="lbl">Cliente</div><div class="val">${customerName || "—"}</div></div>
    <div><div class="lbl">Correo</div><div class="val">${customerEmail || "—"}</div></div>
    <div><div class="lbl">Teléfono</div><div class="val">${customerPhone || "—"}</div></div>
    <div><div class="lbl">Tipo de Entrega</div><div class="val">${getDeliveryTypeText(deliveryType)}</div></div>
    <div><div class="lbl">Método de Pago</div><div class="val">${getPaymentMethodText(paymentMethod)}</div></div>
    <div><div class="lbl">Dirección</div><div class="val">${deliveryAddress || "—"}</div></div>
  </div>

  <div class="section-title">Productos</div>
  <table>
    <thead>
      <tr>
        <th>Producto</th>
        <th style="text-align:center">Cant.</th>
        <th style="text-align:right">P. Unit. (s/ISV)</th>
        <th style="text-align:right">Total</th>
      </tr>
    </thead>
    <tbody>${productRows}</tbody>
  </table>

    <div class="totals-container">
    <div class="qr-box">
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verificationUrl)}" alt="QR Code" />
      <div class="qr-label">ESCANEAR PARA VERIFICAR</div>
    </div>
    <div class="totals">
      <table>
        <tbody>
          <tr><td style="color:#6b7280">Subtotal</td><td style="text-align:right">L ${fmt(subtotal)}</td></tr>
          ${discountRow}
          <tr><td style="color:#6b7280">ISV (15%)</td><td style="text-align:right">L ${fmt(isv)}</td></tr>
          <tr><td style="color:#6b7280">Envío</td><td style="text-align:right">${(deliveryType === "outside" && total < 70000) ? "COTIZAR" : (shippingCost === 0 ? "GRATIS" : `L ${fmt(shippingCost)}`)}</td></tr>
        </tbody>
      </table>
      <div class="total-row"><span>TOTAL</span><span>L ${fmt(total)}</span></div>
    </div>
  </div>

  <div class="footer">Gracias por tu compra • ${fecha || new Date().toLocaleDateString("es-HN")}</div>
</body>
</html>`;

    // Crear un iframe oculto
    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.width = "0px";
    iframe.style.height = "0px";
    iframe.style.border = "none";
    iframe.style.visibility = "hidden";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();

      // Pequeña pausa para asegurar el renderizado antes de imprimir
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        // Eliminar el iframe después de que se abra el diálogo de impresión
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 500);
      }, 500);
    }
  };

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      {/* Recibo oculto para la generación del PDF */}
      <div
        ref={receiptRef}
        style={{
          position: "absolute",
          left: "-9999px",
          top: 0,
          width: "800px",
          padding: "40px",
          backgroundColor: "#ffffff",
          color: "#1f2937",
          fontFamily: "Arial, sans-serif"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #003e7b", paddingBottom: "12px", marginBottom: "20px" }}>
          <div>
            <div style={{ fontSize: "10px", letterSpacing: "2px", color: "#6b7280", marginBottom: "4px" }}>COMPROBANTE DE COMPRA</div>
            <div style={{ fontSize: "24px", fontWeight: 700, color: "#003e7b" }}>{numeroPedido || "—"}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "10px", color: "#6b7280" }}>Fecha de emisión</div>
            <div style={{ fontWeight: 600, fontSize: "14px" }}>{fecha || new Date().toLocaleDateString("es-HN")}</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 20px", background: "#eef9ff", borderRadius: "8px", padding: "16px", marginBottom: "20px", fontSize: "13px" }}>
          <div><div style={{ fontSize: "10px", color: "#9ca3af", textTransform: "uppercase", marginBottom: "2px" }}>Cliente</div><div style={{ fontWeight: 600 }}>{customerName || "—"}</div></div>
          <div><div style={{ fontSize: "10px", color: "#9ca3af", textTransform: "uppercase", marginBottom: "2px" }}>Correo</div><div style={{ fontWeight: 600 }}>{customerEmail || "—"}</div></div>
          <div><div style={{ fontSize: "10px", color: "#9ca3af", textTransform: "uppercase", marginBottom: "2px" }}>Teléfono</div><div style={{ fontWeight: 600 }}>{customerPhone || "—"}</div></div>
          <div><div style={{ fontSize: "10px", color: "#9ca3af", textTransform: "uppercase", marginBottom: "2px" }}>Tipo de Entrega</div><div style={{ fontWeight: 600 }}>{getDeliveryTypeText(deliveryType)}</div></div>
          <div><div style={{ fontSize: "10px", color: "#9ca3af", textTransform: "uppercase", marginBottom: "2px" }}>Método de Pago</div><div style={{ fontWeight: 600 }}>{getPaymentMethodText(paymentMethod)}</div></div>
          <div><div style={{ fontSize: "10px", color: "#9ca3af", textTransform: "uppercase", marginBottom: "2px" }}>Dirección</div><div style={{ fontWeight: 600 }}>{deliveryAddress || "—"}</div></div>
        </div>

        <div style={{ fontWeight: 700, color: "#003e7b", marginBottom: "10px", fontSize: "15px" }}>Productos</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", marginBottom: "20px" }}>
          <thead>
            <tr style={{ background: "#003e7b", color: "#fff" }}>
              <th style={{ padding: "10px", textAlign: "left" }}>Producto</th>
              <th style={{ padding: "10px", textAlign: "center" }}>Cant.</th>
              <th style={{ padding: "10px", textAlign: "right" }}>P. Unit. (s/ISV)</th>
              <th style={{ padding: "10px", textAlign: "right" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {summaryItems.map((item, idx) => (
              <tr key={item?.id_producto || idx} style={{ background: idx % 2 === 0 ? "#ffffff" : "#f9fafb" }}>
                <td style={{ padding: "10px", borderBottom: "1px solid #f0f0f0" }}>{(item?.name || "PRODUCTO").toUpperCase()}</td>
                <td style={{ padding: "10px", textAlign: "center", borderBottom: "1px solid #f0f0f0" }}>{item.qty}</td>
                <td style={{ padding: "10px", textAlign: "right", borderBottom: "1px solid #f0f0f0" }}>L {fmt(item.price)}</td>
                <td style={{ padding: "10px", textAlign: "right", fontWeight: 600, borderBottom: "1px solid #f0f0f0" }}>L {fmt(item.price * item.qty)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: "10px" }}>
          <div style={{ width: "120px", textAlign: "center" }}>
            <div style={{ background: "#fff", padding: "4px", borderRadius: "4px", display: "inline-block", border: "1px solid #f0f0f0" }}>
              {QRCode ? (
                <QRCode
                  value={verificationUrl}
                  size={100}
                  bordered={false}
                  color="#003e7b"
                />
              ) : (
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(verificationUrl)}`} alt="QR Code" />
              )}
            </div>
            <div style={{ fontSize: "9px", color: "#9ca3af", textTransform: "uppercase", marginTop: "4px" }}>Escanear para verificar</div>
          </div>

          <div style={{ maxWidth: "300px", width: "100%", fontSize: "13px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ color: "#6b7280" }}>Subtotal</span>
              <span>L {fmt(subtotal)}</span>
            </div>
            {descuentoTotal > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ color: "#6b7280" }}>Descuento</span>
                <span style={{ color: "#16a34a" }}>-L {fmt(descuentoTotal)}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ color: "#6b7280" }}>ISV (15%)</span>
              <span>L {fmt(isv)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ color: "#6b7280" }}>Envío</span>
              <span>{(deliveryType === "outside" && total < 70000) ? "COTIZAR" : (shippingCost === 0 ? "GRATIS" : `L ${fmt(shippingCost)}`)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", background: "#003e7b", color: "#fff", borderRadius: "6px", padding: "10px 16px", marginTop: "10px", fontWeight: 700, fontSize: "16px" }}>
              <span>TOTAL</span>
              <span>L {fmt(total)}</span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: "40px", fontSize: "12px", color: "#9ca3af", textAlign: "center" }}>
          Gracias por tu compra • {fecha || new Date().toLocaleDateString("es-HN")}
        </div>
      </div>

      <Col xs={24} lg={16}>
        <Result
          status="success"
          title="¡Compra Finalizada Exitosamente!"
          subTitle={`Número de pedido: ${numeroPedido || "..."}`}
          icon={
            <CheckCircleOutlined
              style={{
                color: colors.success,
                fontSize: 72,
                marginBottom: 24,
              }}
            />
          }
          extra={[
            <Button
              key="print"
              size="large"
              icon={<PrinterOutlined />}
              onClick={handlePrint}
              style={{
                borderColor: colors.primary,
                color: colors.primary,
                borderRadius: 8,
                fontWeight: 600,
              }}
            >
              Imprimir Comprobante
            </Button>,
            <Button
              key="shop"
              type="primary"
              size="large"
              icon={<ShoppingOutlined />}
              onClick={onAnotherPurchase}
            >
              Seguir Comprando
            </Button>,
          ]}
          style={{
            padding: "48px 24px",
            backgroundColor: "#fff",
            borderRadius: 14,
            marginBottom: 32,
          }}
        />
      </Col>
      <Col xs={24} lg={8}>
        <Card style={{ borderRadius: 14 }}>
          <Title level={5}>Detalles del Pedido</Title>
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <div>
              <Text strong>Tipo de Entrega</Text>
              <Paragraph
                style={{ color: colors.primary, margin: "8px 0 0 0", fontSize: 14 }}
              >
                {getDeliveryTypeText(deliveryType)}
              </Paragraph>
            </div>

            <Divider style={{ margin: "12px 0" }} />

            <div>
              <Text strong>Método de Pago</Text>
              <Paragraph
                style={{ color: colors.primary, margin: "8px 0 0 0", fontSize: 14 }}
              >
                {getPaymentMethodText(paymentMethod)}
              </Paragraph>
            </div>

            <Divider style={{ margin: "12px 0" }} />

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <Text>Subtotal</Text>
                <Text>L. {fmt(subtotal)}</Text>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <Text>ISV (15%)</Text>
                <Text>L. {fmt(isv)}</Text>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <Text>Envío</Text>
                <Text>{(deliveryType === "outside" && total < 70000) ? "COTIZAR" : (shippingCost === 0 ? "GRATIS" : `L. ${fmt(shippingCost)}`)}</Text>
              </div>
            </div>

            <Divider style={{ margin: "12px 0" }} />

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                backgroundColor: colors.cardBg,
                padding: "12px 16px",
                borderRadius: 8,
              }}
            >
              <Text strong style={{ fontSize: 16 }}>Total</Text>
              <Text strong style={{ fontSize: 18, color: colors.success }}>
                L. {fmt(total)}
              </Text>
            </div>

            {paymentMethod === "paypal" && (
              <Alert type="success" showIcon message="Pago completado"
                description="Tu pago con PayPal ha sido procesado correctamente" />
            )}
            {paymentMethod === "transfer" && (
              <Alert type="info" showIcon message="Esperando validación"
                description="Validaremos tu comprobante y procesaremos tu pedido pronto" />
            )}
            {(paymentMethod === "pos" || paymentMethod === "efectivo") && (
              <Alert type="warning" showIcon message="Pago contra entrega"
                description="El pago se realizará cuando recibas tu compra" />
            )}
            {paymentMethod === "link" && (
              <Alert type="info" showIcon message="Link enviado"
                description="Te hemos enviado un link de pago por WhatsApp" />
            )}
          </Space>
        </Card>
      </Col>
    </div>
  );
}
