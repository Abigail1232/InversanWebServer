const jsonwebtoken = require("jsonwebtoken");
const prisma = require("../config/database");

function getToken(req) {
  const cookieToken = req.cookies?.token || null;
  const authHeader = req.headers.authorization || "";
  const headerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  return cookieToken || headerToken;
}

async function verificarTokenOpcional(req, res, next) {
  const token = getToken(req);

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jsonwebtoken.verify(token, process.env.JWT_SECRET);
    const idUsuario = Number(decoded.id || decoded.id_usuario);

    if (!idUsuario || Number.isNaN(idUsuario)) {
      req.user = null;
      return next();
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id_usuario: idUsuario },
      include: { rol: true },
    });

    if (!usuario || !usuario.activo || (usuario.rol && !usuario.rol.activo)) {
      req.user = null;
      return next();
    }

    req.user = {
      ...decoded,
      id: idUsuario,
      id_usuario: idUsuario,
      rol: usuario.id_rol,
      id_rol: usuario.id_rol,
    };

    return next();
  } catch {
    req.user = null;
    return next();
  }
}

module.exports = verificarTokenOpcional;
