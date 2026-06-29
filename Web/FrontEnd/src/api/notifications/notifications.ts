import axiosLib from "axios";
import api from "../axios";
import { safeLocalStorage } from "../../utils/storage";

export interface NotificationApiItem {
  id: number;
  titulo: string;
  contenido: string;
  fecha_emision: string;
  leida: boolean;
  ruta?: string;
}

interface NotificationsResponse {
  ok: boolean;
  unreadCount: number;
  totalCount: number;
  data: NotificationApiItem[];
}

export async function getMyNotifications(filter: "all" | "unread" = "all") {
  const token = safeLocalStorage.getItem("token");
  if (!token) return { unreadCount: 0, totalCount: 0, data: [] as NotificationApiItem[] };

  try {
    const response = await api.get<NotificationsResponse>("/api/notificaciones/me", {
      params: { filtro: filter },
    });
    if (!response.data?.ok) {
      return { unreadCount: 0, totalCount: 0, data: [] as NotificationApiItem[] };
    }
    return response.data;
  } catch (error: unknown) {
    if (axiosLib.isAxiosError(error) && (error.response?.status === 403 || error.response?.status === 401)) {
       return { unreadCount: 0, totalCount: 0, data: [] as NotificationApiItem[] };
    }
    console.error("No se pudieron cargar notificaciones", error);
    return { unreadCount: 0, totalCount: 0, data: [] as NotificationApiItem[] };
  }
}

export async function markNotificationAsRead(id: number) {
  try {
    await api.patch(`/api/notificaciones/${id}/read`);
    return true;
  } catch (error) {
    console.error("No se pudo marcar la notificación", error);
    return false;
  }
}

export async function markAllNotificationsAsRead() {
  try {
    await api.patch("/api/notificaciones/me/read-all");
    return true;
  } catch (error) {
    console.error("No se pudieron marcar todas las notificaciones", error);
    return false;
  }
}

export async function deleteNotification(id: number) {
  try {
    await api.delete(`/api/notificaciones/${id}`);
    return true;
  } catch (error) {
    console.error("No se pudo eliminar la notificación", error);
    return false;
  }
}

export async function deleteAllNotifications() {
  try {
    await api.delete("/api/notificaciones/me");
    return true;
  } catch (error) {
    console.error("No se pudieron eliminar todas las notificaciones", error);
    return false;
  }
}
