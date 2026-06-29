import { useEffect, useState, type ReactNode } from "react";
import { Card, Typography, Button, Dropdown } from "antd";
import { useNavigate } from "react-router-dom";
import type { MenuProps } from "antd";
import { BellOutlined, CheckOutlined, MoreOutlined, DeleteOutlined } from "@ant-design/icons";
import { Truck, Tag, Package, Bell } from "lucide-react";
import {
  deleteNotification,
  getMyNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  deleteAllNotifications,
  type NotificationApiItem,
} from "../../api/notifications/notifications";
import { usePreventDuplicate } from "../../hooks/usePreventDuplicateRequest";

const { Title, Text } = Typography;
const NOTIFICATIONS_VIEWED_EVENT = "notificationsViewed";

type NotificationType = "shipping" | "promo" | "delivered" | "branch";

interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  description: string;
  date: string;
  unread: boolean;
  ruta?: string;
}

const typeConfig: Record<NotificationType, { icon: ReactNode; bg: string }> = {
  shipping: { icon: <Truck className="w-5 h-5 text-white" />, bg: "#027EB1" },
  promo: { icon: <Tag className="w-5 h-5 text-white" />, bg: "#D61216" },
  delivered: { icon: <Package className="w-5 h-5 text-white" />, bg: "#027EB1" },
  branch: { icon: <Bell className="w-5 h-5 text-white" />, bg: "#003E7B" },
};

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function inferType(title: string, description: string): NotificationType {
  const text = `${title} ${description}`.toLowerCase();
  if (text.includes("oferta") || text.includes("descuento") || text.includes("promoción")) {
    return "promo";
  }
  if (text.includes("entregado")) {
    return "delivered";
  }
  if (text.includes("sucursal")) {
    return "branch";
  }
  return "shipping";
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fecha no disponible";
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

function mapApiToUi(item: NotificationApiItem): Notification {
  return {
    id: item.id,
    type: inferType(item.titulo, item.contenido),
    title: item.titulo,
    description: item.contenido,
    date: formatDate(item.fecha_emision),
    unread: !item.leida,
    ruta: item.ruta,
  };
}

export default function NotificationPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [loading, setLoading] = useState(true);

  const loadNotifications = async (nextFilter: "all" | "unread") => {
    setLoading(true);
    const response = await getMyNotifications(nextFilter);
    setNotifications((response.data || []).map(mapApiToUi));
    setLoading(false);
  };

  useEffect(() => {
    void loadNotifications(filter);
  }, [filter]);

  const unreadCount = notifications.filter((n) => n.unread).length;
  const totalCount = notifications.length;
  const displayed = notifications;

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(
      new CustomEvent(NOTIFICATIONS_VIEWED_EVENT, {
        detail: { unreadCount },
      }),
    );
  }, [unreadCount]);

  const performMarkAllRead = async () => {
    const success = await markAllNotificationsAsRead();
    if (!success) return;
    await loadNotifications(filter);
  };

  const { execute: markAllRead } = usePreventDuplicate(performMarkAllRead);

  const performMarkAsRead = async (id: number) => {
    const notification = notifications.find((n) => n.id === id);
    
    if (notification?.unread) {
      const success = await markNotificationAsRead(id);
      if (success) {
        await loadNotifications(filter);
      }
    }

    if (notification?.ruta) {
      navigate(notification.ruta);
    }
  };

  const { execute: markAsRead } = usePreventDuplicate(performMarkAsRead);

  const performRemoveNotification = async (id: number) => {
    const success = await deleteNotification(id);
    if (!success) return;
    await loadNotifications(filter);
  };

  const { execute: removeNotification, isLoading: isRemoving } = usePreventDuplicate(performRemoveNotification);
  const removeAllNotifications = async () => {
    const success = await deleteAllNotifications();
    if (success) {
      setNotifications([]);
    }
  };

  const getItemMenu = (id: number): MenuProps["items"] => [
    { key: "delete", icon: <DeleteOutlined />, label: "Eliminar", onClick: () => removeNotification(id), disabled: isRemoving },
  ];

  return (
    <div className="bg-[#F3F4F6] min-h-screen py-6 px-4 md:px-8">
      <div className="max-w-4xl mx-auto animate-page-enter">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-[#027EB1] flex items-center justify-center">
                <BellOutlined className="text-white text-2xl" />
              </div>
              <div>
                <Title level={2} className="!mb-0 !text-2xl md:!text-3xl !text-[#1A1A1A]">
                  Notificaciones
                </Title>
                <Text className="text-[#4A4A4A] text-sm">
                  Tienes {unreadCount} notificación{unreadCount !== 1 ? "es" : ""} sin leer
                </Text>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="default"
                className="!border-[#027EB1] !text-[#027EB1] h-10 rounded-lg font-medium"
                icon={<CheckOutlined />}
                onClick={markAllRead}
                disabled={unreadCount === 0}
              >
                Marcar todas como leídas
              </Button>
              <Button
                danger
                type="default"
                className="h-10 rounded-lg font-medium"
                icon={<DeleteOutlined />}
                onClick={removeAllNotifications}
                disabled={totalCount === 0}
              >
                Borrar todas
              </Button>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              type={filter === "all" ? "primary" : "default"}
              className={filter === "all" ? "!bg-[#027EB1] !border-[#027EB1]" : ""}
              onClick={() => setFilter("all")}
            >
              Todas ({totalCount})
            </Button>
            <Button
              type={filter === "unread" ? "primary" : "default"}
              className={filter === "unread" ? "!bg-[#027EB1] !border-[#027EB1]" : ""}
              onClick={() => setFilter("unread")}
            >
              No leídas ({unreadCount})
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {loading && (
            <Card className="!rounded-[20px] !border-2 !border-[#E5E7EB]" styles={{ body: { padding: "20px 24px" } }}>
              <Text className="text-[#6B7280] text-base">Cargando notificaciones...</Text>
            </Card>
          )}
          {!loading && displayed.length === 0 && (
            <Card className="!rounded-[20px] !border-2 !border-[#E5E7EB]" styles={{ body: { padding: "20px 24px" } }}>
              <Text className="text-[#6B7280] text-base">No tienes notificaciones.</Text>
            </Card>
          )}
          {displayed.map((n, i) => {
            const { icon, bg } = typeConfig[n.type];
            return (
              <Card
                key={n.id}
                className="!rounded-[20px] !border-2 cursor-pointer hover:opacity-95 transition-opacity animate-card-enter"
                style={{
                  borderColor: n.unread ? "#027EB1" : "#E5E7EB",
                  animationDelay: `${i * 0.06}s`,
                }}
                styles={{ body: { padding: "20px 24px" } }}
                onClick={() => void markAsRead(n.id)}
              >
                <div className="flex gap-4">
                  <div
                    className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: bg }}
                  >
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <Title level={5} className="!mb-1 !text-lg !text-[#1A1A1A]">
                        {n.title}
                      </Title>
                      {n.unread && (
                        <span className="shrink-0 w-2.5 h-2.5 rounded-full bg-[#027EB1]" />
                      )}
                    </div>
                    <Text className="text-[#4A4A4A] text-base block mb-2">{n.description}</Text>
                    <div className="flex items-center justify-between">
                      <Text className="text-[#6B7280] text-sm">{n.date}</Text>
                      <Dropdown menu={{ items: getItemMenu(n.id) }} trigger={["click"]}>
                        <Button type="text" size="small" icon={<MoreOutlined />} className="!text-[#4A4A4A]" onClick={(e) => e.stopPropagation()} />
                      </Dropdown>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
