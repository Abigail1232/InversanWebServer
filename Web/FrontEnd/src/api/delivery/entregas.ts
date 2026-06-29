import api from "../axios";

export interface PedidoEnCola {
  id: string;
  id_pedido: number;
  nombre: string;
  direccion: string;
  telefono?: string;
  tipoPago?: string;
  fecha_estimada_entrega?: string | null;
}

export interface PedidoActual {
  id: string;
  id_pedido: number;
  nombre: string;
  direccion: string;
  persona: string;
  telefono: string;
  tipoPago: string;
  fecha_estimada_entrega?: string | null;
}

export interface MisPedidosEntregasResponse {
  ok: boolean;
  pedido_actual: PedidoActual | null;
  pedidos_en_cola: PedidoEnCola[];
  total: number;
  page: number;
  pageSize: number;
  msg?: string;
}

export interface DetalleEntregaItem {
  inv: string;
  producto: string;
  marca: string;
  cantidad: number;
  subtotal: string;
  total: string;
  imagen?: string;
}
export type DetalleItem = DetalleEntregaItem;

export interface DetalleEntregaResponse {
  ok: boolean;
  codigo: string;
  persona: string;
  telefono: string;
  tipoPago: string;
  direccion: string;
  fecha_estimada_entrega?: string | null;
  subtotal: number;
  descuento: number;
  isv: number;
  costo_envio: number;
  total: number;
  tipoEntrega?: string;
  items: DetalleEntregaItem[];
  msg?: string;
}

export async function getMisPedidosEntregas(
  page = 1,
  pageSize = 8,
  excludeIds?: number[]
): Promise<MisPedidosEntregasResponse> {
  const params: Record<string, string | number> = { page, pageSize };
  if (excludeIds?.length) params.exclude_ids = excludeIds.join(",");
  const res = await api.get<MisPedidosEntregasResponse>("/api/pedido/entregas/mis_pedidos", {
    params,
    withCredentials: true,
  });
  return res.data;
}

export async function getDetalleEntrega(id_pedido: number): Promise<DetalleEntregaResponse | null> {
  try {
    const res = await api.get<DetalleEntregaResponse>(`/api/pedido/entregas/detalle/${id_pedido}`, {
      withCredentials: true,
    });
    return res.data;
  } catch {
    return null;
  }
}

export async function efectuarEntrega(id_pedido: number, comentarios?: string): Promise<boolean> {
  try {
    await api.patch(`/api/pedido/entregas/efectuar/${id_pedido}`, { comentarios: comentarios ?? "" }, { withCredentials: true });
    return true;
  } catch {
    return false;
  }
}

export async function rechazarPedido(id_pedido: number, motivo?: string): Promise<boolean> {
  try {
    await api.patch(`/api/pedido/entregas/rechazar/${id_pedido}`, { motivo: motivo ?? "" }, { withCredentials: true });
    return true;
  } catch {
    return false;
  }
}
