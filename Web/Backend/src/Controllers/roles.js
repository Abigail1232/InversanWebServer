const prisma = require("../config/database");

async function roleExist(nombre) {
  const rol = await prisma.rol.findFirst({
    where: { nombre },
  });
  return !!rol;
}

async function getAllRoles(req, res) {
  try {
    const roles = await prisma.rol.findMany();
    return res.status(200).json(roles);
  } catch (error) {
    console.error("Error al obtener los roles:", error);
    return res.status(500).json({
      error: "Ocurrió un error al obtener los roles.",
    });
  }
}

async function createRole(req, res) {
  const { nombre, descripcion } = req.body;

  if (!nombre || !descripcion) {
    return res.status(400).json({
      error: "El nombre y la descripción son obligatorios para crear un rol.",
    });
  }

  if (await roleExist(nombre)) {
    return res.status(400).json({
      error: "El rol con ese nombre ya existe.",
    });
  }

  try {
    const nuevoRol = await prisma.rol.create({
      data: {
        nombre,
        descripcion,
      },
    });
    return res.status(201).json(nuevoRol);
  } catch (error) {
    console.error("Error al crear el rol:", error);
    return res.status(500).json({
      error: "Ocurrió un error al crear el rol.",
    });
  }
}

async function deleteRole(req, res) {
  const { id } = req.params;

  try {
    const rol = await prisma.rol.findUnique({
      where: { id_rol: parseInt(id) },
    });

    if (!rol) {
      return res.status(404).json({ error: "Rol no encontrado" });
    }

    await prisma.rol.delete({
      where: { id_rol: parseInt(id) },
    });

    return res.status(200).json({ message: "Rol eliminado exitosamente" });
  } catch (error) {
    // Manejo de error de restricción de llave foránea (P2003 en Prisma)
    if (error.code === "P2003") {
      return res.status(409).json({
        error:
          "No se puede eliminar el rol porque está siendo utilizado por usuarios o tiene privilegios asignados. Intente desactivarlo en su lugar.",
      });
    }
    console.error("Error al eliminar el rol:", error);
    return res.status(500).json({
      error: "Ocurrió un error al eliminar el rol.",
    });
  }
}

async function deactivateRole(req, res) {
  const { id } = req.params;
  try {
    const updatedRol = await prisma.rol.update({
      where: { id_rol: parseInt(id) },
      data: { activo: false },
    });
    return res.status(200).json(updatedRol);
  } catch (error) {
    console.error("Error al desactivar el rol:", error);
    return res.status(500).json({ error: "Error al desactivar el rol" });
  }
}

async function activateRole(req, res) {
  const { id } = req.params;
  try {
    const updatedRol = await prisma.rol.update({
      where: { id_rol: parseInt(id) },
      data: { activo: true },
    });
    return res.status(200).json(updatedRol);
  } catch (error) {
    console.error("Error al activar el rol:", error);
    return res.status(500).json({ error: "Error al activar el rol" });
  }
}
async function updateRole(req, res) {
  const { id } = req.params;
  const { nombre, descripcion } = req.body;

  try {
    // 1. Verificar si el rol existe
    const existingRole = await prisma.rol.findUnique({
      where: { id_rol: parseInt(id) },
    });

    if (!existingRole) {
      return res.status(404).json({ error: "Rol no encontrado." });
    }

    // 3. Actualizar solo los campos proporcionados
    const rolActualizado = await prisma.rol.update({
      where: { id_rol: parseInt(id) },
      data: {
        nombre: nombre !== undefined ? nombre : undefined,
        descripcion: descripcion !== undefined ? descripcion : undefined,
      },
    });

    return res.status(200).json(rolActualizado);
  } catch (error) {
    console.error("Error al actualizar el rol:", error);
    return res.status(500).json({
      error: "Ocurrió un error al actualizar el rol.",
    });
  }
}

module.exports = {
  getAllRoles,
  createRole,
  deleteRole,
  updateRole,
  activateRole,
  deactivateRole,
};
