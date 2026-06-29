const prisma = require("../config/database");

const parseBoolean = (value, defaultValue = true) => {
  if (value === undefined || value === null || value === "") return defaultValue;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return value.toLowerCase() === "true" || value === "1";
  }
  return Boolean(value);
};

const buildImageUrl = (filename) => {
  if (!filename) return null;
  return filename;
};

const formatMedida = (producto) => {
  const ancho = producto.ancho_rin ?? "";
  const alto = producto.alto_rin ?? "";
  const rin = producto.rin ?? "";
  if (!ancho && !alto && !rin) return "";
  if (ancho && alto && rin) return `${ancho}/${alto} R ${rin}`;
  return [ancho, alto, rin].filter(Boolean).join(" ");
};

const formatProductoParaDiseno = (producto) => {
  const primeraImagen = producto.producto_imagen?.[0]?.imagen_url || null;
  return {
    id: producto.id_producto,
    id_producto: producto.id_producto,
    name: producto.nombre,
    nombre: producto.nombre,
    image: primeraImagen,
    imagen_url: primeraImagen,
    brand: producto.marca?.nombre || "",
    marca: producto.marca?.nombre || "",
    design: producto.diseno?.nombre || producto.version || "",
    diseno: producto.diseno?.nombre || producto.version || "",
    medida: formatMedida(producto),
    price: producto.precio_detalle || 0,
    precio: producto.precio_detalle || 0,
    status: producto.estado ? "Activo" : "Inactivo",
    estado: producto.estado,
  };
};

class DisenosService {
  async getDisenos({ search = "", id_marca, estado, activo, page, pageSize }) {
    const where = {};

    if (search && search.trim() !== "") {
      where.OR = [
        { nombre: { contains: search.trim() } },
        { descripcion: { contains: search.trim() } },
        { marca: { nombre: { contains: search.trim() } } },
      ];
    }

    if (id_marca && !isNaN(Number(id_marca))) {
      where.id_marca = Number(id_marca);
    }

    const estadoValue = estado || activo;
    if (estadoValue !== undefined && estadoValue !== "") {
      if (
        estadoValue === "Activa" ||
        estadoValue === "Activo" ||
        estadoValue === "true" ||
        estadoValue === true
      ) {
        where.activo = true;
      }
      if (
        estadoValue === "Inactiva" ||
        estadoValue === "Inactivo" ||
        estadoValue === "false" ||
        estadoValue === false
      ) {
        where.activo = false;
      }
    }

    const shouldPaginate = page !== undefined && pageSize !== undefined && !isNaN(Number(page)) && !isNaN(Number(pageSize));
    const currentPage = Math.max(Number(page || 1), 1);
    const take = Math.max(Number(pageSize || 10), 1);
    const skip = (currentPage - 1) * take;

    const [disenos, total] = await Promise.all([
      prisma.diseno.findMany({
        where,
        include: {
          marca: { select: { id_marca: true, nombre: true, activo: true } },
          _count: { select: { producto: true } },
        },
        orderBy: [{ activo: "desc" }, { nombre: "asc" }],
        ...(shouldPaginate ? { skip, take } : {}),
      }),
      prisma.diseno.count({ where }),
    ]);

    const responseData = disenos.map((diseno) => ({
      id_diseno: diseno.id_diseno,
      nombre: diseno.nombre,
      imagen_url: diseno.imagen_url || null,
      descripcion: diseno.descripcion || "",
      activo: diseno.activo,
      id_marca: diseno.id_marca,
      marca: diseno.marca,
      cantidad_productos: diseno._count?.producto || 0,
      productCount: diseno._count?.producto || 0,
    }));

    return {
      data: responseData,
      total,
      pagination: shouldPaginate ? {
        page: currentPage,
        pageSize: take,
        total,
        totalPages: Math.ceil(total / take),
      } : undefined,
    };
  }

  async getDisenoById(id) {
    if (!id || isNaN(Number(id))) {
      throw { status: 400, message: "El id del diseño es inválido" };
    }

    const diseno = await prisma.diseno.findUnique({
      where: { id_diseno: Number(id) },
      include: {
        marca: { select: { id_marca: true, nombre: true, activo: true } },
        _count: { select: { producto: true } },
      },
    });

    if (!diseno) {
      throw { status: 404, message: "Diseño no encontrado" };
    }

    return {
      id_diseno: diseno.id_diseno,
      nombre: diseno.nombre,
      imagen_url: diseno.imagen_url || null,
      descripcion: diseno.descripcion || "",
      activo: diseno.activo,
      id_marca: diseno.id_marca,
      marca: diseno.marca,
      cantidad_productos: diseno._count?.producto || 0,
      productCount: diseno._count?.producto || 0,
    };
  }

  async getProductosPorDiseno(id, query) {
    const { search = "", estado, medida, page, pageSize } = query;

    if (!id || isNaN(Number(id))) {
      throw { status: 400, message: "El id del diseño es inválido" };
    }

    const diseno = await prisma.diseno.findUnique({
      where: { id_diseno: Number(id) },
      include: {
        marca: { select: { id_marca: true, nombre: true, activo: true } },
      },
    });

    if (!diseno) {
      throw { status: 404, message: "Diseño no encontrado" };
    }

    const where = { id_diseno: Number(id) };

    if (search && search.trim() !== "") {
      where.OR = [
        { nombre: { contains: search.trim() } },
        { version: { contains: search.trim() } },
        { marca: { nombre: { contains: search.trim() } } },
        { diseno: { nombre: { contains: search.trim() } } },
      ];
    }

    if (estado && estado !== "Todos los Estados") {
      if (estado === "Activo" || estado === "Activa" || estado === "true") where.estado = true;
      if (estado === "Inactivo" || estado === "Inactiva" || estado === "false") where.estado = false;
    }

    const shouldPaginate = page !== undefined && pageSize !== undefined && !isNaN(Number(page)) && !isNaN(Number(pageSize));
    const currentPage = Math.max(Number(page || 1), 1);
    const take = Math.max(Number(pageSize || 10), 1);
    const skip = (currentPage - 1) * take;

    const productos = await prisma.producto.findMany({
      where,
      include: {
        marca: { select: { id_marca: true, nombre: true } },
        diseno: { select: { id_diseno: true, nombre: true, imagen_url: true } },
        producto_imagen: { orderBy: { orden: "asc" }, take: 1 },
      },
      orderBy: { nombre: "asc" },
    });

    let productosFormateados = productos.map(formatProductoParaDiseno);

    if (medida && medida !== "Todas las Medidas") {
      productosFormateados = productosFormateados.filter(producto => producto.medida === medida);
    }

    const total = productosFormateados.length;
    const responseData = shouldPaginate ? productosFormateados.slice(skip, skip + take) : productosFormateados;

    return {
      diseno: {
        id_diseno: diseno.id_diseno,
        nombre: diseno.nombre,
        imagen_url: diseno.imagen_url || null,
        descripcion: diseno.descripcion || "",
        activo: diseno.activo,
        id_marca: diseno.id_marca,
        marca: diseno.marca,
      },
      data: responseData,
      total,
      pagination: shouldPaginate ? {
        page: currentPage,
        pageSize: take,
        total,
        totalPages: Math.ceil(total / take),
      } : undefined,
    };
  }

  async createDiseno({ nombre, descripcion, id_marca, activo, filename }) {
    if (!nombre || nombre.trim() === "") throw { status: 400, message: "El nombre del diseño es obligatorio" };
    if (!id_marca || isNaN(Number(id_marca))) throw { status: 400, message: "La marca es obligatoria" };

    const marca = await prisma.marca.findUnique({ where: { id_marca: Number(id_marca) } });
    if (!marca) throw { status: 404, message: "Marca no encontrada" };

    const disenoExistente = await prisma.diseno.findFirst({
      where: { id_marca: Number(id_marca), nombre: { equals: nombre.trim() } },
    });
    if (disenoExistente) throw { status: 409, message: "Ya existe un diseño con ese nombre para esta marca" };

    const imagen = buildImageUrl(filename || null);

    const nuevoDiseno = await prisma.diseno.create({
      data: {
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || "",
        imagen_url: imagen,
        activo: parseBoolean(activo, true),
        id_marca: Number(id_marca),
      },
      include: {
        marca: { select: { id_marca: true, nombre: true, activo: true } },
      },
    });

    return {
      ...nuevoDiseno,
      cantidad_productos: 0,
      productCount: 0,
    };
  }

  async updateDiseno(id, { nombre, descripcion, id_marca, activo, filename }) {
    if (!id || isNaN(Number(id))) throw { status: 400, message: "El id del diseño es inválido" };
    if (!nombre || nombre.trim() === "") throw { status: 400, message: "El nombre del diseño es obligatorio" };
    if (!id_marca || isNaN(Number(id_marca))) throw { status: 400, message: "La marca es obligatoria" };

    const disenoExistente = await prisma.diseno.findUnique({ where: { id_diseno: Number(id) } });
    if (!disenoExistente) throw { status: 404, message: "Diseño no encontrado" };

    const marca = await prisma.marca.findUnique({ where: { id_marca: Number(id_marca) } });
    if (!marca) throw { status: 404, message: "Marca no encontrada" };

    const disenoDuplicado = await prisma.diseno.findFirst({
      where: {
        id_marca: Number(id_marca),
        nombre: { equals: nombre.trim() },
        NOT: { id_diseno: Number(id) },
      },
    });
    if (disenoDuplicado) throw { status: 409, message: "Ya existe un diseño con ese nombre para esta marca" };

    const imagen = filename || disenoExistente.imagen_url;

    const disenoActualizado = await prisma.diseno.update({
      where: { id_diseno: Number(id) },
      data: {
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || "",
        imagen_url: imagen,
        activo: parseBoolean(activo, disenoExistente.activo),
        id_marca: Number(id_marca),
      },
      include: {
        marca: { select: { id_marca: true, nombre: true, activo: true } },
        _count: { select: { producto: true } },
      },
    });

    return {
      id_diseno: disenoActualizado.id_diseno,
      nombre: disenoActualizado.nombre,
      imagen_url: disenoActualizado.imagen_url || null,
      descripcion: disenoActualizado.descripcion || "",
      activo: disenoActualizado.activo,
      id_marca: disenoActualizado.id_marca,
      marca: disenoActualizado.marca,
      cantidad_productos: disenoActualizado._count?.producto || 0,
      productCount: disenoActualizado._count?.producto || 0,
    };
  }

  async toggleActiveDiseno(id) {
    if (!id || isNaN(Number(id))) throw { status: 400, message: "El id del diseño es inválido" };

    const disenoExistente = await prisma.diseno.findUnique({ where: { id_diseno: Number(id) } });
    if (!disenoExistente) throw { status: 404, message: "Diseño no encontrado" };

    const disenoActualizado = await prisma.diseno.update({
      where: { id_diseno: Number(id) },
      data: { activo: !disenoExistente.activo },
      include: {
        marca: { select: { id_marca: true, nombre: true, activo: true } },
        _count: { select: { producto: true } },
      },
    });

    return {
      id_diseno: disenoActualizado.id_diseno,
      nombre: disenoActualizado.nombre,
      imagen_url: disenoActualizado.imagen_url || null,
      descripcion: disenoActualizado.descripcion || "",
      activo: disenoActualizado.activo,
      id_marca: disenoActualizado.id_marca,
      marca: disenoActualizado.marca,
      cantidad_productos: disenoActualizado._count?.producto || 0,
      productCount: disenoActualizado._count?.producto || 0,
    };
  }
}

module.exports = new DisenosService();
