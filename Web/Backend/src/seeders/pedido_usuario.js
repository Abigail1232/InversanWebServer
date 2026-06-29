const prisma = require("../../src/config/database");

const N = 16;
const nombres = [
  "Alejandro García",
  "Omar Ortega",
  "Oscar Mejía",
  "Alejandro Coello",
  "María López",
  "Carlos Rivera",
  "Ana Martínez",
  "Luis Hernández",
  "Carmen Díaz",
  "Jorge Sánchez",
  "Rosa Torres",
  "Pedro Ramírez",
  "Laura Flores",
  "Miguel González",
  "Sofia Cruz",
  "Diego Morales",
];
const telefonos = [
  "99990001",
  "99990002",
  "99990003",
  "99990004",
  "99990005",
  "99990006",
  "99990007",
  "99990008",
  "99990009",
  "99990010",
  "99990011",
  "99990012",
  "99990013",
  "99990014",
  "99990015",
  "99990016",
];
const correos = [
  "alejandro@ejemplo.com",
  "omar@ejemplo.com",
  "oscar@ejemplo.com",
  "acoello@ejemplo.com",
  "maria@ejemplo.com",
  "carlos@ejemplo.com",
  "ana@ejemplo.com",
  "luis@ejemplo.com",
  "carmen@ejemplo.com",
  "jorge@ejemplo.com",
  "rosa@ejemplo.com",
  "pedro@ejemplo.com",
  "laura@ejemplo.com",
  "miguel@ejemplo.com",
  "sofia@ejemplo.com",
  "diego@ejemplo.com",
];

async function insertPedidoUsuario() {
  const usuarios = [3, 5, 1, null, 3, 1, 5, null, 1, 3, null, 5, 1, 3, 5, null];
  for (let i = 1; i <= N; i++) {
    await prisma.pedido_Usuario.create({
      data: {
        id_pedido: i,
        id_usuario: usuarios[i - 1],
        tipo_cliente: usuarios[i - 1] ? "registrado" : "invitado",
        nombre_completo: nombres[i - 1],
        telefono_cliente: telefonos[i - 1],
        correo_cliente: correos[i - 1],
        fecha: new Date(Date.now() - (N - i) * 3600000),
      },
    });
  }
  console.log("Pedido_Usuario insertados correctamente");
}

module.exports = { insertPedidoUsuario };
