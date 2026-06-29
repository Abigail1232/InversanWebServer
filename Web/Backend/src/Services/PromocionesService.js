const prisma = require("../config/database");

class PromocionesService {
  async obtenerPromociones() {
    const promociones = await prisma.promocion.findMany({
      select: {
        id_promocion: true,
        banner_url: true,
        fecha_finalizacion: true,
      },
    });

    if (promociones.length === 0) {
      throw { status: 404, message: "No hay promociones activas" };
    }
    return promociones;
  }

  async obtenerDetallePromocionProductos(id, id_sucursal, page = 1, pageSize = 8) {
    if (!id || isNaN(id)) {
      throw { status: 400, message: "ID de promoción no válido" };
    }

    const pageNum = parseInt(page);
    const pageSizeNum = parseInt(pageSize);

    if (pageNum < 1) {
      throw { status: 400, message: "Número de página inválido" };
    }

    const skip = (pageNum - 1) * pageSizeNum;

    const promoconDetalle = await prisma.promocion.findUnique({
      where: { id_promocion: parseInt(id) },
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
    });

    if (!promoconDetalle) {
      throw { status: 404, message: "Promoción no encontrada" };
    }

    const [totalProductos, productosPromocion] = await Promise.all([
      prisma.producto_Promocion.count({
        where: { id_promocion: parseInt(id) },
      }),
      prisma.producto_Promocion.findMany({
        where: { id_promocion: parseInt(id) },
        include: {
          producto: {
            include: {
              producto_imagen: true,
              marca: true,
              categoria: true,
              modelo_producto: { include: { modelo: true } },
              stock_bodega: {
                where: id_sucursal && id_sucursal !== 0
                  ? { bodega: { id_sucursal: parseInt(id_sucursal) } }
                  : undefined,
                select: {
                  existencias: true,
                  bodega: { select: { id_sucursal: true } },
                },
              },
            },
          },
        },
        skip,
        take: pageSizeNum,
        orderBy: { id_producto: "desc" },
      }),
    ]);

    const totalPages = Math.ceil(totalProductos / pageSizeNum);

    const productos = productosPromocion.map((pp) => {
      const producto = pp.producto;

      const precios = [parseFloat(producto.precio_detalle)];
      if (producto.precio_mayoreo)
        precios.push(parseFloat(producto.precio_mayoreo));

      if (pp.descuento && pp.descuento > 0) {
        // Si tipo_descuento es "monto" y existe precio_promocion, usarlo directamente
        if (pp.tipo_descuento === "monto" && pp.precio_promocion) {
          precios.push(parseFloat(pp.precio_promocion));
        } else {
          const precioConDesc =
            Math.round((producto.precio_detalle * (1 - pp.descuento / 100)) * 100) / 100;
          precios.push(precioConDesc);
        }
      }

      const precioMasBajo = parseFloat(Math.min(...precios).toFixed(2));
      const stockSucursal = producto.stock_bodega.reduce(
        (total, sb) => total + sb.existencias,
        0,
      );

      // Usar la configuración de la promoción para determinar el modo de visualización
      const mostrarPorcentaje = Boolean(promoconDetalle.mostrar_precio_porcentaje);
      const mostrarPrecioTachado = Boolean(promoconDetalle.mostrar_precio_tachado);
      let promotionDisplayMode = "precio_tachado";

      if (mostrarPorcentaje && !mostrarPrecioTachado) {
        promotionDisplayMode = "porcentaje";
      } else if (mostrarPrecioTachado && !mostrarPorcentaje) {
        promotionDisplayMode = "precio_tachado";
      } else {
        // Si ambos son true o ambos son false, usar precio_tachado por defecto
        promotionDisplayMode = "precio_tachado";
      }

      return {
        id: producto.id_producto,
        brand: producto.marca?.nombre || "",
        modelos: producto.modelo_producto.map((mp) => mp.modelo.nombre),
        name: producto.nombre,
        price: precioMasBajo,
        originalPrice: parseFloat(producto.precio_detalle),
        discountPercent: Math.round((pp.descuento ?? 0) * 100) / 100,
        promotionDisplayMode,
        imageUrl: producto.producto_imagen?.[0]?.imagen_url || "",
        stock: stockSucursal,
      };
    });

    return {
      promocion: {
        id_promocion: promoconDetalle.id_promocion,
        titulo: promoconDetalle.titulo,
        descripcion: promoconDetalle.descripcion,
        banner_url: promoconDetalle.banner_url,
        fecha_inicio: promoconDetalle.fecha_inicio,
        fecha_finalizacion: promoconDetalle.fecha_finalizacion,
        mostrar_precio_porcentaje: promoconDetalle.mostrar_precio_porcentaje ?? true,
        mostrar_precio_tachado: promoconDetalle.mostrar_precio_tachado ?? false,
      },
      productos,
      pagination: {
        currentPage: pageNum,
        pageSize: pageSizeNum,
        totalProductos,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    };
  }

  async actualizarConfigVisualizacion(id, config) {
    const { mostrar_precio_porcentaje, mostrar_precio_tachado } = config;

    if (!id || isNaN(id)) {
      throw { status: 400, message: "ID de promoción no válido" };
    }

    const promocionActualizada = await prisma.promocion.update({
      where: { id_promocion: parseInt(id) },
      data: {
        mostrar_precio_porcentaje: mostrar_precio_porcentaje ?? true,
        mostrar_precio_tachado: mostrar_precio_tachado ?? false,
      },
    });

    return promocionActualizada;
  }
}

module.exports = new PromocionesService();
