// api/payment/paypal.ts (Corregido)
import api from "../axios";

export const createOrder = async (monto: number) => {
  const { data } = await api.post("api/paypal/create-order", { monto });
  return data.data.id;
};

export const captureOrder = async (orderID: string) => {
  const { data } = await api.post(`api/paypal/capture-order/${orderID}`);
  return data;
};
