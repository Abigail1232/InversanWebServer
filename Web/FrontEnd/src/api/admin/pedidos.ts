import axios from "../axios";

export interface ClientePedido {
    nombre_completo: string;
    telefono_cliente: string;
    correo_cliente: string;
}

export interface MunicipioEntrega {
    nombre: string;
}

export interface AsignacionPedido {
    id_pedido_asignacion: number;
    id_repartidor: number;
    observacion: string;
    fecha_estimada_entrega?: string;
    repartidor?: {
        id_usuario: number;
        primer_nombre: string;
        primer_apellido: string;
    };
}

export interface PedidoAdmin {
    id_pedido: number;
    numero_pedido: string;
    fecha: string;
    direccion: string;
    tipo_de_pago: string;
    tipo_de_entrega: string;
    estado: string;
    subtotal: number;
    costo_envio: number;
    IVA: number;
    total: number;
    municipio_entrega?: MunicipioEntrega;
    pedido_usuario?: ClientePedido[];
    pedido_asignacion?: AsignacionPedido[];
    comprobante_url?: string;
    id_sucursal: number;
    sucursal?: {
        nombre: string;
        direccion: string;
    };
}

export interface RespuestaPedidosAdmin {
    ok: boolean;
    data: PedidoAdmin[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
    msg?: string;
}

export const buscarPedidosAdmin = async (params: {
    busqueda?: string;
    tipo_de_pago?: string;
    tipo_de_entrega?: string;
    estado?: string;
    id_sucursal?: number | string;
    page?: number;
    limit?: number;
}) => {
    try {
        const response = await axios.get<RespuestaPedidosAdmin>("/api/pedido/buscar_pedidos", {
            params,
        });
        return response.data;
    } catch (error) {
        console.error("Error al buscar pedidos administradores:", error);
        throw error;
    }
};

export const asignarPedido = async (data: {
    id_pedido: number;
    id_repartidor: number;
    asignado_por: number;
    fecha_estimada_entrega?: string;
    observacion?: string;
}) => {
    try {
        const response = await axios.post("/api/pedido/asignar_pedido", data);
        return response.data;
    } catch (error) {
        console.error("Error al asignar pedido:", error);
        throw error;
    }
};

export const actualizarEstadoPedidoAdmin = async (id_pedido: number, nuevo_estado: string) => {
    try {
        const response = await axios.patch(`/api/pedido/actualizar_estado/${id_pedido}`, {
            nuevo_estado,
        });
        return response.data;
    } catch (error) {
        console.error("Error al actualizar estado del pedido:", error);
        throw error;
    }
};
