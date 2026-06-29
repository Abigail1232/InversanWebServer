const prisma = require("../../src/config/database");

async function insertNotificacion() {
  const notificaciones = [
    {
      id_usuario: 1,
      titulo: "Pedido asignado",
      contenido: "Se te ha asignado un nuevo pedido para revisión.",
      fecha_emision: new Date(),
      ruta: "/admin/pedidos",
    },
    {
      id_usuario: null,
      titulo: "Promoción activa",
      contenido: "Hay una nueva promoción disponible en el sistema.",
      fecha_emision: new Date(),
      ruta: "/home",
    },
  ];

  for (const notificacionData of notificaciones) {
    await prisma.notificacion.create({
      data: notificacionData,
    });
  }
}

module.exports = { insertNotificacion };
