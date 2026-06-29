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
  ];

  for (const usuarioNotificacionData of usuariosNotificaciones) {
    await prisma.usuario_Notificacion.create({
      data: usuarioNotificacionData,
    });
  }
}

module.exports = { insertUsuarioNotificacion };