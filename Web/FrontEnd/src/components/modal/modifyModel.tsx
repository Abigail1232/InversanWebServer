import React, { useEffect, useState } from "react";
import { Modal, Form, Input, Button, Select, AutoComplete, message } from "antd";
import { motion, AnimatePresence } from "framer-motion";
import type { Model } from "../../api/admin/models";
import { getBrandNames } from "../../api/products/brands";

interface ModeloModalProps {
  open: boolean;
  onCancel: () => void;
  onSave: (values: Model) => Promise<any>;
  modeloEditar?: Model | null;
}

const ModeloModal: React.FC<ModeloModalProps> = ({
  open,
  onCancel,
  onSave,
  modeloEditar,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [brandOptions, setBrandOptions] = useState<string[]>([]);
  const [brandValue, setBrandValue] = useState<string>("");

  useEffect(() => {
    const loadBrandOptions = async () => {
      try {
        const names = await getBrandNames();
        const normalized = Array.from(
          new Set(names.map((name) => name?.trim()).filter(Boolean).map((name) => name as string))
        );
        setBrandOptions(normalized);
      } catch (error) {
        console.error("Error cargando marcas:", error);
      }
    };

    void loadBrandOptions();
  }, [open]);

  useEffect(() => {
    if (open) {
      if (modeloEditar) {
        form.setFieldsValue({
          name: modeloEditar.name,
          year: modeloEditar.year
            ? new Date(modeloEditar.year).getUTCFullYear()
            : undefined,
          brand: modeloEditar.brand,
          versions: modeloEditar.versions?.map(v => v.nombre) || [],
        });
        setBrandValue(modeloEditar.brand ?? "");
      } else {
        form.resetFields();
        setBrandValue("");
      }
    }
  }, [open, modeloEditar, form]);

  const normalizeBrand = (brand?: string) => {
    if (!brand) return "";
    const trimmed = brand.trim();
    const lower = trimmed.toLowerCase();
    const existing = brandOptions.find((name) => name.toLowerCase() === lower);

    return existing ?? trimmed;
  };

  const getBackendErrorMessage = (error: any) => {
    const backendMessage = error?.response?.data?.error ?? error?.message;
    if (!backendMessage) return null;

    if (
      error?.response?.status === 409 ||
      /duplicad/i.test(String(backendMessage)) ||
      /registro ya existe/i.test(String(backendMessage))
    ) {
      return "Ya existe un modelo con ese nombre y año.";
    }

    return String(backendMessage);
  };

  const handleOk = async () => {
    try {
      setLoading(true);

      const values = await form.validateFields();
      values.brand = normalizeBrand(values.brand);

      await onSave(values);
      form.resetFields();
    } catch (error: any) {
      if (Array.isArray(error?.errorFields) && error.errorFields.length > 0) {
        return;
      }

      const backendError = getBackendErrorMessage(error);
      if (backendError) {
        form.setFields([
          {
            name: "name",
            errors: [backendError],
          },
          {
            name: "year",
            errors: [backendError],
          },
        ]);
        message.error(backendError);
        return;
      }

      console.error("Error validando:", error);
      message.error("Ocurrió un error al guardar el modelo. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      centered
      width={480}
      closable={false}
      className="[&_.ant-modal-content]:!rounded-[18px] [&_.ant-modal-content]:!overflow-hidden [&_.ant-modal-content]:!p-0"
    >
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
        >
          {/* HEADER */}

          <div className="border-b border-[#E5E7EB] px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[20px] font-bold text-[#1F2937]">
                  {modeloEditar ? "Editar Modelo de Vehículo" : "Crear Modelo de Vehículo"}
                </h2>

                <p className="mt-1 text-sm text-[#6B7280]">
                  Completa los datos del modelo del vehículo.
                </p>
              </div>

              <button
                type="button"
                onClick={onCancel}
                className="text-[24px] leading-none text-[#6B7280]"
              >
                ×
              </button>
            </div>
          </div>

          {/* BODY */}

          <div className="px-5 py-4">
            <Form form={form} layout="vertical">
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#374151]">
                    Marca del vehículo
                  </label>

                  <Form.Item
                    name="brand"
                    noStyle
                    rules={[
                      {
                        required: true,
                        message: "Ingrese la marca del vehículo",
                      },
                    ]}
                  >
                    <AutoComplete
                      value={brandValue}
                      options={brandOptions.map((name) => ({ value: name }))}
                      onChange={(value) => {
                        setBrandValue(value);
                        form.setFieldValue("brand", value);
                      }}
                      placeholder="Ej. Toyota"
                      filterOption={(inputValue, option) => {
                        if (!option?.value) return false;
                        return option.value.toString().toLowerCase().includes(inputValue.toLowerCase());
                      }}
                      className="w-full"
                    >
                      <Input className="h-[42px] rounded-xl" />
                    </AutoComplete>
                  </Form.Item>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[#374151]">
                    Nombre del modelo de vehículo
                  </label>

                  <Form.Item
                    name="name"
                    noStyle
                    rules={[
                      {
                        required: true,
                        message: "Ingrese el nombre del modelo de vehículo",
                      },
                    ]}
                  >
                    <Input
                      placeholder="Ej. Corolla"
                      className="h-[42px] rounded-xl"
                    />
                  </Form.Item>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[#374151]">
                    Año
                  </label>

                  <Form.Item
                    name="year"
                    noStyle
                    rules={[
                      { required: true, message: "Ingrese el año" },
                      {
                        pattern: /^[0-9]+$/,
                        message: "Solo números",
                      },
                    ]}
                  >
                    <Input
                      type="number"
                      min={1900}
                      max={2200}
                      placeholder="Ej. 2024"
                      className="h-[42px] rounded-xl"
                    />
                  </Form.Item>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[#374151]">
                    Versiones (Opcional)
                  </label>

                  <Form.Item
                    name="versions"
                    noStyle
                  >
                    <Select
                      mode="tags"
                      placeholder="Escribe la versión y presiona Enter (Ej: SRV, SR5)"
                      className="w-full rounded-xl custom-multi-select"
                      style={{ minHeight: '42px' }}
                      tokenSeparators={[',']}
                    />
                  </Form.Item>
                </div>
              </div>
            </Form>
          </div>

          {/* FOOTER */}

          <div className="flex flex-col-reverse gap-2 border-t border-[#E5E7EB] px-5 py-3 sm:flex-row sm:justify-end sm:gap-3">
            <Button
              className="h-[42px] w-full border border-gray-400 px-6 sm:w-auto"
              onClick={onCancel}
              disabled={loading}
            >
              Cancelar
            </Button>

            <Button
              className="h-[42px] rounded-xl border-0 px-5 text-sm font-bold !text-white !bg-[#027eb1] shadow-md transition-all hover:!bg-[#026a96]"
              onClick={handleOk}
              loading={loading}
            >
              {modeloEditar ? "Guardar cambios" : "Crear modelo de vehículo"}
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>
    </Modal>
  );
};

export default ModeloModal;
