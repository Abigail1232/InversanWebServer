import type { ProfileFormValues, RecentOrder, StatCard } from "./types";

export const PROFILE_STATS: StatCard[] = [
  { label: "Total de Pedidos", value: "12", iconType: "orders" },
  { label: "Último Pedido", value: "15 Feb 2024", iconType: "lastOrder" },
  { label: "Estado", value: "Activo", dot: true },
];

export const PROFILE_ORDERS: RecentOrder[] = [
  { id: "INV-2024-001", date: "14 de febrero de 2024", items: "4 artículos", total: "L 12,500.00" },
  { id: "INV-2024-000", date: "27 de enero de 2024", items: "2 artículos", total: "L 8,750.00", delivered: true },
  { id: "INV-2023-099", date: "9 de diciembre de 2023", items: "4 artículos", total: "L 15,200.00", delivered: true },
];

export const DEFAULT_PROFILE_FORM: ProfileFormValues = {
  username: "CarlosRMendez",
  firstName: "Carlos",
  secondName: "Roberto",
  firstLastName: "Méndez",
  secondLastName: "",
  email: "carlos.mendez@gmail.com",
  phone: "+504 9988-7766",
};
