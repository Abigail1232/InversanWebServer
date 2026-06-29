import api from "../axios";

export interface CancelOrderResponse {
  ok: boolean;
  msg: string;
  pedido?: any;
}

export const cancelOrderAdmin = async (
  id_pedido: number | string,
  motivo?: string
): Promise<CancelOrderResponse> => {
  const res = await api.patch(`/api/pedido/rechazar_pedido/${id_pedido}`, {
    estado: "cancelado",
    motivo
  });

  return res.data;
};