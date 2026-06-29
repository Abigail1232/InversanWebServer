import api from "../axios";

export type DeliveryStatus =
  | "entregado"
  | "en_proceso"
  | "pendiente"
  | "cancelado";

export interface DeliveryClientInfo {
  nombre: string | null;
  telefono: string | null;
  correo: string | null;
}

export interface DeliveryRepartidorInfo {
  id_usuario: number;
  primer_nombre: string;
  primer_apellido: string;
}

export interface DeliveryResumen {
  descuento: number;
  subtotal: number;
  iva: number;
  total: number;
}

export interface DeliveryItem {
  id_producto: number;
  nombre_producto: string;
  cantidad: number;
  subtotal: number;
  total_con_isv: number;
  imagen?: string | null;
}

export interface DeliveryRecord {
  id_pedido: number;
  estado: DeliveryStatus | string;
  tipo_de_pago?: string;
  fecha: string;
  fecha_entrega: string | null;
  cliente: DeliveryClientInfo;
  repartidor?: DeliveryRepartidorInfo | null;
  resumen: DeliveryResumen;
  id_sucursal?: number;
}

export interface DeliveryDetail {
  id_pedido: number;
  estado: string;
  tipo_de_pago?: string;
  direccion?: string;
  fecha: string;
  fecha_entrega: string | null;
  comentario_repartidor?: string | null;
  cliente: DeliveryClientInfo;
  repartidor?: DeliveryRepartidorInfo | null;
  items: DeliveryItem[];
  resumen: DeliveryResumen;
  id_sucursal?: number;
}

interface DeliveryHistoryBackendItem {
  id_pedido: number;
  estado: string;
  tipo_de_pago?: string;
  direccion?: string;
  fecha: string;
  fecha_entrega?: string | null;
  cliente: DeliveryClientInfo;
  repartidor?: DeliveryRepartidorInfo | null;
  detalle: DeliveryItem[];
  observacionAsignacion?: string;
  resumen: DeliveryResumen;
  id_sucursal?: number;
}

interface DeliveryHistoryResponse {
  ok: boolean;
  data: DeliveryHistoryBackendItem[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalRows: number;
  msg?: string;
}

export interface DeliveryHistoryFilters {
  page?: number;
  limit?: number;
  fecha?: string;
  fecha_entrega?: string;
  estado?: string;
  tipo_pago?: string;
  buscar?: string;
  id_repartidor?: number | null;
  id_sucursal?: string;
}

const DEFAULT_LIMIT = 6;
const HISTORY_URL = "/api/pedido/entregas/historial/filtrado";

export async function getDeliveryHistory(
  filters: DeliveryHistoryFilters = {},
): Promise<{
  rows: DeliveryRecord[];
  totalPages: number;
  totalRows: number;
  page: number;
  pageSize: number;
}> {
  const {
    page = 1,
    limit = DEFAULT_LIMIT,
    fecha,
    estado,
    tipo_pago,
    buscar,
    id_repartidor,
  } = filters;

  const params: Record<string, string | number> = { page, limit };
  if (fecha && fecha !== "Todos") {
    params.fecha = fecha;
  }
  if (filters.fecha_entrega && filters.fecha_entrega !== "Todos") {
    params.fecha_entrega = filters.fecha_entrega;
  }
  if (estado) params.estado = estado;
  if (tipo_pago) params.tipo_pago = tipo_pago;
  if (buscar) params.buscar = buscar;
  if (id_repartidor != null) params.id_repartidor = id_repartidor;
  // id_sucursal filtering is handled on the frontend side

  const res = await api.get<DeliveryHistoryResponse>(HISTORY_URL, {
    params,
    withCredentials: true,
  });

  const payload = res.data;
  const rows: DeliveryRecord[] = (payload.data ?? []).map((item) => ({
    id_pedido: item.id_pedido,
    estado: item.estado,
    tipo_de_pago: item.tipo_de_pago,
    fecha: item.fecha,
    fecha_entrega: item.fecha_entrega ?? null,
    cliente: item.cliente,
    repartidor: item.repartidor,
    resumen: item.resumen,
    id_sucursal: item.id_sucursal,
  }));

  return {
    rows,
    totalPages: payload.totalPages ?? 1,
    totalRows: payload.totalRows ?? rows.length,
    page: payload.page ?? page,
    pageSize: payload.pageSize ?? limit,
  };
}

export async function getDeliveryDetail(
  id_pedido: number,
): Promise<DeliveryDetail | null> {
  try {
    const res = await api.get<DeliveryHistoryResponse>(HISTORY_URL, {
      params: { page: 1, limit: 1, id_pedido },
      withCredentials: true,
    });
    const item = res.data.data?.[0];
    if (!item) return null;
    return {
      id_pedido: item.id_pedido,
      estado: item.estado,
      tipo_de_pago: item.tipo_de_pago,
      direccion: item.direccion,
      fecha: item.fecha,
      fecha_entrega: item.fecha_entrega || null,
      comentario_repartidor: item.observacionAsignacion,
      cliente: item.cliente,
      repartidor: item.repartidor,
      items: item.detalle,
      resumen: item.resumen,
      id_sucursal: item.id_sucursal,
    };
  } catch {
    return null;
  }
}
