const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function insertProductoIngresoDetalle() {
  const detalles = [
    {
      id_ingreso: 1,
      id_producto: 1,
      cantidad: 10,
      total: 15000.0,
      accion: "incremento",
    },
    {
      id_ingreso: 1,
      id_producto: 2,
      cantidad: 8,
      total: 12000.0,
      accion: "incremento",
    },
    {
      id_ingreso: 2,
      id_producto: 1,
      cantidad: 5,
      total: 7500.0,
      accion: "incremento",
    },
  ];

  for (const detalleData of detalles) {
    await prisma.producto_Ingreso_Detalle.create({
      data: detalleData,
    });
  }
}

module.exports = { insertProductoIngresoDetalle };