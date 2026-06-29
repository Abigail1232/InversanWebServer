const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const { access } = require("fs");

const prisma = new PrismaClient();

async function insertUsuarios() {
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
      id_rol: 1, // Asumiendo que el rol de admin tiene id 1
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
      id_rol: 2, // Asumiendo que el rol de vendedor tiene id 2
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
      id_rol: 3, // Asumiendo que el rol de gestor tiene id 3
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
      id_rol: 4, // Asumiendo que el rol de user tiene id 4
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
      id_rol: 4, // Asumiendo que el rol de user tiene id 4
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
      id_rol: 5, // Asumiendo que el rol de mayoreo tiene id 5
    }
  ];

  //!comando upsert es mejor que insertar porque solo crea el registro si no existe, si ya existe lo actualiza, esto evita errores de duplicados
  for (const usuarioData of usuarios) {
    await prisma.usuario.create({
      data: usuarioData,
    });
  }
}

module.exports = { insertUsuarios };
