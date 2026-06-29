import React from "react";
import { Card, Tag } from "antd";
import {
  EnvironmentOutlined,
  CreditCardOutlined,
  EyeOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { type OrderData } from "../api/orders/my-orders";

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

interface OrderCardProps {
  order: OrderData;
  onClick: () => void;
}

export default function OrderCard({ order, onClick }: OrderCardProps): React.JSX.Element {
  const getStatusColor = (status: OrderData["estado"]): string => {
    switch (status) {
      case "en_proceso":
        return "blue"
      case "entregado":
        return "green";
      case "pendiente":
        return "orange";
      case "pago_pendiente":
        return "orange";
      case "cancelado":
        return "red";
      case "devolucion_pendiente":
        return "orange"
      case "devolucion_aplicada":
        return "orange"
      default:
        return "default";
    }
  };

  return (
    <Card
      onClick={onClick}
      hoverable
      className="rounded-2xl shadow-sm border-0 xs:w-64"
      styles={{ body: { padding: 20 } }}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-xs text-gray-400 mb-1">
            ID: #{order.id_pedido}
          </p>
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <CalendarOutlined />{formatFecha(order.fecha)}
          </p>
          <Tag
            color={getStatusColor(order.estado)}
            className="rounded-full px-3 py-1 text-xs mt-2 max-[450px]:block min-[450px]:hidden w-fit"
          >
            {order.estado.toUpperCase().replace("_"," ")}
          </Tag>
        </div>
        <Tag
          color={getStatusColor(order.estado)}
          className="rounded-full px-3 py-1 text-xs max-[450px]:hidden min-[450px]:inline-block"
        >
          {order.estado.toUpperCase().replace("_"," ")}
        </Tag>
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold mb-4">
        {order.id_pedido}
      </h3>

      {/* Destination */}
      <div className="flex items-start gap-2 mb-3 text-sm text-gray-600">
        <EnvironmentOutlined className="text-red-500 mt-1" />
        <div>
          <p className="text-xs text-gray-400 uppercase">Destino</p>
          <p className="font-medium text-gray-700">{order.municipio_entrega?.nombre ?? order.direccion}</p>
        </div>
      </div>

      {/* Payment */}
      <div className="flex items-start gap-2 mb-5 text-sm text-gray-600">
        <CreditCardOutlined className="text-blue-500 mt-1" />
        <div>
          <p className="text-xs text-gray-400 uppercase">Pago</p>
          <p className="font-medium text-gray-700">{order.tipo_de_pago.toUpperCase().replace("_"," ")}</p>
        </div>
      </div>

      <hr className="mb-4 border-gray-100" />

      {/* Total */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs text-gray-400 uppercase">Total</p>
          <p className="text-lg font-bold text-blue-600">
            L. {fmt(order.total, 2)}
          </p>
        </div>

        <div className="bg-gray-50 p-2 rounded-full">
          <EyeOutlined className="text-gray-400 text-lg" />
        </div>
      </div>
    </Card>
  );
}