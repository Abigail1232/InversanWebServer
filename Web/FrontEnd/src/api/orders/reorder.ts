import api from "../axios";

export interface ReorderItem {
  id_producto: number;
  img: string;
  name: string;
  qty: number;
  price: number;
  precio_original?: number;
  descuento_aplicado?: number;
  tipo_descuento?: string;
}

export interface ReorderCheckoutData {
  id_sucursal: number;
  id_municipio_sucursal: number;
  departamento_sucursal: string;
  productos: ReorderItem[];
  contacto?: {
    name?: string;
    email?: string;
    phone?: string;
  };
}

export const validateReorder = async (
  id_pedido: number | string,
  email: string
): Promise<ReorderCheckoutData> => {
  const res = await api.post("/api/pedido/reorder/validate", {
    id_pedido,
    email,
  });

  return res.data.data;
};