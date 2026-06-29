import { Steps, Row, Col } from "antd";
import {
  UserOutlined,
  CreditCardOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";

interface CheckoutProgressProps {
  currentStep: number;
  brandColors: {
    primary: string;
    dark: string;
    bg: string;
    cardBg: string;
    success: string;
    warning: string;
  };
}

export default function CheckoutProgress({
  currentStep
}: CheckoutProgressProps) {
  const steps = [
    {
      title: "Datos",
      icon: <UserOutlined />,
      description: "Completa tu información",
    },
    {
      title: "Pago",
      icon: <CreditCardOutlined />,
      description: "Selecciona método de pago",
    },
    {
      title: "Finalizado",
      icon: <CheckCircleOutlined />,
      description: "Confirmación de compra",
    },
  ];

  return (
    <div style={{ marginBottom: 32 }}>
      <Row gutter={[24, 24]}>
        <Col xs={24}>
          <Steps
            current={currentStep}
            items={steps.map((step) => ({
              title: step.title,
              description: step.description,
              icon: step.icon,
            }))}
            style={{
              padding: "24px",
              backgroundColor: "#fff",
              borderRadius: "8px",
            }}
          />
        </Col>
      </Row>
    </div>
  );
}
