import { useEffect, useState } from "react";
import { Modal, Tag, Typography, Space, Empty, Button, Spin } from "antd";
import { motion, AnimatePresence } from "framer-motion";
import { X, Hash, ShoppingBag, MessageSquare } from "lucide-react";
import dayjs from "dayjs";
import type { IngresoProducto } from "../../pages/inventory/history";
import { getEntryDetail } from "../../api/admin/entries";

const { Title, Text } = Typography;


interface EntryDetail {
  id_entry: number;
  date: string;
  supplier: string;
  store: string;
  user: string;
  productos_count: number;
  unidades_count: number;
  comments: string;
  detalles: {
    id_producto: number;
    nombre: string;
    foto: string | null;
    unidades: number;
    accion: "incremento" | "decremento";
    total: number | string;
  }[];
}

interface Props {
  entry: IngresoProducto | null;
  isOpen: boolean;
  onClose: () => void;
}

const DetailModal = ({ entry, isOpen, onClose }: Props) => {
  const [detail, setDetail] = useState<EntryDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!entry?.id_entry || !isOpen) return;

    const fetchDetail = async () => {
      try {
        setLoading(true);

        const data = await getEntryDetail(Number(entry.id_entry));

        setDetail(data);
      } catch (error) {
        console.error("Error cargando detalle", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [entry, isOpen]);

  if (!entry) return null;

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      closable={false}
      width={700}
      centered
      styles={{
        body: {
          padding: 0,
          overflow: "hidden",
          borderRadius: 20,
        },
        mask: {
          backdropFilter: "blur(4px)",
          backgroundColor: "rgba(0, 29, 61, 0.4)",
        },
      }}
      className="entry-detail-modal"
    >
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.3 }}
          className="w-full overflow-hidden"
        >
          <div className="bg-[#0B4E87] px-5 py-6 sm:p-8 text-white">
            <div className="flex justify-between items-start gap-4">
              <Space direction="vertical" size={0} className="min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Tag
                    color={detail?.detalles.some(d => d.accion === 'decremento') ? "volcano" : "blue"}
                    className={`${detail?.detalles.some(d => d.accion === 'decremento') ? 'bg-red-400/30' : 'bg-blue-400/30'} border-none text-white font-bold !m-0`}
                  >
                    {detail?.detalles.some(d => d.accion === 'decremento') ? 'MOVIMIENTO' : 'INGRESO'}
                  </Tag>

                  <Text className="!text-blue-100 font-mono text-xs opacity-80">
                    ID: {detail?.id_entry ?? entry.id_entry}
                  </Text>
                </div>

                <Title
                  level={3}
                  className="!text-white !m-0 !font-black !text-[24px] sm:!text-[28px] !leading-tight"
                >
                  Detalle del Inventario
                </Title>

                <Text className="!text-blue-200 text-xs">
                  {dayjs(detail?.date ?? entry.date).format("YYYY-MM-DD")}
                </Text>
              </Space>

              <button
                type="button"
                onClick={onClose}
                className="shrink-0 bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-all border border-white/20"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="px-4 py-5 sm:p-8 bg-white">
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <Spin size="large" />
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center gap-3 mb-5 sm:mb-6">
                  <Title
                    level={5}
                    className="!m-0 flex items-center gap-2 !text-sm sm:!text-base"
                  >
                    <ShoppingBag size={18} className="text-[#0B4E87] shrink-0" />
                    <span>Productos en este ingreso</span>
                  </Title>

                  <Tag className="rounded-full px-3 font-bold border-none bg-cyan-50 !m-0">
                    {detail?.detalles?.length ?? 0}
                  </Tag>
                </div>

                <div className="space-y-4 max-h-[55vh] sm:max-h-[400px] overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
                  {detail?.detalles && detail.detalles.length > 0 ? (
                    detail.detalles.map((item) => {
                      const total = Number(item.total);
                      const imageSrc = item.foto
                        ? `${import.meta.env.VITE_API_URL}/public/${item.foto}`
                        : "/no-image.png";

                      return (
                        <motion.div
                          key={item.id_producto}
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          className="group rounded-2xl border border-gray-100 bg-[#f8fafc] hover:bg-white hover:shadow-xl hover:border-blue-100 transition-all overflow-hidden"
                        >
                          <div className="p-4">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                              <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
                                <div className="relative shrink-0">
                                  <img
                                    src={imageSrc}
                                    alt={item.nombre}
                                    className="w-16 h-16 sm:w-16 sm:h-16 rounded-xl object-cover bg-white shadow-sm border border-gray-200"
                                    onError={(event) => {
                                      event.currentTarget.src = "/no-image.png";
                                    }}
                                  />

                                  <div className={`absolute -top-2 -right-2 text-white text-[10px] font-black min-w-6 h-6 px-1 flex items-center justify-center rounded-lg ${
                                    item.accion === 'decremento' ? 'bg-[#EF4444]' : 'bg-[#0B4E87]'
                                  }`}>
                                    {item.accion === 'decremento' ? '-' : ''}{item.unidades.toLocaleString()}
                                  </div>
                                </div>

                                <div className="min-w-0 flex-1">
                                  <Text className="block font-bold text-[#001d3d] text-sm sm:text-base leading-snug uppercase whitespace-normal break-words">
                                    {item.nombre}
                                  </Text>

                                  <Space size={4} className="mt-2">
                                    <Hash size={12} className="text-gray-400" />

                                    <Text className="text-xs text-gray-400 font-mono">
                                      {item.id_producto}
                                    </Text>
                                  </Space>
                                </div>
                              </div>

                              <div className="w-full sm:w-auto sm:min-w-[120px] sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0">
                                <div className="flex items-end justify-between gap-3 sm:block">
                                  <div>
                                    <Text className="block text-[10px] text-gray-400 font-black uppercase">
                                      Costo
                                    </Text>

                                    <Text
                                      className="text-lg font-bold"
                                      style={{ color: "#027EB1" }}
                                    >
                                      L. {Number.isFinite(total) ? total.toLocaleString("en-US") : "0"}
                                    </Text>
                                  </div>

                                  <Text className="block text-xs text-gray-400">
                                    {item.unidades.toLocaleString()} unidades
                                  </Text>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  ) : (
                    <Empty description="No hay productos en este ingreso" />
                  )}
                </div>

                {detail?.comments && detail.comments.trim() !== "" && (
                  <div className="mt-6 p-4 sm:p-5 bg-[#f8fafc] rounded-2xl border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare size={16} className="text-[#0B4E87]" />

                      <Text className="text-xs font-black uppercase text-gray-500">
                        Comentarios
                      </Text>
                    </div>

                    <Text className="text-sm text-gray-700 whitespace-normal break-words">
                      {detail.comments}
                    </Text>
                  </div>
                )}

                <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                    <div className="grid grid-cols-2 gap-4 sm:flex sm:gap-10">
                      <Space direction="vertical" size={0}>
                        <Text className="text-[10px] text-gray-400 font-black uppercase">
                          Tot. Productos
                        </Text>

                        <Text className="text-2xl font-black text-[#001d3d]">
                          {(detail?.productos_count ?? entry.productos_count).toLocaleString()}
                        </Text>
                      </Space>

                      <Space direction="vertical" size={0}>
                        <Text className="text-[10px] text-gray-400 font-black uppercase">
                          Tot. Unidades
                        </Text>

                        <Text className="text-2xl font-black text-[#0B4E87]">
                          {(detail?.unidades_count ?? entry.unidades_count).toLocaleString()}
                        </Text>
                      </Space>
                    </div>

                    <Button
                      type="primary"
                      size="large"
                      onClick={onClose}
                      className="!bg-[#0B4E87] hover:!bg-[#003566] !rounded-xl font-bold px-8 w-full sm:w-auto"
                    >
                      Cerrar
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      <style>{`
        .entry-detail-modal .ant-modal-content {
          padding: 0 !important;
          overflow: hidden !important;
          border-radius: 20px !important;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }

        @media (max-width: 480px) {
          .entry-detail-modal {
            width: calc(100vw - 24px) !important;
            max-width: calc(100vw - 24px) !important;
            margin: 0 auto !important;
          }

          .entry-detail-modal .ant-modal {
            max-width: calc(100vw - 24px) !important;
          }

          .entry-detail-modal .ant-modal-content {
            max-height: calc(100vh - 24px);
          }

          .entry-detail-modal .ant-typography {
            word-break: normal;
            overflow-wrap: anywhere;
          }
        }
      `}</style>
    </Modal>
  );
};

export default DetailModal;