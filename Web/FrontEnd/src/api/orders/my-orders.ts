import axios from "../axios";

const ORDER_URL  = "/api/pedido";

export interface OrderData {
  id_pedido: number;
  numero_pedido: string;
  id : number,
  fecha: string;
  entrega?: string;
  tipo_de_entrega?: string;
  direccion: string;
  tipo_de_pago: string;
  municipio_entrega: {
    id_municipio: number;
    nombre: string;
    id_departamento: number;
  } | null;
  total: number;
  estado: "pendiente" | "en_proceso" | "entregado" | "cancelado" | "pago_pendiente" | "devolucion_pendiente" | "devolucion_aplicada";
}
export interface OrderDetail {
  fecha: string;
  estado: string;
  direccion_entrega: string;
  metodo_pago: string;
  total: number;
  productos: {
    producto: string;
    cantidad: number;
    precio_unitario: number;
  }[];
}

export async function getPreviousOrders(correo: string | null) : Promise<OrderData[]> 
{
    try {
        const response = await axios.get(`${ORDER_URL}/mis_pedidos_finalizados`,{
            params: correo ? { correo_cliente: correo } : {},
            withCredentials: true,
        })

        if (response.status !== 200) return [];
        return response.data.data;
    } catch (error) {
        return [];
    }
}

export async function getPendingOrders(correo: string | null): Promise<OrderData[]> {
  try {
    const response = await axios.get(`${ORDER_URL}/mis_pedidos_pendientes`, {
      params: correo ? { correo_cliente: correo } : {},
      withCredentials: true
    });

    if (response.status !== 200) {
      throw new Error("Respuesta no válida del servidor");
    }

    return response.data.data;
  } catch (error) {
    throw error;
  }
}


export async function getOrderDetail(id_pedido: number,correo: string | undefined): Promise<OrderDetail | null> {
  try {
    const response = await axios.get(`${ORDER_URL}/detalle_pedido/${id_pedido}`, {
      params: correo ? { correo_cliente: correo } : {},
      withCredentials: true
    });
    if (response.status !== 200) return null;
    return response.data.data;

  } catch (error) {
    return null;
  }
}

export async function uploadPurchaseReceipt(orderId: string, file: File): Promise<{ success: boolean; message: string; comprobante_url?: string }> {
    try {
        const formData = new FormData();
        formData.append('comprobante', file);

        const response = await axios.post(
            `${ORDER_URL}/subir_comprobante/${orderId}`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    ...axios.defaults.headers.common,
                },
                withCredentials: true,
            }
        );

        return {
            success: response.data.ok,           // ← mapear ok → success
            message: response.data.msg || '',
            comprobante_url: response.data.data?.comprobante_url,  // ← datos anidados en data
        };
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.msg || error.message || 'Error al subir el comprobante',
        };
    }
}