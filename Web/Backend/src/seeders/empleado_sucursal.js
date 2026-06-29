const prisma = require("../../src/config/database");

async function insertEmpleadoSucursal() {
  const asignaciones = [
    {
      id_usuario: 3,
      id_sucursal: 1,
    },
    {
      id_usuario: 4,
      id_sucursal: 1,
    },
    {
      id_usuario: 1,
      id_sucursal: 1,
    },
    {
      id_usuario: 1,
      id_sucursal: 2,
    },
    {
      id_usuario: 2,
      id_sucursal: 2,
    },
  ];
  for (const eu of asignaciones) {
    await prisma.empleado_Sucursal.create({
      data: eu,
    });
  }

  console.log("Asignaciones de Empleado y Usuarios insertadas correctamente");
}

module.exports = { insertEmpleadoSucursal };
