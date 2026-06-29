const prisma = require("../../src/config/database");

/**
 * Inserta datos de asociación entre modelos y productos en la base de datos.
 *
 * Esta función se usa como seeder para poblar la tabla `modelo_Producto`.
 * Cada elemento de `relaciones` representa un vínculo entre un producto y
 * su modelo correspondiente.
 *
 * @returns {Promise<void>} No retorna valor, solo inserta los datos.
 */
async function insertModeloProducto() {
  // Relaciones de ejemplo para el seeder: producto <-> modelo
  const relaciones = [
    { id_producto: 1, id_modelo: 1 },
    { id_producto: 1, id_modelo: 9 },
    { id_producto: 2, id_modelo: 2 },
    { id_producto: 3, id_modelo: 2 },
    { id_producto: 5, id_modelo: 4 },
  ];

  for (const relacion of relaciones) {
    // Inserta cada relación en la tabla `modelo_Producto` con Prisma
    await prisma.modelo_Producto.create({
      data: relacion,
    });
  }

  console.log("Modelo_Producto insertado");
}

module.exports = { insertModeloProducto };
