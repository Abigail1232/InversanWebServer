import { useState, useMemo, useEffect } from "react";
import { Modal, Typography, Pagination } from "antd";
import { X } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../ui/table";
import { Badge } from "../ui/badge";
import { cn } from "../ui/utils";
import type { DeliveryDetail } from "../../api/deliveries/delivery-history";

const { Text, Title } = Typography;

const PAGE_SIZE = 5;

function formatMonto(monto: any): string {
  // Convertir a número si no lo es
  const numero = Number(monto);
  
  // Verificar si es un número válido
  if (isNaN(numero) || !isFinite(numero)) {
    return "L. 0.00";
  }
  
  // Formatear con comas como separador de miles y 2 decimales
  const [enteros, decimales] = numero.toFixed(2).split('.');
  const enterosConComas = enteros.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `L. ${enterosConComas}.${decimales}`;
}

export interface DeliveryDetailModalProps {
  delivery: DeliveryDetail | null;
  isOpen: boolean;
  onClose: () => void;
}

type DetailItem = DeliveryDetail["items"][number];

export default function DeliveryDetailModal({
  delivery,
  isOpen,
  onClose,
}: DeliveryDetailModalProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Detectar tamaño de pantalla
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const paginatedItems = useMemo(() => {
    if (!delivery?.items?.length) return [];
    const start = (currentPage - 1) * PAGE_SIZE;
    return delivery.items.slice(start, start + PAGE_SIZE);
  }, [delivery?.items, currentPage]);

  const totalPages = Math.ceil((delivery?.items?.length ?? 0) / PAGE_SIZE) || 1;

  if (!delivery) {
    return (
      <Modal
        open={isOpen}
        onCancel={onClose}
        footer={null}
        width={720}
        centered
        styles={{ body: { padding: "24px", textAlign: "center" } }}
      >
        <div className="py-8 text-gray-500">Cargando detalles...</div>
      </Modal>
    );
  }

  // Vista móvil con cartas (siguiendo el estilo de deliveryHistory)
  if (isMobile) {
    return (
      <Modal
        open={isOpen}
        onCancel={onClose}
        footer={null}
        closeIcon={<X size={20} />}
        width="95%"
        centered
        style={{ borderRadius: 12, overflow: "hidden" }}
        styles={{ body: { padding: 0, maxHeight: '80vh', overflowY: 'auto' } }}
      >
        <div className="px-4 pt-4 pb-2">
          <Title level={4} style={{ margin: 0, marginBottom: 4 }}>
            Detalles de Entrega
          </Title>
          <Text type="secondary" className="block text-sm">
            Entrega #{delivery.id_pedido}
          </Text>
        </div>

        {/* Client Info Mobile */}
        <div className="px-4 pb-4">
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-sm shadow-sm">
            <div className="grid grid-cols-1 gap-2">
              <div>
                <Text type="secondary" className="block text-xs uppercase tracking-wide">Cliente</Text>
                <Text strong>{delivery.cliente.nombre || "—"}</Text>
              </div>
              <div>
                <Text type="secondary" className="block text-xs uppercase tracking-wide">Teléfono / Correo</Text>
                <Text>{delivery.cliente.telefono || "—"} / {delivery.cliente.correo || "—"}</Text>
              </div>
              <div>
                <Text type="secondary" className="block text-xs uppercase tracking-wide">Dirección</Text>
                <Text>{delivery.direccion || "—"}</Text>
              </div>
              <div>
                <Text type="secondary" className="block text-xs uppercase tracking-wide">Tipo de pago</Text>
                <Text className="capitalize">{delivery.tipo_de_pago?.replace(/_/g, " ") || "—"}</Text>
              </div>
              {delivery.comentario_repartidor && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <Text type="secondary" className="block text-xs uppercase tracking-wide">Comentarios del repartidor</Text>
                  <Text italic className="text-gray-700">{delivery.comentario_repartidor}</Text>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Items en formato de cartas (estilo deliveryHistory) */}
        <div className="px-4 pb-4 space-y-3">
          {paginatedItems.map((item: DetailItem, idx: number) => (
            <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 flex gap-3">
              <div className="flex-shrink-0">
                {item.imagen ? (
                  <img
                    src={`${import.meta.env.VITE_API_URL}/public/${item.imagen}`}
                    alt={item.nombre_producto}
                    className="w-14 h-14 rounded-lg object-cover bg-gray-100"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-gray-200 flex items-center justify-center text-gray-400 text-xs">—</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                      <div className="text-sm font-bold text-slate-800 break-words">
                      {item.nombre_producto}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Producto #{item.id_producto}
                    </div>
                </div>
                <Badge
                  className={cn(
                    "rounded-full font-semibold text-[11px] px-3 py-0.5",
                    "bg-blue-100 text-blue-800 border-0"
                  )}
                >
                  {item.cantidad} unid.
                </Badge>
              </div>

              <div className="mt-3 space-y-1 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="text-right text-slate-700">
                    {formatMonto(item.subtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500">Total (+ISV)</span>
                  <span className="text-right text-slate-700 font-medium">
                    {formatMonto(item.total_con_isv)}
                  </span>
                </div>
              </div>
              </div>
            </div>
          ))}
        </div>

        {/* Resumen (estilo consistente) */}
        <div className="px-4 pb-4">
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
            {/* Subtítulo del resumen */}
            <div className="mb-4 pb-2 border-b border-gray-300">
              <Text strong className="text-sm text-gray-700 uppercase tracking-wide">
                Resumen de Entrega
              </Text>
            </div>
            
            {/* Valores alineados */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Text className="text-sm text-gray-600">Subtotal:</Text>
                <Text className="text-sm font-medium text-gray-800">
                  {formatMonto(Number(delivery.resumen.subtotal) + Number(delivery.resumen.descuento || 0))}
                </Text>
              </div>
              {Number(delivery.resumen.descuento) > 0 && (
                <div className="flex justify-between items-center">
                  <Text className="text-sm text-red-500">Descuento:</Text>
                  <Text className="text-sm font-medium text-red-500">
                    - {formatMonto(delivery.resumen.descuento)}
                  </Text>
                </div>
              )}
              <div className="flex justify-between items-center">
                <Text className="text-sm text-gray-600">ISV (15%):</Text>
                <Text className="text-sm font-medium text-gray-800">
                  {formatMonto(delivery.resumen.iva)}
                </Text>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                <Text strong className="text-sm text-gray-700">Total:</Text>
                <Text strong className="text-sm text-[#027EB1]">
                  {formatMonto(delivery.resumen.total)}
                </Text>
              </div>
            </div>
          </div>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="px-4 pb-4">
            <Pagination
              current={currentPage}
              total={delivery.items.length}
              pageSize={PAGE_SIZE}
              onChange={setCurrentPage}
              showSizeChanger={false}
              showPrevNextJumpers
              prevIcon={<span>Anterior</span>}
              nextIcon={<span>Siguiente</span>}
              simple
            />
          </div>
        )}
      </Modal>
    );
  }

  // Vista desktop con tabla (siguiendo el estilo de deliveryHistory)
  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      closeIcon={<X size={20} />}
      width={900}
      centered
      style={{ borderRadius: 12, overflow: "hidden" }}
      styles={{ body: { padding: 0 } }}
    >
        <div className="px-6 pt-6 pb-2">
        <Title level={4} style={{ margin: 0, marginBottom: 4 }}>
          Detalles de Entrega
        </Title>
        <Text type="secondary" className="block">
          Entrega #{delivery.id_pedido}
        </Text>
      </div>

      {/* Contenido principal */}
      <div className="px-6 pb-6 w-full">
        {/* Info del Cliente y Pedido */}
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 mb-4">
          <div className="flex flex-wrap gap-x-8 gap-y-4">
            <div className="flex-1 min-w-[200px]">
              <Text type="secondary" className="block text-xs uppercase tracking-wide">Cliente</Text>
              <Text strong className="text-sm">{delivery.cliente.nombre || "—"}</Text>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Text type="secondary" className="block text-xs uppercase tracking-wide">Teléfono / Correo</Text>
              <Text className="text-sm">{delivery.cliente.telefono || "—"} / {delivery.cliente.correo || "—"}</Text>
            </div>
            <div className="w-full">
              <Text type="secondary" className="block text-xs uppercase tracking-wide">Dirección</Text>
              <Text className="text-sm">{delivery.direccion || "—"}</Text>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Text type="secondary" className="block text-xs uppercase tracking-wide">Tipo de pago</Text>
              <Text className="text-sm capitalize">{delivery.tipo_de_pago?.replace(/_/g, " ") || "—"}</Text>
            </div>
            {delivery.comentario_repartidor && (
              <div className="w-full pt-3 mt-1 border-t border-gray-200">
                <Text type="secondary" className="block text-xs uppercase tracking-wide">Comentarios del repartidor</Text>
                <Text italic className="text-sm text-gray-700">{delivery.comentario_repartidor}</Text>
              </div>
            )}
          </div>
        </div>

        {/* Tabla (estilo deliveryHistory) */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-4">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#003E7B] hover:bg-[#003E7B] border-0">
                <TableHead className="text-white font-semibold h-11 px-4 w-16">IMG</TableHead>
                <TableHead className="text-white font-semibold h-11 px-4">ID PRODUCTO</TableHead>
                <TableHead className="text-white font-semibold h-11 px-4">PRODUCTO</TableHead>
                <TableHead className="text-white font-semibold h-11 px-4">CANTIDAD</TableHead>
                <TableHead className="text-white font-semibold h-11 px-4">SUBTOTAL</TableHead>
                <TableHead className="text-white font-semibold h-11 px-4">TOTAL (+ISV)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.map((item: DetailItem, idx: number) => (
                <TableRow key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                  <TableCell className="px-4 py-3">
                    {item.imagen ? (
                      <img
                        src={`${import.meta.env.VITE_API_URL}/public/${item.imagen}`}
                        alt={item.nombre_producto}
                        className="w-10 h-10 rounded-lg object-cover bg-gray-100"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center text-gray-400 text-xs">—</div>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-700 font-medium">
                    #{item.id_producto}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-700">
                    {item.nombre_producto}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge
                      className={cn(
                        "rounded-full font-semibold text-[11px] px-3 py-0.5",
                        "bg-blue-100 text-blue-800 border-0"
                      )}
                    >
                      {item.cantidad}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-700">
                    {formatMonto(item.subtotal)}
                  </TableCell>
                  <TableCell className="px-4 py-3 font-medium text-gray-800">
                    {formatMonto(item.total_con_isv)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Resumen (estilo tabla organizada) */}
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
          {/* Subtítulo del resumen */}
          <div className="mb-4 pb-2 border-b border-gray-300">
            <Text strong className="text-sm text-gray-700 uppercase tracking-wide">
              Resumen de Entrega
            </Text>
          </div>
          
          {/* Tabla de resumen */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="px-4 py-3 text-sm text-gray-600 font-medium">Subtotal:</td>
                  <td className="px-4 py-3 text-sm text-gray-800 text-right font-medium">
                    {formatMonto(Number(delivery.resumen.subtotal) + Number(delivery.resumen.descuento || 0))}
                  </td>
                </tr>
                {Number(delivery.resumen.descuento) > 0 && (
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-3 text-sm text-red-500 font-medium">Descuento:</td>
                    <td className="px-4 py-3 text-sm text-red-500 text-right font-medium">
                      - {formatMonto(delivery.resumen.descuento)}
                    </td>
                  </tr>
                )}
                <tr className="border-b border-gray-100">
                  <td className="px-4 py-3 text-sm text-gray-600 font-medium">ISV (15%):</td>
                  <td className="px-4 py-3 text-sm text-gray-800 text-right font-medium">
                    {formatMonto(delivery.resumen.iva)}
                  </td>
                </tr>
                <tr className="bg-[#003E7B]">
                  <td className="px-4 py-3 text-sm text-white font-semibold">Total:</td>
                  <td className="px-4 py-3 text-sm text-white text-right font-bold">
                    {formatMonto(delivery.resumen.total)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-4 pt-3 border-t border-gray-200">
              <Pagination
                current={currentPage}
                total={delivery.items.length}
                pageSize={PAGE_SIZE}
                onChange={setCurrentPage}
                showSizeChanger={false}
                showPrevNextJumpers
                prevIcon={<span>Anterior</span>}
                nextIcon={<span>Siguiente</span>}
              />
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
