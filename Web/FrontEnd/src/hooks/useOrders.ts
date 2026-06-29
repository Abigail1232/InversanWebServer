import { useState, useEffect } from "react";
import { message } from "antd";
import { getPreviousOrders, getPendingOrders, type OrderData } from "../api/orders/my-orders";

export function useOrders(email: string | null) {
  const [pendingOrders, setPendingOrders] = useState<OrderData[]>([]);
  const [previousOrders, setPreviousOrders] = useState<OrderData[]>([]);

  const fetchPending = async () => {
    try {
      const pending = await getPendingOrders(email);
      setPendingOrders(pending);
    } catch {
      message.error("No se pudieron cargar los pedidos pendientes");
      setPendingOrders([]);
    }
  };

  const fetchPrevious = async () => {
    try {
      const previous = await getPreviousOrders(email);
      setPreviousOrders(previous);
    } catch {
      message.error("No se pudo cargar el historial de pedidos");
      setPreviousOrders([]);
    }
  };

  useEffect(() => {
    fetchPending();
    fetchPrevious();
  }, [email]);

  return {
    pendingOrders,
    previousOrders,
    fetchPending,
    fetchPrevious
  };
}
