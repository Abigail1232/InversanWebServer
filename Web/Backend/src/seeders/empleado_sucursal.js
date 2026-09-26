const prisma = require("../../src/config/database");

async function insertEmpleadoSucursal() {
  const asignaciones = [
    {
      usuario: "Gestor1",
      sucursal: "Sucursal San Pedro Sula",
    },
    {
      usuario: "user1",
      sucursal: "Sucursal San Pedro Sula",
    },
    {
      usuario: "admin",
      sucursal: "Sucursal San Pedro Sula",
    },
    {
      usuario: "admin",
      sucursal: "Sucursal Tegucigalpa",
    },
    {
      usuario: "Vendedor1",
      sucursal: "Sucursal Tegucigalpa",
    },
  ];

  for (const asignacion of asignaciones) {
    const usuario = await prisma.usuario.findUnique({
      where: { usuario: asignacion.usuario },
      select: { id_usuario: true },
    });
    if (!usuario) {
      throw new Error(`Usuario no encontrado: ${asignacion.usuario}`);
    }

    const sucursal = await prisma.sucursal.findFirst({
      where: { nombre: asignacion.sucursal },
      orderBy: { id_sucursal: "asc" },
      select: { id_sucursal: true },
    });
    if (!sucursal) {
      throw new Error(`Sucursal no encontrada: ${asignacion.sucursal}`);
    }

    const existing = await prisma.empleado_Sucursal.findUnique({
      where: {
        id_usuario_id_sucursal: {
          id_usuario: usuario.id_usuario,
          id_sucursal: sucursal.id_sucursal,
        },
      },
      select: { id_empleado_sucursal: true },
    });

    if (!existing) {
      await prisma.empleado_Sucursal.create({
        data: {
          id_usuario: usuario.id_usuario,
          id_sucursal: sucursal.id_sucursal,
        },
      });
    }
  }

  console.log("Asignaciones de Empleado y Usuarios insertadas correctamente");
}

module.exports = { insertEmpleadoSucursal };
