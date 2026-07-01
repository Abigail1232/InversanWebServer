const bcrypt = require("bcrypt");
const prisma = require("../config/database");
const jsonwebtoken = require("jsonwebtoken");
const redis = require("../middleware/redisConfig");
const transporter = require("../middleware/mailerConfig");
const path = require("path");

function validarPassword(password) {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
  return regex.test(password);
}

class AuthService {
  async register(datos) {
    let {
      usuario,
      primer_nombre,
      primer_apellido,
      segundo_nombre,
      segundo_apellido,
      correo,
      clave,
    } = datos;

    usuario = typeof usuario === "string" ? usuario.trim() : "";
    primer_nombre = typeof primer_nombre === "string" ? primer_nombre.trim() : "";
    primer_apellido = typeof primer_apellido === "string" ? primer_apellido.trim() : "";
    segundo_nombre = typeof segundo_nombre === "string" ? segundo_nombre.trim() : "";
    segundo_apellido = typeof segundo_apellido === "string" ? segundo_apellido.trim() : "";
    correo = typeof correo === "string" ? correo.trim().toLowerCase() : "";
    clave = typeof clave === "string" ? clave : "";

    if (!usuario || !correo || !clave) {
      throw { status: 400, message: "Todos los campos son obligatorios!" };
    }
    if (!primer_nombre || !primer_apellido) {
      throw { status: 400, message: "Debe tener al menos un nombre y un apellido" };
    }
    if (!validarPassword(clave)) {
      throw { status: 400, message: "La contraseña debe tener al menos 8 caracteres, una letra mayúscula, una letra minúscula, un número y un símbolo especial!" };
    }

    const Clavehash = await bcrypt.hash(clave, 10);

    const UserExist = await prisma.usuario.findFirst({ where: { usuario } });
    if (UserExist) {
      throw { status: 400, message: "El usuario ya existe!" };
    }

    const EmailExist = await prisma.usuario.findFirst({ where: { correo } });
    if (EmailExist) {
      throw { status: 400, message: "El correo ya está registrado!" };
    }

    const newUser = await prisma.usuario.create({
      data: {
        usuario,
        primer_nombre,
        primer_apellido,
        correo,
        clave: Clavehash,
        id_rol: 4, 
      },
    });

    try {
      await transporter.sendMail({
        from: `"INVERSAN" <${process.env.EMAIL_USER}>`,
        to: correo,
        subject: "¡Bienvenido INVERSAN! Tu cuenta ha sido creada exitosamente",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #027eb1; margin-bottom: 10px;">¡Bienvenido a INVERSAN!</h1>
              <p style="color: #6c757d; font-size: 16px;">Tu cuenta ha sido creada exitosamente</p>
            </div>
            
            <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 30px;">
              <h2 style="color: #333; margin-bottom: 20px;">Hola ${primer_nombre} ${primer_apellido},</h2>
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                Nos complace darte la bienvenida. Tu cuenta ha sido creada exitosamente y ya puedes aprovechar todos nuestros productos y servicios.
              </p>
              
              <div style="background-color: #e8f4f8; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="color: #027eb1; margin-bottom: 15px;">Detalles de tu cuenta:</h3>
                <ul style="color: #666; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li><strong>Usuario:</strong> ${usuario}</li>
                  <li><strong>Correo:</strong> ${correo}</li>
                  <li><strong>Fecha de registro:</strong> ${new Date().toLocaleDateString("es-HN")}</li>
                </ul>
              </div>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
                Ahora puedes acceder a nuestro catálogo completo de llantas y neumáticos, gestionar tus pedidos y disfrutar de todas las ventajas que ofrecemos a nuestros clientes.
              </p>
              
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || "https://inversan.com"}" 
                   style="display: inline-block; background-color: #027eb1; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                  Ir a la Tienda Online
                </a>
              </div>
            </div>
          </div>
        `,
      });
    } catch (emailError) {}

    return newUser;
  }

  async login(Nameusuario, clave) {
    if (!Nameusuario || !clave) {
      throw { status: 400, message: "Ingresar nombre y contraseña!" };
    }

    const Usuariof = await prisma.usuario.findFirst({
      where: { usuario: Nameusuario },
      include: { rol: true } // Incluimos el rol para verificar si está activo también
    });

    // Mensaje genérico para evitar user enumeration (mismo error para usuario no encontrado o clave incorrecta)
    const INVALID_CREDENTIALS_MSG = "Usuario o contraseña incorrectos.";

    if (!Usuariof) {
      throw { status: 401, message: INVALID_CREDENTIALS_MSG };
    }

    // Verificar si el usuario está activo
    if (!Usuariof.activo) {
      throw { status: 403, message: "Su cuenta está desactivada. Contacte al administrador." };
    }

    // Opcional: Verificar si el rol del usuario está activo
    if (Usuariof.rol && !Usuariof.rol.activo) {
      throw { status: 403, message: "Su rol de usuario está desactivado. Contacte al administrador." };
    }

    const verificar_contra = await bcrypt.compare(clave, Usuariof.clave);
    if (!verificar_contra) {
      throw { status: 401, message: INVALID_CREDENTIALS_MSG };
    }

    const payload = {
      id: Usuariof.id_usuario,
      nombre: Usuariof.usuario,
      rol: Usuariof.id_rol,
    };

    const token = jsonwebtoken.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "2h",
    });

    return { token, usuario: Usuariof };
  }

  async solicitarRecuperacion(correo) {
    const usuario = await prisma.usuario.findFirst({ where: { correo } });

    // Respuesta genérica siempre: no revelar si el correo existe o no (evita user enumeration)
    if (!usuario || !usuario.activo) {
      return true; // Silencioso — el frontend siempre muestra "Código enviado si el correo existe"
    }

    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    await redis.set(`recovery:${correo}`, codigo, "EX", 600);

    try {
      await transporter.sendMail({
        from: `"INVERSAN - Soporte" <${process.env.EMAIL_USER}>`,
        to: correo,
        subject: `🔑 ${codigo} es tu código de recuperación - INVERSAN`,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
            <div style="background-color: #027eb1; padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">INVERSAN</h1>
            </div>
            <div style="padding: 40px 30px; text-align: center;">
              <h2>Restablecer Contraseña</h2>
              <div style="background-color: #f4f7f9; border: 2px dashed #027eb1; padding: 20px; margin: 30px 0;">
                <span style="font-size: 32px; font-weight: bold; color: #027eb1; letter-spacing: 8px;">${codigo}</span>
              </div>
              <p>Este código es válido por 10 minutos.</p>
            </div>
          </div>
        `
      });
    } catch (emailError) {
      console.error("[AuthService] Error enviando correo de recuperación:", emailError.message);
      throw { status: 503, message: "No se pudo enviar el correo de recuperación. Intente de nuevo en unos minutos." };
    }

    return true;
  }

  async verificarCodigoSolo(correo, codigo) {
    if (!correo || !codigo) {
      throw { status: 400, message: "Correo y código son obligatorios" };
    }
    const codigoGuardado = await redis.get(`recovery:${correo}`);
    if (!codigoGuardado) {
      throw { status: 400, message: "El código ha expirado o no existe" };
    }
    if (codigoGuardado !== codigo) {
      throw { status: 400, message: "Código incorrecto" };
    }
    return true;
  }

  async verificarCodigoYCambiarPassword(correo, codigo, nuevaClave) {
    if (!correo || !codigo || !nuevaClave) {
      throw { status: 400, message: "Correo, código y nueva clave son obligatorios" };
    }

    if (!validarPassword(nuevaClave)) {
      throw { status: 400, message: "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo especial" };
    }

    const codigoGuardado = await redis.get(`recovery:${correo}`);
    if (!codigoGuardado || codigoGuardado !== codigo) {
      throw { status: 400, message: "El código es incorrecto o ha expirado" };
    }

    const usuario = await prisma.usuario.findFirst({ where: { correo } });
    if (!usuario) {
      throw { status: 404, message: "Usuario no encontrado" };
    }

    const passDiferente = await bcrypt.compare(nuevaClave, usuario.clave);
    if (passDiferente) {
      throw { status: 400, message: "La nueva contraseña debe ser diferente a la actual" };
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash(nuevaClave, salt);

    await prisma.usuario.updateMany({
      where: { correo: correo },
      data: { clave: hashedPass },
    });

    await redis.del(`recovery:${correo}`);
    return true;
  }
}

module.exports = new AuthService();
