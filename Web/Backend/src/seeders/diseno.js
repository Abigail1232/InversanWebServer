const prisma = require("../../src/config/database");

async function insertDisenos() {
  const disenos = [
    {
      id_diseno: 1,
      nombre: "Direccional",
      descripcion:
        "Patrón en forma de V que mejora el drenaje de agua y el agarre en lluvia",
      id_marca: 1, // Michelin,
      imagen_url:
        "https://png.pngtree.com/thumb_back/fh260/background/20231229/pngtree-a-collection-of-tire-tracks-patterns-and-textures-for-automobile-tires-image_13902049.png",
      activo: true,
    },
    {
      id_diseno: 2,
      nombre: "Simétrico",
      descripcion:
        "Patrón uniforme en toda la banda de rodadura, mayor durabilidad y bajo ruido",
      id_marca: 2, // Bridgestone
      imagen_url:
        "https://png.pngtree.com/thumb_back/fh260/background/20231229/pngtree-a-collection-of-tire-tracks-patterns-and-textures-for-automobile-tires-image_13902049.png",
      activo: true,
    },
    {
      id_diseno: 3,
      nombre: "Asimétrico",
      descripcion:
        "Diferente diseño en interior y exterior para balancear agarre y confort",
      id_marca: 3, // Goodyear
      imagen_url:
        "https://png.pngtree.com/thumb_back/fh260/background/20231229/pngtree-a-collection-of-tire-tracks-patterns-and-textures-for-automobile-tires-image_13902049.png",
      activo: true,
    },
    {
      id_diseno: 4,
      nombre: "All Terrain",
      descripcion:
        "Patrón agresivo para uso mixto en carretera y terrenos irregulares",
      id_marca: 4, // Continental
      imagen_url:
        "https://png.pngtree.com/thumb_back/fh260/background/20231229/pngtree-a-collection-of-tire-tracks-patterns-and-textures-for-automobile-tires-image_13902049.png",
      activo: true,
    },
    {
      id_diseno: 5,
      nombre: "Mud Terrain",
      descripcion: "Diseño con tacos profundos para máximo agarre en lodo",
      id_marca: 2,
      imagen_url:
        "https://png.pngtree.com/thumb_back/fh260/background/20231229/pngtree-a-collection-of-tire-tracks-patterns-and-textures-for-automobile-tires-image_13902049.png",
      activo: true,
    },
    {
      id_diseno: 6,
      nombre: "High Performance",
      descripcion:
        "Patrón optimizado para alta velocidad y máximo agarre en seco",
      id_marca: 1,
      imagen_url:
        "https://png.pngtree.com/thumb_back/fh260/background/20231229/pngtree-a-collection-of-tire-tracks-patterns-and-textures-for-automobile-tires-image_13902049.png",
      activo: true,
    },
  ];

  for (const diseno of disenos) {
    await prisma.diseno.create({
      data: diseno,
    });
  }

  console.log("Diseños de llanta insertados");
}

module.exports = { insertDisenos };
