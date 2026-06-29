const prisma = require("../../src/config/database");

async function insertDevolucionDetalle() {
  const detalles = [
    {
      id_devolucion: 1,
      id_factura_detalle: 1,
      cantidad: 1,
      precio_unitario: 1000.0,
      descuento: 0.0,
      subtotal: 1000.0,
      total: 1150.0,
    },
  ];

  for (const detalleData of detalles) {
    await prisma.devolucion_Detalle.create({
      data: detalleData,
    });
  }
}

module.exports = { insertDevolucionDetalle };
