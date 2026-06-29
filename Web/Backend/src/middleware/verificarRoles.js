/**
 * Middleware de autorización basado en roles.
 *
 * Verifica que el usuario autenticado tenga uno de los roles permitidos
 * para acceder a la ruta protegida.
 *
 * @param {...number} rolesAdmitidos - IDs de roles que tienen acceso permitido
 * @returns {Function} Middleware de Express
 */
const verificarRoles = (...rolesAdmitidos) => {
  return (req, res, next) => {
    // Verificar que el usuario esté autenticado (req.user debe existir)
    if (!req.user) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    // Verificar que el usuario tenga un rol asignado
    if (!req.user.rol) {
      return res.status(403).json({ error: "Usuario sin rol asignado" });
    }

    // Verificar que el rol del usuario esté en la lista de roles admitidos
    if (!rolesAdmitidos.includes(req.user.rol)) {
      return res.status(403).json({ 
        error: "Acceso denegado por nivel de privilegio" 
      });
    }

    // Si todas las validaciones pasan, continuar al siguiente middleware/controlador
    next();
  };
};

module.exports = verificarRoles;
