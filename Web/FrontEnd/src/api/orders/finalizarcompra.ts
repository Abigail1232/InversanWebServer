
import api from "../axios";

export type TipoCliente = "registrado" | "invitado";

export type ProductoCompra = {
  id_producto: number;
  cantidad: number;
};

export type FinalizarCompraPayload = {
  id_sucursal: number;
  id_municipio_entrega: number;
  direccion: string;
  tipo_de_entrega: string;
  tipo_de_pago: string;
  descuento?: number;
  costo_envio?: number;
  productos: ProductoCompra[];

  // Pedido_Usuario
  tipo_cliente: TipoCliente;
  id_usuario?: number | null;

  // Invitado (requeridos si tipo_cliente="invitado")
  nombre_completo?: string;
  telefono_cliente?: string;
  correo_cliente?: string;
};

export type FinalizarCompraResponse = {
  ok: boolean;
  msg: string;
  data: {
    pedido: {
      id_pedido: number;
      numero_pedido: string;
      total: number;
      estado: string;
    };
    pedido_usuario: any;
    detalle: any;
    stock: any;
    notificacion: any;
  };
};

export async function finalizarCompra(payload: FinalizarCompraPayload) {
  const res = await api.post<FinalizarCompraResponse>(
    "/api/pedido/realizar_compra",
    payload
  );
  return res.data;
}