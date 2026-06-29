const prisma = require("../config/database");
const jsonwebtoken = require("jsonwebtoken");
const transporter = require("../middleware/mailerConfig");

class PedidosClientService {
  async realizarCompra(bodyPayload, files, params, user) {
    const { id_sucursal, id_municipio_entrega, direccion, tipo_de_entrega, tipo_de_pago, productos } = bodyPayload;
    
    if (!id_sucursal || !productos || productos.length === 0) {
      throw { status: 400, message: "Datos de compra incompletos" };
    }

    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Crear Pedido principal
      const subtotalProductos = productos.reduce((acc, p) => acc + (p.precio * p.cantidad), 0);
      const costoEnvio = Number(bodyPayload.costo_envio) || 0;
      const descuento = Number(bodyPayload.descuento) || 0;
      const total = subtotalProductos + costoEnvio;

      const pedido = await tx.pedido.create({
        data: {
          numero_pedido: `PED-${Date.now()}`,
          id_sucursal: Number(id_sucursal),
          id_municipio_entrega: Number(id_municipio_entrega),
          direccion,
          tipo_de_entrega,
          tipo_de_pago,
          estado: "pendiente",
          fecha: new Date(),
          total: total,
          subtotal: subtotalProductos / 1.15,
          IVA: subtotalProductos - (subtotalProductos / 1.15),
          descuento: descuento,
          costo_envio: costoEnvio
        }
      });

      // 2. Crear detalles
      await tx.pedido_Detalle.createMany({
        data: productos.map(p => ({
          id_pedido: pedido.id_pedido,
          id_producto: p.id_producto,
          cantidad: p.cantidad,
          precio_unitario: p.precio,
          subtotal: (p.precio * p.cantidad) / 1.15,
          total: p.precio * p.cantidad
        }))
      });

      // 3. Descontar stock de las bodegas de la sucursal
      for (const p of productos) {
        let cantidadPendiente = p.cantidad;

        const stocksBodega = await tx.stock_Bodega.findMany({
          where: {
            id_producto: p.id_producto,
            bodega: { id_sucursal: Number(id_sucursal) },
            existencias: { gt: 0 }
          },
          orderBy: { existencias: 'desc' }
        });

        for (const stock of stocksBodega) {
          if (cantidadPendiente <= 0) break;

          const descontar = Math.min(stock.existencias, cantidadPendiente);
          await tx.stock_Bodega.update({
            where: { id_stock_bodega: stock.id_stock_bodega },
            data: { existencias: stock.existencias - descontar, fecha_actualizacion: new Date() }
          });
          cantidadPendiente -= descontar;
        }
      }

      // 4. Link con usuario
      await tx.pedido_Usuario.create({
        data: {
          id_pedido: pedido.id_pedido,
          id_usuario: user?.id || null,
          tipo_cliente: user?.id ? "registrado" : "invitado",
          nombre_completo: bodyPayload.nombre_completo || "Cliente",
          correo_cliente: bodyPayload.correo_cliente || "",
          telefono_cliente: bodyPayload.telefono_cliente || "",
          fecha: new Date()
        }
      });

      // Notificación a administradores
      const admins = await tx.usuario.findMany({ where: { id_rol: { in: [1, 2, 3] }, activo: true } });
      if (admins.length > 0) {
        const notifAdmin = await tx.notificacion.create({
          data: {
            titulo: "Nuevo Pedido",
            contenido: `Se ha registrado un nuevo pedido: ${pedido.numero_pedido}`,
            fecha_emision: new Date(),
            ruta: "/admin/pedidos"
          }
        });
        await tx.usuario_Notificacion.createMany({
          data: admins.map(a => ({
            id_usuario: a.id_usuario,
            id_notifiacion: notifAdmin.id_notificacion,
            leida: false
          }))
        });
      }

      // Notificación al cliente si está registrado
      if (user?.id) {
        const notifCliente = await tx.notificacion.create({
          data: {
            id_usuario: user.id,
            titulo: "Pedido Creado Exitosamente",
            contenido: `Tu pedido ${pedido.numero_pedido} se encuentra en estado pendiente.`,
            fecha_emision: new Date(),
            ruta: "/orders"
          }
        });
        await tx.usuario_Notificacion.create({
          data: {
            id_usuario: user.id,
            id_notifiacion: notifCliente.id_notificacion,
            leida: false
          }
        });
      }

      return pedido;
    });

    const correoCliente = bodyPayload.correo_cliente || user?.correo;
    if (correoCliente) {
      const frontendUrl = process.env.FRONTEND_URL || "https://inversan.com";
      transporter.sendMail({
        from: '"INVERSAN" <no-reply@inversan.com>',
        to: correoCliente,
        subject: `Confirmación de Pedido #${resultado.numero_pedido}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <h2>¡Gracias por tu compra!</h2>
            <p>Se ha registrado tu pedido <b>#${resultado.numero_pedido}</b> de forma exitosa.</p>
            <p>Puedes dar seguimiento al estado de tu pedido en cualquier momento utilizando nuestro portal y tu cuenta de correo electrónico:</p>
            <a href="${frontendUrl}/api/pedido/verificar/${resultado.numero_pedido}" style="display:inline-block; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 10px;">Seguir mi pedido</a>
          </div>
        `
      }).catch(e => console.error("Error en envío de correo de confirmación:", e));
    }

    return { ok: true, data: { pedido: resultado } };
  }

  async obtenerMisPedidosPendientes(bodyPayload, files, params, user) {
    const userId = user?.id;
    const where = {
      estado: { in: ["pendiente", "en_proceso", "pago_pendiente"] },
      pedido_usuario: { some: { id_usuario: userId } }
    };
    if (!userId && params.correo_cliente) {
        where.pedido_usuario = { some: { correo_cliente: params.correo_cliente, tipo_cliente: "invitado" } };
    }

    const pedidos = await prisma.pedido.findMany({
      where,
      include: { municipio_entrega: true },
      orderBy: { fecha: "desc" }
    });

    return { ok: true, data: pedidos };
  }

  async obtenerMisPedidosFinalizados(bodyPayload, files, params, user) {
    const userId = user?.id;
    const where = {
      estado: { in: ["entregado", "cancelado"] },
      pedido_usuario: { some: { id_usuario: userId } }
    };
    if (!userId && params.correo_cliente) {
        where.pedido_usuario = { some: { correo_cliente: params.correo_cliente, tipo_cliente: "invitado" } };
    }

    const pedidos = await prisma.pedido.findMany({
      where,
      include: { municipio_entrega: true },
      orderBy: { fecha: "desc" }
    });

    return { ok: true, data: pedidos };
  }

  async obtenerDetallePedido(bodyPayload, files, params, user) {
    const { id_pedido } = params;
    
    const includeClause = {
      pedido_detalle: { include: { producto: { include: { producto_imagen: true } } } },
      pedido_usuario: true,
      municipio_entrega: true
    };

    let pedido = null;

    // Intentar primero por ID numérico
    if (!isNaN(Number(id_pedido)) && Number(id_pedido) > 0) {
      pedido = await prisma.pedido.findUnique({
        where: { id_pedido: Number(id_pedido) },
        include: includeClause
      });
    }

    // Si no se encontró, buscar por numero_pedido
    if (!pedido) {
      pedido = await prisma.pedido.findFirst({
        where: { numero_pedido: String(id_pedido) },
        include: includeClause
      });
    }

    if (!pedido) {
      throw { status: 404, message: "Pedido no encontrado" };
    }

    const orderData = this._formatOrder(pedido);
    return { ok: true, data: orderData };
  }

  async obtenerPedidoDeUsuario(bodyPayload, files, params, user) {
    return await this.obtenerDetallePedido(bodyPayload, files, params, user);
  }

  _formatOrder(pedido) {
    return {
      ...pedido,
      productos: pedido.pedido_detalle.map(d => ({
        id_producto: d.id_producto,
        producto: d.producto?.nombre || "Producto",
        cantidad: d.cantidad,
        precio_unitario: d.precio_unitario,
        total: d.total,
        imagen_url: d.producto?.producto_imagen?.[0]?.imagen_url || ""
      }))
    };
  }

  async obtenerResumenPedidosPorUsuario(bodyPayload, files, params, user) {
    const userId = user?.id || Number(params.id_usuario);
    if (!userId) return { ok: true, data: { total_pedidos: 0 } };

    const total = await prisma.pedido.count({
      where: { pedido_usuario: { some: { id_usuario: userId } } }
    });
    return { ok: true, data: { total_pedidos: total } };
  }

  async subirComprobanteCompra(bodyPayload, file, params, user) {
    const { id_pedido } = params;
    let comprobante_url = bodyPayload.comprobante_url;
    if (file) { comprobante_url = `/assets/${file.filename}`; }
    if (!comprobante_url) {
      throw { status: 400, message: "No se ha proporcionado un comprobante" };
    }
    
    let pedidoId = null;
    if (!isNaN(Number(id_pedido)) && Number(id_pedido) > 0) {
      pedidoId = Number(id_pedido);
    } else {
      const found = await prisma.pedido.findFirst({ where: { numero_pedido: String(id_pedido) } });
      if (!found) throw { status: 404, message: "Pedido no encontrado" };
      pedidoId = found.id_pedido;
    }

    const pedido = await prisma.pedido.update({
      where: { id_pedido: pedidoId },
      data: { comprobante_url, estado: "pendiente" }
    });

    return { ok: true, data: pedido };
  }

  async obtenerPedidoPublico(bodyPayload, files, params, user) {
    const { id_pedido } = params;

    const includeClause = {
      pedido_usuario: true,
      sucursal: true,
      municipio_entrega: true,
      pedido_detalle: { include: { producto: { include: { marca: true, producto_imagen: true } } } }
    };

    let pedido = null;

    if (!isNaN(Number(id_pedido)) && Number(id_pedido) > 0) {
      pedido = await prisma.pedido.findUnique({
        where: { id_pedido: Number(id_pedido) },
        include: includeClause
      });
    }

    if (!pedido) {
      pedido = await prisma.pedido.findFirst({
        where: { numero_pedido: String(id_pedido) },
        include: includeClause
      });
    }

    if (!pedido) {
      throw { status: 404, message: "Pedido no encontrado" };
    }

    const pu = pedido.pedido_usuario?.[0] || {};

    const formattedData = {
      numero_pedido: pedido.numero_pedido || "",
      fecha: pedido.fecha || new Date(),
      estado: pedido.estado || "",
      tipo_de_entrega: pedido.tipo_de_entrega || "",
      tipo_de_pago: pedido.tipo_de_pago || "",
      direccion: pedido.direccion || "",
      municipio_entrega: pedido.municipio_entrega?.nombre || "N/A",
      sucursal: pedido.sucursal?.nombre || "Online",
      cliente: {
        nombre_completo: pu.nombre_completo || "Cliente Invitado",
        correo: pu.correo_cliente || "",
        telefono: pu.telefono_cliente || "",
        tiene_cuenta: pu.tipo_cliente === "registrado"
      },
      productos: pedido.pedido_detalle.map(d => ({
        id_producto: d.id_producto,
        nombre: d.producto?.nombre || "Producto",
        marca: d.producto?.marca?.nombre || "",
        cantidad: d.cantidad,
        precio_unitario: d.precio_unitario,
        subtotal: d.subtotal || (d.precio_unitario * d.cantidad),
        total: d.total || (d.precio_unitario * d.cantidad),
        imagen: d.producto?.producto_imagen?.[0]?.imagen_url || null
      })),
      resumen_factura: {
        subtotal: pedido.subtotal || 0,
        descuento: pedido.descuento || 0,
        iva: pedido.IVA || 0,
        costo_envio: pedido.costo_envio || 0,
        total: pedido.total || 0
      }
    };

    return { ok: true, data: formattedData };
  }

  async verificarUsuarioPedido(bodyPayload, files, params, user) {
      const { id_pedido, correo } = params;
      
      let whereClause = { correo_cliente: correo };
      if (!isNaN(Number(id_pedido))) {
        whereClause.id_pedido = Number(id_pedido);
      } else {
        whereClause.pedido = { numero_pedido: String(id_pedido) };
      }

      const pedido = await prisma.pedido_Usuario.findFirst({
          where: whereClause
      });
      return { ok: true, valida: !!pedido };
  }

  async validateReorder(bodyPayload, files, params, user) {
    const { id_pedido } = bodyPayload;
    if (!id_pedido) throw { status: 400, message: "ID de pedido requerido" };
    const fechaActual = new Date();
    const includeReorder = {
      pedido_usuario: true, // Incluir usuario para extraer datos de contacto
      pedido_detalle: { include: { producto: { include: { producto_imagen: true,
              producto_promocion: { where: { promocion: { is: {fecha_inicio: { lte: fechaActual, }, fecha_finalizacion: 
                {gte: fechaActual,}, },
              }, }, include: { promocion: true } } } } } }, sucursal: { include: { municipio: { include: { departamento: true } } } } };

    let pedido = null;

    // Intentar primero por ID numérico
    if (!isNaN(Number(id_pedido)) && Number(id_pedido) > 0) {
      pedido = await prisma.pedido.findUnique({
        where: { id_pedido: Number(id_pedido) },
        include: includeReorder
      });
    }

    // Fallback: buscar por numero_pedido
    if (!pedido) {
      pedido = await prisma.pedido.findFirst({
        where: { numero_pedido: String(id_pedido) },
        include: includeReorder
      });
    }

    if (!pedido) throw { status: 404, message: "Pedido original no encontrado" };

    // Validar el stock en la sucursal del pedido para estos productos
    const stocks = await prisma.stock_Bodega.findMany({
      where: {
        id_producto: { in: pedido.pedido_detalle.map(d => d.id_producto) },
        bodega: { id_sucursal: pedido.id_sucursal }
      }
    });

    // Mapeo del stock total en la sucursal por producto
    const stockPorProducto = {};
    stocks.forEach(st => {
      stockPorProducto[st.id_producto] = (stockPorProducto[st.id_producto] || 0) + st.existencias;
    });

    // Validación ESTRICTA: Todos los productos deben tener stock suficiente
    for (const d of pedido.pedido_detalle) {
      const stockDisponible = stockPorProducto[d.id_producto] || 0;
      if (stockDisponible < d.cantidad) {
        throw { 
          status: 400, 
          message: `El producto '${d.producto?.nombre}' ya no tiene stock suficiente (requieres ${d.cantidad}, disponibles ${stockDisponible}) en la sucursal de origen.` 
        };
      }
    }

    const productos = pedido.pedido_detalle.map(d => {
    const precioOriginal = Number(d.producto?.precio_detalle || d.precio_unitario || 0);

    const mejorPromocion = d.producto?.producto_promocion?.reduce( (mejor, promoActual) => {
      const descuentoActual = Number(promoActual.descuento || 0);
      const descuentoMejor = Number(mejor?.descuento || 0); 
      return descuentoActual > descuentoMejor ? promoActual : mejor; }, null);

      const descuentoAplicado = mejorPromocion ? Math.max(0, Math.min(100, Number(mejorPromocion.descuento || 0))) : 0;

      const precioConDescuento = descuentoAplicado > 0 ? precioOriginal - (precioOriginal * descuentoAplicado) / 100 : precioOriginal;

      const precioFinal = Number(precioConDescuento.toFixed(2));

      return {
        id_producto: d.id_producto,
        img: d.producto?.producto_imagen?.[0]?.imagen_url || "",
        name: d.producto?.nombre || "Producto",
        qty: d.cantidad,
        price: precioFinal,
        precio_original: precioOriginal,
        descuento_aplicado: descuentoAplicado,
        tipo_descuento: descuentoAplicado > 0 ? "porcentaje" : "",
      };
    });

    const pu = pedido.pedido_usuario?.[0]; // Pedido_Usuario asociado

    const result = {
      id_sucursal: pedido.id_sucursal,
      id_municipio_sucursal: pedido.sucursal?.id_municipio || 0,
      departamento_sucursal: pedido.sucursal?.municipio?.departamento?.nombre || "",
      productos,
      contacto: pu ? {
        name: pu.nombre_completo,
        email: pu.correo_cliente,
        phone: pu.telefono_cliente
      } : undefined
    };

    return { ok: true, data: result };
  }
}

module.exports = new PedidosClientService();
