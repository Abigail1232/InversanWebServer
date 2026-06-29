const prisma = require("../config/database");

const getEntry = async (req, res) => {
  try {

    const {
      id_entry,
      supplier,
      user,
      store,
      startDate,
      endDate,
      page = 1,
      pageSize = 10
    } = req.query;

    const pageNumber = Number(page);
    const pageSizeNumber = Number(pageSize);

    const skip = (pageNumber - 1) * pageSizeNumber;
    const take = pageSizeNumber;

    const where = {};

    if (id_entry) {
      where.id_ingreso = Number(id_entry);
    }

    if (supplier) {
      where.proveedor = {
        contains: String(supplier),
      };
    }

    if (user) {
      where.usuario = {
        usuario: {
          contains: String(user),
        }
      };
    }

    if (store && store !== "Todas") {
      const bodegaId = Number(store);
      if (!isNaN(bodegaId)) {
        where.id_bodega = bodegaId;
      }
    }

    if (startDate || endDate) {
      where.fecha = {};

      if (startDate) {
        where.fecha.gte = new Date(startDate);
      }

      if (endDate) {
        where.fecha.lte = new Date(endDate);
      }
    }

    const [ingresos, total] = await Promise.all([
      prisma.producto_Ingreso.findMany({
        where,
        orderBy: {
          fecha: "desc"
        },
        skip,
        take,
        include: {
          usuario: true,
          bodega: true,
          producto_ingreso_detalle: {
            select: {
              cantidad: true,
              accion: true
            }
          }
        }
      }),

      prisma.producto_Ingreso.count({ where })
    ]);

    const formatted = ingresos.map((ingreso) => {

      const productos_count = ingreso.producto_ingreso_detalle.length;

      const unidades_count = ingreso.producto_ingreso_detalle.reduce(
        (sum, item) => {
          const valor = item.accion === "decremento" ? -item.cantidad : item.cantidad;
          return sum + valor;
        },
        0
      );

      return {
        id_entry: ingreso.id_ingreso,
        date: ingreso.fecha,
        supplier: ingreso.proveedor,
        store: ingreso.bodega.nombre,
        user: ingreso.usuario.usuario,
        productos_count,
        unidades_count
      };

    });

    res.json({
      data: formatted,
      pagination: {
        total,
        currentPage: pageNumber,
        pageSize: pageSizeNumber,
        totalPages: Math.ceil(total / pageSizeNumber)
      }
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Error obteniendo ingresos"
    });

  }
};


const getEntryDetail = async (req, res) => {
  try {

    const { id_entry } = req.params;

    if (!id_entry) {
      return res.status(400).json({
        message: "id_entry es requerido"
      });
    }

    const ingreso = await prisma.producto_Ingreso.findUnique({
      where: {
        id_ingreso: Number(id_entry)
      },
      select: {
        id_ingreso: true,
        fecha: true,
        proveedor: true,
        observaciones: true,
        usuario: { select: { usuario: true } },
        bodega: { select: { nombre: true } },
        producto_ingreso_detalle: {
          select: {
            cantidad: true,
            total:true,
            accion:true,
            producto: {
              select: {
                id_producto: true,
                nombre: true,
                producto_imagen: {
                  select: { imagen_url: true },
                  take: 1
                }
              }
            }
          }
        }
      }
    });

    if (!ingreso) {
      return res.status(404).json({
        message: "Ingreso no encontrado"
      });
    }

    const productos_count = ingreso.producto_ingreso_detalle.length;

    const unidades_count = ingreso.producto_ingreso_detalle.reduce(
      (sum, item) => {
        const valor = item.accion === "decremento" ? -item.cantidad : item.cantidad;
        return sum + valor;
      },
      0
    );

    const detalles = ingreso.producto_ingreso_detalle.map((detalle) => ({
      id_producto: detalle.producto.id_producto,
      nombre: detalle.producto.nombre,
      foto: detalle.producto.producto_imagen?.[0]?.imagen_url || null,
      unidades: detalle.cantidad,
      total: detalle.total,
      accion: detalle.accion
    }));

    const formatted = {
      id_entry: ingreso.id_ingreso,
      date: ingreso.fecha,
      supplier: ingreso.proveedor,
      store: ingreso.bodega.nombre,
      user: ingreso.usuario.usuario,
      comments: ingreso.observaciones,
      productos_count,
      unidades_count,
      detalles
    };

    res.json(formatted);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Error obteniendo detalle del ingreso"
    });

  }
};

module.exports = {
  getEntry,
  getEntryDetail
};
