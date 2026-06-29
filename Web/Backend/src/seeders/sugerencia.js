const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function insertSugerencias() {
  const sugerencias = [
    {
      id_sugerencia: 1,
      id_usuario: 1,
      tipo: "recomendacion",
      titulo: "Agregar filtro por marca",
      descripcion: "Sería útil permitir búsquedas rápidas de productos por marca.",
      fecha: new Date("2026-03-01T09:00:00"),
    },
    {
      id_sugerencia: 2,
      id_usuario: 3,
      tipo: "queja",
      titulo: "Problema con el carrito",
      descripcion: "El carrito no actualiza correctamente la cantidad de productos.",
      fecha: new Date("2026-03-01T09:30:00"),
    },
    {
      id_sugerencia: 3,
      id_usuario: 5,
      tipo: "recomendacion",
      titulo: "Métodos de pago",
      descripcion: "Sería bueno mostrar mejor los métodos de pago disponibles antes de finalizar la compra.",
      fecha: new Date("2026-03-01T10:00:00"),
    },
  ];

  for (const sugerencia of sugerencias) {
    await prisma.sugerencia.create({
      data: sugerencia,
    });
  }

  console.log("Sugerencias insertadas");
}

module.exports = { insertSugerencias };