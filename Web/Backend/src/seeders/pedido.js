const prisma = require("../../src/config/database");

const N = 16;
const estados = ["pendiente", "en_proceso", "entregado", "cancelado"];
const tiposPago = [
  "efectivo",
  "transferencia_bancaria",
  "pos",
  "compra_click",
  "pay_pal",
];

async function insertPedidos() {
  const pedidos = [];
  for (let i = 1; i <= N; i++) {
    const subtotal = 2000 + i * 400;
    const descuento = i % 3 === 0 ? 50 : 0;
    const costoEnv = 100 + (i % 5) * 20;
    const iva = (subtotal - descuento) * 0.15;
    const total = subtotal - descuento + costoEnv + iva;
    const estadoIndex = (i - 1) % estados.length;
    pedidos.push({
      numero_pedido: `PED-${String(i).padStart(4, "0")}`,
      descuento,
      subtotal: subtotal - descuento,
      costo_envio: costoEnv,
      total: Math.round(total * 100) / 100,
      IVA: Math.round(iva * 100) / 100,
      tipo_de_entrega: "a_domicilio",
      tipo_de_pago: tiposPago[(i - 1) % tiposPago.length],
      estado: estados[estadoIndex],
      fecha: new Date(Date.now() - (N - i) * 3600000),
      id_sucursal: 1,
      id_municipio_entrega: 1,
      direccion: `Colonia ${["Centro", "Norte", "Sur", "Las Flores", "El Prado"][i % 5]}, calle ${i}, casa #${10 + i}`,
    });
  }

  for (const pedido of pedidos) {
    await prisma.pedido.create({ data: pedido });
  }
  console.log("Pedidos insertados correctamente");
}

module.exports = { insertPedidos };
