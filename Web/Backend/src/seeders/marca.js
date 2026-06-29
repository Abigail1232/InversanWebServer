const prisma = require("../../src/config/database");

async function insertMarcas() {
  const marcas = [
    {
      id_marca: 1,
      nombre: "Michelin",
      logo_url: "Michelin_Logo_2017.svg",
      banner_url: "michelin-tire-race-car-banner.jpg",
      activo: true,
    },
    {
      id_marca: 2,
      nombre: "Bridgestone",
      logo_url: "bridgeston.png",
      banner_url: "Bstone_Banner.jpg",
      activo: true,
    },
    {
      id_marca: 3,
      nombre: "Goodyear",
      logo_url: "gooyear.png",
      banner_url: "goody.png",
      activo: true,
    },
    {
      id_marca: 4,
      nombre: "Continental",
      logo_url: "continental.png",
      banner_url: "continentalbanner.jpg",
      activo: true,
    },
  ];

  for (const marca of marcas) {
    await prisma.marca.create({
      data: marca,
    });
  }

  console.log("Marcas insertadas");
}

module.exports = { insertMarcas };
