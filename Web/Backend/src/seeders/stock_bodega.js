const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function insertStockBodega() {
  const ahora = new Date();
  const stocks = [
    { existencias: 25, id_bodega: 1, id_producto: 1, fecha_actualizacion: ahora },
    { existencias: 18, id_bodega: 1, id_producto: 2, fecha_actualizacion: ahora },
    { existencias: 12, id_bodega: 1, id_producto: 3, fecha_actualizacion: ahora },
    { existencias: 30, id_bodega: 1, id_producto: 4, fecha_actualizacion: ahora },
    { existencias: 20, id_bodega: 1, id_producto: 5, fecha_actualizacion: ahora },
    { existencias: 15, id_bodega: 1, id_producto: 6, fecha_actualizacion: ahora },
    { existencias: 22, id_bodega: 1, id_producto: 7, fecha_actualizacion: ahora },
    { existencias: 28, id_bodega: 1, id_producto: 8, fecha_actualizacion: ahora },
    { existencias: 14, id_bodega: 1, id_producto: 9, fecha_actualizacion: ahora },
    { existencias: 10, id_bodega: 1, id_producto: 10, fecha_actualizacion: ahora },
    { existencias: 17, id_bodega: 1, id_producto: 11, fecha_actualizacion: ahora },
    { existencias: 21, id_bodega: 1, id_producto: 12, fecha_actualizacion: ahora },
    { existencias: 13, id_bodega: 1, id_producto: 13, fecha_actualizacion: ahora },
    { existencias: 19, id_bodega: 1, id_producto: 14, fecha_actualizacion: ahora },
    { existencias: 11, id_bodega: 1, id_producto: 15, fecha_actualizacion: ahora },
    { existencias: 9, id_bodega: 1, id_producto: 16, fecha_actualizacion: ahora },
    { existencias: 16, id_bodega: 1, id_producto: 17, fecha_actualizacion: ahora },
    { existencias: 8, id_bodega: 1, id_producto: 18, fecha_actualizacion: ahora },
    { existencias: 14, id_bodega: 1, id_producto: 19, fecha_actualizacion: ahora },
    { existencias: 22, id_bodega: 1, id_producto: 20, fecha_actualizacion: ahora },
    { existencias: 11, id_bodega: 1, id_producto: 21, fecha_actualizacion: ahora },
    { existencias: 9, id_bodega: 1, id_producto: 22, fecha_actualizacion: ahora },
    { existencias: 17, id_bodega: 1, id_producto: 23, fecha_actualizacion: ahora },
    { existencias: 13, id_bodega: 1, id_producto: 24, fecha_actualizacion: ahora },
    { existencias: 20, id_bodega: 1, id_producto: 25, fecha_actualizacion: ahora },
    { existencias: 10, id_bodega: 1, id_producto: 26, fecha_actualizacion: ahora },
    { existencias: 20, id_bodega: 2, id_producto: 1, fecha_actualizacion: ahora },
    { existencias: 16, id_bodega: 2, id_producto: 2, fecha_actualizacion: ahora },
    { existencias: 8, id_bodega: 2, id_producto: 3, fecha_actualizacion: ahora },
    { existencias: 25, id_bodega: 2, id_producto: 4, fecha_actualizacion: ahora },
    { existencias: 18, id_bodega: 2, id_producto: 5, fecha_actualizacion: ahora },
    { existencias: 12, id_bodega: 2, id_producto: 6, fecha_actualizacion: ahora },
    { existencias: 19, id_bodega: 2, id_producto: 7, fecha_actualizacion: ahora },
    { existencias: 24, id_bodega: 2, id_producto: 8, fecha_actualizacion: ahora },
    { existencias: 11, id_bodega: 2, id_producto: 9, fecha_actualizacion: ahora },
    { existencias: 7, id_bodega: 2, id_producto: 10, fecha_actualizacion: ahora },
    { existencias: 14, id_bodega: 2, id_producto: 11, fecha_actualizacion: ahora },
    { existencias: 18, id_bodega: 2, id_producto: 12, fecha_actualizacion: ahora },
    { existencias: 10, id_bodega: 2, id_producto: 13, fecha_actualizacion: ahora },
    { existencias: 15, id_bodega: 2, id_producto: 14, fecha_actualizacion: ahora },
    { existencias: 9, id_bodega: 2, id_producto: 15, fecha_actualizacion: ahora },
    { existencias: 7, id_bodega: 2, id_producto: 16, fecha_actualizacion: ahora },
    { existencias: 12, id_bodega: 2, id_producto: 17, fecha_actualizacion: ahora },
    { existencias: 6, id_bodega: 2, id_producto: 18, fecha_actualizacion: ahora },
    { existencias: 11, id_bodega: 2, id_producto: 19, fecha_actualizacion: ahora },
    { existencias: 18, id_bodega: 2, id_producto: 20, fecha_actualizacion: ahora },
    { existencias: 9, id_bodega: 2, id_producto: 21, fecha_actualizacion: ahora },
    { existencias: 7, id_bodega: 2, id_producto: 22, fecha_actualizacion: ahora },
    { existencias: 14, id_bodega: 2, id_producto: 23, fecha_actualizacion: ahora },
    { existencias: 10, id_bodega: 2, id_producto: 24, fecha_actualizacion: ahora },
    { existencias: 16, id_bodega: 2, id_producto: 25, fecha_actualizacion: ahora },
    { existencias: 8, id_bodega: 2, id_producto: 26, fecha_actualizacion: ahora },
  ];

  for (const stock of stocks) {
    await prisma.stock_Bodega.create({
      data: stock,
    });
  }

  console.log("Stock_Bodega insertado");
}

module.exports = { insertStockBodega };