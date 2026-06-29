import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ContactInfoSection from "../../components/profile/ContactInfoSection";
import EditProfileModal from "../../components/profile/EditProfileModal";
import ProfileActions from "../../components/profile/ProfileActions";
import ProfileHero from "../../components/profile/ProfileHero";
import RecentOrdersSection from "../../components/profile/RecentOrdersSection";
import type {
  ProfileFormValues,
  StatCard,
} from "../../components/profile/types";
import {
  getMyOrderSummary,
  getMyProfile,
  getMyRecentOrders,
  updateMyProfile,
} from "../../api/profile/profile";
import { logout } from "../../api/auth/logout";
import { clearAllLocalCarts } from "../../api/cart/cart";
import { usePreventDuplicate } from "../../hooks/usePreventDuplicateRequest";

const EMPTY_PROFILE: ProfileFormValues = {
  username: "",
  firstName: "",
  secondName: "",
  firstLastName: "",
  secondLastName: "",
  email: "",
  phone: "",
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [totalOrders, setTotalOrders] = useState(0);
  const [profileValues, setProfileValues] =
    useState<ProfileFormValues>(EMPTY_PROFILE);
  const [recentOrders, setRecentOrders] = useState<
    {
      id: string;
      date: string;
      items: string;
      total: string;
      delivered?: boolean;
    }[]
  >([]);

  const fullName = useMemo(() => {
    const names = [
      profileValues.firstName,
      profileValues.secondName,
      profileValues.firstLastName,
      profileValues.secondLastName,
    ]
      .map((value) => value.trim())
      .filter(Boolean);
    return names.join(" ") || "Mi Perfil";
  }, [
    profileValues.firstName,
    profileValues.secondName,
    profileValues.firstLastName,
    profileValues.secondLastName,
  ]);

  const stats: StatCard[] = useMemo(() => {
    const lastOrderDate = recentOrders[0]?.date ?? "Sin pedidos";
    return [
      {
        label: "Total de Pedidos",
        value: String(totalOrders),
        iconType: "orders",
      },
      { label: "Último Pedido", value: lastOrderDate, iconType: "lastOrder" },
      { label: "Estado", value: "Activo", dot: true },
    ];
  }, [recentOrders, totalOrders]);

  const loadProfileData = async () => {
    setLoading(true);
    const [profile, ordersCount, orders] = await Promise.all([
      getMyProfile(),
      getMyOrderSummary(),
      getMyRecentOrders(3),
    ]);

    if (!profile) {
      navigate("/login");
      return;
    }

    const formatPhone = (raw: string) => {
      const digits = (raw || "").replace(/\D/g, "").slice(0, 8);
      if (digits.length <= 4) return digits;
      return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    };

    setProfileValues({
      username: profile.usuario ?? "",
      firstName: profile.primer_nombre ?? "",
      secondName: profile.segundo_nombre ?? "",
      firstLastName: profile.primer_apellido ?? "",
      secondLastName: profile.segundo_apellido ?? "",
      email: profile.correo ?? "",
      phone: formatPhone(profile.telefono ?? ""),
    });
    setTotalOrders(ordersCount);
    setRecentOrders(orders);
    setLoading(false);
  };

  useEffect(() => {
    void loadProfileData();
  }, []);

  const performSaveProfile = async (values: ProfileFormValues) => {
    const updated = await updateMyProfile({
      usuario: values.username,
      correo: values.email,
      primer_nombre: values.firstName,
      segundo_nombre: values.secondName,
      primer_apellido: values.firstLastName,
      segundo_apellido: values.secondLastName,
      telefono: values.phone,
    });

    if (!updated) {
      return;
    }

    setProfileValues(values);
    setEditModalOpen(false);
  };

  const { execute: handleSaveProfile } = usePreventDuplicate(performSaveProfile);

  const performLogout = async () => {
    await logout();
    clearAllLocalCarts();
    localStorage.removeItem("delivery_pedidos_actuales");
    navigate("/login");
  };

  const { execute: handleLogout } = usePreventDuplicate(performLogout);

  if (loading) {
    return (
      <section className="bg-[#f3f4f6] min-h-screen">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-10">
          Cargando perfil...
        </div>
      </section>
    );
  }

  return (
    <section className="bg-[#f3f4f6] min-h-screen">
      <ProfileHero
        fullName={fullName}
        memberSince="Miembro activo"
        stats={stats}
      />

      <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-6 md:py-8 animate-page-enter">
        <h2 className="text-2xl md:text-[32px] font-semibold text-[#1A1A1A] leading-8 md:leading-10 mb-4 md:mb-6">
          Mi Perfil
        </h2>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 md:px-6 pb-8 grid grid-cols-1 lg:grid-cols-3 gap-6 animate-page-enter-delay-1">
        <div className="lg:col-span-2 space-y-6">
          <ContactInfoSection
            email={profileValues.email}
            phone={profileValues.phone}
          />
          <RecentOrdersSection
            orders={recentOrders}
            onSeeAll={() => navigate("/orders")}
          />
        </div>
        <div className="lg:pt-12">
          <ProfileActions
            onLogout={handleLogout}
            onEditProfile={() => setEditModalOpen(true)}
            onChangePassword={() => navigate("/profile/change-password")}
          />
        </div>
      </div>

      <EditProfileModal
        open={editModalOpen}
        defaultValues={profileValues}
        onCancel={() => setEditModalOpen(false)}
        onSave={handleSaveProfile}
      />
    </section>
  );
}
