/**
 * Constantes de privilegios del sistema.
 *
 * Este archivo centraliza los nombres de privilegios para evitar typos
 * y facilitar el mantenimiento. Los nombres deben coincidir EXACTAMENTE
 * con los definidos en el seeder de privilegios.
 *
 * @see src/seeders/privilegios.js
 */

const PRIVILEGIOS = {
  // ===== REPORTES =====
  /** Ver reportes y estadísticas de ventas */
  VER_REPORTE_VENTAS: "REP_VENTAS",
  /** Ver métricas de tráfico y visitas */
  VER_REPORTE_VISITAS: "REP_VISITAS",
  /** Ver reportes de sugerencias de clientes */
  VER_REPORTE_SUGERENCIAS: "REP_SUGERENCIAS",

  // ===== ADMINISTRACIÓN DE USUARIOS Y SISTEMA =====
  /** Crear, editar y desactivar cuentas de usuario y sus roles */
  GESTIONAR_USUARIOS: "ADM_USUARIOS",
  /** Administrar datos de sucursales y sus respectivas bodegas */
  GESTIONAR_SUCURSALES: "ADM_SUCURSALES",
  /** Crear y gestionar roles y sus privilegios */
  GESTIONAR_ROLES: "ADM_ROLES",

  // ===== ADMINISTRACIÓN DE CATÁLOGO =====
  /** Gestionar y crear productos */
  GESTIONAR_PRODUCTOS: "ADM_PRODUCTOS",
  /** Gestionar y crear marcas */
  GESTIONAR_MARCAS: "ADM_MARCAS",
  /** Gestionar y crear modelos de productos */
  GESTIONAR_MODELOS: "ADM_MODELOS",
  /** Gestionar y crear categorías */
  GESTIONAR_CATEGORIAS: "ADM_CATEGORIAS",
  /** Gestionar y crear diseños de productos */
  GESTIONAR_DISENOS: "ADM_DISENOS",
  /** Gestionar y crear promociones */
  GESTIONAR_PROMOCIONES: "ADM_PROMOCIONES",

  // ===== INVENTARIO =====
  /** Registrar nueva mercancía (ingresos) */
  REGISTRAR_INGRESO_INVENTARIO: "INV_INGRESO",
  /** Ver bitácora de ingresos de inventario */
  VER_HISTORIAL_INVENTARIO: "INV_HISTORIAL",


  // ===== ASISTENCIAS =====
  /** Marcar asistencia de empleados en la sucursal asignada */
  MARCAR_ASISTENCIA: "ASI_MARCAR",
  /** Administrar asistencia de cualquier sucursal */
  ADMINISTRAR_ASISTENCIA: "ASI_ADMINISTRAR",
  /** Ver reportes de asistencias */
  VER_REPORTES_ASISTENCIA: "ASI_REPORTES",

  // ===== PEDIDOS =====
  /** Gestionar pedidos: asignar repartidores, cambiar estado */
  GESTIONAR_PEDIDOS: "PED_PEDIDOS",
  /** Realizar entregas de pedidos (repartidor) */
  REALIZAR_ENTREGAS: "PED_ENTREGA",
  /** Ver historial completo de entregas y pedidos realizados */
  VER_HISTORIAL_ENTREGAS: "PED_HISTORIAL",

  // ===== ESPECIALES =====
  /** Acceso total al sistema (SuperAdmin) */
  ACCESO_TOTAL: "ALL_ACCESS",
  /** Indica si el usuario es mayorista (precios especiales) */
  ES_MAYORISTA: "IS_MAYORIST",
  /** Ver el dashboard administrativo con estadísticas generales */
  VER_DASHBOARD: "DASHBOARD_VIEW",

  // ===== CLIENTES =====
  /** Exclusivo de clientes. Permite barra de búsqueda, restringe otros permisos */
  SOLO_CLIENTES: "SOLO_CLIENTES",

  // ===== ALIASES COMPATIBLES (para minimizar cambios en otros archivos) =====
  // Usados en rutas y middlewares que aún no se han migrado
  SOLO_CLIENTES: "SOLO_CLIENTES",
  REP_VENTAS: "REP_VENTAS",
  REP_VISITAS: "REP_VISITAS",
  REP_SUGERENCIAS: "REP_SUGERENCIAS",
  ADM_USUARIOS: "ADM_USUARIOS",
  ADM_SUCURSALES: "ADM_SUCURSALES",
  ADM_ROLES: "ADM_ROLES",
  ADM_MODELOS: "ADM_MODELOS",
  ADM_PRODUCTOS: "ADM_PRODUCTOS",
  ADM_MARCAS: "ADM_MARCAS",
  ADM_PROMOCIONES: "ADM_PROMOCIONES",
  ADM_CATEGORIAS: "ADM_CATEGORIAS",
  ADM_DISENOS: "ADM_DISENOS",
  INV_INGRESO: "INV_INGRESO",
  INV_HISTORIAL: "INV_HISTORIAL",
  ASI_MARCAR: "ASI_MARCAR",
  ASI_ADMINISTRAR: "ASI_ADMINISTRAR",
  ASI_REPORTES: "ASI_REPORTES",
  PED_PEDIDOS: "PED_PEDIDOS",
  PED_ENTREGA: "PED_ENTREGA",
  PED_HISTORIAL: "PED_HISTORIAL",
  ALL_ACCESS: "ALL_ACCESS",
  IS_MAYORIST: "IS_MAYORIST",
  DASHBOARD_VIEW: "DASHBOARD_VIEW",
};

/**
 * Grupos de privilegios comunes para reutilizar en rutas.
 */
const PRIVILEGE_GROUPS = {
  // Gestión completa de productos
  GESTION_PRODUCTOS: [
    PRIVILEGIOS.ADM_PRODUCTOS,
    PRIVILEGIOS.ADM_CATEGORIAS,
    PRIVILEGIOS.ADM_MARCAS,
    PRIVILEGIOS.ADM_MODELOS,
    PRIVILEGIOS.ADM_DISENOS,
  ],

  // Cualquier privilegio de inventario
  INVENTARIO: [PRIVILEGIOS.INV_INGRESO, PRIVILEGIOS.INV_HISTORIAL],

  // Cualquier privilegio de asistencias
  ASISTENCIAS: [
    PRIVILEGIOS.ASI_MARCAR,
    PRIVILEGIOS.ASI_ADMINISTRAR,
    PRIVILEGIOS.ASI_REPORTES,
  ],

  // Cualquier privilegio de pedidos
  PEDIDOS_GESTION: [
    PRIVILEGIOS.PED_PEDIDOS,
    PRIVILEGIOS.PED_ENTREGA,
    PRIVILEGIOS.PED_HISTORIAL,
  ],

  // Reportes generales
  REPORTES: [
    PRIVILEGIOS.REP_VENTAS,
    PRIVILEGIOS.REP_VISITAS,
    PRIVILEGIOS.REP_SUGERENCIAS,
  ],
};

module.exports = {
  PRIVILEGIOS,
  PRIVILEGE_GROUPS,
};
