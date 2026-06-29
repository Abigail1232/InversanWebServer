const prisma = require("../../src/config/database");

async function insertDevolucion() {
  const devoluciones = [
    {
      numero_devolucion: "DEV-0001",
      fecha: new Date(),
      motivo: "Producto con defecto de fábrica",
      tipo: "parcial",
      estado: "aprobada",
      monto_subtotal: 1000.0,
      monto_iva: 150.0,
      monto_total: 1150.0,
      id_factura: 1,
      id_usuario_registra: 1,
      id_usuario_aprueba: 3,
    },
  ];

  for (const devolucionData of devoluciones) {
    await prisma.devolucion.create({
      data: devolucionData,
    });
  }
}

module.exports = { insertDevolucion };
