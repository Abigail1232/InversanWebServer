const prisma = require("../../src/config/database");

async function insertRoles() {
  const roles = [
    {
      nombre: "Admin",
      descripcion:
        "Administrador con acceso completo a todas las funciones del sistema",
    },
    {
      nombre: "Vendedor",
      descripcion:
        "Vendedor con acceso a funciones relacionadas con ventas y clientes",
    },
    {
      nombre: "Gestor",
      descripcion:
        "Gestor con acceso a funciones relacionadas con la gestión de recursos y proyectos",
    },
    {
      nombre: "User",
      descripcion:
        "Usuario con acceso limitado a funciones básicas del sistema",
    },
    {
      nombre: "Mayoreo",
      descripcion:
        "Usuario con acceso a funciones relacionadas con ventas al por mayor",
    },
  ];

  for (const rol of roles) {
    await prisma.rol.create({
      data: rol,
    });
  }
  console.log("Roles insertados");
}

module.exports = {
  insertRoles,
};
