const prisma = require("../config/database");
const { enviarNotificacionClientes } = require("./notificaciones");

function getProductoIdsDuplicados(productos) {
  const vistos = new Set();
  const duplicados = new Set();

  productos.forEach((producto) => {
    const idProducto = Number(producto.id_producto);
    if (!Number.isFinite(idProducto)) return;
    if (vistos.has(idProducto)) duplicados.add(idProducto);
    vistos.add(idProducto);
  });

  return [...duplicados];
}

async function crearPromocion(req, res) {
  try {
    // 1. Extraer datos del body (Multer ya debió llenar esto)
    const { titulo, descripcion, fecha_inicio, fecha_finalizacion, productos } =
      req.body;

    // 2. Extraer el nombre del archivo guardado por Multer
    const banner = req.file ? req.file.filename : null;


    // 3. Validación manual estricta
    if (
      !titulo ||
      !descripcion ||
      !fecha_inicio ||
      !fecha_finalizacion ||
      !banner
    ) {
      return res.status(400).json({
        ok: false,
        msg: "Faltan datos obligatorios (Título, Descripción, Fechas o Banner)",
      });
    }

    // 4. Parsear los productos (vienen como string desde el FormData)
    const productosParsed = JSON.parse(productos || "[]");

    if (productosParsed.length === 0) {
      return res
        .status(400)
        .json({ ok: false, msg: "Debe seleccionar al menos un producto" });
    }

    const productoIdsDuplicados = getProductoIdsDuplicados(productosParsed);

    if (productoIdsDuplicados.length > 0) {
      return res.status(400).json({
        ok: false,
        msg: "Hay productos repetidos en la promoción. Revisa la selección antes de continuar.",
      });
    }

    const productoIds = productosParsed
      .map((p) => Number(p.id_producto))
      .filter((id) => Number.isFinite(id));

    if (productoIds.length !== productosParsed.length) {
      return res.status(400).json({
        ok: false,
        msg: "La selección contiene productos inválidos.",
      });
    }

    // 5. Creación en la base de datos (Usando Transacción para asegurar integridad)
    const resultado = await prisma.$transaction(async (tx) => {
      const productosConPromocion = await tx.producto_Promocion.findMany({
        where: {
          id_producto: { in: productoIds },
        },
        select: {
          id_producto: true,
          producto: {
            select: {
              nombre: true,
            },
          },
          promocion: {
            select: {
              titulo: true,
            },
          },
        },
      });

      if (productosConPromocion.length > 0) {
        const nombres = productosConPromocion
          .map(
            (item) =>
              `${item.producto?.nombre || `Producto ${item.id_producto}`} (${item.promocion?.titulo || "promoción existente"})`,
          )
          .join(", ");

        const error = new Error(
          `No se puede asignar más de una promoción al mismo producto. Ya están en promoción: ${nombres}.`,
        );
        error.statusCode = 409;
        throw error;
      }

      const configExistente = await tx.promocion.findFirst({
        select: {
          mostrar_precio_porcentaje: true,
          mostrar_precio_tachado: true,
        },
      });

      // Crear la promoción
      const nuevaPromo = await tx.promocion.create({
        data: {
          titulo,
          descripcion,
          banner_url: banner,
          fecha_inicio: new Date(fecha_inicio),
          fecha_finalizacion: new Date(fecha_finalizacion),
          mostrar_precio_porcentaje:
            configExistente?.mostrar_precio_porcentaje ?? false,
          mostrar_precio_tachado:
            configExistente?.mostrar_precio_tachado ?? true,
        },
      });

      // Crear las relaciones con los productos
      const promocionesProductos = productosParsed.map((p) => ({
        id_promocion: nuevaPromo.id_promocion,
        id_producto: p.id_producto,
        descuento: Math.round(parseFloat(p.descuento) * 100) / 100,
        tipo_descuento: p.tipo_descuento || "porcentaje",
        precio_promocion: p.tipo_descuento === "monto" && p.precio_promocion 
          ? Math.round(parseFloat(p.precio_promocion) * 100) / 100 
          : null,
      }));

      await tx.producto_Promocion.createMany({
        data: promocionesProductos,
      });

      return nuevaPromo;
    });

    // Enviar notificación a clientes (fuera de la transacción para no bloquear)
    enviarNotificacionClientes(
      "¡Nueva Promoción!",
      `Se ha publicado la promoción: ${titulo}. ¡Haz clic para ver los descuentos!`,
      `/promotion/${resultado.id_promocion}`,
    ).catch((err) =>
      console.error("Error al enviar notificación global de promoción:", err),
    );

    return res.status(201).json({
      ok: true,
      msg: "Promoción creada exitosamente",
      data: resultado,
    });
  } catch (error) {
    console.error("Error detallado:", error);
    return res.status(error.statusCode || 500).json({
      ok: false,
      msg: error.statusCode
        ? error.message
        : "Error interno al crear la promoción",
      error: error.message,
    });
  }
}

const obtenerPromociones = async (req, res) => {
  try {
    const { search = "" } = req.query;

    const promociones = await prisma.promocion.findMany({
      where: {
        titulo: {
          contains: search,
        },
      },
      select: {
        id_promocion: true,
        titulo: true,
        descripcion: true,
        banner_url: true,
        fecha_inicio: true,
        fecha_finalizacion: true,
        mostrar_precio_porcentaje: true,
        mostrar_precio_tachado: true,
      },
      orderBy: {
        id_promocion: "desc",
      },
    });

    return res.status(200).json({
      ok: true,
      promociones,
    });
  } catch (error) {
    console.error("Error al obtener promociones:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al obtener promociones",
    });
  }
};

const obtenerPromocionDetalle = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const promocion = await prisma.promocion.findUnique({
      where: {
        id_promocion: id,
      },
      include: {
        producto_promocion: {
          include: {
            producto: {
              include: {
                producto_imagen: true,
              },
            },
          },
        },
      },
    });

    if (!promocion) {
      return res.status(404).json({
        ok: false,
        msg: "Promoción no encontrada",
      });
    }

    return res.status(200).json({
      ok: true,
      promocion,
    });
  } catch (error) {
    console.error("Error detalle promocion:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al obtener detalle",
    });
  }
};
const editarPromocion = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const { titulo, descripcion, fecha_inicio, fecha_finalizacion } = req.body;

    // Extraer el nombre del archivo guardado por Multer
    const banner = req.file ? req.file.filename : null;


    // Validación manual
    if (!titulo || !descripcion || !fecha_inicio || !fecha_finalizacion) {
      return res.status(400).json({
        ok: false,
        msg: "Faltan datos obligatorios (Título, Descripción o Fechas)",
      });
    }

    // Construir objeto de actualización
    const updateData = {
      titulo,
      descripcion,
      fecha_inicio: new Date(fecha_inicio),
      fecha_finalizacion: new Date(fecha_finalizacion),
    };

    // Agregar banner solo si se subió uno nuevo
    if (banner) {
      updateData.banner_url = banner;
    }

    const promocion = await prisma.promocion.update({
      where: {
        id_promocion: id,
      },
      data: updateData,
    });

    return res.status(200).json({
      ok: true,
      msg: "Promoción actualizada exitosamente",
      promocion,
    });
  } catch (error) {
    console.error("Error actualizar promocion:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error interno al actualizar la promoción",
      error: error.message,
    });
  }
};

const eliminarPromocion = async (req, res) => {
  try {
    const { id } = req.params;

    const promocionExistente = await prisma.promocion.findUnique({
      where: {
        id_promocion: Number(id),
      },
    });

    if (!promocionExistente) {
      return res.status(404).json({
        ok: false,
        msg: "Promoción no encontrada",
      });
    }

    await prisma.producto_Promocion.deleteMany({
      where: {
        id_promocion: Number(id),
      },
    });

    await prisma.promocion.delete({
      where: {
        id_promocion: Number(id),
      },
    });

    return res.status(200).json({
      ok: true,
      msg: "Promoción eliminada correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar promoción:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al eliminar promoción",
    });
  }
};

const actualizarConfigVisualizacion = async (req, res) => {
  try {
    const { mostrar_precio_porcentaje, mostrar_precio_tachado } = req.body;
    if (
      mostrar_precio_porcentaje === undefined ||
      mostrar_precio_tachado === undefined
    ) {
      return res.status(400).json({
        ok: false,
        msg: "Parámetros 'mostrar_precio_porcentaje' y 'mostrar_precio_tachado' son requeridos",
      });
    }
    // Actualizar todas las promociones con la nueva configuración
    const result = await prisma.promocion.updateMany({
      data: {
        mostrar_precio_porcentaje: Boolean(mostrar_precio_porcentaje),
        mostrar_precio_tachado: Boolean(mostrar_precio_tachado),
      },
    });
    return res.status(200).json({
      ok: true,
      msg: "Configuración de visualización actualizada",
      promocionesActualizadas: result.count,
    });
  } catch (error) {
    console.error("Error actualizando configuración:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al actualizar configuración",
      error: error.message,
    });
  }
};

const actualizarConfigVisualizacionPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const { mostrar_precio_porcentaje, mostrar_precio_tachado } = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        ok: false,
        msg: "ID de promoción inválido",
      });
    }

    if (
      mostrar_precio_porcentaje === undefined ||
      mostrar_precio_tachado === undefined
    ) {
      return res.status(400).json({
        ok: false,
        msg: "Parámetros 'mostrar_precio_porcentaje' y 'mostrar_precio_tachado' son requeridos",
      });
    }

    const result = await prisma.promocion.update({
      where: { id_promocion: parseInt(id) },
      data: {
        mostrar_precio_porcentaje: Boolean(mostrar_precio_porcentaje),
        mostrar_precio_tachado: Boolean(mostrar_precio_tachado),
      },
    });

    return res.status(200).json({
      ok: true,
      msg: "Configuración de visualización actualizada",
      promocion: result,
    });
  } catch (error) {
    console.error("Error actualizando configuración:", error);
    return res.status(500).json({
      ok: false,
      msg: "Error al actualizar configuración",
      error: error.message,
    });
  }
};

module.exports = {
  crearPromocion,
  obtenerPromociones,
  obtenerPromocionDetalle,
  editarPromocion,
  eliminarPromocion,
  actualizarConfigVisualizacion,
  actualizarConfigVisualizacionPorId,
};
