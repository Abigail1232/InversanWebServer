import type { Privilegio } from "../api/auth/privileges";

/**
 * Tipos de permisos usados por la aplicación para controlar rutas y accesos.
 */
export type Permission =
  | "pedidos.view"
  | "pedidos.entrega"
  | "pedidos.historial"
  | "admin.roles"
  | "admin.usuarios"
  | "admin.permisos"
  | "admin.sucursales"
  | "admin.categorias"
  | "inventario.ingreso"
  | "inventario.historial"
  | "asistencia.marcar"
  | "asistencia.administrar"
  | "asistencia.reportes"
  | "reportes.view"
  | "reportes.ventas"
  | "reportes.visitas"
  | "reportes.sugerencias"
  | "admin.modelos"
  | "admin.productos"
  | "admin.marcas"
  | "admin.disenos"
  | "admin.promocion"
  | "dashboard.view";

/**
 * Traduce los privilegios de backend en permisos legibles por la aplicación.
 */
export function mapPrivilegesToPermissions(privs: Privilegio[]): Permission[] {
  const perm: Permission[] = [];

  privs.forEach((p) => {
    switch (p.nombre) {
      case "PED_PEDIDOS":
        perm.push("pedidos.view", "pedidos.historial");
        break;
      case "PED_ENTREGA":
        perm.push("pedidos.entrega", "pedidos.historial");
        break;
      case "PED_HISTORIAL":
        perm.push("pedidos.historial");
        break;
      case "INV_INGRESO":
        perm.push("inventario.ingreso");
        break;

      case "INV_HISTORIAL":
        perm.push("inventario.historial");
        break;
      case "ASI_MARCAR":
        perm.push("asistencia.marcar");
        break;
      case "ASI_ADMINISTRAR":
        perm.push("asistencia.administrar", "asistencia.marcar");
        break;
      case "ASI_REPORTES":
        perm.push("asistencia.reportes");
        break;
      case "ADM_USUARIOS":
        perm.push("admin.usuarios");
        break;
      case "ADM_SUCURSALES":
        perm.push("admin.sucursales");
        break;

      case "ADM_ROLES":
        perm.push("admin.roles");
        break;
      case "ADM_PERMISOS":
        perm.push("admin.permisos");
        break;
      case "REP_VENTAS":
        perm.push("reportes.ventas", "reportes.view");
        break;
      case "REP_VISITAS":
        perm.push("reportes.visitas", "reportes.view");
        break;
      case "REP_SUGERENCIAS":
        perm.push("reportes.sugerencias", "reportes.view");
        break;
      case "ADM_MODELOS":
        perm.push("admin.modelos");
        break;
      case "ADM_PRODUCTOS":
        perm.push("admin.productos");
        break;
      case "ADM_MARCAS":
        perm.push("admin.marcas");
        break;
      case "ADM_DISENOS":
        perm.push("admin.disenos");
        break;
      case "ADM_PROMOCIONES":
        perm.push("admin.promocion");
        break;
      case "ADM_CATEGORIAS":
        perm.push("admin.categorias");
        break;
      case "DASHBOARD_VIEW":
        perm.push("dashboard.view");
        break;
      case "ALL_ACCESS":
        perm.push(
          "pedidos.view",
          "pedidos.entrega",
          "pedidos.historial",
          "admin.roles",
          "admin.usuarios",
          "admin.permisos",
          "admin.sucursales",
          "admin.categorias",
          "inventario.ingreso",
          "inventario.historial",
          "asistencia.marcar",
          "asistencia.administrar",
          "asistencia.reportes",
          "reportes.view",
          "reportes.ventas",
          "reportes.visitas",
          "reportes.sugerencias",
          "admin.modelos",
          "admin.productos",
          "admin.marcas",
          "admin.disenos",
          "admin.promocion",
          "dashboard.view"
        );
        break;
      default:
        break;
    }
  });

  return Array.from(new Set(perm));
}

const STAFF_PERMISSIONS: Permission[] = [
  "pedidos.view",
  "pedidos.entrega",
  "pedidos.historial",
  "admin.roles",
  "admin.usuarios",
  "admin.permisos",
  "admin.sucursales",
  "admin.categorias",
  "inventario.ingreso",
  "inventario.historial",
  "asistencia.marcar",
  "asistencia.administrar",
  "asistencia.reportes",
  "reportes.view",
  "admin.modelos",
  "admin.productos",
  "admin.marcas",
  "admin.disenos",
  "admin.promocion",
  "dashboard.view",
];

/**
 * Determina si un usuario puede ver el dashboard de administración.
 * Cualquier permiso de staff habilita el acceso al sidebar/admin.
 */
export function canSeeDashboard(permissions: Permission[]): boolean {
  return STAFF_PERMISSIONS.some((p) => permissions.includes(p));
}

/**
 * Devuelve los permisos requeridos para cada ruta de administrador.
 * Retorna null si la ruta no es una ruta /admin.
 * Retorna [] solo cuando la ruta no tiene restricción extra (usa canSeeDashboard).
 */
export function getRequiredPermissionForAdminPath(pathname: string): Permission[] | null {
  if (!pathname.startsWith("/admin")) return null;
  const path = pathname.replace(/\/$/, "");

  // Dashboard — requiere DASHBOARD_VIEW
  if (path === "/admin" || path === "/admin/dashboard") return ["dashboard.view"];

  // Usuarios y permisos
  if (path === "/admin/users") return ["admin.usuarios"];
  if (path === "/admin/permissions") return ["admin.permisos"];
  if (path === "/admin/roles") return ["admin.roles"];

  // Sucursales y bodegas
  if (path === "/admin/branches") return ["admin.sucursales"];

  // Catálogo
  if (path === "/admin/categories") return ["admin.categorias"];
  if (path === "/admin/products" || path === "/admin/productos") return ["admin.productos"];
  if (path === "/admin/models") return ["admin.modelos"];
  if (path === "/admin/brands") return ["admin.marcas"];
  if (path === "/admin/designs") return ["admin.disenos"];
  if (path === "/admin/promotions" || path === "/admin/promotions/add") return ["admin.promocion"];

  // Pedidos
  if (path === "/admin/pedidos") return ["pedidos.view"];

  // Gestión de empleados / asistencia
  if (path === "/admin/empleados/asistencia/marcar") return ["asistencia.marcar", "asistencia.administrar"];
  if (path === "/admin/empleados/asistencia/reportes") return ["asistencia.reportes"];

  // Reportes
  if (path === "/admin/reportes/ventas") return ["reportes.ventas"];
  if (path === "/admin/reportes/visitas") return ["reportes.visitas"];
  if (path === "/admin/reportes/sugerencias") return ["reportes.sugerencias"];

  // Cualquier otra ruta /admin desconocida — requiere al menos un permiso de staff
  return [];
}

/**
 * Devuelve los permisos requeridos para las rutas de inventario.
 */
export function getRequiredPermissionForInvPath(pathname: string): Permission[] | null {
  if (!pathname.startsWith("/inv")) return null;
  if (pathname.startsWith("/inv/additions")) return ["inventario.ingreso"];
  if (pathname.startsWith("/inv/history")) return ["inventario.historial"];
  return [];
}

/**
 * Indica si el usuario puede acceder al historial de entregas.
 */
export function canAccessDeliveryHistory(privs: Privilegio[]): boolean {
  const names = privs.map((p) => p.nombre);
  return (
    names.includes("PED_HISTORIAL") ||
    names.includes("PED_HISTORIAL_ALL") ||
    names.includes("PED_PEDIDOS") ||
    names.includes("PED_ENTREGA") ||
    names.includes("ALL_ACCESS")
  );
}

/**
 * Determina si una ruta cliente está restringida para usuarios admin.
 */
export function isAdminRestrictedClientRoute(pathname: string): boolean {
  const path = pathname.replace(/\/$/, "") || "/";
  const restrictedRoutes = ["/search", "/contact", "/suggestions", "/cart"];
  const dynamicRoutes = ["/promotion", "/product", "/brand"];

  if (restrictedRoutes.includes(path)) {
    return true;
  }

  return dynamicRoutes.some((route) => path.startsWith(route + "/"));
}

/**
 * Verifica si el usuario tiene permisos de staff (no es cliente ni invitado).
 */
export function isUserAdmin(permissions: Permission[]): boolean {
  return STAFF_PERMISSIONS.some((p) => permissions.includes(p));
}
