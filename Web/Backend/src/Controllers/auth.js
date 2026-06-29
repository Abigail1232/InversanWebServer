const authService = require("../Services/AuthService");

/**
 * Registra un usuario nuevo en el sistema.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function register(req, res) {
  try {
    const newUser = await authService.register(req.body);
    delete newUser.clave;
    return res.status(201).json({ mensaje: "Usuario registrado correctamente!", user: newUser });
  } catch (err) {
    console.error("Error en register:", err);

    // Manejo de errores que ya tienen un status para devolver mensajes claros.
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }

    const code = err.code || err.prismaCode;
    const msg = (err.meta?.target && Array.isArray(err.meta.target) ? err.meta.target.join(" ") : "") || err.message || "";

    if (code === "P2002" || /Unique constraint|duplicate entry/i.test(String(err.message))) {
      if (/correo/i.test(msg) || /correo|email|unique.*correo/i.test(err.message || "")) {
        return res.status(400).json({ error: "El correo ya está registrado!" });
      }
      if (/usuario|user/i.test(msg) || /usuario|unique.*usuario/i.test(err.message || "")) {
        return res.status(400).json({ error: "El usuario ya existe!" });
      }
      return res.status(400).json({ error: "El usuario o el correo ya están registrados." });
    }

    if (code === "P2003" || /foreign key|rol/i.test(String(err.message))) {
      return res.status(400).json({ error: "Rol no válido. Contacte al administrador." });
    }

    return res.status(500).json({ error: "Error al crear la cuenta. Intente de nuevo." });
  }
}

/**
 * Autentica al usuario y establece una cookie JWT.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function login(req, res) {
  try {
    const { Nameusuario, clave } = req.body;
    const result = await authService.login(Nameusuario, clave);

    res.cookie("token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 60 * 60 * 1000,
    });

    delete result.usuario.clave;

    return res.json({
      mensaje: "Usuario ingreso correctamente",
      success: true,
      token: result.token,
      user: result.usuario
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message, success: false });
    }
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Cierra la sesión del usuario eliminando la cookie JWT.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function logout(req, res) {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });
    res.clearCookie("cart", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    return res.status(200).json({
      mensaje: "Sesión cerrada exitosamente",
    });
  } catch (error) {
    return res.status(500).json({
      mensaje: "Error al cerrar sesión",
      error: error.message,
    });
  }
}

/**
 * Solicita envío de código de recuperación por correo.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const solicitarRecuperacion = async (req, res) => {
  try {
    const { correo } = req.body;
    await authService.solicitarRecuperacion(correo);
    return res.status(200).json({ ok: true, msg: "Código enviado al correo" });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ ok: false, msg: err.message });
    }
    console.error(err);
    return res.status(500).json({ ok: false, msg: "Error al procesar solicitud" });
  }
};

/**
 * Verifica que el código de recuperación sea válido.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const verificarCodigoSolo = async (req, res) => {
  try {
    const { correo, codigo } = req.body;
    await authService.verificarCodigoSolo(correo, codigo);
    return res.status(200).json({ ok: true, msg: "Código válido" });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ ok: false, msg: err.message });
    }
    console.error(err);
    return res.status(500).json({ ok: false, msg: "Error al verificar código" });
  }
};

/**
 * Verifica el código de recuperación y actualiza la contraseña.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const verificarCodigoYCambiarPassword = async (req, res) => {
  try {
    const { correo, codigo, nuevaClave } = req.body;
    await authService.verificarCodigoYCambiarPassword(correo, codigo, nuevaClave);
    return res.status(200).json({ ok: true, msg: "Contraseña actualizada correctamente" });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ ok: false, msg: err.message });
    }
    console.error(err);
    return res.status(500).json({ ok: false, msg: "Error al actualizar contraseña" });
  }
};

module.exports = {
  register,
  login,
  logout,
  solicitarRecuperacion,
  verificarCodigoSolo,
  verificarCodigoYCambiarPassword,
};
