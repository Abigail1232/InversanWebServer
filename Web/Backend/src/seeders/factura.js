const prisma = require("../../src/config/database");

async function insertFacturas() {
  const facturas = [
    {
      id_factura: 1,
      numero_factura: "FAC-0001",
      fecha_emision: new Date("2026-02-28T10:30:00"),
      id_pedido: 1,
      id_pedido_usuario: 1,
      id_usuario_emisor: 1,
      subtotal: 5300.0,
      descuento: 100.0,
      iva: 795.0,
      costo_envio: 150.0,
      total: 6145.0,
      tipo_de_pago: "efectivo",
      estado: "emitida",
      observacion: "Factura generada correctamente",
    },
    {
      id_factura: 2,
      numero_factura: "FAC-0002",
      fecha_emision: new Date("2026-02-28T11:30:00"),
      id_pedido: 2,
      id_pedido_usuario: 2,
      id_usuario_emisor: 1,
      subtotal: 4200.0,
      descuento: 0.0,
      iva: 630.0,
      costo_envio: 120.0,
      total: 4950.0,
      tipo_de_pago: "transferencia_bancaria",
      estado: "emitida",
      observacion: "Factura emitida para pedido en proceso",
    },
    {
      id_factura: 3,
      numero_factura: "FAC-0003",
      fecha_emision: new Date("2026-02-28T12:30:00"),
      id_pedido: 3,
      id_pedido_usuario: 3,
      id_usuario_emisor: 1,
      subtotal: 3500.0,
      descuento: 50.0,
      iva: 525.0,
      costo_envio: 100.0,
      total: 4075.0,
      tipo_de_pago: "pos",
      estado: "emitida",
      observacion: "Factura emitida con descuento aplicado",
    },
    {
      id_factura: 4,
      numero_factura: "FAC-0004",
      fecha_emision: new Date("2026-02-28T13:30:00"),
      id_pedido: 4,
      id_pedido_usuario: 4,
      id_usuario_emisor: 1,
      subtotal: 6100.0,
      descuento: 0.0,
      iva: 915.0,
      costo_envio: 180.0,
      total: 7195.0,
      tipo_de_pago: "compra_click",
      estado: "emitida",
      observacion: "Factura de pedido entregado",
    },
    {
      id_factura: 5,
      numero_factura: "FAC-0005",
      fecha_emision: new Date("2026-02-28T14:30:00"),
      id_pedido: 5,
      id_pedido_usuario: 5,
      id_usuario_emisor: 1,
      subtotal: 8000.0,
      descuento: 200.0,
      iva: 1200.0,
      costo_envio: 200.0,
      total: 9200.0,
      tipo_de_pago: "pay_pal",
      estado: "emitida",
      observacion: "Factura generada para pago pendiente",
    },
  ];

  for (const factura of facturas) {
    await prisma.factura.create({
      data: factura,
    });
  }

  console.log("Facturas insertadas correctamente");
}

module.exports = { insertFacturas };
