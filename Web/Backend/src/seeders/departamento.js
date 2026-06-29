const prisma = require("../../src/config/database");

async function insertDepartamentos() {
  const departamentos = [
    { nombre_departamento: "Atlántida" },
    { nombre_departamento: "Choluteca" },
    { nombre_departamento: "Colón" },
    { nombre_departamento: "Comayagua" },
    { nombre_departamento: "Copán" },
    { nombre_departamento: "Cortés" },
    { nombre_departamento: "El Paraíso" },
    { nombre_departamento: "Francisco Morazán" },
    { nombre_departamento: "Gracias a Dios" },
    { nombre_departamento: "Intibucá" },
    { nombre_departamento: "Islas de la Bahía" },
    { nombre_departamento: "La Paz" },
    { nombre_departamento: "Lempira" },
    { nombre_departamento: "Ocotepeque" },
    { nombre_departamento: "Olancho" },
    { nombre_departamento: "Santa Bárbara" },
    { nombre_departamento: "Valle" },
    { nombre_departamento: "Yoro" },
  ];

  for (const departamento of departamentos) {
    await prisma.departamento.create({
      data: departamento,
    });
  }

  console.log("Departamentos insertados correctamente");
}

module.exports = { insertDepartamentos };
