const prisma = require("../../src/config/database");

async function insertProductoIngreso() {
  const ingresos = [
    {
      fecha: new Date(),
      proveedor: "Distribuidora Centroamericana",
      id_usuario: 1,
      id_bodega: 1,
      observaciones: "Ingreso inicial de inventario",
    },
    {
      fecha: new Date("2026-03-01T09:30:00"),
      proveedor: "Importadora Premium",
      id_usuario: 1,
      id_bodega: 1,
      observaciones: "Reposición de stock",
    },
  ];

  for (const ingresoData of ingresos) {
    await prisma.producto_Ingreso.create({
      data: ingresoData,
    });
  }
}

module.exports = { insertProductoIngreso };
