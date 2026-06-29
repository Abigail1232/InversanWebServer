const prisma = require("../config/database");

async function enviarNotificacion(id_usuario, titulo, contenido, ruta) {
  const resultado = await prisma.$transaction(async (tx) => {
    const notificacion = await tx.notificacion.create({
      data: {
        id_usuario: Number(id_usuario),
        titulo: String(titulo).trim(),
        contenido: String(contenido).trim(),
        fecha_emision: new Date(),
        ruta: ruta || null,
      },
    });

    await tx.usuario_Notificacion.create({
      data: {
        id_usuario: Number(id_usuario),
        id_notifiacion: notificacion.id_notificacion,
        leida: false,
      },
    });

    return {
      id_notificacion: notificacion.id_notificacion,
      titulo: notificacion.titulo,
      contenido: notificacion.contenido,
      fecha_emision: notificacion.fecha_emision,
      ruta: notificacion.ruta,
    };
  });

  return resultado;
}

async function enviarNotificaciontx(id_usuario, titulo, contenido, db, ruta) {
  const notificacion = await db.notificacion.create({
    data: {
      id_usuario: Number(id_usuario),
      titulo: String(titulo).trim(),
      contenido: String(contenido).trim(),
      fecha_emision: new Date(),
      ruta: ruta || null,
    },
  });

  await db.usuario_Notificacion.create({
    data: {
      id_usuario: Number(id_usuario),
      id_notifiacion: notificacion.id_notificacion,
      leida: false,
    },
  });

  return {
    id_notificacion: notificacion.id_notificacion,
    titulo: notificacion.titulo,
    contenido: notificacion.contenido,
    fecha_emision: notificacion.fecha_emision,
    ruta: notificacion.ruta,
  };
}

async function enviarNotificacionGlobal(titulo, contenido, ruta) {
  const usuarios = await prisma.usuario.findMany({
    where: { activo: true },
    select: { id_usuario: true },
  });

  const resultado = await prisma.$transaction(async (tx) => {
    const notificacion = await tx.notificacion.create({
      data: {
        titulo: String(titulo).trim(),
        contenido: String(contenido).trim(),
        fecha_emision: new Date(),
        ruta: ruta || null,
      },
    });

    const dataUsuarios = usuarios.map((u) => ({
      id_usuario: u.id_usuario,
      id_notifiacion: notificacion.id_notificacion,
      leida: false,
    }));

    await tx.usuario_Notificacion.createMany({
      data: dataUsuarios,
    });

    return {
      id_notificacion: notificacion.id_notificacion,
      titulo: notificacion.titulo,
      contenido: notificacion.contenido,
      fecha_emision: notificacion.fecha_emision,
      ruta: notificacion.ruta,
    };
  });

  return resultado;
}

async function listarMisNotificaciones(req, res) {
  try {
    const idUsuario = Number(req.user?.id);
    if (!idUsuario || Number.isNaN(idUsuario)) {
      return res.status(401).json({ ok: false, msg: "Token inválido" });
    }

    const filtro = String(req.query.filtro || "all").toLowerCase();
    const where = {
      id_usuario: idUsuario,
    };

    if (filtro === "unread") {
      where.leida = false;
    }

    const notificaciones = await prisma.usuario_Notificacion.findMany({
      where,
      include: {
        notificacion: true,
      },
      orderBy: {
        notificacion: {
          fecha_emision: "desc",
        },
      },
    });

    const unreadCount = await prisma.usuario_Notificacion.count({
      where: { id_usuario: idUsuario, leida: false },
    });

    return res.json({
      ok: true,
      unreadCount,
      totalCount: notificaciones.length,
      data: notificaciones.map((item) => ({
        id: item.id_notifiacion,
        titulo: item.notificacion.titulo,
        contenido: item.notificacion.contenido,
        fecha_emision: item.notificacion.fecha_emision,
        ruta: item.notificacion.ruta,
        leida: item.leida,
      })),
    });
  } catch (error) {
    return res
      .status(500)
      .json({ ok: false, msg: "Error al listar notificaciones" });
  }
}

async function enviarNotificacionClientes(titulo, contenido, ruta) {
  const usuarios = await prisma.usuario.findMany({
    where: { activo: true, id_rol: { in: [4, 5] } }, // 4: User, 5: Mayoreo
    select: { id_usuario: true },
  });

  const resultado = await prisma.$transaction(async (tx) => {
    const notificacion = await tx.notificacion.create({
      data: {
        titulo: String(titulo).trim(),
        contenido: String(contenido).trim(),
        fecha_emision: new Date(),
        ruta: ruta || null,
      },
    });

    const dataUsuarios = usuarios.map((u) => ({
      id_usuario: u.id_usuario,
      id_notifiacion: notificacion.id_notificacion,
      leida: false,
    }));

    await tx.usuario_Notificacion.createMany({
      data: dataUsuarios,
    });

    return {
      id_notificacion: notificacion.id_notificacion,
      titulo: notificacion.titulo,
      contenido: notificacion.contenido,
      fecha_emision: notificacion.fecha_emision,
      ruta: notificacion.ruta,
    };
  });

  return resultado;
}

async function marcarNotificacionLeida(req, res) {
  try {
    const idUsuario = Number(req.user?.id);
    const idNotificacion = Number(req.params.id);

    if (!idUsuario || Number.isNaN(idUsuario)) {
      return res.status(401).json({ ok: false, msg: "Token inválido" });
    }
    if (!idNotificacion || Number.isNaN(idNotificacion)) {
      return res
        .status(400)
        .json({ ok: false, msg: "Id de notificación inválido" });
    }

    const existe = await prisma.usuario_Notificacion.findUnique({
      where: {
        id_usuario_id_notifiacion: {
          id_usuario: idUsuario,
          id_notifiacion: idNotificacion,
        },
      },
    });

    if (!existe) {
      return res
        .status(404)
        .json({ ok: false, msg: "Notificación no encontrada" });
    }

    await prisma.usuario_Notificacion.update({
      where: {
        id_usuario_id_notifiacion: {
          id_usuario: idUsuario,
          id_notifiacion: idNotificacion,
        },
      },
      data: { leida: true },
    });

    return res.json({ ok: true, msg: "Notificación marcada como leída" });
  } catch (error) {
    return res
      .status(500)
      .json({ ok: false, msg: "Error al marcar notificación" });
  }
}

async function marcarTodasLeidas(req, res) {
  try {
    const idUsuario = Number(req.user?.id);
    if (!idUsuario || Number.isNaN(idUsuario)) {
      return res.status(401).json({ ok: false, msg: "Token inválido" });
    }

    await prisma.usuario_Notificacion.updateMany({
      where: { id_usuario: idUsuario, leida: false },
      data: { leida: true },
    });

    return res.json({ ok: true, msg: "Notificaciones marcadas como leídas" });
  } catch (error) {
    return res
      .status(500)
      .json({ ok: false, msg: "Error al marcar notificaciones" });
  }
}

async function eliminarNotificacion(req, res) {
  try {
    const idUsuario = Number(req.user?.id);
    const idNotificacion = Number(req.params.id);

    if (!idUsuario || Number.isNaN(idUsuario)) {
      return res.status(401).json({ ok: false, msg: "Token inválido" });
    }
    if (!idNotificacion || Number.isNaN(idNotificacion)) {
      return res
        .status(400)
        .json({ ok: false, msg: "Id de notificación inválido" });
    }

    const existe = await prisma.usuario_Notificacion.findUnique({
      where: {
        id_usuario_id_notifiacion: {
          id_usuario: idUsuario,
          id_notifiacion: idNotificacion,
        },
      },
    });

    if (!existe) {
      return res
        .status(404)
        .json({ ok: false, msg: "Notificación no encontrada" });
    }

    await prisma.$transaction(async (tx) => {
      await tx.usuario_Notificacion.delete({
        where: {
          id_usuario_id_notifiacion: {
            id_usuario: idUsuario,
            id_notifiacion: idNotificacion,
          },
        },
      });

      const referencias = await tx.usuario_Notificacion.count({
        where: { id_notifiacion: idNotificacion },
      });

      if (referencias === 0) {
        await tx.notificacion.delete({
          where: { id_notificacion: idNotificacion },
        });
      }
    });

    return res.json({ ok: true, msg: "Notificación eliminada" });
  } catch (error) {
    return res
      .status(500)
      .json({ ok: false, msg: "Error al eliminar notificación" });
  }
}

async function eliminarTodasNotificaciones(req, res) {
  try {
    const idUsuario = Number(req.user?.id);
    if (!idUsuario || Number.isNaN(idUsuario)) {
      return res.status(401).json({ ok: false, msg: "Token inválido" });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Obtener IDs de las notificaciones del usuario que serán eliminadas de la tabla intermedia
      const misNotificaciones = await tx.usuario_Notificacion.findMany({
        where: { id_usuario: idUsuario },
        select: { id_notifiacion: true },
      });

      const idsAEliminar = misNotificaciones.map((n) => n.id_notifiacion);

      // 2. Eliminar de la tabla intermedia
      await tx.usuario_Notificacion.deleteMany({
        where: { id_usuario: idUsuario },
      });

      // 3. Opcional: Eliminar notificaciones huérfanas en la tabla principal
      for (const idNotif of idsAEliminar) {
        const refs = await tx.usuario_Notificacion.count({
          where: { id_notifiacion: idNotif },
        });
        if (refs === 0) {
          await tx.notificacion.delete({
            where: { id_notificacion: idNotif },
          });
        }
      }
    });

    return res.json({
      ok: true,
      msg: "Todas las notificaciones han sido eliminadas",
    });
  } catch (error) {
    console.error("Error al eliminar todas las notificaciones:", error);
    return res
      .status(500)
      .json({ ok: false, msg: "Error al eliminar todas las notificaciones" });
  }
}

module.exports = {
  enviarNotificacion,
  enviarNotificaciontx,
  enviarNotificacionGlobal,
  enviarNotificacionClientes,
  listarMisNotificaciones,
  marcarNotificacionLeida,
  marcarTodasLeidas,
  eliminarNotificacion,
  eliminarTodasNotificaciones,
};
