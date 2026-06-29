import api from "../axios";

export interface ProfileUserResponse {
  id_usuario: number;
  usuario: string;
  correo: string;
  primer_nombre: string;
  segundo_nombre?: string | null;
  primer_apellido: string;
  segundo_apellido?: string | null;
  telefono?: string | null;
  activo: boolean;
  id_rol: number;
}

type ProfilePayload = ProfileUserResponse | { user?: ProfileUserResponse };

interface ProfileSummaryResponse {
  ok: boolean;
  data?: {
    total_pedidos: number;
  };
}

interface FinalizedOrdersResponse {
  ok: boolean;
  data?: Array<{
    id_pedido: number;
    numero_pedido?: string;
    fecha: string;
    municipio_entrega: { nombre: string } | string | null;
    total: number;
    tipo_de_pago: string;
  }>;
}

function normalizeProfilePayload(payload: ProfilePayload | null | undefined): ProfileUserResponse | null {
  if (!payload) return null;
  if ("user" in payload && payload.user) return payload.user;
  return payload as ProfileUserResponse;
}

export async function getMyProfile(): Promise<ProfileUserResponse | null> {
  try {
    const response = await api.get<ProfilePayload>("/api/users/me");
    return normalizeProfilePayload(response.data);
  } catch (error) {
    console.error("No se pudo obtener el perfil", error);
    return null;
  }
}

export async function updateMyProfile(payload: {
  usuario: string;
  correo: string;
  primer_nombre: string;
  segundo_nombre?: string;
  primer_apellido: string;
  segundo_apellido?: string;
  telefono?: string;
}): Promise<ProfileUserResponse | null> {
  try {
    const response = await api.patch<ProfilePayload>("/api/users/me", payload);
    return normalizeProfilePayload(response.data);
  } catch (error) {
    console.error("No se pudo actualizar el perfil", error);
    return null;
  }
}

export async function getMyOrderSummary(): Promise<number> {
  try {
    const response = await api.get<ProfileSummaryResponse>("/api/pedido/resumen_pedidos", {
      params: { tipo_cliente: "registrado" },
      withCredentials: true,
    });
    return response.data?.data?.total_pedidos ?? 0;
  } catch (error) {
    console.error("No se pudo obtener el resumen de pedidos", error);
    return 0;
  }
}

export type ProfileRecentOrder = {
  id: string;
  date: string;
  items: string;
  total: string;
  delivered: boolean;
};

async function getMyFinalizedOrders(limit = 3): Promise<ProfileRecentOrder[]> {
  try {
    const response = await api.get<FinalizedOrdersResponse>("/api/pedido/mis_pedidos_finalizados", {
      params: {
        tipo_cliente: "registrado",
        page: 1,
        limit,
      },
    });

    const orders = response.data?.data ?? [];
    return orders.map((order) => {
      const municipioNombre = typeof order.municipio_entrega === 'object' && order.municipio_entrega
        ? order.municipio_entrega.nombre
        : String(order.municipio_entrega ?? "");
      return {
        id: String(order.numero_pedido ?? order.id_pedido),
        date: order.fecha ? new Date(order.fecha).toLocaleDateString() : "Fecha no disponible",
        items: municipioNombre ? `Entrega en ${municipioNombre}` : "Sin municipio",
        total: `Lps. ${Number(order.total).toLocaleString()}`,
        delivered: true,
      };
    });
  } catch (error) {
    console.error("No se pudieron obtener los pedidos recientes", error);
    return [];
  }
}

async function getMyPendingOrders(limit = 3): Promise<ProfileRecentOrder[]> {
  try {
    const response = await api.get<FinalizedOrdersResponse>("/api/pedido/mis_pedidos_pendientes", {
      params: {
        page: 1,
        limit,
      },
    });

    const orders = response.data?.data ?? [];
    return orders.map((order) => {
      const municipioNombre = typeof order.municipio_entrega === 'object' && order.municipio_entrega
        ? order.municipio_entrega.nombre
        : String(order.municipio_entrega ?? "");
      return {
        id: String(order.numero_pedido ?? order.id_pedido),
        date: order.fecha ? new Date(order.fecha).toLocaleDateString() : "Fecha no disponible",
        items: municipioNombre ? `Entrega en ${municipioNombre}` : "Sin municipio",
        total: `Lps. ${Number(order.total).toLocaleString()}`,
        delivered: false,
      };
    });
  } catch (error) {
    console.error("No se pudieron obtener los pedidos pendientes", error);
    return [];
  }
}

export async function getMyRecentOrders(limit = 3): Promise<ProfileRecentOrder[]> {
  const [pending, finalized] = await Promise.all([
    getMyPendingOrders(limit),
    getMyFinalizedOrders(limit),
  ]);

  const combined = [...pending, ...finalized];

  combined.sort((a, b) => {
    const da = new Date(a.date).getTime() || 0;
    const db = new Date(b.date).getTime() || 0;
    return db - da;
  });

  return combined.slice(0, limit);
}