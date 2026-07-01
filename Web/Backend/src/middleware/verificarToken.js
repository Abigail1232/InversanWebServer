/**
 * Middleware de protección de rutas.
 * Lee JWT desde cookie `token` o header `Authorization: Bearer`.
 */
const jsonwebtoken = require("jsonwebtoken");
const prisma = require("../config/database");

function getToken(req) {
  const cookieToken = req.cookies?.token || null;
  const authHeader = req.headers.authorization || "";
  const headerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  return cookieToken || headerToken;
}

async function verificarToken(req, res, next) {
  const token = getToken(req);

  if (!token) {
    return res.status(401).json({ success: false, error: "No autenticado" });
  }

  let decoded;
  try {
    decoded = jsonwebtoken.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return res.status(401).json({ success: false, error: "Token inválido o expirado" });
  }

  const idUsuario = Number(decoded.id || decoded.id_usuario);
  if (!idUsuario || Number.isNaN(idUsuario)) {
    return res.status(401).json({ success: false, error: "Token inválido" });
  }

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id_usuario: idUsuario },
      include: { rol: true },
    });

    if (!usuario) {
      return res.status(401).json({ success: false, error: "Sesión inválida. Inicie sesión nuevamente." });
    }

    if (!usuario.activo) {
      return res.status(403).json({ success: false, error: "Su cuenta ha sido desactivada." });
    }

    if (usuario.rol && !usuario.rol.activo) {
      return res.status(403).json({ success: false, error: "Su rol ha sido desactivado." });
    }

    req.user = {
      ...decoded,
      id: idUsuario,
      id_usuario: idUsuario,
      rol: usuario.id_rol,
      id_rol: usuario.id_rol,
      usuario: usuario.usuario,
      correo: usuario.correo,
    };

    return next();
  } catch (error) {
    console.error("[verificarToken] Error DB:", error);
    return res.status(500).json({ success: false, error: "Error interno al verificar sesión." });
  }
}

module.exports = verificarToken;
