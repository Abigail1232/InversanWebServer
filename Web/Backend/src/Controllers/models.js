const prisma = require("../config/database");

async function getModelsController(req, res) {
  try {
    const { id, active, name,brand, year, page = 1, pageSize = 5 } = req.query;

    const pageNum = parseInt(page);
    const pageSizeNum = parseInt(pageSize);

    if (
      isNaN(pageNum) ||
      pageNum < 1 ||
      isNaN(pageSizeNum) ||
      pageSizeNum < 1
    ) {
      return res
        .status(400)
        .json({ success: false, error: "Página o tamaño inválido" });
    }

    const skip = (pageNum - 1) * pageSizeNum;

    // Construir condiciones de filtrado
    const whereConditions = {};

    if (id) {
      const idNum = parseInt(id);
      if (!isNaN(idNum)) {
        whereConditions.id_modelo = idNum;
      }
    }

    if (name && name.trim() !== "") {
      whereConditions.nombre = { contains: name.trim() };
    }

    if (brand && brand.trim() !== "") {
      whereConditions.marca = { contains: brand.trim() };
    }

    if (year) {
      const yearNum = parseInt(year);
      if (!isNaN(yearNum)) {
        const startOfYear = new Date(Date.UTC(yearNum, 0, 1));
        const endOfYear = new Date(Date.UTC(yearNum, 11, 31, 23, 59, 59, 999));
        whereConditions.anio = { gte: startOfYear, lte: endOfYear };
      }
    }

    if (active !== undefined) {
      if (active === "true") whereConditions.activo = true;
      else if (active === "false") whereConditions.activo = false;
    }

    // Total antes de paginar
    const total = await prisma.modelo.count({ where: whereConditions });

    const modelos = await prisma.modelo.findMany({
      select: {
        id_modelo: true,
        nombre: true,
        anio: true,
        activo: true,
        marca: true,
        versiones: {
          where: { activo: true },
          select: { id_version: true, nombre: true }
        },
        _count: {
          select: { modelo_producto: true }, // contará 0 si no tiene relaciones
        },
      },
      where: whereConditions,
      orderBy: { nombre: "asc" },
      skip,
      take: pageSizeNum,
    });

    const modelosConCount = modelos.map((m) => ({
      id: m.id_modelo,
      name: m.nombre,
      year: m.anio,
      active: m.activo,
      brand: m.marca,
      count: m._count.modelo_producto,
      versions: m.versiones,
    }));

    return res.status(200).json({
      success: true,
      data: modelosConCount,
      pagination: {
        currentPage: pageNum,
        pageSize: pageSizeNum,
        total,
        totalPages: Math.ceil(total / pageSizeNum),
        hasNextPage: pageNum < Math.ceil(total / pageSizeNum),
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (error) {
    console.error("Error al traer modelos:", error);
    return res
      .status(500)
      .json({ success: false, error: "Error al obtener modelos" });
  }
}
async function upsertModelController(req, res) {
  try {

    const { id, name, year, active, brand, versions } = req.body;

    if (!name?.trim() || !year || !brand?.trim()) {
      return res.status(400).json({
        success: false,
        error: "El nombre, el año y la marca son campos obligatorios.",
      });
    }

    const parsedYear = parseInt(year);
    if (isNaN(parsedYear)) {
      return res.status(400).json({
        success: false,
        error: "El año no es válido.",
      });
    }

    const dateYear = new Date(Date.UTC(parsedYear, 0, 1));
    let result;
    
    // Process versions if provided
    const versionsArray = Array.isArray(versions) ? versions : [];
    
    if (id) {
      result = await prisma.modelo.update({
        where: { id_modelo: parseInt(id) },
        data: {
          nombre: name.trim(),
          anio: dateYear,
          activo: active !== undefined ? active : true,
          marca: brand.trim(),
        },
      });
      
      // Update versions manually
      if (versions !== undefined) {
        // Fetch current active versions
        const currentVersions = await prisma.version.findMany({
          where: { id_modelo: parseInt(id), activo: true }
        });
        
        const currentVersionNames = currentVersions.map(v => v.nombre);
        
        const versionsToAdd = versionsArray.filter(v => !currentVersionNames.includes(v.trim()));
        const versionsToRemove = currentVersions.filter(v => !versionsArray.map(nv => nv.trim()).includes(v.nombre));
        
        if (versionsToRemove.length > 0) {
          await prisma.version.updateMany({
            where: { id_version: { in: versionsToRemove.map(v => v.id_version) } },
            data: { activo: false } // Soft delete
          });
        }
        
        if (versionsToAdd.length > 0) {
          await prisma.version.createMany({
            data: versionsToAdd.map(v => ({
              nombre: v.trim(),
              id_modelo: parseInt(id),
              activo: true
            }))
          });
        }
      }
    } else {
      result = await prisma.modelo.create({
        data: {
          nombre: name.trim(),
          anio: dateYear,
          activo: active !== undefined ? active : true,
          marca: brand.trim(),
          versiones: versionsArray.length > 0 ? {
            create: versionsArray.map(v => ({
              nombre: v.trim(),
              activo: true
            }))
          } : undefined
        },
      });
    }

    return res.status(id ? 200 : 201).json({
      success: true,
      message: id
        ? "Modelo actualizado correctamente"
        : "Modelo creado con éxito",
      data: result,
    });
  } catch (error) {
    console.error("Error en upsertModel:", error);

    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        error: "El ID proporcionado no existe.",
      });
    }

    if (error.code === "P2002" || /unique constraint|duplicated entry|Registro.*duplicado|duplicado/i.test(String(error.message))) {
      return res.status(409).json({
        success: false,
        error: "Ya existe un modelo con ese nombre y año.",
      });
    }

    return res.status(500).json({
      success: false,
      error: "Error interno del servidor",
    });
  }
}
async function toggleModelStatusController(req, res) {
  try {
    const { id } = req.params;
    const { active } = req.body;

    if (!id) {
      return res
        .status(400)
        .json({ success: false, error: "ID de modelo requerido" });
    }

    const modeloActualizado = await prisma.modelo.update({
      where: { id_modelo: parseInt(id) },
      data: { activo: active },
      select: { id_modelo: true, nombre: true, activo: true },
    });

    return res.status(200).json({
      success: true,
      message: `Modelo ${active ? "activado" : "desactivado"} correctamente`,
      data: modeloActualizado,
    });
  } catch (error) {
    console.error("Error en toggleStatus:", error);
    // Manejar error si el ID no existe
    if (error.code === "P2025") {
      return res
        .status(404)
        .json({ success: false, error: "El modelo no existe" });
    }
    return res
      .status(500)
      .json({ success: false, error: "Error al cambiar estado" });
  }
}

async function getAllBrands(req,res) {
  try {
    const brands = await prisma.modelo.findMany({select: {marca: true,}, distinct: ["marca"],});
    const mappedBrands = brands.map((b)=> b.marca);
    return res.status(200).json({data: mappedBrands});
  } catch (error) {
    console.error(error)
    return res
      .status(500)
      .json({ success: false, error: "Error al mandar marcas" });
  }
}

module.exports = {
  getModelsController,
  upsertModelController,
  toggleModelStatusController,
  getAllBrands
};
