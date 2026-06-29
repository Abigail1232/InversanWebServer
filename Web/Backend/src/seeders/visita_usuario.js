const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function insertVisitaUsuario() {
  const visitas = [
    {
      fecha: new Date(),
    },
    {
      fecha: new Date("2026-03-01T10:00:00"),
    },
  ];

  for (const visitaData of visitas) {
    await prisma.visita_Usuario.create({
      data: visitaData,
    });
  }
}

module.exports = { insertVisitaUsuario };