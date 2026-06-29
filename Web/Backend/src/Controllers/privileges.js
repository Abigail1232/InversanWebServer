const prisma = require("../config/database");

// Funcion para obtener todos los privilegios
async function getAllPrivilegios(req, res) {
  try {
    const privilegios = await prisma.privilegio.findMany();
    return res.status(200).json(privilegios);
  } catch (error) {
    return res.status(500).json({ error: "Error al obtener privilegios" });
  }
}

// Funcion para crear un nuevo privilegio
async function createPrivilegio(req, res) {
  const { nombre, descripcion } = req.body;
  try {
    const nuevo = await prisma.privilegio.create({
      data: { nombre, descripcion },
    });
    return res.status(201).json(nuevo);
  } catch (error) {
    return res.status(500).json({ error: "Error al crear privilegio" });
  }
}

// Funcion para listar los privilegios asociados a un rol
async function ListarPrivilegiosIdRol(req, res) {
  const { id } = req.params;
  try {
    const relaciones = await prisma.rol_Privilegio.findMany({
      where: { id_rol: Number(id) },
      include: { privilegio: true },
    });
    return res.status(200).json(relaciones.map((r) => r.privilegio));
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Error al listar privilegios del rol" });
  }
}

// Funcion para asignar un privilegio a un rol
async function AsignPrivilegioToRole(req, res) {
  const { id_rol, id_privilegio } = req.body;
  try {
    const asignacion = await prisma.rol_Privilegio.create({
      data: { id_rol: Number(id_rol), id_privilegio: Number(id_privilegio) },
    });
    return res.status(201).json(asignacion);
  } catch (error) {
    return res.status(500).json({ error: "Error al asignar privilegio" });
  }
}

// Funcion para eliminar la relación entre un privilegio y un rol
async function removePrivilegioFromRole(req, res) {
  const { id_rol, id_privilegio } = req.body;
  try {
    await prisma.rol_Privilegio.deleteMany({
      where: {
        id_rol: Number(id_rol),
        id_privilegio: Number(id_privilegio),
      },
    });
    return res.status(200).json({ message: "Privilegio eliminado" });
  } catch (error) {
    return res.status(500).json({ error: "Error al eliminar relación" });
  }
}

module.exports = {
  getAllPrivilegios,
  createPrivilegio,
  ListarPrivilegiosIdRol,
  AsignPrivilegioToRole,
  removePrivilegioFromRole,
};
