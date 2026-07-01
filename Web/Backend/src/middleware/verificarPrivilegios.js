const prisma = require("../config/database");

const verificarPrivilegios = (...privilegiosRequeridos) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: "Usuario no autenticado" });
      }

      const idRol = Number(req.user.rol || req.user.id_rol);

      if (!idRol || Number.isNaN(idRol)) {
        return res.status(403).json({ success: false, error: "Usuario sin rol asignado" });
      }

      // Admin base del sistema: evita falsos 403 si Rol_Privilegio queda incompleto tras limpieza/seed.
      if (idRol === 1) {
        req.userPrivileges = ["ALL_ACCESS"];
        return next();
      }

      if (!privilegiosRequeridos || privilegiosRequeridos.length === 0) {
        return next();
      }

      const relaciones = await prisma.rol_Privilegio.findMany({
        where: { id_rol: idRol },
        include: { privilegio: true },
      });

      const privilegiosUsuario = relaciones
        .map((r) => r.privilegio?.nombre)
        .filter(Boolean);

      if (privilegiosUsuario.includes("ALL_ACCESS")) {
        req.userPrivileges = privilegiosUsuario;
        return next();
      }

      const tienePermiso = privilegiosRequeridos.some((p) =>
        privilegiosUsuario.includes(p)
      );

      if (!tienePermiso) {
        return res.status(403).json({
          success: false,
          error: "Acceso denegado. No cuenta con los privilegios necesarios.",
          requeridos: privilegiosRequeridos,
        });
      }

      req.userPrivileges = privilegiosUsuario;
      return next();
    } catch (error) {
      console.error("Error en verificarPrivilegios:", error);
      return res.status(500).json({
        success: false,
        error: "Error interno al verificar privilegios",
      });
    }
  };
};

module.exports = verificarPrivilegios;
