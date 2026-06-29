const prisma = require("../config/database");
const { getPagination, paginatedResponse } = require("./utils/pagination");

async function getAllIngresos(req, res) {
    const { page, limit, skip } = getPagination(req.query);

    try {
        const [totalRows, ingresos] = await Promise.all([
            prisma.producto_Ingreso.count(),
            prisma.producto_Ingreso.findMany({
                skip,
                take: limit,
                orderBy: { fecha: "desc" },
                include: {
                    bodega: {
                        select: {
                            id_bodega: true,
                            nombre: true,
                        },
                    },
                    usuario: {
                        select: {
                            primer_nombre: true,
                            primer_apellido: true,
                        },
                    },
                    producto_ingreso_detalle: {
                        include: {
                            producto: {
                                select: {
                                    id_producto: true,
                                    nombre: true,
                                },
                            },
                        },
                    },
                },
            }),
        ]);

        const data = ingresos.map((ingreso) => ({
            id_entry: ingreso.id_ingreso,
            date: ingreso.fecha,
            store: ingreso.bodega.nombre,
            supplier: ingreso.proveedor,
            user: `${ingreso.usuario.primer_nombre} ${ingreso.usuario.primer_apellido}`,
            productos_count: ingreso.producto_ingreso_detalle.length,
            unidades_count: ingreso.producto_ingreso_detalle.reduce((sum, d) => {
                const valor = d.accion === "decremento" ? -d.cantidad : d.cantidad;
                return sum + valor;
            }, 0),
            detalles: ingreso.producto_ingreso_detalle.map((detalle) => ({
                id_producto: detalle.producto.id_producto,
                producto: detalle.producto.nombre,
                cantidad: detalle.cantidad,
                accion: detalle.accion,
            })),
        }));

        res.json(paginatedResponse(data, totalRows, page, limit));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al obtener los ingresos" });
    }
}

async function getIngresos(req, res) {
    const { buscar, fecha_inicio, fecha_fin } = req.query;
    const { page, limit, skip } = getPagination(req.query);

    if (!buscar && !fecha_inicio && !fecha_fin) {
        return res.json(paginatedResponse([], 0, page, limit));
    }

    try {
        const where = {};

        if (buscar) {
            where.OR = [
                { proveedor: { contains: buscar } },
                ...(isNaN(buscar) ? [] : [{ id_ingreso: Number(buscar) }]),
            ];
        }

        if (fecha_inicio || fecha_fin) {
            where.fecha = {};
            if (fecha_inicio) where.fecha.gte = new Date(fecha_inicio);
            if (fecha_fin) {
                const fin = new Date(fecha_fin);
                fin.setHours(23, 59, 59, 999);
                where.fecha.lte = fin;
            }
        }

        const [totalRows, ingresos] = await Promise.all([
            prisma.producto_Ingreso.count({ where }),
            prisma.producto_Ingreso.findMany({
                where,
                skip,
                take: limit,
                orderBy: { fecha: "desc" },
                include: {
                    bodega: {
                        select: {
                            id_bodega: true,
                            nombre: true,
                        },
                    },
                    usuario: {
                        select: {
                            primer_nombre: true,
                            primer_apellido: true,
                        },
                    },
                    producto_ingreso_detalle: {
                        include: {
                            producto: {
                                select: {
                                    id_producto: true,
                                    nombre: true,
                                },
                            },
                        },
                    },
                },
            }),
        ]);

        if (totalRows === 0) {
            return res.json(paginatedResponse([], 0, page, limit));
        }

        const data = ingresos.map((ingreso) => ({
            id_entry: ingreso.id_ingreso,
            date: ingreso.fecha,
            store: ingreso.bodega.nombre,
            supplier: ingreso.proveedor,
            user: `${ingreso.usuario.primer_nombre} ${ingreso.usuario.primer_apellido}`,
            productos_count: ingreso.producto_ingreso_detalle.length,
            unidades_count: ingreso.producto_ingreso_detalle.reduce((sum, d) => {
                const valor = d.accion === "decremento" ? -d.cantidad : d.cantidad;
                return sum + valor;
            }, 0),
            detalles: ingreso.producto_ingreso_detalle.map((detalle) => ({
                id_producto: detalle.producto.id_producto,
                producto: detalle.producto.nombre,
                cantidad: detalle.cantidad,
                accion: detalle.accion,
            })),
        }));

        res.json(paginatedResponse(data, totalRows, page, limit));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al obtener los ingresos" });
    }
}

async function getIngresoByID(req, res) {
    const { id } = req.params;

    try {
        const ingreso = await prisma.producto_Ingreso.findUnique({
            where: { id_ingreso: Number(id) },
            include: {
                bodega: {
                    select: {
                        nombre: true,
                    },
                },
                usuario: {
                    select: {
                        primer_nombre: true,
                        primer_apellido: true,
                    },
                },
                producto_ingreso_detalle: {
                    include: {
                        producto: {
                            select: {
                                id_producto: true,
                                nombre: true,
                                producto_imagen: {
                                    take: 1,
                                    orderBy: { orden: 'asc' },
                                    select: { imagen_url: true }
                                }
                            },
                        },
                    },
                },
            },
        });

        if (!ingreso) {
            return res.status(404).json({ error: "Ingreso no encontrado" });
        }

        const result = {
            id_entry: ingreso.id_ingreso,
            date: ingreso.fecha,
            supplier: ingreso.proveedor,
            comments: ingreso.observaciones,
            store: ingreso.bodega.nombre,
            user: `${ingreso.usuario.primer_nombre} ${ingreso.usuario.primer_apellido}`,
            productos_count: ingreso.producto_ingreso_detalle.length,
            unidades_count: ingreso.producto_ingreso_detalle.reduce((sum, d) => {
                const valor = d.accion === "decremento" ? -d.cantidad : d.cantidad;
                return sum + valor;
            }, 0),
            detalles: ingreso.producto_ingreso_detalle.map((d) => ({
                id_producto: d.producto.id_producto,
                nombre: d.producto.nombre,
                foto: d.producto.producto_imagen?.[0]?.imagen_url || null,
                unidades: d.cantidad,
                accion: d.accion,
                total: d.total,
            })),
        };

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al obtener el ingreso" });
    }
}

async function getProductosOptions(req, res) {
    try {
        const productos = await prisma.producto.findMany({
            where: {
                estado: true,
            },
            select: {
                id_producto: true,
                nombre: true,
                precio_coste: true,
                marca: {
                    select: {
                        nombre: true,
                    },
                },
                stock_bodega: {
                    select: {
                        id_bodega: true,
                        existencias: true,
                        bodega: {
                            select: {
                                id_bodega: true,
                                nombre: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                nombre: "asc",
            },
        });

        res.json(productos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al obtener productos" });
    }
}

async function getBodegasOptions(req, res) {
    try {
        const bodegas = await prisma.bodega.findMany({
            select: {
                id_bodega: true,
                nombre: true,
                sucursal: {
                    select: {
                        nombre: true,
                    },
                },
            },
            orderBy: {
                nombre: "asc",
            },
            where: {
                activo: true,
                sucursal: {
                    activo: true
                },
            },
        });

        res.json(bodegas);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al obtener bodegas" });
    }
}

async function create(req, res) {
    const { observaciones, productos } = req.body;
    const id_usuario = req.user?.id || req.user?.id_usuario;

    if (!id_usuario) {
        return res.status(401).json({ error: "Usuario no autenticado correctamente" });
    }

    if (!Array.isArray(productos) || productos.length === 0) {
        return res.status(400).json({ error: "Faltan productos para registrar el ingreso" });
    }

    for (const producto of productos) {
        if (
            !producto.id_producto ||
            !producto.id_bodega ||
            !producto.proveedor ||
            !producto.cantidad ||
            producto.cantidad <= 0 ||
            (producto.accion === "incremento" && (producto.costo_unitario == null || producto.costo_unitario <= 0))
        ) {
            return res.status(400).json({
                error: "Cada producto debe incluir id_producto, id_bodega, proveedor, cantidad y costo_unitario (para incrementos) válidos",
            });
        }
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            const grupos = new Map();

            for (const producto of productos) {
                const key = `${producto.id_bodega}__${producto.proveedor.trim()}`;

                if (!grupos.has(key)) {
                    grupos.set(key, {
                        id_bodega: producto.id_bodega,
                        proveedor: producto.proveedor.trim(),
                        productos: [],
                    });
                }

                grupos.get(key).productos.push(producto);
            }

            const ingresosCreados = [];

            for (const grupo of grupos.values()) {
                const ingreso = await tx.producto_Ingreso.create({
                    data: {
                        fecha: new Date(),
                        proveedor: grupo.proveedor,
                        id_usuario,
                        id_bodega: grupo.id_bodega,
                        observaciones,
                    },
                });

                await tx.producto_Ingreso_Detalle.createMany({
                    data: grupo.productos.map((producto) => ({
                        id_ingreso: ingreso.id_ingreso,
                        id_producto: producto.id_producto,
                        cantidad: producto.cantidad,
                        accion: producto.accion,
                        total: producto.cantidad * producto.costo_unitario,
                    })),
                });

                for (const d of grupo.productos) {
                    const stock = await tx.stock_Bodega.findFirst({
                        where: {
                            id_bodega: grupo.id_bodega,
                            id_producto: d.id_producto,
                        },
                    });

                    const valor = d.accion === "incremento" ? d.cantidad : -d.cantidad;

                    if (stock) {
                        if (stock.existencias + valor < 0) {
                            throw new Error(
                                `Stock insuficiente para el producto ID ${d.id_producto} en la bodega ID ${grupo.id_bodega}`
                            );
                        }

                        await tx.stock_Bodega.update({
                            where: {
                                id_stock_bodega: stock.id_stock_bodega,
                            },
                            data: {
                                existencias: stock.existencias + valor,
                                fecha_actualizacion: new Date(),
                            },
                        });
                    } else {
                        if (d.accion === "decremento") {
                            throw new Error(
                                `No existe stock para el producto ID ${d.id_producto} en la bodega ID ${grupo.id_bodega}`
                            );
                        }

                        await tx.stock_Bodega.create({
                            data: {
                                id_bodega: grupo.id_bodega,
                                id_producto: d.id_producto,
                                existencias: d.cantidad,
                                fecha_actualizacion: new Date(),
                            },
                        });
                    }
                }

                ingresosCreados.push(ingreso);
            }

            return ingresosCreados;
        });

        res.status(201).json({
            message: "Ingresos registrados correctamente",
            ingresos: result,
        });
    } catch (error) {
        console.error("Error creating producto_ingreso:", error);
        res.status(500).json({ error: "Ocurrió un error al crear el ingreso" });
    }
}

module.exports = {
    getAllIngresos,
    getIngresos,
    getIngresoByID,
    getProductosOptions,
    getBodegasOptions,
    create,
};