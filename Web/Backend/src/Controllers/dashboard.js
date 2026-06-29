const prisma = require("../config/database");

const obtenerEstadisticasDashboard = async (req, res) => {
  try {
    const { id_sucursal } = req.query;
    const filterBranch = id_sucursal && id_sucursal !== 'todos' ? Number(id_sucursal) : null;

    const hoy = new Date();
    const inicioDia = new Date(hoy.setHours(0, 0, 0, 0));
    const finDia = new Date(hoy.setHours(23, 59, 59, 999));

    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const finMes = new Date(
      hoy.getFullYear(),
      hoy.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    const haceSeisMeses = new Date();
    haceSeisMeses.setMonth(haceSeisMeses.getMonth() - 5);
    haceSeisMeses.setDate(1);
    haceSeisMeses.setHours(0, 0, 0, 0);

    const estadosValidos = [
      "entregado",
      "pendiente",
      "en_proceso",
      "pago_pendiente",
    ];

    // 1. Cálculo de bajo stock (Lógica optimizada)
    const stockWhere = {};
    if (filterBranch) {
      stockWhere.id_sucursal = filterBranch;
    }

    const productosParaStock = await prisma.producto.findMany({
      select: {
        stock_bodega: {
          where: filterBranch ? { bodega: { id_sucursal: filterBranch } } : {},
          select: { existencias: true },
        },
      },
    });

    const bajoStockCount = productosParaStock.filter((p) => {
      const totalGlobal = p.stock_bodega.reduce(
        (acc, curr) => acc + curr.existencias,
        0,
      );
      return totalGlobal < 10;
    }).length;

    // Common where clauses
    const pedidoWhere = {
      estado: { in: estadosValidos }
    };
    if (filterBranch) {
      pedidoWhere.id_sucursal = filterBranch;
    }

    // 2. Consultas principales en paralelo
    const [
      ventasHoy,
      pedidosPendientes,
      ventasMesActual,
      datosGrafica,
      marcasMasVendidas,
      ultimosPedidos,
    ] = await Promise.all([
      // Llantas vendidas hoy
      prisma.pedido_Detalle.aggregate({
        _sum: { cantidad: true },
        where: {
          pedido: {
            ...pedidoWhere,
            fecha: { gte: inicioDia, lte: finDia },
          },
        },
      }),

      // Pedidos pendientes
      prisma.pedido.count({
        where: { 
          estado: "pendiente",
          ...(filterBranch ? { id_sucursal: filterBranch } : {})
        },
      }),

      // Ventas del mes actual
      prisma.pedido_Detalle.aggregate({
        _sum: { cantidad: true },
        where: {
          pedido: {
            ...pedidoWhere,
            fecha: { gte: inicioMes, lte: finMes },
          },
        },
      }),

      // Datos para gráfica de líneas
      prisma.pedido.findMany({
        where: {
          ...pedidoWhere,
          fecha: { gte: haceSeisMeses },
        },
        select: { fecha: true, total: true },
      }),

      // Marcas más vendidas
      prisma.pedido_Detalle.groupBy({
        by: ["id_producto"],
        _sum: { cantidad: true },
        where: {
          pedido: pedidoWhere,
        },
        orderBy: { _sum: { cantidad: "desc" } },
        take: 5,
      }),

      // ÚLTIMOS 10 PEDIDOS
      prisma.pedido.findMany({
        where: filterBranch ? { id_sucursal: filterBranch } : {},
        take: 10,
        orderBy: { fecha: "desc" },
        select: {
          id_pedido: true,
          numero_pedido: true,
          fecha: true,
          estado: true,
          total: true,
          tipo_de_entrega: true,
          pedido_usuario: {
            select: { nombre_completo: true },
          },
        },
      }),
    ]);

    // 3. Procesamiento para gráfica de líneas
    const mesesLabels = [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ];
    const ventasPorMes = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      ventasPorMes[mesesLabels[d.getMonth()]] = 0;
    }

    datosGrafica.forEach((p) => {
      const mes = mesesLabels[new Date(p.fecha).getMonth()];
      if (ventasPorMes[mes] !== undefined) {
        ventasPorMes[mes] += Number(p.total);
      }
    });

    // 4. Obtener nombres de marcas para gráfica de dona
    const productosIds = marcasMasVendidas.map((m) => m.id_producto);
    const productosInfo = await prisma.producto.findMany({
      where: { id_producto: { in: productosIds } },
      include: { marca: true },
    });

    const marcasFinal = productosInfo.map((p) => ({
      marca: p.marca.nombre,
      cantidad:
        marcasMasVendidas.find((m) => m.id_producto === p.id_producto)?._sum
          .cantidad || 0,
    }));

    // 5. Respuesta final
    return res.status(200).json({
      ok: true,
      stats: {
        ventasHoy: ventasHoy._sum.cantidad || 0,
        pedidosPendientes,
        productosBajoStock: bajoStockCount,
        ventasMes: ventasMesActual._sum.cantidad || 0,
      },
      graficaLineas: Object.entries(ventasPorMes).map(([name, total]) => ({
        name,
        total,
      })),
      graficaDona: marcasFinal,
      ultimosPedidos: ultimosPedidos.map((p) => ({
        id_pedido: p.id_pedido,
        pedido: p.numero_pedido,
        fecha: p.fecha,
        cliente: p.pedido_usuario[0]?.nombre_completo || "Invitado",
        estado: p.estado,
        total: Number(p.total),
        entrega: p.tipo_de_entrega, // <-- Se envía como 'entrega' al frontend
      })),
    });
  } catch (error) {
    console.error("Error en dashboard:", error);
    res.status(500).json({ ok: false, msg: "Error interno del servidor" });
  }
};

module.exports = { obtenerEstadisticasDashboard };
