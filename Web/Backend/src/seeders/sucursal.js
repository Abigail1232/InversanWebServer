const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function insertSucursal() {
  const sucursales = [
    {
      id_sucursal: 1,
      nombre: "Sucursal San Pedro Sula",
      RTN: "08011999123456",
      activo: true,
      id_municipio: 79,
      id_usuario: 1,
      direccion: "Calle Principal 123, San Pedro Sula",
      lat: 15.5,
      lng: -88.0,
    },
    {
      id_sucursal: 2,
      nombre: "Sucursal Tegucigalpa",
      RTN: "08011999123457",
      activo: true,
      id_municipio: 110,
      id_usuario: 1,
      direccion: "Avenida Central 456, Tegucigalpa",
      lat: 14.0,
      lng: -87.2,
    },
  ];

  for (const sucursal of sucursales) {
    await prisma.sucursal.create({
      data: sucursal,
    });
  }

  console.log("Sucursales insertadas");
}

module.exports = { insertSucursal };
