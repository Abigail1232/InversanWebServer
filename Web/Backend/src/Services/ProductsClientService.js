const prisma = require("../config/database");

class ProductsClientService {
  async obtenerProductoPorId(id, filtros) {

    // params provided via args
    const {  id_sucursal  } = filtros || {};

    if (!id || isNaN(Number(id))) {
      throw { status: 400, message: "ID inválido" };
    }

    if (id_sucursal && isNaN(Number(id_sucursal))) {
      throw { status: 400, message: "El id_sucursal es inválido" };
    }

    const producto = await prisma.producto.findUnique({
      where: { id_producto: Number(id) },
      include: {
        marca: true,
        categoria: true,
        diseno: true,
        modelo_producto: true,
        producto_imagen: true,
        producto_promocion: {
          select: {
            descuento: true,
            tipo_descuento: true,
            precio_promocion: true,
            promocion: {
              select: {
                fecha_inicio: true,
                fecha_finalizacion: true,
                mostrar_precio_porcentaje: true,
                mostrar_precio_tachado: true,
              },
            },
          },
        },
        stock_bodega: {
          where: id_sucursal
            ? {
                bodega: {
                  id_sucursal: Number(id_sucursal),
                },
              }
            : undefined,
          select: {
            existencias: true,
          },
        },
      },
    });

    if (!producto) {
      throw { status: 404, message: "Producto no encontrado" };
    }

    const stock_total = producto.stock_bodega.reduce(
      (acumulado, bodega) => acumulado + bodega.existencias,
      0,
    );

    const productoFormateado = {
      id_producto: producto.id_producto,
      nombre: producto.nombre,
      estado: producto.estado,
      descripcion: producto.descripcion,
      imagen_3d: producto.imagen_3d,
      marca: producto.marca?.nombre || null,
      categoria: producto.categoria?.nombre || null,
      id_diseno: producto.id_diseno,
      diseno: producto.diseno
        ? {
            id_diseno: producto.diseno.id_diseno,
            nombre: producto.diseno.nombre,
            imagen_url: producto.diseno.imagen_url || null,
          }
        : null,

      modelos: producto.modelo_producto.map((m) => ({
        id_modelo: m.id_modelo,
        nombre: m.nombre,
        anio: m.anio,
      })),

      especificaciones: {
        rin: producto.rin,
        ancho_rin: producto.ancho_rin,
        alto_rin: producto.alto_rin,
        version: producto.version,
        lonas: producto.lonas,
        profundidad: producto.profundidad,
        indice_de_carga: producto.indice_de_carga,
        presion_maxima: producto.presion_maxima,
        indice_velocidad: producto.indice_velocidad,
      },

      precios: {
        detalle: producto.precio_detalle,
        mayoreo: producto.precio_mayoreo,
        coste: producto.precio_coste,
      },
      imagenes: producto.producto_imagen.map((img) => ({
        id: img.id_imagen,
        url: img.imagen_url,
        orden: img.orden,
      })),

      promociones: producto.producto_promocion || [],
      stock_total,
    };

    return {
      success: true,
      producto: productoFormateado,
    };
  }

  async detalleProducto(id) {

    // params provided via args
    if (!id || isNaN(id))
      throw { status: 400, message: "ID del producto inválido" };

    const ahora = new Date();
    const producto = await prisma.producto.findUnique({
      where: { id_producto: Number(id) },
      include: {
        diseno: {
          select: { id_diseno: true, nombre: true, imagen_url: true },
        },
        modelo_producto: { include: { modelo: true } },
        producto_imagen: true,
        producto_promocion: {
          where: {
            promocion: {
              fecha_inicio: { lte: ahora },
              fecha_finalizacion: { gte: ahora },
            },
          },
          include: {
            promocion: {
              select: {
                titulo: true,
                fecha_finalizacion: true,
                mostrar_precio_porcentaje: true,
                mostrar_precio_tachado: true,
              },
            },
          },
        },
        stock_bodega: {
          select: {
            existencias: true,
          },
        },
      },
    });

    if (!producto) {
      throw { status: 404, message: "Producto no encontrado" };
    }

    const precioConISV = producto.precio_detalle * 1.15;
    const promocionActiva =
      producto.producto_promocion.length > 0
        ? {
            fechaFin:
              producto.producto_promocion[0].promocion.fecha_finalizacion,
            mensaje: `Promoción válida hasta ${new Date(
              producto.producto_promocion[0].promocion.fecha_finalizacion,
            ).toLocaleDateString("es-ES")}`,
          }
        : null;

    const unidadesDisponibles = producto.stock_bodega.reduce(
      (acumulado, sb) => acumulado + sb.existencias,
      0,
    );

    const modelosNombres = producto.modelo_producto
      .map((mp) => mp.modelo.nombre)
      .join(", ");

    const previsualizacion = {
      id_producto: producto.id_producto,
      nombre: producto.nombre,
      estado: producto.estado,
      modelo: modelosNombres || "N/A",
      id_diseno: producto.id_diseno,
      diseno: producto.diseno
        ? {
            id_diseno: producto.diseno.id_diseno,
            nombre: producto.diseno.nombre,
            imagen_url: producto.diseno.imagen_url || null,
          }
        : null,
      imagenes: producto.producto_imagen.map((img) => ({
        id: img.id_imagen,
        url: img.imagen_url,
      })),
      precios: {
        precioDetalle: producto.precio_detalle,
        precioConISV: parseFloat(precioConISV.toFixed(2)),
        isvAplicado: 15,
      },
      promocion: promocionActiva,
      fichaTecnica: {
        lonas: producto.lonas,
        presionMaxima: producto.presion_maxima,
        indiceDeCarga: producto.indice_de_carga,
        rin: producto.rin,
        indiceDeVelocidad: producto.indice_velocidad,
        profundidad: producto.profundidad,
      },
      unidadesDisponibles,
      descripcion: producto.descripcion,
    };

    return {
      success: true,
      producto: previsualizacion,
    };
  }

  async buscarProductos(filtros) {

    const { 
      busqueda,
      model,
      year,
      version,
      categoria,
      id_categoria,
      marca,
      marca_vehiculo,
      rin,
      id_sucursal,
      page = 1,
      pageSize = 8,
     } = filtros;

    const pageNum = parseInt(page);
    const pageSizeNum = parseInt(pageSize);
    if (pageNum < 1 || pageSizeNum < 1) {
       throw { status: 400, message: "Página o tamaño inválido" };
    }

    const skip = (pageNum - 1) * pageSizeNum;

    const whereConditions = {
      estado: true,
      AND: [],
    };

    if (busqueda && busqueda.trim() !== "") {
      whereConditions.AND.push({
        OR: [
          { nombre: { contains: busqueda.trim() } },
          { marca: { nombre: { contains: busqueda.trim() } } },
          { categoria: { nombre: { contains: busqueda.trim() } } },
          {
            modelo_producto: {
              some: { modelo: { nombre: { contains: busqueda.trim() } } },
            },
          },
        ],
      });
    }

    if (id_categoria) {
      whereConditions.AND.push({ id_categoria: Number(id_categoria) });
    } else if (categoria && categoria.trim() !== "") {
      whereConditions.AND.push({
        categoria: { nombre: { contains: categoria.trim() } },
      });
    }

    if (marca && marca.trim() !== "") {
      whereConditions.AND.push({
        marca: { nombre: { contains: marca.trim() } },
      });
    }

    const modeloFiltro = { activo: true };

    if (marca_vehiculo && marca_vehiculo.trim() !== "") {
      modeloFiltro.marca = { contains: marca_vehiculo.trim() };
    }

    if (year && year.trim() !== "") {
      const yearNum = parseInt(year);
      if (!isNaN(yearNum)) {
        modeloFiltro.anio = {
          gte: new Date(yearNum, 0, 1),
          lt: new Date(yearNum + 1, 0, 1),
        };
      }
    }

    if (model && model.trim() !== "") {
      modeloFiltro.nombre = {
        contains: model.trim(),
      };
    }

    const modeloProductoConditions = {
      modelo: modeloFiltro
    };

    if (version && version.trim() !== "" && version !== "Sin versión específica") {
      modeloProductoConditions.version = {
        nombre: { contains: version.trim() }
      };
    }

    if (marca_vehiculo || model || year || (version && version !== "Sin versión específica")) {
      whereConditions.AND.push({
        modelo_producto: {
          some: modeloProductoConditions,
        },
      });
    }

    if (rin) {
      const rinNum = parseInt(rin);
      if (!isNaN(rinNum)) {
        whereConditions.AND.push({ rin: rinNum });
      }
    }

    if (whereConditions.AND.length === 0) delete whereConditions.AND;

    const [totalProductos, productos] = await Promise.all([
      prisma.producto.count({ where: whereConditions }),
      prisma.producto.findMany({
        where: whereConditions,
        select: {
          id_producto: true,
          nombre: true,
          precio_detalle: true,
          marca: { select: { nombre: true } },
          modelo_producto: { include: { modelo: true } },
          producto_imagen: {
            select: { id_imagen: true, imagen_url: true, orden: true },
            orderBy: { orden: "asc" },
          },
          stock_bodega: {
            where: id_sucursal
              ? { bodega: { id_sucursal: parseInt(id_sucursal) } }
              : undefined,
            select: {
              existencias: true,
              bodega: {
                select: {
                  id_bodega: true,
                  nombre: true,
                  sucursal: { select: { id_sucursal: true, nombre: true } },
                },
              },
            },
          },
          producto_promocion: {
            select: {
              descuento: true,
              tipo_descuento: true,
              precio_promocion: true,
              promocion: {
                select: {
                  id_promocion: true,
                  titulo: true,
                  fecha_inicio: true,
                  fecha_finalizacion: true,
                  mostrar_precio_porcentaje: true,
                  mostrar_precio_tachado: true,
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

    const productosFormateados = productos.map((p) => {
      const fechaActual = new Date();

      const promocionesActivas =
        p.producto_promocion?.filter(
          (pp) =>
            pp.descuento &&
            pp.descuento > 0 &&
            pp.promocion.fecha_inicio <= fechaActual &&
            pp.promocion.fecha_finalizacion >= fechaActual,
        ) || [];

      let precioConDescuento = p.precio_detalle;
      let porcentajeDescuento = 0;

      if (promocionesActivas.length > 0) {
        const promocionActiva = promocionesActivas[0];
        const descuento = promocionActiva.descuento;
        porcentajeDescuento = descuento;
        
        // Si tipo_descuento es "monto" y existe precio_promocion, usarlo directamente
        if (promocionActiva.tipo_descuento === "monto" && promocionActiva.precio_promocion) {
          precioConDescuento = parseFloat(promocionActiva.precio_promocion);
        } else {
          precioConDescuento = Math.round((p.precio_detalle * (1 - descuento / 100)) * 100) / 100;
        }
      }

      const promocionActiva = promocionesActivas[0];
      const mostrarPorcentaje = Boolean(promocionActiva?.promocion?.mostrar_precio_porcentaje);
      const mostrarPrecioTachado = Boolean(promocionActiva?.promocion?.mostrar_precio_tachado);
      let promotionDisplayMode = "precio_tachado";

      // Usar la configuración de la promoción para determinar el modo de visualización
      if (mostrarPorcentaje && !mostrarPrecioTachado) {
        promotionDisplayMode = "porcentaje";
      } else if (mostrarPrecioTachado && !mostrarPorcentaje) {
        promotionDisplayMode = "precio_tachado";
      } else {
        // Si ambos son true o ambos son false, usar precio_tachado por defecto
        promotionDisplayMode = "precio_tachado";
      }

      return {
        id_producto: p.id_producto,
        nombre: p.nombre,
        marca: p.marca?.nombre || "N/A",
        modelos: p.modelo_producto.map((mp) => mp.modelo.nombre),
        precio_detalle: parseFloat(precioConDescuento.toFixed(2)),
        precio_original: parseFloat(p.precio_detalle.toFixed(2)),
        descuento: porcentajeDescuento,
        promotionDisplayMode,
        imageUrl:
          p.producto_imagen.length > 0 ? p.producto_imagen[0].imagen_url : "",
        stock: p.stock_bodega.reduce((total, sb) => total + sb.existencias, 0),
        sucursales: p.stock_bodega.map((sb) => ({
          id_sucursal: sb.bodega.sucursal.id_sucursal,
          nombre_sucursal: sb.bodega.sucursal.nombre,
          bodega: sb.bodega.nombre,
          existencias: sb.existencias,
        })),
      };
    });

    return {
      success: true,
      data: productosFormateados,
      pagination: {
        currentPage: pageNum,
        pageSize: pageSizeNum,
        totalProductos,
        totalPages: Math.ceil(totalProductos / pageSizeNum),
        hasNextPage: pageNum < Math.ceil(totalProductos / pageSizeNum),
        hasPrevPage: pageNum > 1,
      },
    };
  }

  async obtenerProductosPorMarca(filtros) {

    const {  id_marca, id_sucursal, page = 1  } = filtros;
    const pageNum = parseInt(page);
    const pageSize = 8;
    if (pageNum < 1)
      throw { status: 400, message: "Número de página inválido" };
    const skip = (pageNum - 1) * pageSize;
    let whereConditions = { estado: true };
    let marcaInfo = null;
    if (id_marca && id_marca.trim() !== "") {
      if (isNaN(id_marca))
        return res
          .status(400)
          .json({ error: "Parámetro 'id_marca' debe ser un número" });
      marcaInfo = await prisma.marca.findUnique({
        where: { id_marca: parseInt(id_marca) },
        select: { nombre: true, logo_url: true, banner_url: true },
      });
      if (!marcaInfo)
        throw { status: 404, message: "Marca no encontrada" };
      whereConditions.id_marca = parseInt(id_marca);
    }

    const [totalProductos, productos] = await Promise.all([
      prisma.producto.count({ where: whereConditions }),
      prisma.producto.findMany({
        where: whereConditions,
        select: {
          id_producto: true,
          nombre: true,
          precio_detalle: true,
          marca: { select: { id_marca: true, nombre: true } },
          modelo_producto: { include: { modelo: true } },
          producto_imagen: {
            select: { imagen_url: true },
            orderBy: { orden: "asc" },
            take: 1,
          },
          stock_bodega: {
            where: id_sucursal && parseInt(id_sucursal) > 0
              ? {
                  bodega: { id_sucursal: parseInt(id_sucursal) },
                }
              : undefined,
            select: { existencias: true },
          },
          producto_promocion: {
            select: {
              descuento: true,
              tipo_descuento: true,
              precio_promocion: true,
              promocion: {
                select: {
                  id_promocion: true,
                  titulo: true,
                  fecha_inicio: true,
                  fecha_finalizacion: true,
                  mostrar_precio_porcentaje: true,
                  mostrar_precio_tachado: true,
                },
              },
            },
          },
        },
        skip,
        take: pageSize,
        orderBy: { id_producto: "desc" },
      }),
    ]);
    const totalPages = Math.ceil(totalProductos / pageSize);
    const productosFormateados = productos.map((p) => {
      const fechaActual = new Date();

      const promocionesActivas =
        p.producto_promocion?.filter(
          (pp) =>
            pp.descuento &&
            pp.descuento > 0 &&
            pp.promocion.fecha_inicio <= fechaActual &&
            pp.promocion.fecha_finalizacion >= fechaActual,
        ) || [];

      let precioConDescuento = p.precio_detalle;
      let precioOriginal = p.precio_detalle;
      let porcentajeDescuento = 0;

      if (promocionesActivas.length > 0) {
        const promocionActiva = promocionesActivas[0];
        const descuento = promocionActiva.descuento;
        porcentajeDescuento = descuento;
        
        // Si tipo_descuento es "monto" y existe precio_promocion, usarlo directamente
        if (promocionActiva.tipo_descuento === "monto" && promocionActiva.precio_promocion) {
          precioConDescuento = parseFloat(promocionActiva.precio_promocion);
        } else {
          precioConDescuento = Math.round((p.precio_detalle * (1 - descuento / 100)) * 100) / 100;
        }
      }

      const promocionActiva = promocionesActivas[0];
      const mostrarPorcentaje = Boolean(promocionActiva?.promocion?.mostrar_precio_porcentaje);
      const mostrarPrecioTachado = Boolean(promocionActiva?.promocion?.mostrar_precio_tachado);
      let promotionDisplayMode = "precio_tachado";

      // Usar la configuración de la promoción para determinar el modo de visualización
      if (mostrarPorcentaje && !mostrarPrecioTachado) {
        promotionDisplayMode = "porcentaje";
      } else if (mostrarPrecioTachado && !mostrarPorcentaje) {
        promotionDisplayMode = "precio_tachado";
      } else {
        // Si ambos son true o ambos son false, usar precio_tachado por defecto
        promotionDisplayMode = "precio_tachado";
      }

      return {
        id_producto: p.id_producto,
        nombre: p.nombre,
        marca: p.marca.nombre,
        modelos: p.modelo_producto.map((mp) => mp.modelo.nombre),
        precio_detalle: parseFloat(precioConDescuento.toFixed(2)),
        precio_original: parseFloat(precioOriginal.toFixed(2)),
        descuento: porcentajeDescuento,
        promotionDisplayMode,
        imagen_principal:
          p.producto_imagen.length > 0 ? p.producto_imagen[0].imagen_url : null,
        stock_total: p.stock_bodega.reduce(
          (acumulado, sb) => acumulado + sb.existencias,
          0,
        ),
      };
    });
    return {
      success: true,
      datos: {
        marca:
          id_marca && marcaInfo
            ? marcaInfo.nombre
            : (productos[0]?.marca?.nombre ?? "Todas las marcas"),
        logo_url: id_marca && marcaInfo ? marcaInfo.logo_url : null,
        banner_url: id_marca && marcaInfo ? marcaInfo.banner_url : null,
        total_productos: totalProductos,
        productos: productosFormateados,
      },
      pagination: {
        currentPage: pageNum,
        pageSize,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    };
  }

  async obtenerProductos(filtros) {

    const { 
      id_categoria,
      id_marca,
      rin,
      id_sucursal,
      page = 1,
      pageSize = 8,
     } = filtros;
    const pageNum = parseInt(page);
    const pageSizeNum = parseInt(pageSize);
    const skip = (pageNum - 1) * pageSizeNum;
    const whereConditions = { estado: true };
    if (id_categoria) whereConditions.id_categoria = parseInt(id_categoria);
    if (id_marca) whereConditions.id_marca = parseInt(id_marca);
    if (rin) whereConditions.rin = parseInt(rin);

    const [totalProductos, productos] = await Promise.all([
      prisma.producto.count({ where: whereConditions }),
      prisma.producto.findMany({
        where: whereConditions,
        skip,
        take: pageSizeNum,
        select: {
          id_producto: true,
          nombre: true,
          precio_detalle: true,
          precio_mayoreo: true,
          rin: true,
          marca: { select: { nombre: true } },
          categoria: { select: { nombre: true } },
          modelo_producto: { include: { modelo: true } },
          producto_imagen: {
            select: { imagen_url: true, orden: true },
            orderBy: { orden: "asc" },
            take: 1,
          },
          stock_bodega: {
            where: id_sucursal
              ? { bodega: { id_sucursal: parseInt(id_sucursal) } }
              : undefined,
            select: { existencias: true },
          },
          producto_promocion: {
            select: {
              descuento: true,
              tipo_descuento: true,
              precio_promocion: true,
              promocion: {
                select: {
                  id_promocion: true,
                  titulo: true,
                  fecha_inicio: true,
                  fecha_finalizacion: true,
                  mostrar_precio_porcentaje: true,
                  mostrar_precio_tachado: true,
                },
              },
            },
          },
        },
        orderBy: { id_producto: "desc" },
      }),
    ]);

    const productosFormateados = productos.map((p) => {
      const fechaActual = new Date();
      const promocionesActivas =
        p.producto_promocion?.filter(
          (pp) =>
            pp.descuento &&
            pp.descuento > 0 &&
            pp.promocion.fecha_inicio <= fechaActual &&
            pp.promocion.fecha_finalizacion >= fechaActual,
        ) || [];

      let precioConDescuento = p.precio_detalle;
      let precioOriginal = p.precio_detalle;
      let porcentajeDescuento = 0;

      if (promocionesActivas.length > 0) {
        // Verificar si hay promociones con tipo_descuento "monto" y precio_promocion
        const promocionesMonto = promocionesActivas.filter(
          (promo) => promo.tipo_descuento === "monto" && promo.precio_promocion
        );
        
        if (promocionesMonto.length > 0) {
          // Usar el precio promocional más bajo entre las promociones de monto
          const precioMasBajo = Math.min(
            ...promocionesMonto.map((promo) => parseFloat(promo.precio_promocion))
          );
          precioConDescuento = precioMasBajo;
          // Calcular el porcentaje equivalente para mostrar
          porcentajeDescuento = Math.round(((p.precio_detalle - precioMasBajo) / p.precio_detalle) * 100 * 100) / 100;
        } else {
          // Usar el mayor porcentaje de descuento
          const mayorDescuento = Math.max(
            ...promocionesActivas.map((promo) => promo.descuento),
          );
          porcentajeDescuento = mayorDescuento;
          precioConDescuento = Math.round((p.precio_detalle * (1 - mayorDescuento / 100)) * 100) / 100;
        }
      }

      const promocionActiva = promocionesActivas[0];
      const mostrarPorcentaje = Boolean(promocionActiva?.promocion?.mostrar_precio_porcentaje);
      const mostrarPrecioTachado = Boolean(promocionActiva?.promocion?.mostrar_precio_tachado);
      let promotionDisplayMode = "precio_tachado";

      // Usar la configuración de la promoción para determinar el modo de visualización
      if (mostrarPorcentaje && !mostrarPrecioTachado) {
        promotionDisplayMode = "porcentaje";
      } else if (mostrarPrecioTachado && !mostrarPorcentaje) {
        promotionDisplayMode = "precio_tachado";
      } else {
        // Si ambos son true o ambos son false, usar precio_tachado por defecto
        promotionDisplayMode = "precio_tachado";
      }

      return {
        id_producto: p.id_producto,
        nombre: p.nombre,
        rin: p.rin,
        marca: p.marca?.nombre || "N/A",
        categoria: p.categoria?.nombre || "N/A",
        modelos: p.modelo_producto.map((mp) => mp.modelo.nombre),
        url_imagen: p.producto_imagen[0]?.imagen_url || null,
        stock_total: p.stock_bodega.reduce(
          (total, sb) => total + sb.existencias,
          0,
        ),
        precio_detalle: parseFloat(precioConDescuento.toFixed(2)),
        precio_original: parseFloat(precioOriginal.toFixed(2)),
        descuento: porcentajeDescuento,
        promotionDisplayMode,
      };
    });

    return {
      success: true,
      total: totalProductos,
      page: pageNum,
      totalPages: Math.ceil(totalProductos / pageSizeNum),
      data: productosFormateados,
    };
  }


  async obtenerProductosRelacionados(id, filtros) {

    
    const sucursal_id = filtros?.sucursal_id;

    if (!id || isNaN(id)) {
      throw { status: 400, message: "ID de producto inválido" };
    }

    const idProducto = parseInt(id);
    const idSucursal =
      sucursal_id != null && sucursal_id !== "" ? parseInt(sucursal_id) : null;

    const producto = await prisma.producto.findUnique({
      where: { id_producto: idProducto },
      select: {
        id_marca: true,
        ancho_rin: true,
        alto_rin: true,
        rin: true,
      },
    });

    if (!producto) {
      throw { status: 404, message: "Producto no encontrado" };
    }

    const stockFilter =
      idSucursal != null
        ? {
            stock_bodega: {
              some: {
                existencias: { gt: 0 },
                bodega: { id_sucursal: idSucursal },
              },
            },
          }
        : {};

    const whereMismaMarca = {
      id_producto: { not: idProducto },
      id_marca: producto.id_marca,
      estado: true,
      ancho_rin: producto.ancho_rin,
      alto_rin: producto.alto_rin,
      rin: producto.rin,
      ...stockFilter,
    };

    const whereOtrasMarcas = {
      id_producto: { not: idProducto },
      id_marca: { not: producto.id_marca },
      estado: true,
      ancho_rin: producto.ancho_rin,
      alto_rin: producto.alto_rin,
      rin: producto.rin,
      ...stockFilter,
    };

    const rowsMismaMarca = await prisma.producto.findMany({
      where: whereMismaMarca,
      take: 4,
      include: {
        marca: { select: { nombre: true } },
        producto_imagen: { orderBy: { orden: "asc" }, take: 1 },
        producto_promocion: {
          where: {
            descuento: { gt: 0 },
            promocion: {
              fecha_inicio: { lte: new Date() },
              fecha_finalizacion: { gte: new Date() },
            },
          },
          orderBy: {
            descuento: "desc",
          },
          take: 1,
          include: {
            promocion: {
              select: {
                mostrar_precio_porcentaje: true,
                mostrar_precio_tachado: true,
              },
            },
          },
        },
        stock_bodega:
          idSucursal != null
            ? {
                where: { bodega: { id_sucursal: idSucursal } },
                select: { existencias: true },
              }
            : { select: { existencias: true } },
      },
    });

    const idsMismaMarca = rowsMismaMarca.map((p) => p.id_producto);

    const rowsOtrasMarcas = await prisma.producto.findMany({
      where: {
        ...whereOtrasMarcas,
        id_producto: { notIn: [idProducto, ...idsMismaMarca] },
      },
      take: 4,
      include: {
        marca: { select: { nombre: true } },
        producto_imagen: { orderBy: { orden: "asc" }, take: 1 },
        producto_promocion: {
          where: {
            descuento: { gt: 0 },
            promocion: {
              fecha_inicio: { lte: new Date() },
              fecha_finalizacion: { gte: new Date() },
            },
          },
          orderBy: {
            descuento: "desc",
          },
          take: 1,
          include: {
            promocion: {
              select: {
                mostrar_precio_porcentaje: true,
                mostrar_precio_tachado: true,
              },
            },
          },
        },
        stock_bodega:
          idSucursal != null
            ? {
                where: { bodega: { id_sucursal: idSucursal } },
                select: { existencias: true },
              }
            : { select: { existencias: true } },
      },
    });

    const rows = [...rowsMismaMarca, ...rowsOtrasMarcas];

    const products = rows.map((p) => {
      const existencias = p.stock_bodega.reduce(
        (sum, sb) => sum + sb.existencias,
        0,
      );

      let price = parseFloat(p.precio_detalle);
      let originalPrice = undefined;
      let discountPercent = 0;

      if (p.producto_promocion?.[0]?.descuento) {
        const promocionActiva = p.producto_promocion[0];
        const d = promocionActiva.descuento;
        discountPercent = d;
        originalPrice = price;
        
        // Si tipo_descuento es "monto" y existe precio_promocion, usarlo directamente
        if (promocionActiva.tipo_descuento === "monto" && promocionActiva.precio_promocion) {
          price = parseFloat(promocionActiva.precio_promocion);
        } else {
          price = Math.round((price * (1 - d / 100)) * 100) / 100;
        }
      }

      const promocionActiva = p.producto_promocion?.[0];
      const mostrarPorcentaje = Boolean(promocionActiva?.promocion?.mostrar_precio_porcentaje);
      const mostrarPrecioTachado = Boolean(promocionActiva?.promocion?.mostrar_precio_tachado);
      let promotionDisplayMode = "precio_tachado";

      // Usar la configuración de la promoción para determinar el modo de visualización
      if (mostrarPorcentaje && !mostrarPrecioTachado) {
        promotionDisplayMode = "porcentaje";
      } else if (mostrarPrecioTachado && !mostrarPorcentaje) {
        promotionDisplayMode = "precio_tachado";
      } else {
        // Si ambos son true o ambos son false, usar precio_tachado por defecto
        promotionDisplayMode = "precio_tachado";
      }

      return {
        id: String(p.id_producto),
        brand: p.marca?.nombre || "",
        name: p.nombre,
        price: parseFloat(price.toFixed(2)),
        originalPrice:
          originalPrice != null
            ? parseFloat(originalPrice.toFixed(2))
            : undefined,
        discountPercent: discountPercent || undefined,
        promotionDisplayMode,
        imageUrl: p.producto_imagen?.[0]?.imagen_url || "",
        stock: existencias,
      };
    });

    return [
      {
        spec: "Medida",
        value: Number(producto.alto_rin) === 0
          ? `${producto.ancho_rin}R${producto.rin}`
          : `${producto.ancho_rin}/${producto.alto_rin}R${producto.rin}`,
        products,
      },
    ];
  }
}

module.exports = new ProductsClientService();
