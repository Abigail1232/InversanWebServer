const prisma = require("../config/database");
const jsonwebtoken = require("jsonwebtoken");
const transporter = require("../middleware/mailerConfig");

// Utilidades auxiliares (asumiendo que existen o definiéndolas si son locales)
const MENSAJES_PEDIDO = {
  en_proceso: {
    titulo: "Pedido en Proceso",
    cuerpo: (num) =>
      `Tu pedido ha sido validado y está siendo preparado para envío (Pedido #${num}).`,
  },
  entregado: {
    titulo: "Pedido Entregado",
    cuerpo: (num) =>
      `¡Felicidades! Tu pedido ha sido entregado exitosamente (Pedido #${num}).`,
  },
  cancelado: {
    titulo: "Pedido Cancelado",
    cuerpo: (num) => `Tu pedido #${num} ha sido cancelado.`,
  },
};

async function enviarNotificaciontx(id_usuario, titulo, contenido, tx, ruta) {
  // Implementación simplificada para el servicio
  return await tx.usuario_Notificacion.create({
    data: { id_usuario, titulo, contenido, ruta, leido: false },
  });
}

function getPagination(params) {
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(params.limit) || 10));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

function paginatedResponse(data, totalRows, page, limit) {
  return {
    data,
    pagination: {
      total: totalRows,
      page,
      limit,
      totalPages: Math.ceil(totalRows / limit),
    },
  };
}

class EntregasService {
  async actualizarEstadoPedido(bodyPayload, files, params, user) {
    const { id_pedido } = params;
    const { nuevo_estado } = bodyPayload;
    let msj = "";

    const pedidoActualizado = await prisma.$transaction(async (tx) => {
      const pedidoInfo = await tx.pedido.findUnique({
        where: { id_pedido: Number(id_pedido) },
        include: { pedido_detalle: true },
      });

      if (!pedidoInfo) throw new Error("Pedido no encontrado");

      if (nuevo_estado === "cancelado" && pedidoInfo.estado !== "cancelado") {
        for (const detalle of pedidoInfo.pedido_detalle) {
          const bodegaDestino = await tx.stock_Bodega.findFirst({
            where: {
              id_producto: detalle.id_producto,
              bodega: { id_sucursal: pedidoInfo.id_sucursal },
            },
          });
          if (bodegaDestino) {
            await tx.stock_Bodega.update({
              where: { id_stock_bodega: bodegaDestino.id_stock_bodega },
              data: {
                existencias: bodegaDestino.existencias + detalle.cantidad,
              },
            });
          }
        }
      }

      return await tx.pedido.update({
        where: { id_pedido: Number(id_pedido) },
        data: { estado: nuevo_estado },
        include: {
          pedido_usuario: { include: { usuario: true } },
        },
      });
    });

    const clienteInfo = pedidoActualizado.pedido_usuario?.[0];
    const correoCliente =
      clienteInfo?.correo_cliente || clienteInfo?.usuario?.correo;
    const clienteId = clienteInfo?.id_usuario;

    if (clienteId) {
      const config = MENSAJES_PEDIDO[nuevo_estado];
      if (config) {
        msj = config.cuerpo(pedidoActualizado.numero_pedido);
        await enviarNotificaciontx(
          clienteId,
          config.titulo,
          msj,
          prisma,
          "/orders"
        );
      }
    }

    if (correoCliente) {
      // Lógica de envío de correo omitida para brevedad pero asumida funcional
      transporter
        .sendMail({
          from: '"INVERSAN" <no-reply@inversan.com>',
          to: correoCliente,
          subject: `Actualización de Pedido #${pedidoActualizado.numero_pedido}`,
          html: `<p>Tu pedido ha cambiado a: ${nuevo_estado}</p>`,
        })
        .catch((e) => console.error("Error envío correo:", e));
    }

    return { ok: true, data: pedidoActualizado };
  }

  async obtenerPedidosEntregasRepartidor(bodyPayload, files, params, user) {
    const idRepartidor = Number(user?.id);
    if (!idRepartidor || isNaN(idRepartidor))
      throw { status: 401, message: "Usuario no identificado" };

    const page = Math.max(1, Number(params.page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(params.pageSize) || 8));

    const asignaciones = await prisma.pedido_Asignacion.findMany({
      where: {
        id_repartidor: idRepartidor,
        activo: true,
        pedido: { estado: { in: ["pendiente", "en_proceso"] } },
      },
      include: {
        pedido: {
          include: {
            pedido_usuario: { take: 1, orderBy: { fecha: "desc" } },
          },
        },
      },
      orderBy: { fecha_asignacion: "asc" },
    });

    const formatear = (a) => {
      const pu = a.pedido.pedido_usuario[0];
      return {
        id: String(a.pedido.id_pedido),
        id_pedido: a.pedido.id_pedido,
        nombre: pu ? pu.nombre_completo : "—",
        direccion: a.pedido.direccion,
        telefono: pu ? pu.telefono_cliente : undefined,
        tipoPago: a.pedido.tipo_de_pago,
        fecha_estimada_entrega:
          a.fecha_estimada_entrega ?? a.fecha_asignacion ?? a.pedido.fecha,
      };
    };

    const skip = (page - 1) * pageSize;
    const items = asignaciones.slice(skip, skip + pageSize);

    return {
      ok: true,
      pedido_actual: asignaciones[0] ? formatear(asignaciones[0]) : null,
      pedidos_en_cola: items.map(formatear),
      total: asignaciones.length,
      page,
      pageSize,
    };
  }

  async obtenerDetallePedidoEntrega(bodyPayload, files, params, user) {
    const idPedido = Number(params.id_pedido);
    const asignacion = await prisma.pedido_Asignacion.findFirst({
      where: { id_pedido: idPedido, id_repartidor: user.id, activo: true },
      include: {
        pedido: {
          include: {
            pedido_usuario: true,
            pedido_detalle: {
              include: {
                producto: {
                  include: { marca: true, producto_imagen: { take: 1 } },
                },
              },
            },
          },
        },
      },
    });

    if (!asignacion) throw { status: 404, message: "Pedido no encontrado" };

    const p = asignacion.pedido;
    const pu = p.pedido_usuario?.[0];

    const mappedData = {
      codigo: p.numero_pedido,
      persona: pu ? pu.nombre_completo : "—",
      telefono: pu ? pu.telefono_cliente : "—",
      tipoPago: p.tipo_de_pago,
      direccion: p.direccion,
      fecha_estimada_entrega: asignacion.fecha_estimada_entrega || p.fecha,
      subtotal: Number(p.subtotal || 0),
      descuento: Number(p.descuento || 0),
      isv: Number(p.IVA || 0),
      costo_envio: Number(p.costo_envio || 0),
      total: Number(p.total || 0),
      tipoEntrega: p.tipo_de_entrega,
      items: p.pedido_detalle.map((d, index) => ({
        inv: `INV-${String(index + 1).padStart(3, "0")}`,
        producto: d.producto?.nombre || "Producto desconocido",
        marca: d.producto?.marca?.nombre || "—",
        cantidad: d.cantidad,
        subtotal: String(d.subtotal || 0),
        total: String(d.total || 0),
        imagen: d.producto?.producto_imagen?.[0]?.imagen_url || null,
      })),
    };

    return { ok: true, ...mappedData };
  }

  async efectuarEntrega(bodyPayload, files, params, user) {
    const idPedido = Number(params.id_pedido);
    const { comentarios } = bodyPayload || {};

    const pedido = await prisma.$transaction(async (tx) => {
      await tx.pedido_Asignacion.updateMany({
        where: { id_pedido: idPedido, id_repartidor: user.id },
        data: { fecha_estimada_entrega: new Date(), observacion: comentarios },
      });
      return await tx.pedido.update({
        where: { id_pedido: idPedido },
        data: { estado: "entregado" },
      });
    });

    return { ok: true, msg: "Entrega registrada correctamente", data: pedido };
  }

  async rechazarPedido(bodyPayload, files, params, user) {
    const idPedido = Number(params.id_pedido);
    const { motivo } = bodyPayload || {};

    await prisma.$transaction(async (tx) => {
      await tx.pedido_Asignacion.updateMany({
        where: { id_pedido: idPedido, id_repartidor: user.id },
        data: {
          estado_asignacion: "rechazado",
          activo: false,
          observacion: motivo,
        },
      });

      const pedidoInfo = await tx.pedido.findUnique({
        where: { id_pedido: idPedido },
        include: { pedido_detalle: true },
      });

      if (pedidoInfo && pedidoInfo.estado !== "cancelado") {
        for (const detalle of pedidoInfo.pedido_detalle) {
          const bodegaDestino = await tx.stock_Bodega.findFirst({
            where: {
              id_producto: detalle.id_producto,
              bodega: { id_sucursal: pedidoInfo.id_sucursal },
            },
          });
          if (bodegaDestino) {
            await tx.stock_Bodega.update({
              where: { id_stock_bodega: bodegaDestino.id_stock_bodega },
              data: {
                existencias: bodegaDestino.existencias + detalle.cantidad,
              },
            });
          }
        }
      }

      await tx.pedido.update({
        where: { id_pedido: idPedido },
        data: { estado: "cancelado" },
      });
    });

    return { ok: true, msg: "Pedido rechazado" };
  }

  async obtenerEntregasRealizadas(bodyPayload, files, params, user) {
    const { page, limit, skip } = getPagination(params);

    // Traer entregados o cancelados de todos los repartidores
    const where = {
      estado: { in: ["entregado", "cancelado"] },
    };

    if (params.id_pedido) {
      where.id_pedido = Number(params.id_pedido);
    }
    if (params.id_repartidor) {
      where.pedido_asignacion = { some: { id_repartidor: Number(params.id_repartidor) } };
    }
    if (params.id_sucursal && params.id_sucursal !== "todos") {
      where.id_sucursal = Number(params.id_sucursal);
    }
    if (params.estado) {
      where.estado = params.estado;
    }
    if (params.tipo_pago) {
      where.tipo_de_pago = params.tipo_pago;
    }
    if (params.buscar) {
      where.OR = [
        { pedido_usuario: { some: { nombre_completo: { contains: params.buscar } } } },
        { numero_pedido: { contains: params.buscar } }
      ];
    }

    const [pedidos, totalRows] = await Promise.all([
      prisma.pedido.findMany({
        where,
        skip,
        take: limit,
        include: {
          pedido_usuario: true,
          pedido_asignacion: {
            include: { repartidor: true },
          },
          pedido_detalle: { include: { producto: { include: { marca: true, producto_imagen: { take: 1 } } } } }
        },
        orderBy: { fecha: "desc" },
      }),
      prisma.pedido.count({ where }),
    ]);

    const formattedPedidos = pedidos.map((p) => {
      const u = p.pedido_usuario?.[0];
      const a = p.pedido_asignacion?.[0];
      return {
        id_pedido: p.id_pedido,
        estado: p.estado,
        tipo_de_pago: p.tipo_de_pago,
        fecha: p.fecha,
        fecha_entrega: a ? a.fecha_estimada_entrega : null,
        direccion: p.direccion,
        id_sucursal: p.id_sucursal,
        cliente: {
          nombre: u ? u.nombre_completo : "—",
          correo: u ? u.correo_cliente : null,
          telefono: u ? u.telefono_cliente : null,
        },
        repartidor:
          a && a.repartidor
            ? {
                id_usuario: a.repartidor.id_usuario,
                primer_nombre: a.repartidor.primer_nombre,
                primer_apellido: a.repartidor.primer_apellido,
              }
            : null,
        resumen: {
          descuento: p.descuento || 0,
          subtotal: p.subtotal || 0,
          iva: p.IVA || 0,
          total: p.total || 0,
        },
        detalle: p.pedido_detalle ? p.pedido_detalle.map(d => ({
          id_producto: d.id_producto,
          nombre_producto: d.producto?.nombre || "Producto desconocido",
          cantidad: d.cantidad,
          subtotal: Number(d.subtotal || 0),
          total_con_isv: Number(d.total || 0),
          imagen: d.producto?.producto_imagen?.[0]?.imagen_url || null
        })) : [],
        observacionAsignacion: a ? a.observacion : "",
      };
    });

    return {
      ok: true,
      ...paginatedResponse(formattedPedidos, totalRows, page, limit),
    };
  }

  async obtenerEntregasRealizadasFiltradas(bodyPayload, files, params, user) {
    return await this.obtenerEntregasRealizadas(
      bodyPayload,
      files,
      params,
      user
    );
  }
}

module.exports = new EntregasService();
