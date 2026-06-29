const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function insertPromocion() {
  const promociones = [
    {
      titulo: "Promo Verano",
      descripcion: "Descuento especial en llantas seleccionadas",
      banner_url: "images.png",
      fecha_inicio: new Date("2026-03-01T00:00:00"),
      fecha_finalizacion: new Date("2026-06-31T23:59:59"),
    },
    {
      titulo: "Promo Fin de Semana",
      descripcion: "Oferta limitada por fin de semana",
      banner_url: "brid.jpeg",
      fecha_inicio: new Date("2026-03-07T00:00:00"),
      fecha_finalizacion: new Date("2026-06-09T23:59:59"),
    },
    {
      titulo: "Marcas Premium",
      descripcion: "Hasta 15% en Michelin y Continental",
      banner_url: "images.png",
      fecha_inicio: new Date("2026-03-01T00:00:00"),
      fecha_finalizacion: new Date("2026-06-15T23:59:59"),
    },
    {
      titulo: "Llantas SUV",
      descripcion: "Oferta en medidas para SUV y camionetas",
      banner_url: "brid.jpeg",
      fecha_inicio: new Date("2026-03-10T00:00:00"),
      fecha_finalizacion: new Date("2026-06-25T23:59:59"),
    },
    {
      titulo: "Buen Fin Llantas",
      descripcion: "Los mejores precios del año",
      banner_url: "images.png",
      fecha_inicio: new Date("2026-03-20T00:00:00"),
      fecha_finalizacion: new Date("2026-06-31T23:59:59"),
    },
  ];

  for (const promocionData of promociones) {
    await prisma.promocion.create({
      data: promocionData,
    });
  }
}

module.exports = { insertPromocion };