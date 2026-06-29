const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function insertProductoPromocion() {
  const productosPromocion = [
    { id_producto: 1, id_promocion: 1, descuento: 10 },
    { id_producto: 2, id_promocion: 1, descuento: 15 },
    { id_producto: 1, id_promocion: 2, descuento: 5 },
    { id_producto: 3, id_promocion: 1, descuento: 12 },
    { id_producto: 4, id_promocion: 1, descuento: 8 },
    { id_producto: 11, id_promocion: 3, descuento: 15 },
    { id_producto: 12, id_promocion: 3, descuento: 10 },
    { id_producto: 14, id_promocion: 3, descuento: 12 },
    { id_producto: 15, id_promocion: 3, descuento: 10 },
    { id_producto: 6, id_promocion: 4, descuento: 10 },
    { id_producto: 7, id_promocion: 4, descuento: 8 },
    { id_producto: 10, id_promocion: 4, descuento: 12 },
    { id_producto: 16, id_promocion: 4, descuento: 15 },
    { id_producto: 22, id_promocion: 4, descuento: 10 },
    { id_producto: 2, id_promocion: 5, descuento: 20 },
    { id_producto: 5, id_promocion: 5, descuento: 18 },
    { id_producto: 8, id_promocion: 5, descuento: 15 },
    { id_producto: 13, id_promocion: 5, descuento: 12 },
    { id_producto: 20, id_promocion: 5, descuento: 10 },
  ];

  for (const productoPromocionData of productosPromocion) {
    await prisma.producto_Promocion.create({
      data: productoPromocionData,
    });
  }
}

module.exports = { insertProductoPromocion };
