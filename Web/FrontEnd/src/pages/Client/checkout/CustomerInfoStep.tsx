import { Card, Form, Input, Radio, Row, Col, Alert, Select } from "antd";
import {
  UserOutlined,
  CarOutlined,
  ShopOutlined,
  EnvironmentOutlined,
  MailOutlined,
} from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import type { FormInstance } from "antd";
import type { Departamento, Municipio } from "../../../api/departments/types";

// const { Text } = Typography;

interface CustomerInfoStepProps {
  form: FormInstance;
  deliveryType: "home" | "outside" | "branch";
  setDeliveryType: (type: "home" | "outside" | "branch") => void;
  departaments: Departamento[];
  municipalities: Municipio[];
  deptFilter?: string;
  orderValue: number;
  branchMunicipioId: number;
  branchName: string;
  shippingCost: number;
  brandColors: {
    primary: string;
    dark: string;
    bg: string;
    cardBg: string;
    success: string;
    warning: string;
  };
}

const FREE_SHIPPING_THRESHOLD = 70000;

export default function CustomerInfoStep({
  form,
  deliveryType,
  setDeliveryType,
  departaments,
  municipalities,
  deptFilter,
  orderValue,
  branchMunicipioId,
  branchName,
  brandColors,
}: CustomerInfoStepProps) {


  const formatPhone = (raw: string) => {
    const digits = (raw || "").replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 4) return digits;
    return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  };

  interface DeliveryOptionProps {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    value: "home" | "outside" | "branch";
  }

  const DeliveryOption = ({
    icon,
    title,
    subtitle,
    value,
  }: DeliveryOptionProps) => (
    <Radio.Button value={value} className="custom-delivery-card">
      <div className="icon-container">{icon}</div>
      <div className="text-container">
        <span className="card-title">{title}</span>
        <span className="card-subtitle">{subtitle}</span>
      </div>
    </Radio.Button>
  );

  return (
    <>
      <Card
        title={
          <span>
            <UserOutlined
              style={{
                color: brandColors.primary,
                marginRight: 8,
              }}
            />{" "}
            Datos de Contacto
          </span>
        }
        style={{ borderRadius: 14, marginBottom: 24 }}
      >
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="NOMBRE COMPLETO"
              name="name"
              rules={[{ required: true, message: "El nombre es requerido" }]}
            >
              <Input size="large" placeholder="Carlos Roberto Méndez" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              label="CORREO ELECTRÓNICO"
              name="email"
              rules={[
                {
                  required: true,
                  type: "email",
                  message: "Ingresa un correo válido",
                },
              ]}
            >
              <Input
                size="large"
                prefix={<MailOutlined style={{ color: "#bfbfbf" }} />}
                placeholder="ejemplo@correo.com"
              />
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item
              label="TELÉFONO"
              name="phone"
              rules={[
                {
                  required: true,
                  message: "El teléfono es requerido",
                },
                {
                  pattern: /^\d{4}-\d{4}$/,
                  message: "Formato debe ser 0000-0000",
                },
              ]}
            >
              <Input
                size="large"
                addonBefore="+504"
                placeholder="0000-0000"
                onChange={(e) => {
                  const value = formatPhone(e.target.value);
                  form.setFieldsValue({ phone: value });
                }}
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card
        title={
          <span>
            <CarOutlined
              style={{
                color: brandColors.primary,
                marginRight: 8,
              }}
            />{" "}
            Método de Entrega
          </span>
        }
        style={{ borderRadius: 14 }}
      >
        <Radio.Group
          value={deliveryType}
          onChange={(e) => setDeliveryType(e.target.value)}
          style={{ width: "100%", marginBottom: 24 }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <DeliveryOption
                value="home"
                icon={<CarOutlined />}
                title="Domicilio Local"
                subtitle="MISMA CIUDAD · GRATIS"
              />
            </Col>
            <Col xs={24} md={8}>
              <DeliveryOption
                value="outside"
                icon={<EnvironmentOutlined />}
                title="Envío Nacional"
                subtitle={
                  orderValue >= FREE_SHIPPING_THRESHOLD
                    ? "ENVÍO GRATIS"
                    : "COTIZAR"
                }
              />
            </Col>
            <Col xs={24} md={8}>
              <DeliveryOption
                value="branch"
                icon={<ShopOutlined />}
                title="Recoger Tienda"
                subtitle="PICK UP"
              />
            </Col>
          </Row>
        </Radio.Group>
        
        {branchName && (
          <Alert
            message={
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, color: "#666" }}>Estás comprando en:</span>
                <strong style={{ fontSize: 14, color: brandColors.primary }}>
                  {branchName.toUpperCase()}
                </strong>
              </div>
            }
            type="info"
            showIcon
            style={{
              marginBottom: 24,
              borderRadius: 12,
              backgroundColor: `${brandColors.primary}08`,
              border: `1px solid ${brandColors.primary}20`
            }}
          />
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={deliveryType}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {deliveryType === "branch" ? (
              <Alert
                message="Retiro en Sucursal"
                description="Disponible 24h después de validado el pago."
                type="success"
                showIcon
                icon={<ShopOutlined />}
              />
            ) : deliveryType === "home" ? (
              <Form.Item
                label="DIRECCIÓN EXACTA"
                name="address"
                rules={[{ required: true, message: "La dirección es requerida" }]}
              >
                <Input.TextArea
                  rows={3}
                  placeholder="Barrio, Calle, Referencia..."
                />
              </Form.Item>
            ) : (
              <>
                <Form.Item
                  label="DEPARTAMENTO"
                  name="departamento"
                  rules={[
                    {
                      required: true,
                      message: "Seleccione un departamento",
                    },
                  ]}
                >
                  <Select
                    placeholder="Seleccione departamento"
                    onChange={() => form.setFieldsValue({ municipio: undefined })}
                  >
                    {departaments.map((d) => (
                      <Select.Option
                        key={d.id_departamento}
                        value={d.nombre_departamento}
                      >
                        {d.nombre_departamento}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  label="MUNICIPIO"
                  name="municipio"
                  rules={[
                    { required: true, message: "Seleccione un municipio" },
                  ]}
                >
                  <Select placeholder="Seleccione municipio" disabled={!deptFilter}>
                    {municipalities
                      .filter((m) => m.id_municipio !== branchMunicipioId)
                      .map((m) => (
                        <Select.Option key={m.id_municipio} value={m.nombre}>
                          {m.nombre}
                        </Select.Option>
                      ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  label="DIRECCIÓN EXACTA"
                  name="address"
                  rules={[{ required: true, message: "La dirección es requerida" }]}
                >
                  <Input.TextArea
                    rows={3}
                    placeholder="Barrio, Calle, Referencia..."
                  />
                </Form.Item>


              </>
            )}
          </motion.div>
        </AnimatePresence>
      </Card>

      <style>{`
        .custom-delivery-card {
          width: 100%;
          height: 140px !important;
          background-color: ${brandColors.cardBg} !important;
          border: 2px solid transparent !important;
          border-radius: 16px !important;
          display: flex !important;
          flex-direction: column;
          align-items: flex-start !important;
          justify-content: center !important;
          padding: 20px !important;
          transition: all 0.3s ease;
          overflow: hidden;
        }
        .ant-radio-button-wrapper-checked.custom-delivery-card {
          border-color: ${brandColors.primary} !important;
          box-shadow: 0 4px 12px rgba(2, 126, 177, 0.15);
        }
        .icon-container {
          background-color: ${brandColors.primary};
          width: 45px;
          height: 45px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 15px;
          color: white;
          font-size: 20px;
        }
        .text-container { display: flex; flex-direction: column; text-align: left; }
        .card-title { font-size: 18px; font-weight: 700; color: #000; line-height: 1.2; }
        .card-subtitle { font-size: 11px; font-weight: 700; color: #8c8c8c; letter-spacing: 1px; margin-top: 4px; }
        .ant-form-item-label label { font-size: 11px !important; font-weight: 800 !important; color: #9ca3af !important; }
      `}</style>
    </>
  );
}
