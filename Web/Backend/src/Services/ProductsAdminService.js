const fs = require("fs");
const path = require("path");
const prisma = require("../config/database");

class ProductsAdminService {
  async crearProducto(datos, files, modelo3dPathsArray) {
    const {
      nombre,
      id_categoria,
      id_marca,
      id_diseno,
      modelo,
      version,
      version_vehiculo,
      descripcion,
      imagen_3d,
    } = datos;

    const strip = (val) =>
      val !== undefined && val !== null
        ? val
            .toString()
            .replace(/[^0-9.]/g, "")
            .trim()
        : undefined;

    const rin = strip(datos.rin);
    const ancho_rin = strip(datos.ancho_rin);
    const alto_rin = strip(datos.alto_rin);
    const lonas = strip(datos.lonas);
    const profundidad = strip(datos.profundidad);
    const presion_maxima = strip(datos.presion_maxima);
    const indice_velocidad = strip(datos.indice_velocidad);
    const indice_de_carga = strip(datos.indice_de_carga);
    const precio_detalle = strip(datos.precio_detalle);
    const precio_mayoreo = strip(datos.precio_mayoreo);
    const precio_coste = strip(datos.precio_coste);

    const camposRequeridos = {
      nombre,
      id_categoria,
      id_marca,
      id_diseno,
      rin,
      ancho_rin,
      version,
      lonas,
      profundidad,
      presion_maxima,
      indice_velocidad,
      indice_de_carga,
      precio_detalle,
      precio_coste,
    };

    const faltantes = Object.entries(camposRequeridos)
      .filter(([, v]) => !v || v === "")
      .map(([k]) => k);

    if (faltantes.length > 0) {
      throw { status: 400, message: "Campos requeridos faltantes", campos: faltantes };
    }

    if (descripcion && descripcion.length > 255) {
      throw { status: 400, message: "La descripción no puede exceder los 255 caracteres" };
    }

    const [categoriaExists, marcaExists, disenoExists] = await Promise.all([
      prisma.categoria.findUnique({
        where: { id_categoria: parseInt(id_categoria) },
      }),
      prisma.marca.findUnique({ where: { id_marca: parseInt(id_marca) } }),
      prisma.diseno.findUnique({ where: { id_diseno: parseInt(id_diseno) } }),
    ]);

    if (!categoriaExists) throw { status: 404, message: "Categoría no encontrada" };
    if (!marcaExists) throw { status: 404, message: "Marca no encontrada" };
    if (!disenoExists) throw { status: 404, message: "Diseño no encontrado" };

    const parsedData = {
      nombre,
      categoria: { connect: { id_categoria: parseInt(id_categoria) } },
      marca: { connect: { id_marca: parseInt(id_marca) } },
      diseno: { connect: { id_diseno: parseInt(id_diseno) } },
      rin: parseFloat(rin),
      ancho_rin: parseFloat(ancho_rin),
      alto_rin: alto_rin ? parseFloat(alto_rin) : 0,
      version,
      lonas: parseFloat(lonas),
      profundidad: parseFloat(profundidad),
      presion_maxima: parseFloat(presion_maxima),
      indice_velocidad: parseFloat(indice_velocidad),
      indice_de_carga: parseFloat(indice_de_carga),
      precio_detalle: parseFloat(precio_detalle),
      precio_mayoreo: precio_mayoreo
        ? parseFloat(precio_mayoreo)
        : parseFloat(precio_detalle),
      precio_coste: parseFloat(precio_coste),
      descripcion: descripcion || "",
      imagen_3d: imagen_3d || "",
    };

    if (datos.modelos_versiones) {
      try {
        const mvArray = JSON.parse(datos.modelos_versiones);
        parsedData.modelo_producto = {
          create: mvArray.map((mv) => ({
            id_modelo: mv.id_modelo,
            id_version: mv.id_version || null,
          })),
        };
      } catch (e) {
        console.error("Error parsing modelos_versiones", e);
      }
    } else if (modelo) {
      const modelNames = Array.isArray(modelo) ? modelo : [modelo];

      const modelOperations = await Promise.all(
        modelNames.map(async (name) => {
          let existingModel = await prisma.modelo.findFirst({
            where: { nombre: name },
          });

          if (!existingModel) {
            existingModel = await prisma.modelo.create({
              data: {
                nombre: name,
                anio: new Date(),
                marca: "",
              },
            });
          }

          let id_version = null;
          if (version_vehiculo && version_vehiculo.trim() !== "") {
            let existingVersion = await prisma.version.findFirst({
              where: {
                nombre: version_vehiculo.trim(),
                id_modelo: existingModel.id_modelo,
              },
            });

            if (!existingVersion) {
              existingVersion = await prisma.version.create({
                data: {
                  nombre: version_vehiculo.trim(),
                  id_modelo: existingModel.id_modelo,
                },
              });
            }
            id_version = existingVersion.id_version;
          }

          return {
            id_modelo: existingModel.id_modelo,
            id_version: id_version,
          };
        })
      );

      parsedData.modelo_producto = {
        create: modelOperations.map((op) => ({
          id_modelo: op.id_modelo,
          id_version: op.id_version,
        })),
      };
    }

    const nuevoProducto = await prisma.producto.create({
      data: parsedData,
      select: {
        id_producto: true,
        nombre: true,
        estado: true,
        imagen_3d: true,
        precio_detalle: true,
        precio_mayoreo: true,
        precio_coste: true,
        marca: { select: { id_marca: true, nombre: true } },
        categoria: { select: { id_categoria: true, nombre: true } },
      },
    });

    const imagenes = files.imagenes || [];
    const modelo3dFiles = files.modelo_3d_files || [];

    if (imagenes.length > 0) {
      await prisma.producto_Imagen.createMany({
        data: imagenes.map((file, index) => ({
          id_producto: nuevoProducto.id_producto,
          imagen_url: `${file.filename}`,
          orden: index + 1,
        })),
      });
    }

    if (modelo3dFiles.length > 0 && modelo3dPathsArray.length > 0) {
      for (let i = 0; i < modelo3dFiles.length; i++) {
        const file = modelo3dFiles[i];
        const relativePath = modelo3dPathsArray[i];

        if (!relativePath) continue;

        const normalizedPath = relativePath.replace(/\\/g, "/");

        const safeRelativePath = normalizedPath
          .split("/")
          .filter(Boolean)
          .map((segment) => segment.replace(/[^a-zA-Z0-9._-]/g, "_"))
          .join("/");

        const finalPath = path.join(
          process.cwd(),
          "assets",
          "Modelo3d",
          safeRelativePath
        );

        const finalDir = path.dirname(finalPath);
        fs.mkdirSync(finalDir, { recursive: true });

        fs.renameSync(file.path, finalPath);
      }
    }

    return nuevoProducto;
  }

  async actualizarProducto(id, datos, files, modelo3dPathsArray) {
    if (!id || isNaN(Number(id))) {
      throw { status: 400, message: "Producto Id inválido" };
    }

    const idProducto = Number(id);

    const productoExists = await prisma.producto.findUnique({
      where: { id_producto: idProducto },
      select: {
        id_producto: true,
        imagen_3d: true,
        modelo_producto: true,
      },
    });

    if (!productoExists) {
      throw { status: 404, message: "Producto no encontrado" };
    }

    const strip = (val) =>
      val !== undefined && val !== null
        ? val
            .toString()
            .replace(/[^0-9.]/g, "")
            .trim()
        : undefined;

    const {
      nombre,
      id_categoria,
      id_marca,
      id_diseno,
      modelo,
      version,
      version_vehiculo,
      descripcion,
      imagen_3d,
      estado,
    } = datos;

    const rin = strip(datos.rin);
    const ancho_rin = strip(datos.ancho_rin);
    const alto_rin = strip(datos.alto_rin);
    const lonas = strip(datos.lonas);
    const profundidad = strip(datos.profundidad);
    const presion_maxima = strip(datos.presion_maxima);
    const indice_velocidad = strip(datos.indice_velocidad);
    const indice_de_carga = strip(datos.indice_de_carga);
    const precio_detalle = strip(datos.precio_detalle);
    const precio_mayoreo = strip(datos.precio_mayoreo);
    const precio_coste = strip(datos.precio_coste);

    const validaciones = [];
    if (id_categoria !== undefined) {
      validaciones.push(
        prisma.categoria
          .findUnique({ where: { id_categoria: parseInt(id_categoria) } })
          .then((r) => (!r ? Promise.reject({ campo: "categoria" }) : r))
      );
    }
    if (id_marca !== undefined) {
      validaciones.push(
        prisma.marca
          .findUnique({ where: { id_marca: parseInt(id_marca) } })
          .then((r) => (!r ? Promise.reject({ campo: "marca" }) : r))
      );
    }
    if (id_diseno !== undefined) {
      validaciones.push(
        prisma.diseno
          .findUnique({ where: { id_diseno: parseInt(id_diseno) } })
          .then((r) => (!r ? Promise.reject({ campo: "diseno" }) : r))
      );
    }

    try {
      await Promise.all(validaciones);
    } catch (fkError) {
      throw {
        status: 404,
        message:
          fkError.campo === "categoria"
            ? "Categoría no encontrada"
            : fkError.campo === "diseno"
            ? "Diseño no encontrado"
            : "Marca no encontrada",
      };
    }

    const dataActualizar = {};
    if (nombre !== undefined) dataActualizar.nombre = nombre;
    if (id_categoria !== undefined)
      dataActualizar.id_categoria = parseInt(id_categoria);
    if (id_marca !== undefined) dataActualizar.id_marca = parseInt(id_marca);
    if (id_diseno !== undefined) dataActualizar.id_diseno = parseInt(id_diseno);
    if (rin !== undefined && rin !== "") dataActualizar.rin = parseFloat(rin);
    if (ancho_rin !== undefined && ancho_rin !== "")
      dataActualizar.ancho_rin = parseFloat(ancho_rin);
    if (alto_rin !== undefined && alto_rin !== "")
      dataActualizar.alto_rin = parseFloat(alto_rin);
    if (version !== undefined) dataActualizar.version = version;
    if (lonas !== undefined && lonas !== "")
      dataActualizar.lonas = parseFloat(lonas);
    if (profundidad !== undefined && profundidad !== "")
      dataActualizar.profundidad = parseFloat(profundidad);
    if (presion_maxima !== undefined && presion_maxima !== "")
      dataActualizar.presion_maxima = parseFloat(presion_maxima);
    if (indice_velocidad !== undefined && indice_velocidad !== "")
      dataActualizar.indice_velocidad = parseFloat(indice_velocidad);
    if (indice_de_carga !== undefined && indice_de_carga !== "")
      dataActualizar.indice_de_carga = parseFloat(indice_de_carga);
    if (precio_detalle !== undefined && precio_detalle !== "")
      dataActualizar.precio_detalle = parseFloat(precio_detalle);
    if (precio_mayoreo !== undefined && precio_mayoreo !== "")
      dataActualizar.precio_mayoreo = parseFloat(precio_mayoreo);
    if (precio_coste !== undefined && precio_coste !== "")
      dataActualizar.precio_coste = parseFloat(precio_coste);
    if (descripcion !== undefined) {
      if (descripcion.length > 255) {
        throw { status: 400, message: "La descripción no puede exceder los 255 caracteres" };
      }
      dataActualizar.descripcion = descripcion;
    }
    if (imagen_3d !== undefined) dataActualizar.imagen_3d = imagen_3d || "";

    if (estado !== undefined) {
      dataActualizar.estado =
        estado === true || estado === "true" || estado === 1 || estado === "1";
    }

    if (datos.modelos_versiones !== undefined || modelo !== undefined) {
      await prisma.modelo_Producto.deleteMany({
        where: { id_producto: idProducto },
      });

      if (datos.modelos_versiones) {
        try {
          const mvArray = JSON.parse(datos.modelos_versiones);
          dataActualizar.modelo_producto = {
            create: mvArray.map((mv) => ({
              id_modelo: mv.id_modelo,
              id_version: mv.id_version || null,
            })),
          };
        } catch (e) {
          console.error("Error parsing modelos_versiones", e);
        }
      } else if (modelo) {
        const modelNames = Array.isArray(modelo) ? modelo : [modelo];
        const modelOperations = await Promise.all(
          modelNames.map(async (name) => {
            let existingModel = await prisma.modelo.findFirst({
              where: { nombre: name },
            });

            if (!existingModel) {
              existingModel = await prisma.modelo.create({
                data: { nombre: name, anio: new Date(), marca: "" },
              });
            }

            let id_version = null;
            if (version_vehiculo && version_vehiculo.trim() !== "") {
              let existingVersion = await prisma.version.findFirst({
                where: {
                  nombre: version_vehiculo.trim(),
                  id_modelo: existingModel.id_modelo,
                },
              });

              if (!existingVersion) {
                existingVersion = await prisma.version.create({
                  data: {
                    nombre: version_vehiculo.trim(),
                    id_modelo: existingModel.id_modelo,
                  },
                });
              }
              id_version = existingVersion.id_version;
            }

            return { id_modelo: existingModel.id_modelo, id_version: id_version };
          })
        );

        dataActualizar.modelo_producto = {
          create: modelOperations.map((op) => ({
            id_modelo: op.id_modelo,
            id_version: op.id_version,
          })),
        };
      }
    }

    await prisma.producto.update({
      where: { id_producto: idProducto },
      data: dataActualizar,
    });

    const imagenesFiles = files?.imagenes || [];
    const modelo3dFiles = files?.modelo_3d_files || [];

    const rawImagenesEliminadas = datos.imagenes_eliminadas || [];
    const imagenesEliminadasIds = Array.isArray(rawImagenesEliminadas)
      ? rawImagenesEliminadas.map(Number).filter((idx) => !isNaN(idx))
      : [Number(rawImagenesEliminadas)].filter((idx) => !isNaN(idx));

    if (imagenesEliminadasIds.length > 0) {
      await prisma.producto_Imagen.deleteMany({
        where: {
          id_producto: idProducto,
          id_imagen: {
            in: imagenesEliminadasIds,
          },
        },
      });
    }

    if (imagenesFiles.length > 0) {
      const ultimaImagen = await prisma.producto_Imagen.findFirst({
        where: { id_producto: idProducto },
        orderBy: { orden: "desc" },
        select: { orden: true },
      });

      let currentOrden = (ultimaImagen?.orden || 0) + 1;

      await prisma.producto_Imagen.createMany({
        data: imagenesFiles.map((file) => ({
          id_producto: idProducto,
          imagen_url: `${file.filename}`,
          orden: currentOrden++,
        })),
      });
    }

    if (modelo3dFiles.length > 0 && modelo3dPathsArray.length > 0) {
      for (let i = 0; i < modelo3dFiles.length; i++) {
        const file = modelo3dFiles[i];
        const relativePath = modelo3dPathsArray[i];

        if (!relativePath) continue;

        const normalizedPath = relativePath.replace(/\\/g, "/");

        const safeRelativePath = normalizedPath
          .split("/")
          .filter(Boolean)
          .map((segment) => segment.replace(/[^a-zA-Z0-9._-]/g, "_"))
          .join("/");

        const finalPath = path.join(
          process.cwd(),
          "assets",
          "Modelo3d",
          safeRelativePath
        );

        const finalDir = path.dirname(finalPath);
        fs.mkdirSync(finalDir, { recursive: true });

        fs.renameSync(file.path, finalPath);
      }
    }

    const productoActualizado = await prisma.producto.findUnique({
      where: { id_producto: idProducto },
      include: {
        marca: true,
        categoria: true,
        producto_imagen: true,
        modelo_producto: { include: { modelo: true } },
      },
    });

    return productoActualizado;
  }

  async cambiarEstadoProducto(id, activo) {
    if (!id || isNaN(id)) throw { status: 400, message: "ID del producto inválido" };
    if (activo === undefined) throw { status: 400, message: "Parámetro 'activo' requerido (true/false)" };

    if (activo !== "true" && activo !== "false") {
      throw { status: 400, message: "Parámetro 'activo' debe ser 'true' o 'false'" };
    }

    const nuevoEstado = activo === "true";

    try {
      const productoActualizado = await prisma.producto.update({
        where: { id_producto: parseInt(id) },
        data: { estado: nuevoEstado },
        select: {
          id_producto: true,
          nombre: true,
          estado: true,
        },
      });

      return productoActualizado;
    } catch (error) {
      if (error.code === "P2025") {
        throw { status: 404, message: "Producto no encontrado" };
      }
      throw error;
    }
  }

  async obtenerProductosParaAdminProductos(pageReq, pageSizeReq, filtros) {
    const page = parseInt(pageReq) || 1;
    const pageSize = parseInt(pageSizeReq) || 10;
    const { search, marca, categoria, estado, sortBy, order } = filtros;

    if (page < 1 || pageSize < 1) {
      throw { status: 400, message: "Página y tamaño inválidos" };
    }

    const where = {};

    if (search) {
      const searchConditions = [
        { nombre: { contains: search } },
        { marca: { nombre: { contains: search } } },
        { version: { contains: search } },
        {
          modelo_producto: {
            some: { modelo: { nombre: { contains: search } } },
          },
        },
      ];

      const searchNum = parseFloat(search);
      if (!isNaN(searchNum)) {
        searchConditions.push({ precio_detalle: { equals: searchNum } });
      }

      where.OR = searchConditions;
    }

    if (marca) where.marca = { nombre: marca };
    if (categoria) where.categoria = { nombre: categoria };
    if (estado) where.estado = estado === "activo";

    const baseSelect = {
      id_producto: true,
      nombre: true,
      estado: true,
      precio_detalle: true,
      precio_mayoreo: true,
      rin: true,
      ancho_rin: true,
      alto_rin: true,
      lonas: true,
      profundidad: true,
      presion_maxima: true,
      indice_velocidad: true,
      indice_de_carga: true,
      imagen_3d: true,
      descripcion: true,
      id_diseno: true,
      marca: { select: { nombre: true } },
      categoria: { select: { nombre: true } },
      diseno: { select: { id_diseno: true, nombre: true, imagen_url: true } },
      version: true,
      modelo_producto: {
        select: {
          modelo: {
            select: { id_modelo: true, nombre: true, marca: true, anio: true },
          },
          version: {
            select: { id_version: true, nombre: true },
          },
        },
      },
      producto_imagen: {
        select: { id_imagen: true, imagen_url: true },
        orderBy: { orden: "asc" },
      },
      producto_promocion: {
        select: {
          promocion: {
            select: {
              id_promocion: true,
              titulo: true,
            },
          },
        },
      },
      stock_bodega: {
        select: {
          existencias: true,
          bodega: {
            select: {
              nombre: true,
              sucursal: {
                select: {
                  id_sucursal: true,
                  nombre: true,
                },
              },
            },
          },
        },
      },
    };

    const ordenarPorStock = sortBy === "stock";

    let totalProductos = 0;
    let productos = [];

    if (ordenarPorStock) {
      const productosRaw = await prisma.producto.findMany({
        where,
        select: baseSelect,
      });

      const productosFormateados = productosRaw.map((p) => {
        const modelosNombres = p.modelo_producto
          .map((mp) => mp.modelo.nombre)
          .join(", ");

        const anios = p.modelo_producto
          .map((mp) =>
            mp.modelo.anio ? new Date(mp.modelo.anio).getFullYear() : null
          )
          .filter((a) => a !== null);

        const anioFinal =
          anios.length > 0 ? Array.from(new Set(anios)).join(", ") : "N/A";

        const totalStock = p.stock_bodega.reduce(
          (sum, item) => sum + item.existencias,
          0
        );

        const sucursales = p.stock_bodega.map((sb) => ({
          id_sucursal: sb.bodega?.sucursal?.id_sucursal,
          nombre_sucursal: sb.bodega?.sucursal?.nombre,
          bodega: sb.bodega?.nombre,
          existencias: sb.existencias,
        }));
        const promocionAsignada = p.producto_promocion?.[0]?.promocion || null;

        return {
          id_producto: p.id_producto,
          nombre: p.nombre,
          estado: p.estado,
          marca: p.marca?.nombre || "N/A",
          categoria: p.categoria?.nombre || "N/A",
          id_diseno: p.id_diseno,
          diseno: p.diseno
            ? {
                id_diseno: p.diseno.id_diseno,
                nombre: p.diseno.nombre,
                imagen_url: p.diseno.imagen_url || null,
              }
            : null,
          modelo: modelosNombres || "N/A",
          modelos: p.modelo_producto.map((mp) => mp.modelo.nombre),
          modelosData: p.modelo_producto.map((mp) => ({
            id_modelo: mp.modelo.id_modelo,
            nombre: mp.modelo.nombre,
            id_version: mp.version?.id_version || null,
          })),
          versiones: p.modelo_producto
            .filter((mp) => mp.version)
            .map((mp) => ({ id_version: mp.version.id_version, nombre: mp.version.nombre, id_modelo: mp.modelo.id_modelo })),
          anio: anioFinal,
          rin: p.rin,
          ancho_rin: p.ancho_rin,
          alto_rin: p.alto_rin,
          lonas: p.lonas,
          profundidad: p.profundidad,
          presion_maxima: p.presion_maxima,
          indice_velocidad: p.indice_velocidad,
          indice_de_carga: p.indice_de_carga,
          stock: totalStock,
          version: p.version,
          imagen_3d: p.imagen_3d,
          descripcion: p.descripcion,
          precio: p.precio_detalle,
          precioMayoreo: p.precio_mayoreo,
          imagenPrincipal: p.producto_imagen?.[0]?.imagen_url || null,
          totalImagenes: p.producto_imagen?.length || 0,
          imagenes: p.producto_imagen.map((img) => ({
            id: img.id_imagen,
            url: img.imagen_url,
          })),
          enPromocion: Boolean(promocionAsignada),
          promocionAsignada,
          sucursales,
        };
      });

      productosFormateados.sort((a, b) => {
        if (order === "desc") return b.stock - a.stock;
        return a.stock - b.stock;
      });

      totalProductos = productosFormateados.length;

      const skip = (page - 1) * pageSize;
      productos = productosFormateados.slice(skip, skip + pageSize);
    } else {
      const skip = (page - 1) * pageSize;

      [totalProductos, productos] = await Promise.all([
        prisma.producto.count({ where }),
        prisma.producto.findMany({
          where,
          skip,
          take: pageSize,
          select: baseSelect,
          orderBy: { id_producto: "desc" },
        }),
      ]);

      productos = productos.map((p) => {
        const modelosNombres = p.modelo_producto
          .map((mp) => mp.modelo.nombre)
          .join(", ");

        const anios = p.modelo_producto
          .map((mp) =>
            mp.modelo.anio ? new Date(mp.modelo.anio).getFullYear() : null
          )
          .filter((a) => a !== null);

        const anioFinal =
          anios.length > 0 ? Array.from(new Set(anios)).join(", ") : "N/A";

        const totalStock = p.stock_bodega.reduce(
          (sum, item) => sum + item.existencias,
          0
        );

        const sucursales = p.stock_bodega.map((sb) => ({
          id_sucursal: sb.bodega?.sucursal?.id_sucursal,
          nombre_sucursal: sb.bodega?.sucursal?.nombre,
          bodega: sb.bodega?.nombre,
          existencias: sb.existencias,
        }));
        const promocionAsignada = p.producto_promocion?.[0]?.promocion || null;

        return {
          id_producto: p.id_producto,
          nombre: p.nombre,
          estado: p.estado,
          marca: p.marca?.nombre || "N/A",
          categoria: p.categoria?.nombre || "N/A",
          id_diseno: p.id_diseno,
          diseno: p.diseno
            ? {
                id_diseno: p.diseno.id_diseno,
                nombre: p.diseno.nombre,
                imagen_url: p.diseno.imagen_url || null,
              }
            : null,
          modelo: modelosNombres || "N/A",
          modelos: p.modelo_producto.map((mp) => mp.modelo.nombre),
          modelosData: p.modelo_producto.map((mp) => ({
            id_modelo: mp.modelo.id_modelo,
            nombre: mp.modelo.nombre,
            id_version: mp.version?.id_version || null,
          })),
          versiones: p.modelo_producto
            .filter((mp) => mp.version)
            .map((mp) => ({ id_version: mp.version.id_version, nombre: mp.version.nombre, id_modelo: mp.modelo.id_modelo })),
          anio: anioFinal,
          rin: p.rin,
          ancho_rin: p.ancho_rin,
          alto_rin: p.alto_rin,
          lonas: p.lonas,
          profundidad: p.profundidad,
          presion_maxima: p.presion_maxima,
          indice_velocidad: p.indice_velocidad,
          indice_de_carga: p.indice_de_carga,
          stock: totalStock,
          version: p.version,
          imagen_3d: p.imagen_3d,
          descripcion: p.descripcion,
          precio: p.precio_detalle,
          precioMayoreo: p.precio_mayoreo,
          imagenPrincipal: p.producto_imagen?.[0]?.imagen_url || null,
          totalImagenes: p.producto_imagen?.length || 0,
          imagenes: p.producto_imagen.map((img) => ({
            id: img.id_imagen,
            url: img.imagen_url,
          })),
          enPromocion: Boolean(promocionAsignada),
          promocionAsignada,
          sucursales,
        };
      });
    }

    const totalPages = Math.ceil(totalProductos / pageSize);

    return {
      productos,
      pagination: {
        currentPage: page,
        pageSize,
        totalProductos,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }
}

module.exports = new ProductsAdminService();
