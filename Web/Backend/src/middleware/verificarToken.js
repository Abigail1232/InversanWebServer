/**
 * Middleware de protección de rutas.
 *
 * Verifica que el token JWT esté presente en cookies o cabeceras Authorization
 * y agrega el usuario decodificado a `req.user`.
 */
const jsonwebtoken = require("jsonwebtoken");
const prisma = require("../config/database");

function logAuthDebug(label, value) {
  if (process.env.DEBUG_AUTH === "true") {
    console.log(`[auth-debug] ${label}:`, value);
  }
}

async function verificarToken(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const cookieToken = req.cookies?.token || null;
  const headerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  logAuthDebug("req.headers.authorization", req.headers.authorization);
  logAuthDebug("req.cookies", req.cookies);

  if (!cookieToken && !headerToken) {
    return res.status(401).json({ error: "Token no proporcionado!" });
  }

  // Intenta primero la cookie; si falla y hay un header token distinto, lo reintenta.
  let decoded;
  const primaryToken = cookieToken || headerToken;
  try {
    decoded = jsonwebtoken.verify(primaryToken, process.env.JWT_SECRET);
  } catch (primaryErr) {
    if (headerToken && headerToken !== cookieToken) {
      try {
        decoded = jsonwebtoken.verify(headerToken, process.env.JWT_SECRET);
      } catch {
        return res.status(401).json({ error: "Token inválido" });
      }
    } else {
      return res.status(401).json({ error: "Token inválido" });
    }
  }

  const idUsuario = Number(decoded.id || decoded.id_usuario);

  if (!idUsuario || Number.isNaN(idUsuario)) {
    return res.status(401).json({ error: "Token inválido" });
  }

  try {
    // Verificar en la DB si el usuario sigue activo
    const usuario = await prisma.usuario.findUnique({
      where: { id_usuario: idUsuario },
      include: { rol: true }
    });

    if (!usuario) {
      return res.status(403).json({ error: "Usuario no encontrado!" });
    }

    if (!usuario.activo) {
      return res.status(403).json({ error: "Su cuenta ha sido desactivada." });
    }

    if (usuario.rol && !usuario.rol.activo) {
      return res.status(403).json({ error: "Su rol ha sido desactivado." });
    }

    req.user = {
      ...decoded,
      id: idUsuario,
      id_usuario: idUsuario,
      rol: usuario.id_rol,
      id_rol: usuario.id_rol,
    };
    logAuthDebug("req.user", req.user);
    next();
  } catch (dbErr) {
    console.error("[verificarToken] Error de DB al verificar sesión:", dbErr);
    return res.status(500).json({ error: "Error interno al verificar sesión." });
  }
}

module.exports = verificarToken;
