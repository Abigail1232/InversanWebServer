const prisma = require("../../src/config/database");

/**
 * Lista completa de privilegios del sistema.
 *
 * IMPORTANTE: El orden importa porque los IDs se asignan secuencialmente.
 * Si agregas nuevos privilegios, agrégalos al FINAL para no romper las relaciones existentes.
 */
const privilegios = [
  // ===== REPORTES (1-3) =====
  {
    nombre: "REP_VENTAS",
    descripcion: "Visualizar reportes detallados de ventas y estadísticas financieras generales.",
  },
  {
    nombre: "REP_VISITAS",
    descripcion: "Acceso a las métricas de tráfico del sitio, permitiendo ver qué productos son más visitados y el comportamiento de los usuarios en la plataforma.",
  },
  {
    nombre: "REP_SUGERENCIAS",
    descripcion: "Acceso para leer y gestionar las sugerencias y comentarios enviados por los clientes a través del buzón de contacto.",
  },

  // ===== ADMINISTRACIÓN (4-5) =====
  {
    nombre: "ADM_USUARIOS",
    descripcion: "Gestión total de cuentas de usuario: creación, edición de datos, activación/desactivación y asignación de roles de sistema.",
  },
  {
    nombre: "ADM_SUCURSALES",
    descripcion: "Configuración de los datos de la empresa, sucursales y sus respectivas bodegas locales.",
  },

  // ===== INVENTARIO (6-7) =====
  {
    nombre: "INV_INGRESO",
    descripcion: "Capacidad para registrar entradas de nueva mercancía al sistema, actualizando automáticamente el stock disponible por sucursal.",
  },

  // ===== EXTRAS (8-9) =====
  {
    nombre: "IS_MAYORIST",
    descripcion: "Etiqueta de cliente mayorista. Al activarse, habilita el banner de precios especiales y descuentos por volumen en el catálogo.",
  },
  {
    nombre: "ALL_ACCESS",
    descripcion: "Superusuario con permisos totales. Tiene acceso ilimitado a todas las funciones administrativas y operativas sin restricciones.",
  },

  // ===== INVENTARIO HISTORIAL (10) =====
  {
    nombre: "INV_HISTORIAL",
    descripcion: "Acceso a la bitácora histórica de ingresos de inventario para auditoría y control de entradas pasadas.",
  },

  // ===== PEDIDOS (11-14) =====
  {
    nombre: "PED_PEDIDOS",
    descripcion: "Gestión central de órdenes: ver lista general de pedidos, cambiar estados (validar, cancelar) y asignar transportistas.",
  },
  {
    nombre: "PED_ENTREGA",
    descripcion: "Interfaz para repartidores: permite ver las rutas asignadas, marcar pedidos como entregados y administrar entregas activas.",
  },
  {
    nombre: "PED_HISTORIAL",
    descripcion: "Acceso al historial completo de entregas y pedidos finalizados de todos los usuarios.",
  },

  // ===== ADMINISTRACIÓN DE PRODUCTOS (15-19) =====
  {
    nombre: "ADM_MODELOS",
    descripcion: "Gestión del catálogo de modelos asociados a los productos (especificaciones técnicas y variantes).",
  },
  {
    nombre: "ADM_PRODUCTOS",
    descripcion: "Control total del catálogo de productos: subir nuevas unidades, editar fotos, nombres, precios y stock inicial.",
  },
  {
    nombre: "ADM_MARCAS",
    descripcion: "Administración de las marcas comerciales que representan a los productos en la tienda virtual.",
  },
  {
    nombre: "ADM_PROMOCIONES",
    descripcion: "Creación y gestión de descuentos temporales, ofertas especiales y configuración de banners promocionales.",
  },
  {
    nombre: "ADM_CATEGORIAS",
    descripcion: "Organización del catálogo mediante la creación y edición de categorías y subcategorías de productos.",
  },

  // ===== SEGURIDAD Y CONFIGURACIÓN (20-23) =====
  {
    nombre: "ADM_ROLES",
    descripcion: "Gestión de la estructura jerárquica: crear nuevos perfiles (ej. Vendedor, Gestor) y administrar sus nombres.",
  },
  {
    nombre: "ADM_DISENOS",
    descripcion: "Gestión de los diseños de rines y variantes visuales que se muestran en la galería de productos.",
  },
  {
    nombre: "DASHBOARD_VIEW",
    descripcion: "Acceso al panel principal de estadísticas: resumen de ventas, stock crítico y alertas operativas del día.",
  },

  // ===== CLIENTES Y PERMISOS (24-25) =====
  {
    nombre: "SOLO_CLIENTES",
    descripcion: "Permiso de navegación: permite al usuario buscar productos y ver el carrito. Habilita la barra de búsqueda y oculta el panel administrativo.",
  },
  {
    nombre: "ADM_PERMISOS",
    descripcion: "Control granular de seguridad: asignar y remover privilegios específicos a cada rol definido en el sistema.",
  },
];

async function Privilegios() {
  for (const privilegio of privilegios) {
    await prisma.privilegio.create({
      data: privilegio,
    });
  }
  console.log("Privilegios insertados");
}

module.exports = { Privilegios };
