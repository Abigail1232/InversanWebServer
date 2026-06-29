const prisma = require("../config/database");

class LlantasService {
  async obtenerRines(id_categoria, numero_rin) {
    const whereConditions = { estado: true };
    if (id_categoria) {
      if (isNaN(id_categoria)) throw { status: 400, message: "El parámetro 'id_categoria' debe ser un número" };
      const categoriaExists = await prisma.categoria.findUnique({
        where: { id_categoria: parseInt(id_categoria) },
      });
      if (!categoriaExists) throw { status: 404, message: "Categoría no encontrada" };
      whereConditions.id_categoria = parseInt(id_categoria);
    }
    if (numero_rin) {
      if (isNaN(numero_rin)) throw { status: 400, message: "El parámetro 'numero_rin' debe ser un número" };
      whereConditions.rin = parseInt(numero_rin);
    }
    const rinesRaw = await prisma.producto.findMany({
      where: whereConditions,
      select: { rin: true },
      distinct: ["rin"],
      orderBy: { rin: "asc" },
    });
    // Asegurar valores únicos convirtiendo a número
    const rinesUnicos = Array.from(new Set(rinesRaw.map((p) => parseFloat(p.rin)))).sort((a, b) => a - b);
    return rinesUnicos;
  }

  async obtenerFiltrosLlantas(filtros) {
    const { id_categoria, id_sucursal, rin, alto_rin, ancho_rin } = filtros;
    const whereConditions = { estado: true };

    if (id_categoria) {
      if (isNaN(id_categoria)) throw { status: 400, message: "El parámetro 'id_categoria' debe ser un número" };
      whereConditions.id_categoria = parseInt(id_categoria);
    }

    if (rin !== undefined && rin !== null && rin !== '') {
      if (isNaN(rin)) throw { status: 400, message: "El parámetro 'rin' debe ser un número" };
      whereConditions.rin = parseInt(rin);
    }

    if (alto_rin !== undefined && alto_rin !== null && alto_rin !== '') {
      if (isNaN(alto_rin)) throw { status: 400, message: "El parámetro 'alto_rin' debe ser un número" };
      whereConditions.alto_rin = parseFloat(alto_rin);
    }

    if (ancho_rin !== undefined && ancho_rin !== null && ancho_rin !== '') {
      if (isNaN(ancho_rin)) throw { status: 400, message: "El parámetro 'ancho_rin' debe ser un número" };
      whereConditions.ancho_rin = parseFloat(ancho_rin);
    }

    if (id_sucursal) {
      if (isNaN(id_sucursal)) throw { status: 400, message: "El parámetro 'id_sucursal' debe ser un número" };
      whereConditions.stock_bodega = {
        some: {
          existencias: { gt: 0 },
          bodega: { id_sucursal: parseInt(id_sucursal) },
        },
      };
    }

    const productos = await prisma.producto.findMany({
      where: whereConditions,
      select: {
        id_producto: true,
        nombre: true,
        precio_detalle: true,
        precio_mayoreo: true,
        precio_coste: true,
        rin: true,
        alto_rin: true,
        ancho_rin: true,
        version: true,
        lonas: true,
        profundidad: true,
        presion_maxima: true,
        indice_velocidad: true,
        indice_de_carga: true,
        descripcion: true,
        imagen_3d: true,
        estado: true,
        marca: { select: { id_marca: true, nombre: true, logo_url: true } },
        categoria: { select: { id_categoria: true, nombre: true, imagen_url: true } },
        modelo_producto: { include: { modelo: true } },
        producto_imagen: { select: { id_imagen: true, imagen_url: true, orden: true }, orderBy: { orden: "asc" } },
        stock_bodega: {
          where: id_sucursal ? { bodega: { id_sucursal: parseInt(id_sucursal) } } : undefined,
          select: {
            existencias: true,
            bodega: { select: { id_bodega: true, nombre: true, sucursal: { select: { id_sucursal: true, nombre: true } } } },
          },
        },
        producto_promocion: {
          select: {
            descuento: true,
            promocion: { select: { id_promocion: true, titulo: true, fecha_inicio: true, fecha_finalizacion: true } },
          },
        },
      },
      orderBy: { id_producto: "desc" },
    });

    const fechaActual = new Date();

    const productosFormateados = productos.map((p) => {
      const promocionesActivas = p.producto_promocion?.filter(
        (pp) => pp.descuento && pp.descuento > 0 && pp.promocion.fecha_inicio <= fechaActual && pp.promocion.fecha_finalizacion >= fechaActual
      ) || [];

      let precioConDescuento = p.precio_detalle;
      let precioOriginal = p.precio_detalle;
      let porcentajeDescuento = 0;

      if (promocionesActivas.length > 0) {
        const mayorDescuento = Math.max(...promocionesActivas.map((pp) => pp.descuento));
        porcentajeDescuento = mayorDescuento;
        precioConDescuento = p.precio_detalle * (1 - mayorDescuento / 100);
      }

      const stockTotal = p.stock_bodega.reduce((sum, sb) => sum + sb.existencias, 0);

      return {
        id_producto: p.id_producto,
        nombre: p.nombre,
        precio_detalle: parseFloat(precioConDescuento.toFixed(2)),
        precio_original: parseFloat(precioOriginal.toFixed(2)),
        descuento: porcentajeDescuento,
        rin: p.rin,
        alto_rin: p.alto_rin,
        ancho_rin: p.ancho_rin,
        version: p.version,
        lonas: p.lonas,
        profundidad: p.profundidad,
        presion_maxima: p.presion_maxima,
        indice_velocidad: p.indice_velocidad,
        indice_de_carga: p.indice_de_carga,
        descripcion: p.descripcion,
        imagen_3d: p.imagen_3d,
        estado: p.estado,
        marca: p.marca,
        categoria: p.categoria,
        modelos: p.modelo_producto.map((mp) => ({
          id_modelo: mp.modelo?.id_modelo,
          nombre: mp.modelo?.nombre,
          anio: mp.modelo?.anio,
        })),
        imagenes: p.producto_imagen.map((img) => ({
          id_imagen: img.id_imagen,
          imagen_url: img.imagen_url,
          orden: img.orden,
        })),
        stock_total: stockTotal,
        sucursales: p.stock_bodega.map((sb) => ({
          id_sucursal: sb.bodega.sucursal.id_sucursal,
          nombre_sucursal: sb.bodega.sucursal.nombre,
          id_bodega: sb.bodega.id_bodega,
          nombre_bodega: sb.bodega.nombre,
          existencias: sb.existencias,
        })),
      };
    });

    const rines = Array.from(new Set(productos.map((p) => parseFloat(p.rin)))).sort((a, b) => a - b);
    const altos_rin = Array.from(new Set(productos.map((p) => p.alto_rin !== null && p.alto_rin !== undefined ? parseFloat(p.alto_rin) : null).filter((value) => value !== null && value !== undefined))).sort((a, b) => a - b);
    const anchos_rin = Array.from(new Set(productos.map((p) => p.ancho_rin !== null && p.ancho_rin !== undefined ? parseFloat(p.ancho_rin) : null).filter((value) => value !== null && value !== undefined))).sort((a, b) => a - b);

    return {
      filtros: { rines, altos_rin, anchos_rin },
      productos: productosFormateados,
      total: productosFormateados.length,
    };
  }

  async obtenerEspecificacionesRin(rin) {
    if (!rin || isNaN(rin)) throw { status: 400, message: "Parámetro 'rin' inválido" };
    const specs = await prisma.producto.findMany({
      where: { rin: parseInt(rin), estado: true },
      select: { ancho_rin: true, alto_rin: true },
      distinct: ["ancho_rin", "alto_rin"],
      orderBy: [{ ancho_rin: "asc" }, { alto_rin: "asc" }],
    });
    if (specs.length === 0) throw { status: 404, message: `No se encontraron especificaciones para el rin ${rin}` };
    
    return {
      rin: parseInt(rin),
      data: specs.map((s) => ({ ancho_rin: parseFloat(s.ancho_rin), alto_rin: parseFloat(s.alto_rin) })),
      total: specs.length,
    };
  }

  async obtenerEspecificacionesExistentes() {
    const products = await prisma.producto.findMany({
      where: { estado: true },
      select: {
        ancho_rin: true,
        alto_rin: true,
        rin: true,
        lonas: true,
        profundidad: true,
        presion_maxima: true,
        indice_velocidad: true,
        indice_de_carga: true,
      },
    });

    const getUniqueSorted = (arr, key, formatFn = (v) => v) => {
      const values = arr
        .map((p) => p[key])
        .filter((v) => v !== null && v !== undefined && v !== '')
        .map((v) => formatFn(v));
      return Array.from(new Set(values)).sort((a, b) => {
        const numA = parseFloat(a);
        const numB = parseFloat(b);
        if (!isNaN(numA) && !isNaN(numB)) {
          return numA - numB;
        }
        return String(a).localeCompare(String(b));
      });
    };

    return {
      anchos: getUniqueSorted(products, "ancho_rin", (v) => parseFloat(v).toString()),
      perfiles: getUniqueSorted(products, "alto_rin", (v) => parseFloat(v).toString()),
      rines: getUniqueSorted(products, "rin", (v) => parseFloat(v).toString()),
      lonas: getUniqueSorted(products, "lonas", (v) => parseFloat(v).toString()),
      profundidades: getUniqueSorted(products, "profundidad", (v) => parseFloat(v).toString()),
      presiones: getUniqueSorted(products, "presion_maxima", (v) => parseInt(v).toString()),
      velocidades: getUniqueSorted(products, "indice_velocidad", (v) => parseInt(v).toString()),
      cargas: getUniqueSorted(products, "indice_de_carga", (v) => parseFloat(v).toString()),
    };
  }
}

module.exports = new LlantasService();
