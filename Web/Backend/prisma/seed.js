const bcrypt = require("bcrypt");
const prisma = require("../src/config/database");

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);
  await prisma.usuario.create({
    data: {
      nombre: "admin",
      contrasena: passwordHash,
    },
  });
  await prisma.usuario.create({
    data: {
      nombre: "testuser",
      contrasena: await bcrypt.hash("testpass", 10),
    },
  });
  console.log("Usuarios de prueba insertados");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
