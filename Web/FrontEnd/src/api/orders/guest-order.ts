import api from "../axios";

export interface GuestOrderProduct {
  id_producto: number;
  nombre: string;
  marca: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  total: number;
  imagen: string | null;
}

export interface GuestOrderSummary {
  subtotal: number;
  descuento: number;
  iva: number;
  costo_envio: number;
  total: number;
}

export interface GuestOrder {
  numero_pedido: string;
  fecha: string | Date;
  fecha_entrega?: string | Date | null;
  estado: string;
  tipo_de_entrega: string;
  tipo_de_pago: string;
  direccion: string;
  municipio_entrega: string;
  sucursal: string;
  cliente: {
    nombre_completo: string;
    correo: string;
    telefono: string;
    tiene_cuenta: boolean; // Indica si tiene cuenta registrada
  };
  productos: GuestOrderProduct[];
  resumen_factura: GuestOrderSummary;
}

export interface GuestOrderResponse {
  ok: boolean;
  data: GuestOrder;
  msg?: string;
}

export async function getGuestOrder(numeroPedido: string): Promise<GuestOrderResponse> {
  try {
    const { data } = await api.get(`/api/pedido/publico/${numeroPedido}`);
    
    if (!data.ok) {
      throw new Error(data.msg || `Error al obtener pedido`);
    }

    return data;
  } catch (error) {
    console.error('Error fetching guest order:', error);
    throw error;
  }
}

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-HN', {
    style: 'currency',
    currency: 'HNL',
    minimumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat('es-HN', {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
};

export const getEstadoColor = (estado: string): string => {
  switch (estado.toLowerCase()) {
    case 'pendiente':
      return '#6c757d';
    case 'en_proceso':
      return '#ffc107';
    case 'entregado':
      return '#28a745';
    case 'cancelado':
      return '#dc3545';
    default:
      return '#6c757d';
  }
};

export const getEstadoLabel = (estado: string): string => {
  switch (estado.toLowerCase()) {
    case 'pendiente':
      return 'PENDIENTE';
    case 'en_proceso':
      return 'EN PROCESO';
    case 'entregado':
      return 'ENTREGADO';
    case 'cancelado':
      return 'CANCELADO';
    default:
      return estado.toUpperCase();
  }
};
