const prisma = require("../../src/config/database");

async function insertCategorias() {
  const categorias = [
    {
      id_categoria: 1,
      nombre: "Llanta para turismo",
      imagen_url: "turismo.png",
      activo: true,
    },
    {
      id_categoria: 2,
      nombre: "Llanta para camioneta",
      imagen_url: "camioneta.png",
      activo: true,
    },
    {
      id_categoria: 3,
      nombre: "Llanta para trabajo pesado",
      imagen_url: "pesado.png",
      activo: true,
    },
  ];

  for (const categoria of categorias) {
    await prisma.categoria.create({
      data: categoria,
    });
  }
}

module.exports = { insertCategorias };
