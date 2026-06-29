/**
 * Middleware de protección de rutas.
 *
 * Verifica que el token JWT esté presente en cookies o cabeceras Authorization
 * y agrega el usuario decodificado a `req.user`.
 */
const jsonwebtoken = require("jsonwebtoken");
require("dotenv").config();

const prisma = require("../config/database");

async function verificarToken(req, res, next) {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Token no proporcionado!" });
  }

  try {
    const decoded = jsonwebtoken.verify(token, process.env.JWT_SECRET);
    
    // Verificar en la DB si el usuario sigue activo
    const usuario = await prisma.usuario.findUnique({
      where: { id_usuario: decoded.id },
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

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Token inválido!" });
  }
}

module.exports = verificarToken;
