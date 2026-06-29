const prisma = require("../config/database");

// Honduras está en UTC-6 (sin horario de verano)
// Para que un día local "2026-05-05" cubra el rango correcto en UTC,
// necesitamos sumar 6 horas: 00:00 local = 06:00 UTC, 23:59 local = 05:59 UTC del día siguiente
const HN_OFFSET_HOURS = 6;

const inicioDiaLocalAUTC = (fechaStr) => {
  // fechaStr: "YYYY-MM-DD" → Date en UTC que representa 00:00 hora Honduras
  return new Date(
    `${fechaStr}T${String(HN_OFFSET_HOURS).padStart(2, "0")}:00:00.000Z`
  );
};

const finDiaLocalAUTC = (fechaStr) => {
  // fechaStr: "YYYY-MM-DD" → Date en UTC que representa 23:59:59 hora Honduras (= 05:59 UTC del día siguiente)
  const d = new Date(
    `${fechaStr}T${String(HN_OFFSET_HOURS).padStart(2, "0")}:00:00.000Z`
  );
  d.setUTCDate(d.getUTCDate() + 1);
  d.setUTCMilliseconds(d.getUTCMilliseconds() - 1);
  return d;
};

const validarCompra = async (req, res) => {
  try {
    const {
      id_pedido,
      id_pedido_usuario,
      id_usuario_emisor,
      observacion = "",
    } = req.body;

    //validacion de pedido y usuario emisor
    if (!id_pedido || !id_pedido_usuario || !id_usuario_emisor) {
      return res.status(400).json({
        ok: false,
        msg: "Faltan datos para crear la factura",
      });
    }

    const resultado = await prisma.$transaction(async (tx) => {
      //busca pedido
      const pedido = await tx.pedido.findUnique({
        where: { id_pedido: Number(id_pedido) },
        include: {
          pedido_detalle: true,
          factura: true,
          pedido_usuario: true,
        },
      });

      if (!pedido) {
        throw new Error("El pedido no existe");
      }

      //validar que el pedido tenga detalle
      if (!pedido.pedido_detalle || pedido.pedido_detalle.length === 0) {
        throw new Error("El pedido no tiene detalles para facturar");
      }

      //validar que no exista factura previa para ese pedido
      if (pedido.factura) {
        throw new Error("Este pedido ya tiene una factura generada");
      }

      //validar que el pedido_usuario exista y pertenezca a ese pedido
      const pedidoUsuario = await tx.pedido_Usuario.findUnique({
        where: { id_pedido_usuario: Number(id_pedido_usuario) },
      });

      if (!pedidoUsuario) {
        throw new Error("El registro de pedido_usuario no existe");
      }

      if (pedidoUsuario.id_pedido !== Number(id_pedido)) {
        throw new Error("El pedido_usuario no pertenece al pedido indicado");
      }

      //validar usuario emisor
      const usuarioEmisor = await tx.usuario.findUnique({
        where: { id_usuario: Number(id_usuario_emisor) },
      });

      if (!usuarioEmisor) {
        throw new Error("El usuario emisor no existe");
      }

      //se agarra del pedido
      let tipoPagoFactura = pedido.tipo_de_pago;

      //ajuste por si el pedido viene con un valor que también existe en factura
      const tiposPermitidosFactura = [
        "efectivo",
        "transferencia_bancaria",
        "pos",
        "compra_click",
        "mi_pos",
        "pay_pal",
      ];

      if (!tiposPermitidosFactura.includes(tipoPagoFactura)) {
        throw new Error("Tipo de pago inválido para la factura");
      }

      //generar número de factura
      const numeroFactura = `FAC-${Date.now()}`;

      //crear factura
      const facturaCreada = await tx.factura.create({
        data: {
          numero_factura: numeroFactura,
          fecha_emision: new Date(),
          id_pedido: Number(id_pedido),
          id_pedido_usuario: Number(id_pedido_usuario),
          id_usuario_emisor: Number(id_usuario_emisor),
          subtotal: pedido.subtotal,
          descuento: pedido.descuento,
          iva: pedido.IVA,
          costo_envio: pedido.costo_envio,
          total: pedido.total,
          tipo_de_pago: tipoPagoFactura,
          estado: "emitida",
          observacion,
        },
      });

      //preparar detalle de factura copiando desde pedido_detalle
      const detallesFactura = pedido.pedido_detalle.map((item) => ({
        id_factura: facturaCreada.id_factura,
        id_producto: item.id_producto,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        descuento: 0, // el descuento global ya va en la cabecera
        subtotal: item.subtotal,
        total: item.total,
      }));

      //crear detalles
      const detallesCreados = await tx.factura_Detalle.createMany({
        data: detallesFactura,
      });

      //actualiza estado del pedido
      await tx.pedido.update({
        where: { id_pedido: Number(id_pedido) },
        data: {
          estado: "en_proceso",
        },
      });

      return {
        factura: facturaCreada,
        detalle: {
          total_registros: detallesCreados.count,
          detalles: detallesFactura,
        },
      };
    });

    return res.status(201).json({
      ok: true,
      msg: "Factura creada correctamente",
      data: resultado,
    });
  } catch (error) {
    console.error("Error al crear la factura:", error);

    return res.status(500).json({
      ok: false,
      msg: error.message || "Error interno al crear la factura",
    });
  }
};

const obtenerFacturas = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    if (page < 1 || limit < 1) {
      return res.status(400).json({
        ok: false,
        msg: "Los parámetros page y limit deben ser mayores a 0",
      });
    }

    const skip = (page - 1) * limit;

    const [totalRegistros, facturas] = await Promise.all([
      prisma.factura.count(),
      prisma.factura.findMany({
        select: {
          id_factura: true,
          fecha_emision: true,
          total: true,
          tipo_de_pago: true,
          estado: true,
        },
        orderBy: {
          fecha_emision: "desc",
        },
        skip,
        take: limit,
      }),
    ]);

    return res.status(200).json({
      ok: true,
      page,
      limit,
      total_registros: totalRegistros,
      total_paginas: Math.ceil(totalRegistros / limit),
      facturas,
    });
  } catch (error) {
    console.error("Error al obtener facturas:", error);

    return res.status(500).json({
      ok: false,
      msg: "Error interno al obtener las facturas",
      error: error.message,
    });
  }
};

const obtenerDetallePorPedido = async (req, res) => {
  try {
    const { id_pedido } = req.params;

    if (!id_pedido) {
      return res.status(400).json({
        ok: false,
        msg: "Debes enviar el id_pedido",
      });
    }

    const pedidoExiste = await prisma.pedido.findUnique({
      where: {
        id_pedido: Number(id_pedido),
      },
      select: {
        id_pedido: true,
      },
    });

    if (!pedidoExiste) {
      return res.status(404).json({
        ok: false,
        msg: "El pedido no existe",
      });
    }

    const detalles = await prisma.pedido_Detalle.findMany({
      where: {
        id_pedido: Number(id_pedido),
      },
      select: {
        cantidad: true,
        precio_unitario: true,
        subtotal: true,
        total: true,
        pedido: {
          select: {
            id_pedido: true,
            direccion: true,
            tipo_de_pago: true,
          },
        },
        producto: {
          select: {
            nombre: true,
          },
        },
      },
      orderBy: {
        id_pedido_detalle: "asc",
      },
    });

    const resultado = detalles.map((detalle) => ({
      id_pedido: detalle.pedido.id_pedido,
      nombre_producto: detalle.producto.nombre,
      cantidad: detalle.cantidad,
      precio_unitario: detalle.precio_unitario,
      subtotal: detalle.subtotal,
      direccion: detalle.pedido.direccion,
      metodo_de_pago: detalle.pedido.tipo_de_pago,
      total: detalle.total,
    }));

    return res.status(200).json({
      ok: true,
      total_registros: resultado.length,
      detalles: resultado,
    });
  } catch (error) {
    console.error("Error al obtener detalle del pedido:", error);

    return res.status(500).json({
      ok: false,
      msg: "Error interno al obtener el detalle del pedido",
      error: error.message,
    });
  }
};

const obtenerCantidadVentas = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;

    if (!fecha_inicio || !fecha_fin) {
      return res.status(400).json({
        ok: false,
        msg: "Debes enviar fecha_inicio y fecha_fin",
      });
    }

    // Rango solicitado (interpretado como hora Honduras)
    const inicio = inicioDiaLocalAUTC(fecha_inicio);
    const fin = finDiaLocalAUTC(fecha_fin);

    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
      return res.status(400).json({
        ok: false,
        msg: "Las fechas enviadas no son válidas",
      });
    }

    // Día actual en hora Honduras
    const ahora = new Date();
    // Calcular la fecha local Honduras (restar 6 horas a UTC)
    const ahoraHN = new Date(
      ahora.getTime() - HN_OFFSET_HOURS * 60 * 60 * 1000
    );
    const hoyStr = `${ahoraHN.getUTCFullYear()}-${String(
      ahoraHN.getUTCMonth() + 1
    ).padStart(2, "0")}-${String(ahoraHN.getUTCDate()).padStart(2, "0")}`;
    const inicioHoy = inicioDiaLocalAUTC(hoyStr);
    const finHoy = finDiaLocalAUTC(hoyStr);

    const [ventasRango, ventasHoy] = await Promise.all([
      prisma.pedido.count({
        where: {
          estado: "entregado",
          fecha: {
            gte: inicio,
            lte: fin,
          },
        },
      }),
      prisma.pedido.count({
        where: {
          estado: "entregado",
          fecha: {
            gte: inicioHoy,
            lte: finHoy,
          },
        },
      }),
    ]);

    return res.status(200).json({
      ok: true,
      fecha_inicio,
      fecha_fin,
      total_ventas_rango: ventasRango,
      ventas_dia_actual: ventasHoy,
    });
  } catch (error) {
    console.error("Error al obtener cantidad de ventas:", error);

    return res.status(500).json({
      ok: false,
      msg: "Error interno al obtener la cantidad de ventas",
      error: error.message,
    });
  }
};

const filtrarFacturas = async (req, res) => {
  try {
    const {
      fecha_inicio,
      fecha_fin,
      metodo_pago,
      marca,
      sucursal,
      tipo_cliente,
      page = 1,
      limit = 10,
    } = req.query;

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    if (pageNum < 1 || limitNum < 1) {
      return res.status(400).json({
        ok: false,
        msg: "Los parámetros page y limit deben ser mayores a 0",
      });
    }

    // Solo pedidos entregados
    const where = { estado: "entregado" };

    // Filtro por fecha (interpretado como hora Honduras)
    if (fecha_inicio || fecha_fin) {
      where.fecha = {};

      if (fecha_inicio) {
        const inicio = inicioDiaLocalAUTC(fecha_inicio);
        if (isNaN(inicio.getTime())) {
          return res
            .status(400)
            .json({ ok: false, msg: "fecha_inicio no es válida" });
        }
        where.fecha.gte = inicio;
      }

      if (fecha_fin) {
        const fin = finDiaLocalAUTC(fecha_fin);
        if (isNaN(fin.getTime())) {
          return res
            .status(400)
            .json({ ok: false, msg: "fecha_fin no es válida" });
        }
        where.fecha.lte = fin;
      }
    }

    // Filtro por método de pago
    if (
      metodo_pago &&
      String(metodo_pago).trim() !== "" &&
      String(metodo_pago).toLowerCase() !== "todos"
    ) {
      where.tipo_de_pago = String(metodo_pago);
    }

    if (tipo_cliente && String(tipo_cliente).toLowerCase() !== "todos") {
      where.pedido_usuario = {
        some: {
          tipo_cliente: String(tipo_cliente).toLowerCase(),
        },
      };
    }

    if (sucursal && String(sucursal).toLowerCase() !== "todas") {
      where.sucursal = {
        nombre: { contains: String(sucursal) },
      };
    }

    if (marca && String(marca).toLowerCase() !== "todas las marcas" && String(marca).toLowerCase() !== "todas") {
      where.pedido_detalle = {
        some: {
          producto: {
            marca: { nombre: String(marca) },
          },
        },
      };
    }

    const [totalRegistros, pedidos] = await Promise.all([
      prisma.pedido.count({ where }),
      prisma.pedido.findMany({
        where,
        select: {
          id_pedido: true,
          numero_pedido: true,
          fecha: true,
          direccion: true,
          subtotal: true,
          descuento: true,
          IVA: true,
          costo_envio: true,
          total: true,
          tipo_de_pago: true,
          estado: true,
          sucursal: {
            select: { nombre: true },
          },
          pedido_usuario: {
            select: {
              nombre_completo: true,
              correo_cliente: true,
              telefono_cliente: true,
              tipo_cliente: true,
            },
          },
          pedido_asignacion: {
            select: {
              repartidor: {
                select: {
                  primer_nombre: true,
                  primer_apellido: true,
                },
              },
            },
            orderBy: { fecha_asignacion: "desc" },
            take: 1,
          },
          pedido_detalle: {
            select: {
              id_pedido_detalle: true,
              cantidad: true,
              precio_unitario: true,
              subtotal: true,
              total: true,
              producto: {
                select: {
                  id_producto: true,
                  nombre: true,
                  lonas: true,
                  profundidad: true,
                  rin: true,
                  marca: {
                    select: {
                      nombre: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          fecha: "desc",
        },
        skip,
        take: limitNum,
      }),
    ]);

    // Mapear pedidos al formato que espera el frontend (como si fueran facturas)
    const data = pedidos.map((p) => ({
      id_factura: p.id_pedido,
      numero_factura: p.numero_pedido,
      fecha_emision: p.fecha,
      direccion: p.direccion,
      subtotal: p.subtotal,
      descuento: p.descuento,
      iva: p.IVA,
      costo_envio: p.costo_envio,
      total: p.total,
      tipo_de_pago: p.tipo_de_pago,
      estado: p.estado,
      cliente:
        p.pedido_usuario &&
          p.pedido_usuario.length > 0 &&
          p.pedido_usuario[0].nombre_completo
          ? {
            nombre: p.pedido_usuario[0].nombre_completo,
            correo: p.pedido_usuario[0].correo_cliente,
            telefono: p.pedido_usuario[0].telefono_cliente,
            tipo: p.pedido_usuario[0].tipo_cliente,
          }
          : null,
      sucursal: p.sucursal ? p.sucursal.nombre : "—",
      repartidor:
        p.pedido_asignacion &&
          p.pedido_asignacion.length > 0 &&
          p.pedido_asignacion[0].repartidor
          ? `${p.pedido_asignacion[0].repartidor.primer_nombre} ${p.pedido_asignacion[0].repartidor.primer_apellido}`
          : null,
      factura_detalle: p.pedido_detalle.map((d) => ({
        id_factura_detalle: d.id_pedido_detalle,
        cantidad: d.cantidad,
        precio_unitario: d.precio_unitario,
        subtotal: d.subtotal,
        total: d.total,
        producto: d.producto,
      })),
    }));

    return res.status(200).json({
      ok: true,
      page: pageNum,
      limit: limitNum,
      total_registros: totalRegistros,
      total_paginas: Math.ceil(totalRegistros / limitNum),
      data,
    });
  } catch (error) {
    console.error("Error al filtrar facturas:", error);

    return res.status(500).json({
      ok: false,
      msg: "Error interno al filtrar facturas",
      error: error.message,
    });
  }
};

module.exports = {
  validarCompra,
  obtenerFacturas,
  obtenerDetallePorPedido,
  obtenerCantidadVentas,
  filtrarFacturas,
};
