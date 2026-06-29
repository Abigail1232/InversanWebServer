const prisma = require("../../src/config/database");

async function insertModelo() {
  const modelos = [
    { marca: "Toyota", nombre: "Corolla", anio: new Date("2022-01-01") },
    { marca: "Toyota", nombre: "Hilux", anio: new Date("2023-01-01") },
    { marca: "Toyota", nombre: "RAV4", anio: new Date("2023-01-01") },
    { marca: "Toyota", nombre: "Yaris", anio: new Date("2023-01-01") },
    { marca: "Ford", nombre: "Ranger", anio: new Date("2024-01-01") },
    { marca: "Ford", nombre: "Fiesta", anio: new Date("2020-01-01") },
    { marca: "Ford", nombre: "Focus", anio: new Date("2022-01-01") },
    { marca: "Ford", nombre: "Escape", anio: new Date("2023-01-01") },
    { marca: "Ford", nombre: "Explorer", anio: new Date("2024-01-01") },
    { marca: "Ford", nombre: "F-150", anio: new Date("2024-01-01") },
    { marca: "Honda", nombre: "Civic", anio: new Date("2021-01-01") },
    { marca: "Honda", nombre: "CR-V", anio: new Date("2023-01-01") },
    { marca: "Honda", nombre: "Pilot", anio: new Date("2024-01-01") },
    { marca: "Nissan", nombre: "Sentra", anio: new Date("2022-01-01") },
    { marca: "Nissan", nombre: "Kicks", anio: new Date("2023-01-01") },
    { marca: "Nissan", nombre: "Versa", anio: new Date("2021-01-01") },
    { marca: "Nissan", nombre: "Pathfinder", anio: new Date("2024-01-01") },
    { marca: "Nissan", nombre: "Altima", anio: new Date("2023-01-01") },
    { marca: "Nissan", nombre: "Frontier", anio: new Date("2023-01-01") },
    { marca: "Kia", nombre: "Sportage", anio: new Date("2023-01-01") },
    { marca: "Chevrolet", nombre: "Silverado", anio: new Date("2024-01-01") },
  ];

  for (const modeloData of modelos) {
    await prisma.modelo.create({
      data: modeloData,
    });
  }

  console.log("Modelos insertados correctamente");
}

module.exports = { insertModelo };
