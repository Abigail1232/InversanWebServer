const bcrypt = require("bcrypt");
const prisma = require("../config/database");

function validarPassword(password) {
  const regex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
  return regex.test(password);
}

function cleanString(value, lower = false) {
  if (typeof value !== "string") return value;
  const v = value.trim();
  return lower ? v.toLowerCase() : v;
}

async function roleExist(id_rol) {
  const rol = await prisma.rol.findUnique({
    where: { id_rol: Number(id_rol) },
  });
  return !!rol;
}

const userSelect = {
  id_usuario: true,
  usuario: true,
  correo: true,
  primer_nombre: true,
  segundo_nombre: true,
  primer_apellido: true,
  segundo_apellido: true,
  telefono: true,
  activo: true,
  id_rol: true,
  rol: {
    select: {
      id_rol: true,
      nombre: true,
      descripcion: true,
      rol_privilegio: {
        select: {
          privilegio: {
            select: {
              nombre: true,
            },
          },
        },
      },
    },
  },
  empleado_sucursal: {
    select: {
      id_sucursal: true,
      sucursal: {
        select: {
          nombre: true,
        },
      },
    },
  },
};

async function getAllUsers(req, res) {
  try {
    const users = await prisma.usuario.findMany({
      select: userSelect,
      orderBy: { id_usuario: "desc" },
    });

    return res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ error: "Error fetching users" });
  }
}

async function getUserById(req, res) {
  try {
    const id = Number(req.params.id);

    const user = await prisma.usuario.findUnique({
      where: { id_usuario: id },
      select: userSelect,
    });

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    return res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({ error: "Error fetching user" });
  }
}

async function createUser(req, res) {
  try {
    let {
      usuario,
      correo,
      clave,
      primer_nombre,
      segundo_nombre,
      primer_apellido,
      segundo_apellido,
      telefono,
      id_rol,
    } = req.body;

    usuario = cleanString(usuario);
    correo = cleanString(correo, true);
    clave = typeof clave === "string" ? clave : "";
    primer_nombre = cleanString(primer_nombre);
    segundo_nombre = cleanString(segundo_nombre);
    primer_apellido = cleanString(primer_apellido);
    segundo_apellido = cleanString(segundo_apellido);
    telefono = cleanString(telefono);
    id_rol = Number(id_rol);

    if (!usuario || !correo || !clave || !primer_nombre || !primer_apellido || !id_rol) {
      return res.status(400).json({ error: "Todos los campos obligatorios deben ser enviados" });
    }

    if (!validarPassword(clave)) {
      return res.status(400).json({
        error:
          "La contraseña debe tener al menos 8 caracteres, una letra mayúscula, una letra minúscula, un número y un símbolo especial!",
      });
    }

    if (!(await roleExist(id_rol))) {
      return res.status(400).json({ error: "El rol enviado no existe" });
    }

    const userByUsername = await prisma.usuario.findUnique({
      where: { usuario },
    });

    if (userByUsername) {
      return res.status(400).json({ error: "El nombre de usuario ya está en uso." });
    }

    const userByEmail = await prisma.usuario.findUnique({
      where: { correo },
    });

    if (userByEmail) {
      return res.status(400).json({ error: "El correo ya está registrado." });
    }

    const hashedPassword = await bcrypt.hash(clave, 10);

    const newUser = await prisma.usuario.create({
      data: {
        usuario,
        correo,
        clave: hashedPassword,
        primer_nombre,
        segundo_nombre: segundo_nombre || null,
        primer_apellido,
        segundo_apellido: segundo_apellido || null,
        telefono: telefono || null,
        id_rol,
      },
      select: userSelect,
    });

    return res.status(201).json({
      mensaje: "Usuario creado correctamente",
      user: newUser,
    });
  } catch (error) {
    console.error("Error al crear usuario:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

async function updateUser(req, res) {
  try {
    const id = Number(req.params.id);
    let {
      usuario,
      correo,
      primer_nombre,
      segundo_nombre,
      primer_apellido,
      segundo_apellido,
      telefono,
      id_rol,
    } = req.body;

    usuario = cleanString(usuario);
    correo = cleanString(correo, true);
    primer_nombre = cleanString(primer_nombre);
    segundo_nombre = cleanString(segundo_nombre);
    primer_apellido = cleanString(primer_apellido);
    segundo_apellido = cleanString(segundo_apellido);
    telefono = cleanString(telefono);

    if (id_rol !== undefined) {
      id_rol = Number(id_rol);
      if (!(await roleExist(id_rol))) {
        return res.status(400).json({ error: "El rol enviado no existe" });
      }
    }

    const userExists = await prisma.usuario.findUnique({
      where: { id_usuario: id },
    });

    if (!userExists) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    if (usuario && usuario !== userExists.usuario) {
      const usuarioOcupado = await prisma.usuario.findUnique({
        where: { usuario },
      });

      if (usuarioOcupado) {
        return res.status(400).json({ error: "El nombre de usuario ya está en uso." });
      }
    }

    if (correo && correo !== userExists.correo) {
      const correoOcupado = await prisma.usuario.findUnique({
        where: { correo },
      });

      if (correoOcupado) {
        return res.status(400).json({ error: "El correo ya está registrado." });
      }
    }

    const updatedUser = await prisma.usuario.update({
      where: { id_usuario: id },
      data: {
        usuario,
        correo,
        primer_nombre,
        segundo_nombre: segundo_nombre === "" ? null : segundo_nombre,
        primer_apellido,
        segundo_apellido: segundo_apellido === "" ? null : segundo_apellido,
        telefono: telefono === "" ? null : telefono,
        id_rol,
      },
      select: userSelect,
    });

    return res.json({
      mensaje: "Usuario actualizado correctamente",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

async function desactivarUsuario(req, res) {
  try {
    const id = Number(req.params.id);

    const user = await prisma.usuario.findUnique({
      where: { id_usuario: id },
    });

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado!" });
    }

    const updatedUser = await prisma.usuario.update({
      where: { id_usuario: id },
      data: { activo: false },
      select: userSelect,
    });

    return res.json({
      mensaje: "Usuario desactivado correctamente!",
      user: updatedUser,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function ActivarUsuario(req, res) {
  try {
    const id = Number(req.params.id);

    const user = await prisma.usuario.findUnique({
      where: { id_usuario: id },
    });

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado!" });
    }

    const updatedUser = await prisma.usuario.update({
      where: { id_usuario: id },
      data: { activo: true },
      select: userSelect,
    });

    return res.json({
      mensaje: "Usuario activado correctamente!",
      user: updatedUser,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function changePassword(req, res) {
  try {
    const id = Number(req.params.id);
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ error: "La nueva contraseña es obligatoria!" });
    }

    if (!validarPassword(newPassword)) {
      return res.status(400).json({
        error:
          "La nueva contraseña debe tener al menos 8 caracteres, una letra mayúscula, una letra minúscula, un número y un símbolo especial!",
      });
    }

    const user = await prisma.usuario.findUnique({
      where: { id_usuario: id },
    });

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado!" });
    }

    const passDiferente = await bcrypt.compare(newPassword, user.clave);

    if (passDiferente) {
      return res.status(400).json({
        error: "La nueva contraseña debe ser diferente a la actual!",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.usuario.update({
      where: { id_usuario: id },
      data: { clave: hashedPassword },
    });

    return res.json({
      mensaje: "Contraseña actualizada correctamente!",
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function changeRolUser(req, res) {
  try {
    const id = Number(req.params.id);
    const { id_rol } = req.body;

    if (!id_rol) {
      return res.status(400).json({ error: "El nuevo ID del rol es obligatorio!" });
    }

    if (!(await roleExist(id_rol))) {
      return res.status(400).json({ error: "El rol con ese ID no existe!" });
    }

    const user = await prisma.usuario.findUnique({
      where: { id_usuario: id },
    });

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado!" });
    }

    const updatedUser = await prisma.usuario.update({
      where: { id_usuario: id },
      data: { id_rol: Number(id_rol) },
      select: userSelect,
    });

    return res.json({
      mensaje: "Rol del usuario actualizado correctamente!",
      user: updatedUser,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function getMe(req, res) {
  try {
    const idUsuario = Number(req.user?.id);

    if (!idUsuario || Number.isNaN(idUsuario)) {
      return res.status(401).json({ error: "Token inválido o sin id de usuario" });
    }

    const user = await prisma.usuario.findUnique({
      where: { id_usuario: idUsuario },
      select: userSelect,
    });

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    return res.json({ user });
  } catch (error) {
    return res.status(500).json({ error: "Error al obtener el perfil del usuario" });
  }
}

async function updateMe(req, res) {
  try {
    const idUsuario = Number(req.user?.id);
    if (!idUsuario || Number.isNaN(idUsuario)) {
      return res.status(401).json({ error: "Token inválido o sin id de usuario" });
    }

    let {
      usuario,
      correo,
      primer_nombre,
      segundo_nombre,
      primer_apellido,
      segundo_apellido,
      telefono,
    } = req.body;

    usuario = cleanString(usuario);
    correo = cleanString(correo, true);
    primer_nombre = cleanString(primer_nombre);
    segundo_nombre = cleanString(segundo_nombre);
    primer_apellido = cleanString(primer_apellido);
    segundo_apellido = cleanString(segundo_apellido);
    telefono = cleanString(telefono);

    if (!usuario || !correo || !primer_nombre || !primer_apellido) {
      return res.status(400).json({ error: "El nombre de usuario, correo, primer nombre y primer apellido son obligatorios." });
    }

    const userExists = await prisma.usuario.findUnique({
      where: { id_usuario: idUsuario },
    });

    if (!userExists) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    if (usuario && usuario !== userExists.usuario) {
      const usuarioOcupado = await prisma.usuario.findUnique({
        where: { usuario },
      });

      if (usuarioOcupado) {
        return res.status(400).json({ error: "El nombre de usuario ya está en uso." });
      }
    }

    if (correo && correo !== userExists.correo) {
      const correoOcupado = await prisma.usuario.findUnique({
        where: { correo },
      });

      if (correoOcupado) {
        return res.status(400).json({ error: "El correo ya está registrado." });
      }
    }

    const updatedUser = await prisma.usuario.update({
      where: { id_usuario: idUsuario },
      data: {
        usuario,
        correo,
        primer_nombre,
        segundo_nombre: segundo_nombre === "" ? null : segundo_nombre,
        primer_apellido,
        segundo_apellido: segundo_apellido === "" ? null : segundo_apellido,
        telefono: telefono === "" ? null : telefono,
      },
      select: userSelect,
    });

    return res.json({
      mensaje: "Perfil actualizado correctamente",
      user: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

async function changeMyPassword(req, res) {
  try {
    const idUsuario = Number(req.user?.id);
    const { currentPassword, newPassword } = req.body;

    if (!idUsuario || Number.isNaN(idUsuario)) {
      return res.status(401).json({ error: "Token inválido o sin id de usuario" });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: "Debes enviar la contraseña actual y la nueva contraseña",
      });
    }

    if (!validarPassword(newPassword)) {
      return res.status(400).json({
        error:
          "La nueva contraseña debe tener al menos 8 caracteres, una letra mayúscula, una letra minúscula, un número y un símbolo especial!",
      });
    }

    const user = await prisma.usuario.findUnique({
      where: { id_usuario: idUsuario },
    });

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const currentMatches = await bcrypt.compare(currentPassword, user.clave);
    if (!currentMatches) {
      return res.status(400).json({ error: "La contraseña actual no es correcta" });
    }

    const passDiferente = await bcrypt.compare(newPassword, user.clave);
    if (passDiferente) {
      return res.status(400).json({
        error: "La nueva contraseña debe ser diferente a la actual!",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.usuario.update({
      where: { id_usuario: idUsuario },
      data: { clave: hashedPassword },
    });

    return res.json({ mensaje: "Contraseña actualizada correctamente!" });
  } catch (error) {
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

async function ListarPrivilegiosMe(req, res) {
  try {
    const idUsuario = Number(req.user?.id);

    if (!idUsuario || Number.isNaN(idUsuario)) {
      return res.status(401).json({ error: "Token inválido o sin id de usuario" });
    }

    const usuarioConPrivilegios = await prisma.usuario.findUnique({
      where: { id_usuario: idUsuario },
      select: {
        rol: {
          include: {
            rol_privilegio: {
              include: { privilegio: true },
            },
          },
        },
      },
    });

    if (!usuarioConPrivilegios) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const privilegios = (usuarioConPrivilegios.rol?.rol_privilegio ?? []).map(
      (rp) => rp.privilegio
    );

    return res.status(200).json(privilegios);
  } catch (error) {
    return res.status(500).json({ error: "Error al obtener privilegios del usuario" });
  }
}

async function ListarPrivilegiosUsuario(req, res) {
  try {
    const id = Number(req.params.usuario);

    const usuarioConPrivilegios = await prisma.usuario.findUnique({
      where: { id_usuario: id },
      select: {
        rol: {
          include: {
            rol_privilegio: {
              include: { privilegio: true },
            },
          },
        },
      },
    });

    if (!usuarioConPrivilegios) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const privilegios = (usuarioConPrivilegios.rol?.rol_privilegio ?? []).map(
      (rp) => rp.privilegio
    );

    return res.status(200).json(privilegios);
  } catch (error) {
    return res.status(500).json({ error: "Error al obtener privilegios del usuario" });
  }
}

async function changeUserBranch(req, res) {
  try {
    const id = Number(req.params.id);
    const { id_sucursal } = req.body;

    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ error: "El ID del usuario es inválido" });
    }

    if (!id_sucursal || Number.isNaN(Number(id_sucursal))) {
      return res.status(400).json({ error: "El ID de la sucursal es obligatorio" });
    }

    const user = await prisma.usuario.findUnique({ where: { id_usuario: id }});

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const sucursal = await prisma.sucursal.findUnique({ where: { id_sucursal: Number(id_sucursal) }});

    if (!sucursal) {
      return res.status(404).json({ error: "Sucursal no encontrada" });
    }

    const relacionExistente = await prisma.empleado_Sucursal.findFirst({ where: { id_usuario: id }});

    let resultado;

    if (relacionExistente) {
      resultado = await prisma.empleado_Sucursal.update({
        where: {
          id_empleado_sucursal: relacionExistente.id_empleado_sucursal,
        },
        data: {
          id_sucursal: Number(id_sucursal),
        },
      });
    } else {
      resultado = await prisma.empleado_Sucursal.create({
        data: {
          id_usuario: id,
          id_sucursal: Number(id_sucursal),
        },
      });
    }

    return res.json({ mensaje: "Sucursal del usuario actualizada correctamente", data: resultado});
  } catch (error) {
    console.error("Error al cambiar sucursal del usuario:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

async function getRepartidores(req, res) {
  try {
    // Devuelve todos los usuarios activos cuyo rol tenga el privilegio PED_ENTREGA
    const usuarios = await prisma.usuario.findMany({
      where: {
        activo: true,
        rol: {
          rol_privilegio: {
            some: {
              privilegio: {
                nombre: { in: ["PED_ENTREGA", "ALL_ACCESS"] }
              }
            }
          }
        }
      },
      select: userSelect,
      orderBy: { primer_nombre: "asc" }
    });
    return res.json(usuarios);
  } catch (error) {
    console.error("Error al obtener repartidores:", error);
    return res.status(500).json({ error: "Error al obtener repartidores" });
  }
}

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  desactivarUsuario,
  ActivarUsuario,
  changePassword,
  changeRolUser,
  getMe,
  updateMe,
  ListarPrivilegiosMe,
  ListarPrivilegiosUsuario,
  changeMyPassword,
  changeUserBranch,
  getRepartidores
};
