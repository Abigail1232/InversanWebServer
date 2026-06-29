import { Card, Radio, Space, Upload, Alert, Button, Row, Col, Typography, Spin } from "antd";
import {
  CreditCardOutlined,
  DollarOutlined,
  PrinterOutlined,
  WhatsAppOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import type { message } from "antd";

const { Text, Paragraph } = Typography;
const { Dragger } = Upload;

interface PaymentMethodStepProps {
  paymentMethod: "transfer" | "paypal" | "pos" | "link" | "efectivo";
  setPaymentMethod: (method: "transfer" | "paypal" | "pos" | "link") => void;
  file: File | null;
  setFile: (file: File | null) => void;
  uploading: boolean;
  totalPaypal: React.MutableRefObject<number>;
  messageApi: ReturnType<typeof message.useMessage>[0];
  createOrder: (amount: number) => Promise<string>;
  onPayPalApprove: () => Promise<void>;
  brandColors: {
    primary: string;
    dark: string;
    bg: string;
    cardBg: string;
    success: string;
    warning: string;
  };
}

export default function PaymentMethodStep({
  paymentMethod,
  setPaymentMethod,
  file,
  setFile,
  uploading,
  totalPaypal,
  messageApi,
  createOrder,
  onPayPalApprove,
  brandColors,
}: PaymentMethodStepProps) {
  const handleFileUpload = (info: any) => {
    const uploadedFile = info.fileList[0]?.originFileObj as File;
    if (uploadedFile) {
      if (!uploadedFile.type.startsWith("image/")) {
        messageApi.error(
          "Solo se permiten archivos de imagen (JPG, PNG, etc.)"
        );
        return;
      }
      if (uploadedFile.size > 5 * 1024 * 1024) {
        messageApi.error("El archivo no debe superar los 5MB");
        return;
      }
      setFile(uploadedFile);
    }
  };

  return (
    <Card
      title={
        <span>
          <CreditCardOutlined
            style={{
              color: brandColors.primary,
              marginRight: 8,
            }}
          />{" "}
          Método de Pago
        </span>
      }
      style={{ borderRadius: 14 }}
    >
       <style>
      {`
        .payment-radio { width: 100%; padding: 12px 16px; border: 1px solid #e5e7eb; border-radius: 10px; }
        .ant-radio-button-wrapper::before { display: none !important; }
        .ant-form-item-label label { font-size: 11px !important; font-weight: 800 !important; color: #9ca3af !important; }
      `}
    </style>  
      <Radio.Group
        value={paymentMethod}
        onChange={(e) => setPaymentMethod(e.target.value)}
        style={{ width: "100%" }}
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          {/* Transferencia Bancaria */}
          <Radio value="transfer" className="payment-radio">
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <DollarOutlined style={{ color: brandColors.primary }} />
              Transferencia Bancaria
            </span>
          </Radio>

          {paymentMethod === "transfer" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ padding: "0 24px 16px" }}
            >
              <Row gutter={12} style={{ marginBottom: 16 }}>
                <Col span={12} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/BAC_Credomatic_logo.svg/1280px-BAC_Credomatic_logo.svg.png"
                    alt="BAC"
                    style={{ width: 40, height: 15 }}
                  />
                  <Text style={{ fontSize: 12, color: "#666" }}>
                    BAC Credomatic
                  </Text>
                </Col>
                <Col span={12} style={{ display: "flex", justifyContent: "flex-end" }}>
                  <Text style={{ fontSize: 12, color: "#666" }}>
                    Cta: 1234-5678
                  </Text>
                </Col>
              </Row>
              <Paragraph style={{ fontSize: 12, color: "#999", marginBottom: 16 }}>
                Por favor, sube el comprobante de tu transferencia
              </Paragraph>
              <Dragger
                maxCount={1}
                beforeUpload={() => false}
                onChange={handleFileUpload}
                onRemove={() => {
                  setFile(null);
                }}
                disabled={uploading}
                accept="image/*"
              >
                <p className="ant-upload-text">
                  {uploading
                    ? "Subiendo comprobante..."
                    : file
                      ? `Archivo seleccionado: ${file.name}`
                      : "Drag & drop tu comprobante aquí"}
                </p>
                {file && !uploading && (
                  <div style={{ marginTop: 8, color: "#52c41a" }}>
                    ✓ Comprobante listo para subir
                  </div>
                )}
                {uploading && (
                  <div style={{ marginTop: 8, color: "#1890ff" }}>
                    <Spin size="small" /> Procesando archivo...
                  </div>
                )}
              </Dragger>
            </motion.div>
          )}

          {/* PayPal */}
          <Radio value="paypal" className="payment-radio">
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <CreditCardOutlined style={{ color: "#003e7b" }} />
              PayPal / Tarjeta de Crédito
            </span>
          </Radio>

          {paymentMethod === "paypal" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                padding: "0 24px 16px",
                position: "relative",
                width: "100%",
                overflow: "hidden",
                zIndex: 1,
              }}
            >
              <Alert
                type="info"
                showIcon
                message="Pago inmediato"
                description="Al confirmar el pago con PayPal, tu compra se finalizará automáticamente"
                style={{ marginBottom: 16 }}
              />
              <PayPalScriptProvider
                options={{
                  clientId:
                    "AdPuusfEwFpgoLjKkn_4T_J4H1RJ0u7SsLbYov51-m5g1rYtr8X64md-mGoNmuz16utbzIXf4wJR5u5j",
                  currency: "USD",
                  intent: "capture",
                }}
              >
                <div style={{ width: "100%", maxWidth: "500px", margin: "0 auto" }}>
                  <PayPalButtons
                    style={{
                      layout: "vertical",
                      color: "blue",
                      shape: "rect",
                      label: "paypal",
                    }}
                    createOrder={async () => {
                      try {
                        const orderId = await createOrder(
                          totalPaypal.current
                        );
                        return orderId;
                      } catch (error) {
                        messageApi.error(
                          "Error al iniciar el pago con PayPal"
                        );
                        console.error(error);
                        throw error;
                      }
                    }}
                    onApprove={async () => {
                      await onPayPalApprove();
                    }}
                    onError={() => {
                      messageApi.error(
                        "Ocurrió un error con PayPal. Intenta de nuevo."
                      );
                    }}
                  />
                </div>
              </PayPalScriptProvider>
            </motion.div>
          )}

          {/* POS */}
          <Radio value="pos" className="payment-radio">
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <PrinterOutlined style={{ color: brandColors.primary }} />
                Pago con POS 
            </span>
          </Radio>

          {paymentMethod === "pos" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ padding: "0 24px 16px" }}
            >
              <Alert
                type="info"
                showIcon
                icon={<PrinterOutlined />}
                message="Pago al recibir"
                description="Nuestro repartidor llevará una terminal POS para tarjeta al momento de la entrega."
              />
            </motion.div>
          )}

          {/* Efectivo */}
          <Radio value="efectivo" className="payment-radio">
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <DollarOutlined style={{ color: brandColors.primary }} />
                Pago con Efectivo
            </span>
          </Radio>


          {paymentMethod === "efectivo" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ padding: "0 24px 16px" }}
            >
              <Alert
                type="info"
                showIcon
                icon={<DollarOutlined />}
                message="Pago al recibir"
                description="Nuestro repartidor aceptará efectivo al momento de la entrega."
              />
            </motion.div>
          )}
          {/* Link WhatsApp */}
          <Radio value="link" className="payment-radio">
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <WhatsAppOutlined style={{ color: brandColors.success }} />
              Pago con Link (WhatsApp)
            </span>
          </Radio>

          {paymentMethod === "link" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ padding: "0 24px 16px" }}
            >
              <Alert
                type="info"
                showIcon
                message="Link de pago por WhatsApp"
                description="Te enviaremos un link de pago por WhatsApp para que realices tu transacción de forma segura"
                style={{ marginBottom: 16 }}
              />
              <Button
                icon={<WhatsAppOutlined />}
                block
                style={{
                  backgroundColor: brandColors.success,
                  color: "white",
                  height: 45,
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                SOLICITAR LINK POR WHATSAPP
              </Button>
            </motion.div>
          )}
        </Space>
      </Radio.Group>
    </Card>
  );
}
