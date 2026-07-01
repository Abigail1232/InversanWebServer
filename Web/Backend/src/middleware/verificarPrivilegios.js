/**
 * Middleware de autorizaciÃ³n basado en PRIVILEGIOS.
 *
 * A diferencia de verificarRoles (que solo verifica el ID del rol),
 * este middleware consulta la base de datos en cada request para obtener
 * los privilegios reales asignados al rol del usuario.
 *
 * Ventajas:
 * - Permite agregar/quitar privilegios sin redeploy de cÃ³digo.
 * - Es flexible: un mismo usuario puede tener combinaciones Ãºnicas de permisos.
 * - Si un usuario tiene ALL_ACCESS, el middleware le da paso automÃ¡ticamente.
 * - Datos siempre frescos (no hay cachÃ© en token), si quitas un privilegio
 *   el usuario lo pierde inmediatamente.
 *
 * @param {...string} privilegiosRequeridos - Nombres de privilegios permitidos (uno cualquiera basta)
 * @returns {Function} Middleware de Express
 *
 * Ejemplo de uso:
 *   router.get("/usuarios", verificarToken, verificarPrivilegios("ADM_USUARIOS"), handler);
 *   router.post("/pedidos", verificarToken, verificarPrivilegios("PED_PEDIDOS", "ALL_ACCESS"), handler);
 */
const prisma = require("../config/database");

const verificarPrivilegios = (...privilegiosRequeridos) => {
  return async (req, res, next) => {
    try {
      // 1) Verificar que el usuario estÃ© autenticado
      if (!req.user) {
        return res.status(401).json({ error: "Usuario no autenticado" });
      }

      if (!req.user.rol) {
        return res.status(403).json({ error: "Usuario sin rol asignado" });
      }

      // 2) Si no se requiere ningÃºn privilegio especÃ­fico, basta con estar logueado
      if (!privilegiosRequeridos || privilegiosRequeridos.length === 0) {
        return next();
      }

      // 3) Consultar privilegios reales del rol en la DB
      const relaciones = await prisma.rol_Privilegio.findMany({
        where: { id_rol: req.user.rol },
        include: { privilegio: true },
      });

      const privilegiosUsuario = relaciones.map((r) => r.privilegio.nombre);

      // 4) ALL_ACCESS sortea todo (SuperAdmin)
      if (privilegiosUsuario.includes("ALL_ACCESS")) {
        // Adjuntar privilegios al request por si el controlador los necesita
        req.userPrivileges = privilegiosUsuario;
        return next();
      }

      // 5) Verificar que tenga al menos uno de los privilegios requeridos
      const tienePermiso = privilegiosRequeridos.some((p) =>
        privilegiosUsuario.includes(p)
      );

      if (!tienePermiso) {
        return res.status(403).json({
          error: "Acceso denegado. No cuenta con los privilegios necesarios.",
          requeridos: privilegiosRequeridos,
        });
      }

      // 6) Adjuntar al request para uso del controlador
      req.userPrivileges = privilegiosUsuario;
      next();
    } catch (error) {
      console.error("Error en verificarPrivilegios:", error);
      return res.status(500).json({
        error: "Error interno al verificar privilegios",
      });
    }
  };
};

module.exports = verificarPrivilegios;
