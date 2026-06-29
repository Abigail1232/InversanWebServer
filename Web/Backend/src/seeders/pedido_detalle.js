const prisma = require("../../src/config/database");

async function insertPedidoDetalle() {
  const productos = await prisma.producto.findMany({
    select: { id_producto: true, precio_detalle: true },
    take: 24,
  });
  if (productos.length < 16)
    throw new Error(
      "Se requieren al menos 16 productos. Ejecuta el seeder de productos primero.",
    );
  const detalles = [];
  for (let idPedido = 1; idPedido <= 16; idPedido++) {
    const numLineas = 1 + (idPedido % 3);
    for (let l = 0; l < numLineas; l++) {
      const prod = productos[(idPedido + l * 5) % productos.length];
      const cant = 1 + (l % 3);
      const precio = Number(prod.precio_detalle);
      const subtotal = precio * cant;
      detalles.push({
        id_pedido: idPedido,
        id_producto: prod.id_producto,
        cantidad: cant,
        precio_unitario: precio,
        subtotal,
        total: subtotal,
      });
    }
  }

  for (const d of detalles) {
    await prisma.pedido_Detalle.create({ data: d });
  }
  console.log("Pedido_Detalle insertados correctamente");
}

module.exports = { insertPedidoDetalle };
