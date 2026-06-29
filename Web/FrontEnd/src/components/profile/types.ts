export type StatCard = {
  label: string;
  value: string;
  iconType?: "orders" | "lastOrder";
  dot?: boolean;
};

export type RecentOrder = {
  id: string;
  date: string;
  items: string;
  total: string;
  delivered?: boolean;
};

export type ProfileFormValues = {
  username: string;
  firstName: string;
  secondName: string;
  firstLastName: string;
  secondLastName: string;
  email: string;
  phone: string;
};
