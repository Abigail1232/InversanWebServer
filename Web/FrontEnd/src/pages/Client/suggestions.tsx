import { useState } from "react";
import { motion as Motion } from "framer-motion";
import { Form, Input, Select, Button, Card, Typography, Result, ConfigProvider, Space, message } from "antd";
import { SendOutlined, InfoCircleOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { createSuggestion } from "../../api/suggestions/suggestion";
import { usePreventDuplicate } from "../../hooks/usePreventDuplicateRequest"; 

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export default function SuggestionsPage() {
  const [form] = Form.useForm();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const performSubmit = async (values: any) => {
    await createSuggestion({
      titulo: values.title,
      tipo: values.category,
      descripcion: values.message,
    });

    messageApi.success({
      content: "¡Gracias! Tu sugerencia ha sido enviada con éxito.",
      duration: 3,
    });

    setIsSubmitted(true);
  };

  const { execute: onFinish, isLoading: submitting } = usePreventDuplicate(performSubmit);

  const handleReset = () => {
    setIsSubmitted(false);
    form.resetFields();
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#027eb1",
          borderRadius: 10,
          fontFamily: "'Arimo', sans-serif",
        },
        components: {
          Button: { controlHeight: 48, fontWeight: 700 },
          Input: { controlHeight: 46, colorBgContainer: "#f3f4f6" },
          Select: { controlHeight: 46, colorBgContainer: "#f3f4f6" },
        },
      }}
    >
      {contextHolder}
      <div className="min-h-screen bg-[#f3f4f6]">
        <div className="max-w-[1108px] mx-auto px-4 md:px-8 pt-6 pb-8 md:pt-12">
          <div className="mb-6 md:mb-8">
            <Title level={2} style={{ marginBottom: 4, fontWeight: 700 }} className="!text-xl md:!text-2xl">
              Buzón de Sugerencias
            </Title>
            <Text type="secondary" className="text-sm md:text-base">
              Tu opinión nos ayuda a mejorar. Comparte tus sugerencias aquí.
            </Text>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            <Motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 order-1">
              <Card className="shadow-sm border-[#e5e7eb] [&_.ant-card-body]:p-4 md:[&_.ant-card-body]:p-6">
                {!isSubmitted ? (
                  <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    requiredMark={false}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-x-6">
                      <Form.Item
                        label={<span className="text-[12px] font-bold text-[#9ca3af] uppercase tracking-[0.5px]">Título de sugerencia</span>}
                        name="title"
                        rules={[{ required: true, message: "Por favor completa este campo" }]}
                      >
                        <Input placeholder="Ej. Mejora en tiempos de entrega" />
                      </Form.Item>

                      <Form.Item
                        label={<span className="text-[12px] font-bold text-[#9ca3af] uppercase tracking-[0.5px]">Categoría</span>}
                        name="category"
                        initialValue="recomendacion"
                      >
                        <Select>
                          <Select.Option value="recomendacion">Recomendación</Select.Option>
                          <Select.Option value="queja">Quejas</Select.Option>
                        </Select>
                      </Form.Item>
                    </div>

                    <Form.Item
                      label={<span className="text-[12px] font-bold text-[#9ca3af] uppercase tracking-[0.5px]">Tu Mensaje</span>}
                      name="message"
                      rules={[{ required: true, message: "El mensaje es obligatorio" }]}
                    >
                      <TextArea
                        rows={5}
                        placeholder="Escribe tu sugerencia o comentario aquí..."
                        className="resize-none min-h-[120px] md:min-h-0"
                      />
                    </Form.Item>

                    <Form.Item className="mb-0">
                      <Button
                        type="primary"
                        htmlType="submit"
                        icon={<SendOutlined />}
                        loading={submitting}
                        className="w-full h-12 md:h-12 px-8 bg-[#027eb1] border-none shadow-md"
                      >
                        Enviar Sugerencia
                      </Button>
                    </Form.Item>
                  </Form>
                ) : (
                  <Result
                    status="success"
                    title="¡Sugerencia entregada!"
                    subTitle="Tu mensaje ha sido recibido con éxito por nuestro equipo."
                    extra={[
                      <Button type="link" key="again" onClick={handleReset} className="font-bold">
                        Enviar otra sugerencia
                      </Button>,
                    ]}
                  />
                )}
              </Card>
            </Motion.div>

            {/* Info cards intactas */}
            <div className="space-y-4 md:space-y-6 order-2">
              <Motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                <Card className="border-[#e5e7eb] shadow-sm [&_.ant-card-body]:p-4 md:[&_.ant-card-body]:p-6">
                  <Space align="start" size={12} className="w-full">
                    <InfoCircleOutlined className="text-[#003e7b] text-xl mt-1" />
                    <div>
                      <Title level={5} style={{ color: "#003e7b", marginTop: 0 }}>Información</Title>
                      <Paragraph className="text-[#4a4a4a] text-[13px] md:text-[14px] m-0">
                        Tus sugerencias son enviadas directamente a nuestro equipo de calidad para ser revisadas.
                      </Paragraph>
                    </div>
                  </Space>
                </Card>
              </Motion.div>

              <Motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                <Card className="border-[#bedbff] bg-[#eff6ff] shadow-sm [&_.ant-card-body]:p-4 md:[&_.ant-card-body]:p-6">
                  <Space align="start" size={12} className="w-full">
                    <CheckCircleOutlined className="text-[#155dfc] text-xl mt-1" />
                    <div>
                      <Title level={5} style={{ color: "#155dfc", marginTop: 0 }}>Compromiso</Title>
                      <Paragraph className="text-[#4a4a4a] text-[13px] md:text-[14px] m-0">
                        Nos comprometemos a mejorar continuamente basados en la retroalimentación de nuestros clientes.
                      </Paragraph>
                    </div>
                  </Space>
                </Card>
              </Motion.div>
            </div>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
}