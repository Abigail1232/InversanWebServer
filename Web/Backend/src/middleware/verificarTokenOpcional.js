const jsonwebtoken = require("jsonwebtoken");

const prisma = require("../config/database");

function logAuthDebug(label, value) {
  if (process.env.DEBUG_AUTH === "true") {
    console.log(`[auth-debug-optional] ${label}:`, value);
  }
}

async function verificarTokenOpcional(req, res, next) {
  const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

  logAuthDebug("req.headers.authorization", req.headers.authorization);
  logAuthDebug("req.cookies", req.cookies);

  // ✅ Si no hay token → invitado, NO bloquea
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jsonwebtoken.verify(token, process.env.JWT_SECRET);
    
    // Verificar si el usuario sigue activo
    const usuario = await prisma.usuario.findUnique({
      where: { id_usuario: decoded.id }
    });

    if (!usuario || !usuario.activo) {
      req.user = null; // Tratamos como invitado si está desactivado o no existe
    } else {
      req.user = decoded; // ✅ logueado y activo
    }
    logAuthDebug("req.user", req.user);
    return next();
  } catch (err) {
    // ✅ token inválido → tratamos como invitado (NO bloquea)
    req.user = null;
    return next();
  }
}

module.exports = verificarTokenOpcional;