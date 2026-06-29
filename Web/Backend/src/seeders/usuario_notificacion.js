const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function insertUsuarioNotificacion() {
  const usuariosNotificaciones = [
    {
      id_usuario: 1,
      id_notifiacion: 1,
      leida: false,
    },
    {
      id_usuario: 1,
      id_notifiacion: 2,
      leida: true,
    },
    {
      id_usuario: 2,
      id_notifiacion: 1,
      leida: false,
    },
  ];

  for (const usuarioNotificacion of usuariosNotificaciones) {
    await prisma.usuario_Notificacion.create({
      data: usuarioNotificacion,
    });
  }

  console.log("Usuario_Notificacion insertado");
}

module.exports = { insertUsuarioNotificacion };