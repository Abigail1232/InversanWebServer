const prisma = require("../config/database");

const VEHICLE_MAKE_BY_MODEL = {
  Corolla: "Toyota",
  Hilux: "Toyota",
  RAV4: "Toyota",
  Yaris: "Toyota",
  Ranger: "Ford",
  Fiesta: "Ford",
  Focus: "Ford",
  Escape: "Ford",
  Explorer: "Ford",
  "F-150": "Ford",
  Civic: "Honda",
  "CR-V": "Honda",
  Pilot: "Honda",
  Sentra: "Nissan",
  Kicks: "Nissan",
  Versa: "Nissan",
  Pathfinder: "Nissan",
  Altima: "Nissan",
  Frontier: "Nissan",
  Sportage: "Kia",
  Silverado: "Chevrolet",
};

function normalizeText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function inferVehicleMake(modelName = "") {
  const normalizedModel = normalizeText(modelName);
  const found = Object.entries(VEHICLE_MAKE_BY_MODEL).find(
    ([model]) => normalizeText(model) === normalizedModel
  );
  return found ? found[1] : null;
}

class MarcasService {
  async obtenerMarcas({ incluir_inactivas } = {}) {
    const includeInactive = incluir_inactivas === true || incluir_inactivas === "true" || incluir_inactivas === "1";

    const marcas = await prisma.marca.findMany({
      where: includeInactive ? {} : { activo: true },
      orderBy: { nombre: "asc" },
    });

    const conteos = await prisma.producto.groupBy({
      where: { estado: true },
      by: ["id_marca"],
      _count: { id_producto: true },
    });

    const conteoMap = new Map(
      conteos.map((item) => [item.id_marca, item._count.id_producto])
    );

    return marcas.map((marca) => ({
      ...marca,
      imagen_url: marca.logo_url,
      cantidad_productos: conteoMap.get(marca.id_marca) || 0,
    }));
  }

  async obtenerMarcasFiltro() {
    const marcas = await prisma.marca.findMany({
      where: {
        producto: {
          some: {
            estado: true
          }
        }
      },
      orderBy: { nombre: "asc" },
    });

    const conteos = await prisma.producto.groupBy({
      where: { estado: true },
      by: ["id_marca"],
      _count: { id_producto: true },
    });

    const conteoMap = new Map(
      conteos.map((item) => [item.id_marca, item._count.id_producto])
    );

    return marcas.map((marca) => ({
      ...marca,
      imagen_url: marca.logo_url,
      cantidad_productos: conteoMap.get(marca.id_marca) || 0,
    }));
  }

  async getMarcaById(id) {
    const marca = await prisma.marca.findUnique({
      where: { id_marca: Number(id) },
    });
    if (!marca) throw { status: 404, message: "Marca no encontrada" };
    
    const cantidad_productos = await prisma.producto.count({
      where: { id_marca: Number(id) },
    });

    return { ...marca, cantidad_productos };
  }

  async createMarca({ nombre, logo, banner, activo }) {
    return await prisma.marca.create({
      data: {
        nombre,
        logo_url: logo,
        banner_url: banner,
        activo: activo === "true" || activo === true,
      },
    });
  }

  async updateMarca(id, { nombre, logo, banner, activo }) {
    return await prisma.marca.update({
      where: { id_marca: Number(id) },
      data: {
        nombre,
        logo_url: logo,
        banner_url: banner,
        activo: activo === "true" || activo === true,
      },
    });
  }

  async toggleActiveMarca(id) {
    const marca = await this.getMarcaById(id);
    return await prisma.marca.update({
      where: { id_marca: Number(id) },
      data: { activo: !marca.activo },
    });
  }

  async getProductosPorMarca(id) {
    const productos = await prisma.producto.findMany({
      where: { id_marca: Number(id) },
      include: {
        producto_imagen: { orderBy: { orden: "asc" }, take: 1 },
      },
      orderBy: { nombre: "asc" },
    });

    return productos.map((producto) => ({
      ...producto,
      imagen_url: producto.producto_imagen?.[0]?.imagen_url || null,
    }));
  }

  async obtenerNombreMarcas() {
    return await prisma.modelo.findMany({
      where: { 
        activo: true,
        modelo_producto: {
          some: {
            producto: {
              estado: true
            }
          }
        }
      },
      select: { marca: true },
      distinct: ["marca"],
      orderBy: { marca: "asc" },
    });
  }

  async obtenerAniosPorMarca(marca) {
    if (!marca) return [];
    
    // Buscar primero por el campo marca directamente en el modelo con búsqueda insensible a mayúsculas
    const modelos = await prisma.modelo.findMany({
      where: { 
        activo: true, 
        marca: { contains: marca.trim() },
        modelo_producto: {
          some: {
            producto: {
              estado: true
            }
          }
        }
      },
      select: { anio: true },
    });
    
    if (modelos.length > 0) {
      return Array.from(
        new Set(modelos.map((m) => new Date(m.anio).getFullYear()))
      ).sort((a, b) => b - a);
    }

    // Fallback al mapa estático de inferencia si no hay resultados directos
    const todosModelos = await prisma.modelo.findMany({
      where: { 
        activo: true,
        modelo_producto: {
          some: {
            producto: {
              estado: true
            }
          }
        }
      },
      select: { nombre: true, anio: true },
    });
    return Array.from(
      new Set(
        todosModelos
          .filter((m) => inferVehicleMake(m.nombre) === marca.trim())
          .map((m) => new Date(m.anio).getFullYear())
      )
    ).sort((a, b) => b - a);
  }

  async obtenerModelosPorMarcaYAnio(marca, anio) {
    if (!marca || !anio || isNaN(anio)) {
      throw { status: 400, message: "Parámetros 'marca' y 'anio' son requeridos" };
    }
    const yearNum = parseInt(anio, 10);
    const dateGte = new Date(yearNum, 0, 1);
    const dateLt = new Date(yearNum + 1, 0, 1);

    const modelosDirectos = await prisma.modelo.findMany({
      where: {
        activo: true,
        marca: { contains: marca.trim() },
        anio: { gte: dateGte, lt: dateLt },
        modelo_producto: {
          some: {
            producto: {
              estado: true
            }
          }
        }
      },
      select: { nombre: true },
      distinct: ["nombre"],
    });

    if (modelosDirectos.length > 0) {
      return modelosDirectos.map(m => m.nombre);
    }

    const modelosRaw = await prisma.modelo.findMany({
      where: {
        activo: true,
        anio: { gte: dateGte, lt: dateLt },
        modelo_producto: {
          some: {
            producto: {
              estado: true
            }
          }
        }
      },
      select: { nombre: true },
      distinct: ["nombre"],
      orderBy: { nombre: "asc" },
    });
    return modelosRaw
      .map((m) => m.nombre)
      .filter((nombre) => inferVehicleMake(nombre) === marca.trim());
  }

  async obtenerTodosModelos() {
    return await prisma.modelo.findMany({
      where: { activo: true },
      select: {
        id_modelo: true,
        nombre: true,
        marca: true,
        anio: true,
        versiones: {
          where: { activo: true },
          select: { id_version: true, nombre: true },
          orderBy: { nombre: "asc" },
        },
      },
      orderBy: [{ marca: "asc" }, { nombre: "asc" }],
    });
  }

  async obtenerModelosPorMarca(id_marca) {
    if (!id_marca) return [];
    return await prisma.modelo.findMany({
      where: { activo: true },
      select: { id_modelo: true, nombre: true, marca: true, anio: true },
      orderBy: { nombre: "asc" },
    });
  }

  async obtenerVersionesPorMarcaYModelo(marca, anio, modelo) {
    if (!marca || !anio || !modelo) {
      throw { status: 400, message: "Parámetros 'marca', 'anio' y 'modelo' son requeridos" };
    }
    const yearNum = parseInt(anio, 10);
    const dateGte = new Date(yearNum, 0, 1);
    const dateLt = new Date(yearNum + 1, 0, 1);

    const modelosDirectos = await prisma.modelo.findMany({
      where: {
          activo: true,
          nombre: modelo.trim(),
          marca: { contains: marca.trim() },
          anio: { gte: dateGte, lt: dateLt }
      },
      select: { id_modelo: true }
    });

    let modelIds = modelosDirectos.map(m => m.id_modelo);

    if (modelIds.length === 0) {
        const modelosRaw = await prisma.modelo.findMany({
          where: {
            activo: true,
            nombre: modelo.trim(),
            anio: { gte: dateGte, lt: dateLt }
          },
          select: { id_modelo: true, nombre: true }
        });
        modelIds = modelosRaw
          .filter((m) => inferVehicleMake(m.nombre) === marca.trim())
          .map((m) => m.id_modelo);
    }

    if (modelIds.length === 0) return ["Sin versión específica"];

    const versionesRaw = await prisma.version.findMany({
      where: {
        activo: true,
        id_modelo: { in: modelIds },
        modelo_producto: {
          some: {
            producto: {
              estado: true
            }
          }
        }
      },
      select: { nombre: true },
      distinct: ["nombre"],
      orderBy: { nombre: "asc" },
    });
    const versiones = versionesRaw.map((v) => v.nombre);
    return ["Sin versión específica", ...versiones];
  }
}

module.exports = new MarcasService();
