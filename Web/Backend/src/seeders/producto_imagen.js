const prisma = require("../../src/config/database");

const IMG = "1772573368918-558689175.jpg";

async function insertProductoImagen() {
  const imagenes = Array.from({ length: 26 }, (_, i) => ({
    imagen_url: IMG,
    orden: 1,
    id_producto: i + 1,
  }));

  for (const imagenData of imagenes) {
    await prisma.producto_Imagen.create({
      data: imagenData,
    });
  }

  console.log("Producto_Imagen insertado");
}

module.exports = { insertProductoImagen };
