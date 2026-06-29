const prisma = require("../config/database");
const jsonwebtoken = require("jsonwebtoken");
const transporter = require("../middleware/mailerConfig");

class PedidosAdminService {
  async buscarPedidosConFiltros(bodyPayload, files, params, user) {
    const {
      correo_cliente,
      busqueda,
      tipo_de_pago,
      tipo_de_entrega,
      estado,
      min,
      max,
      page = 1,
      limit = 10,
      id_sucursal,
      token
    } = params;

    let usuarioToken = null;
    if (token) {
      try {
        usuarioToken = jsonwebtoken.verify(token, process.env.JWT_SECRET);
      } catch (e) {
        // Ignorar error de token opcional o manejarlo
      }
    }

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const where = {};

    // Si se provee correo_cliente en el query (flujo de invitados sin sesión), filtrar por él
    if (!user && correo_cliente) {
      where.pedido_usuario = { some: { correo_cliente: String(correo_cliente).trim().toLowerCase(), tipo_cliente: "invitado" } };
    }

    if (busqueda) {
      where.OR = [
        { numero_pedido: { contains: String(busqueda) } },
        { pedido_usuario: { some: { nombre_completo: { contains: String(busqueda) } } } }
      ];
    }

    if (estado && estado !== 'todos') {
      where.estado = estado;
    } else {
      where.estado = { notIn: ['entregado', 'cancelado'] };
    }
    
    if (tipo_de_pago && tipo_de_pago !== 'todos') where.tipo_de_pago = tipo_de_pago;
    if (tipo_de_entrega && tipo_de_entrega !== 'todos') where.tipo_de_entrega = tipo_de_entrega;
    if (id_sucursal && id_sucursal !== 'todos') where.id_sucursal = Number(id_sucursal);

    const [totalRegistros, pedidos] = await Promise.all([
      prisma.pedido.count({ where }),
      prisma.pedido.findMany({
        where,
        include: {
          municipio_entrega: true,
          pedido_usuario: true,
          pedido_asignacion: { where: { activo: true }, include: { repartidor: true } }
        },
        orderBy: { fecha: "desc" },
        skip,
        take: limitNum
      })
    ]);

    return {
      ok: true,
      data: pedidos,
      pagination: {
        total: totalRegistros,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalRegistros / limitNum)
      }
    };
  }

  async asignarPedidoARepartidor(bodyPayload, files, params, user) {
    const { id_pedido, id_repartidor, asignado_por, fecha_estimada_entrega, observacion } = bodyPayload;

    if (!id_pedido || !id_repartidor) throw { status: 400, message: "Faltan datos de asignación" };

    const resultado = await prisma.$transaction(async (tx) => {
      const pedido = await tx.pedido.findUnique({ where: { id_pedido: Number(id_pedido) } });
      if (!pedido) throw new Error("El pedido no existe");

      await tx.pedido_Asignacion.updateMany({
        where: { id_pedido: Number(id_pedido), activo: true },
        data: { activo: false }
      });

      const asignacion = await tx.pedido_Asignacion.create({
        data: {
          id_pedido: Number(id_pedido),
          id_repartidor: Number(id_repartidor),
          asignado_por: Number(asignado_por || user.id),
          fecha_estimada_entrega: new Date(fecha_estimada_entrega),
          observacion: observacion || "Asignado por administrador",
          estado_asignacion: "asignado",
          activo: true,
          fecha_asignacion: new Date()
        }
      });

      await tx.pedido.update({
        where: { id_pedido: Number(id_pedido) },
        data: { estado: "en_proceso" }
      });

      return asignacion;
    });

    return { ok: true, data: resultado };
  }

  async actualizarEstadoPedidoAdmin(bodyPayload, files, params, user) {
    const { id_pedido } = params;
    const { estado } = bodyPayload;

    const resultado = await prisma.$transaction(async (tx) => {
      const pedido = await tx.pedido.findUnique({
        where: { id_pedido: Number(id_pedido) },
        include: { pedido_detalle: true }
      });

      if (!pedido) throw new Error("Pedido no encontrado");

      if (estado === "cancelado" && pedido.estado !== "cancelado") {
        for (const detalle of pedido.pedido_detalle) {
          const bodegaDestino = await tx.stock_Bodega.findFirst({
            where: { 
              id_producto: detalle.id_producto, 
              bodega: { id_sucursal: pedido.id_sucursal } 
            }
          });
          if (bodegaDestino) {
            await tx.stock_Bodega.update({
              where: { id_stock_bodega: bodegaDestino.id_stock_bodega },
              data: { existencias: bodegaDestino.existencias + detalle.cantidad }
            });
          }
        }
      }

      return await tx.pedido.update({
        where: { id_pedido: Number(id_pedido) },
        data: { estado }
      });
    });

    return { ok: true, data: resultado };
  }
}

module.exports = new PedidosAdminService();
