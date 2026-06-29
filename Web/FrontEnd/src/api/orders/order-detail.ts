import axios from "../axios";

export interface PedidoDetalle {
  id_producto: number;
  producto: string;
  version?: string;
  cantidad: number;
  precio_unitario: number;
  imagen_url: string;
}

export interface PedidoResponse {
  ok: boolean;
  data: {
    fecha: string;
    estado: string;
    direccion_entrega: string;
    metodo_pago: string;
    total: number;
    subtotal: number;
    IVA: number;
    descuento: number;
    costo_envio: number;
    tipo_de_entrega: string;
    productos: PedidoDetalle[];
  };
  msg?: string;
}

export async function getPedidoDetalle(id_pedido: number,correo_cliente?: string): Promise<PedidoResponse | null> {
  try {
    const res = await axios.get<PedidoResponse>(
      `/api/pedido/detalle_pedido/${id_pedido}`,
      {
        params: { correo_cliente },
        withCredentials: true,
      }
    );

    if (res.status !== 200) return null;
    return res.data;
  } catch (error) {
    console.error("Error al traer detalle del pedido:", error);
    return null;
  }
}
