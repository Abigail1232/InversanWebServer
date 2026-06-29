const prisma = require("../../src/config/database");

async function insertFacturaDetalle() {
  const detalles = [
    // Factura 1
    {
      id_factura_detalle: 1,
      id_factura: 1,
      id_producto: 1,
      cantidad: 1,
      precio_unitario: 2500.0,
      descuento: 0.0,
      subtotal: 2500.0,
      total: 2500.0,
    },
    {
      id_factura_detalle: 2,
      id_factura: 1,
      id_producto: 2,
      cantidad: 1,
      precio_unitario: 2800.0,
      descuento: 100.0,
      subtotal: 2800.0,
      total: 2700.0,
    },

    // Factura 2
    {
      id_factura_detalle: 3,
      id_factura: 2,
      id_producto: 3,
      cantidad: 1,
      precio_unitario: 4200.0,
      descuento: 0.0,
      subtotal: 4200.0,
      total: 4200.0,
    },

    // Factura 3
    {
      id_factura_detalle: 4,
      id_factura: 3,
      id_producto: 4,
      cantidad: 1,
      precio_unitario: 2000.0,
      descuento: 0.0,
      subtotal: 2000.0,
      total: 2000.0,
    },
    {
      id_factura_detalle: 5,
      id_factura: 3,
      id_producto: 5,
      cantidad: 1,
      precio_unitario: 1500.0,
      descuento: 50.0,
      subtotal: 1500.0,
      total: 1450.0,
    },

    // Factura 4
    {
      id_factura_detalle: 6,
      id_factura: 4,
      id_producto: 1,
      cantidad: 1,
      precio_unitario: 2500.0,
      descuento: 0.0,
      subtotal: 2500.0,
      total: 2500.0,
    },
    {
      id_factura_detalle: 7,
      id_factura: 4,
      id_producto: 3,
      cantidad: 1,
      precio_unitario: 3600.0,
      descuento: 0.0,
      subtotal: 3600.0,
      total: 3600.0,
    },

    // Factura 5
    {
      id_factura_detalle: 8,
      id_factura: 5,
      id_producto: 2,
      cantidad: 2,
      precio_unitario: 4000.0,
      descuento: 200.0,
      subtotal: 8000.0,
      total: 7800.0,
    },
  ];

  for (const detalle of detalles) {
    await prisma.factura_Detalle.create({
      data: detalle,
    });
  }

  console.log("Factura_Detalle insertados correctamente");
}

module.exports = { insertFacturaDetalle };
