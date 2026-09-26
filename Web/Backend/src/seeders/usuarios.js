const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function insertUsuarios() {
  const roles = await prisma.rol.findMany({
    orderBy: { id_rol: "asc" },
    select: { id_rol: true, nombre: true },
  });

  const getRoleId = (nombre) => {
    const role = roles.find((item) => item.nombre === nombre);
    if (!role) {
      throw new Error(`Rol no encontrado: ${nombre}`);
    }
    return role.id_rol;
  };

  const usuarios = [
    {
      usuario: "admin",
      correo: "admin@example.com",
      clave: await bcrypt.hash("admin123", 10),
      primer_nombre: "Admin",
      segundo_nombre: "Min",
      primer_apellido: "Admin",
      segundo_apellido: "Min",
      telefono: "1234567890",
      activo: true,
      id_rol: getRoleId("Admin"),
    },
    {
      usuario: "Vendedor1",
      correo: "vendedor1@example.com",
      clave: await bcrypt.hash("vendedor123", 10),
      primer_nombre: "Vendedor",
      segundo_nombre: "Uno",
      primer_apellido: "Vendedor",
      segundo_apellido: "Uno",
      telefono: "1122334455",
      activo: true,
      id_rol: getRoleId("Vendedor"),
    },
    {
      usuario: "Gestor1",
      correo: "gestor1@example.com",
      clave: await bcrypt.hash("gestor123", 10),
      primer_nombre: "Gestor",
      segundo_nombre: "Uno",
      primer_apellido: "Gestor",
      segundo_apellido: "Uno",
      telefono: "2233445566",
      activo: true,
      id_rol: getRoleId("Gestor"),
    },
    {
      usuario: "user1",
      correo: "user1@example.com",
      clave: await bcrypt.hash("user123", 10),
      primer_nombre: "User",
      segundo_nombre: "One",
      primer_apellido: "User",
      segundo_apellido: "One",
      telefono: "0987654321",
      activo: true,
      id_rol: getRoleId("User"),
    },
    {
      usuario: "user2",
      correo: "user2@example.com",
      clave: await bcrypt.hash("user234", 10),
      primer_nombre: "User",
      segundo_nombre: "Two",
      primer_apellido: "User",
      segundo_apellido: "Two",
      telefono: "0987654322",
      activo: true,
      id_rol: getRoleId("User"),
    },
    {
      usuario: "mayoreo",
      correo: "mayoreo@example.com",
      clave: await bcrypt.hash("mayoreo123", 10),
      primer_nombre: "Mayoreo",
      segundo_nombre: "User",
      primer_apellido: "Mayoreo",
      segundo_apellido: "User",
      telefono: "0987654323",
      activo: true,
      id_rol: getRoleId("Mayoreo"),
    }
  ];

  // Seeds set a known password on creation; updates deliberately preserve an existing password.
  for (const usuarioData of usuarios) {
    const { clave, ...datosActualizables } = usuarioData;
    await prisma.usuario.upsert({
      where: { usuario: usuarioData.usuario },
      update: datosActualizables,
      create: { ...usuarioData, clave },
    });
  }
}

module.exports = { insertUsuarios };
