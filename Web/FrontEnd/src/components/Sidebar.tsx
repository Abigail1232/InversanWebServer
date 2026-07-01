import { useMemo, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Drawer, Dropdown } from "antd";
import {
  AppstoreOutlined,
  BarChartOutlined,
  DashboardOutlined,
  DownOutlined,
  FileTextOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  SettingOutlined,
  TeamOutlined,
  UpOutlined,
  UserAddOutlined,
  UserOutlined,
} from "@ant-design/icons";

import type { Privilegio } from "../api/auth/privileges";
import type { Usuario } from "../api/user/user";
import { canSeeDashboard, mapPrivilegesToPermissions, type Permission } from "../lib/routePermissions";
import { logout } from "../api/auth/logout";
import { clearAllLocalCarts } from "../api/cart/cart";

export type { Permission } from "../lib/routePermissions";

type Props = {
  privileges: Privilegio[];
  open: boolean;
  onClose: () => void;
  currentUser: Usuario;
};

type MenuItem = {
  key: string;
  icon: ReactNode;
  label: string;
  children?: Array<{ key: string; label: string }>;
};

const DESKTOP_WIDTH = 310;

export default function SidebarDrawer({
  privileges,
  open,
  onClose,
  currentUser,
}: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const [drop, setDrop] = useState(false);
  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set());

  const effectivePermissions = useMemo(
    () => mapPrivilegesToPermissions(privileges),
    [privileges],
  );

  const hasPermission = (permission?: Permission) =>
    !permission || effectivePermissions.includes(permission);

  const isAdmin = useMemo(() => {
    return privileges.some((p) =>
      ["ADM_USUARIOS", "ADM_SUCURSALES", "ALL_ACCESS"].includes(p.nombre),
    );
  }, [privileges]);

  const showDashboard = useMemo(
    () => canSeeDashboard(effectivePermissions),
    [effectivePermissions],
  );

  const hasGestorOrAdminAccess = useMemo(
    () =>
      isAdmin ||
      effectivePermissions.some((p) =>
        ["admin.categorias", "admin.productos", "admin.modelos", "admin.marcas", "admin.disenos", "admin.promocion"].includes(p),
      ),
    [isAdmin, effectivePermissions],
  );

  const toggleGroup = (key: string) => {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const menuItems = useMemo<MenuItem[]>(() => {
    const items: MenuItem[] = [];

    if (showDashboard) {
      items.push({
        key: "/admin",
        icon: <DashboardOutlined />,
        label: "Dashboard",
      });
    }

    if (
      hasPermission("pedidos.view") ||
      hasPermission("pedidos.entrega") ||
      hasPermission("pedidos.historial")
    ) {
      const children = [
        hasPermission("pedidos.view")
          ? { key: "/admin/pedidos", label: "Gestion de Pedidos" }
          : null,
        hasPermission("pedidos.entrega")
          ? { key: "/delivery/orders", label: "Entrega de Pedidos" }
          : null,
        hasPermission("pedidos.historial")
          ? { key: "/delivery-history", label: "Historial de Entregas" }
          : null,
      ].filter(Boolean) as Array<{ key: string; label: string }>;

      items.push({
        key: "pedidos",
        icon: <FileTextOutlined />,
        label: "Pedidos",
        children,
      });
    }

    if (
      hasPermission("admin.roles") ||
      hasPermission("admin.usuarios") ||
      hasPermission("admin.permisos")
    ) {
      const children = [
        hasPermission("admin.roles")
          ? { key: "/admin/roles", label: "Administracion de Roles" }
          : null,
        hasPermission("admin.usuarios")
          ? { key: "/admin/users", label: "Administracion de Usuarios" }
          : null,
        hasPermission("admin.permisos")
          ? { key: "/admin/permissions", label: "Administración de Permisos" }
          : null,
      ].filter(Boolean) as Array<{ key: string; label: string }>;

      if (children.length > 0) {
        items.push({
          key: "users",
          icon: <UserAddOutlined />,
          label: "Usuarios",
          children,
        });
      }
    }

    if (
      hasPermission("asistencia.marcar") ||
      hasPermission("asistencia.administrar") ||
      hasPermission("asistencia.reportes")
    ) {
      const children = [
        hasPermission("asistencia.marcar") || hasPermission("asistencia.administrar")
          ? { key: "/admin/empleados/asistencia/marcar", label: "Marcar asistencia" }
          : null,
        hasPermission("asistencia.reportes")
          ? { key: "/admin/empleados/asistencia/reportes", label: "Reportes de asistencias" }
          : null,
      ].filter(Boolean) as Array<{ key: string; label: string }>;

      if (children.length > 0) {
        items.push({
          key: "empleados",
          icon: <TeamOutlined />,
          label: "Gestión de Empleados",
          children,
        });
      }
    }

    if (hasGestorOrAdminAccess) {
      const children = [
        hasPermission("admin.sucursales")
          ? { key: "/admin/branches", label: "Administración de Sucursales" }
          : null,
        hasPermission("admin.categorias")
          ? { key: "/admin/categories", label: "Administración de Categorias" }
          : null,
        hasPermission("admin.modelos")
          ? { key: "/admin/models", label: "Administración de Modelos" }
          : null,
        hasPermission("admin.productos")
          ? { key: "/admin/products", label: "Administración de Productos" }
          : null,
        hasPermission("admin.marcas")
          ? { key: "/admin/brands", label: "Administración de Marcas" }
          : null,
        hasPermission("admin.disenos")
          ? { key: "/admin/designs", label: "Administración de Diseños" }
          : null,
        hasPermission("admin.promocion")
          ? { key: "/admin/promotions", label: "Administración de Promociones" }
          : null,
      ].filter(Boolean) as Array<{ key: string; label: string }>;

      if (children.length > 0) {
        items.push({
          key: "admin",
          icon: <SettingOutlined />,
          label: "Administración",
          children,
        });
      }
    }

    if (
      hasPermission("inventario.ingreso") ||
      hasPermission("inventario.historial")
    ) {
        const children = [
          hasPermission("inventario.ingreso")
            ? { key: "/admin/inventory/entry", label: "Ingreso de Producto" }
            : null,
          hasPermission("inventario.ingreso")
            ? { key: "/admin/inventory/decrement", label: "Decremento de Producto" }
            : null,
          hasPermission("inventario.historial")
            ? { key: "/admin/inventory/history", label: "Historial de Movimientos" }
            : null,
        ].filter(Boolean) as Array<{ key: string; label: string }>;

      if (children.length > 0) {
        items.push({
          key: "inventario",
          icon: <AppstoreOutlined />,
          label: "Inventario",
          children,
        });
      }
    }

    if (hasPermission("reportes.view")) {
      const children = [
        hasPermission("reportes.ventas")
          ? { key: "/admin/reportes/ventas", label: "Reporte de Ventas" }
          : null,
        hasPermission("reportes.visitas")
          ? { key: "/admin/reportes/visitas", label: "Reporte de Visitas" }
          : null,
        hasPermission("reportes.sugerencias")
          ? { key: "/admin/reportes/sugerencias", label: "Reporte de Sugerencias" }
          : null,
      ].filter(Boolean) as Array<{ key: string; label: string }>;

      if (children.length > 0) {
        items.push({
          key: "reportes",
          icon: <BarChartOutlined />,
          label: "Reportes",
          children,
        });
      }
    }

    return items;
  }, [effectivePermissions, isAdmin, privileges, showDashboard, hasGestorOrAdminAccess]);

  const userMenu = {
    items: [
      {
        key: "perfil",
        label: "Mi Perfil",
        onClick: () => {
          navigate("/profile");
          onClose();
        },
      },
      {
        key: "logout",
        icon: <LogoutOutlined />,
        label: "Cerrar Sesion",
        onClick: async () => {
          try {
            await logout();
          } finally {
            clearAllLocalCarts();
            navigate("/login");
            onClose();
          }
        },
      },
    ],
  };

  const isGroupActive = (item: MenuItem) => {
    if (!item.children?.length) {
      return item.key === "/admin"
        ? location.pathname === "/admin" || location.pathname === "/admin/dashboard"
        : location.pathname === item.key;
    }

    return item.children.some((child) => location.pathname === child.key);
  };

  const renderMenu = () => (
    <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-4 pr-2 space-y-3 [scrollbar-width:thin] [scrollbar-color:#9fb8d2_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#b7cce2] hover:[&::-webkit-scrollbar-thumb]:bg-[#8eaecd]">
      {menuItems.map((group) => {
        const isOpen = openKeys.has(group.key);
        const isDirectLink = !group.children?.length;
        const isActive = isGroupActive(group);

        return (
          <div key={group.key} className="rounded-2xl">
            <button
              type="button"
              onClick={() => {
                if (isDirectLink) {
                  navigate(group.key);
                  onClose();
                  return;
                }
                toggleGroup(group.key);
              }}
              className={`w-full flex scroll-smooth items-center justify-between px-4 py-3 rounded-2xl font-semibold shadow-sm transition ${isActive ? "bg-[#003E7B] text-white" : "bg-[#027EB1] text-white hover:bg-[#026a96]"
                }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-base">{group.icon}</span>
                <span>{group.label}</span>
              </div>
              {!isDirectLink &&
                (isOpen ? <UpOutlined className="text-sm" /> : <DownOutlined className="text-sm" />)}
            </button>

            {isOpen && group.children?.length && (
              <div className="mt-2 scroll-smooth rounded-2xl border border-[#E5EDF6] bg-[#F8FAFC] p-2">
                {group.children.map((child) => {
                  const active = location.pathname === child.key;

                  return (
                    <button
                      key={child.key}
                      type="button"
                      onClick={() => {
                        navigate(child.key);
                        onClose();
                      }}
                      className={`w-full text-left px-4 py-3 rounded-xl transition mb-1 last:mb-0 ${active
                        ? "bg-[#EAF7FD] text-[#003E7B] font-semibold shadow-sm"
                        : "text-[#5F6C7B] hover:bg-white hover:text-[#003E7B]"
                        }`}
                    >
                      {child.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const renderFooter = () => (
    <div className="shrink-0 border-t border-white/10 bg-[#003E7B] p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-white min-w-0">
          <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center shrink-0">
            <UserOutlined />
          </div>
          <div className="leading-tight min-w-0">
            <div className="font-semibold truncate">{currentUser.usuario}</div>
            <div className="text-xs opacity-80 truncate">{currentUser.correo}</div>
          </div>
        </div>

        <Dropdown
          menu={userMenu}
          trigger={["click"]}
          open={drop}
          onOpenChange={(flag) => setDrop(flag)}
        >
          <button
            type="button"
            className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-white/15 transition-colors text-white"
          >
            {drop ? <UpOutlined className="text-sm" /> : <DownOutlined className="text-sm" />}
          </button>
        </Dropdown>
      </div>
    </div>
  );

  const sidebarHeader = (
    <div className="flex items-center justify-between gap-3 px-4 py-4 border-b border-[#E5EDF6] bg-white/95 backdrop-blur">
      <img
        src="/logo.svg"
        alt="Logo"
        className="cursor-pointer h-10 w-auto"
        onClick={() => {
          navigate("/admin");
          onClose();
        }}
      />

      {open && (
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#027EB1] text-white hover:bg-[#026a96] transition shadow-sm"
          title="Ocultar sidebar"
        >
          <MenuFoldOutlined />
        </button>
      )}
    </div>
  );

  return (
    <Drawer
      placement="left"
      open={open}
      onClose={onClose}
      width={DESKTOP_WIDTH}
      styles={{
        body: {
          display: "flex",
          flexDirection: "column",
          padding: 0,
          height: "100%",
        },
        header: {
          padding: 0,
          borderBottom: "none",
        },
        mask: {
          backdropFilter: "blur(4px)",
        }
      }}
      title={sidebarHeader}
      closable={false}
      zIndex={1000}
    >
      {renderMenu()}
      {renderFooter()}
    </Drawer>
  );
}