/**
 * Constantes de roles del sistema.
 * 
 * Este archivo centraliza la definición de IDs de roles para evitar
 * el uso de números mágicos (hardcoded) en el código y facilitar el mantenimiento.
 * 
 * Los IDs deben coincidir con los definidos en el seeder de roles:
 * @see src/seeders/Roles.js
 */

const ROLES = {
  ADMIN: 1,
  VENDEDOR: 2,
  GESTOR: 3,
  USER: 4,
  MAYOREO: 5,
};

/**
 * Grupos de roles para facilitar la aplicación de permisos.
 */
const ROLE_GROUPS = {
  // Administradores con acceso completo
  ADMIN_ONLY: [ROLES.ADMIN],
  
  // Roles administrativos (Admin y Gestor)
  ADMIN_GESTOR: [ROLES.ADMIN, ROLES.GESTOR],
  
  // Roles de gestión (Admin, Vendedor y Gestor)
  GESTION: [ROLES.ADMIN, ROLES.VENDEDOR, ROLES.GESTOR],
  
  // Todos los roles internos (excepto User y Mayoreo)
  INTERNOS: [ROLES.ADMIN, ROLES.VENDEDOR, ROLES.GESTOR],
  
  // Todos los roles
  TODOS: [ROLES.ADMIN, ROLES.VENDEDOR, ROLES.GESTOR, ROLES.USER, ROLES.MAYOREO],
};

module.exports = {
  ROLES,
  ROLE_GROUPS,
};
