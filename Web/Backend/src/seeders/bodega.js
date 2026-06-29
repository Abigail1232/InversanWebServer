const prisma = require("../../src/config/database");

async function insertBodegas() {
  const bodegas = [
    {
      id_bodega: 1,
      nombre: "Bodega Principal SPS",
      id_sucursal: 1,
    },
    {
      id_bodega: 2,
      nombre: "Bodega Secundaria TGU",
      id_sucursal: 2,
    },
  ];

  for (const bodega of bodegas) {
    await prisma.bodega.create({
      data: bodega,
    });
  }
}

module.exports = { insertBodegas };
