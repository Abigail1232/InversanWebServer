const prisma = require("../../src/config/database");

const N = 16;
const ID_REPARTIDOR = 2;
const ASIGNADO_POR = 1;

async function insertPedidoAsignacion() {
  for (let i = 1; i <= N; i++) {
    const fechaAsignacion = new Date(Date.now() - (N - i) * 3600000);

    const pedido = await prisma.pedido.findUnique({
      where: { id_pedido: i },
      select: { estado: true },
    });

    const estadoPedido = pedido?.estado;
    const esPendiente = estadoPedido === "pendiente";
    const esEnProceso = estadoPedido === "en_proceso";
    const esEntregado = estadoPedido === "entregado";
    const esCancelado = estadoPedido === "cancelado";

    // Regla:
    // - pendiente => la UI usa pedido.fecha (no fecha_estimada_entrega)
    // - en_proceso => usa fecha_estimada_entrega como estimada
    // - entregado/cancelado => fecha_estimada_entrega representa el timestamp real
    const offsetHoras = esPendiente
      ? null
      : esEnProceso
        ? 6 + i
        : esEntregado
          ? 12 + i
          : esCancelado
            ? 9 + i
            : 12 + i;

    const fechaEstimadaEntrega =
      offsetHoras == null
        ? null
        : new Date(fechaAsignacion.getTime() + offsetHoras * 3600000);
    const estadoAsignacion = esCancelado ? "rechazado" : "asignado";
    const activo = esCancelado ? false : true;

    await prisma.pedido_Asignacion.create({
      data: {
        observacion: `Asignación pedido ${i} al repartidor`,
        fecha_asignacion: fechaAsignacion,
        id_pedido: i,
        id_repartidor: ID_REPARTIDOR,
        asignado_por: ASIGNADO_POR,
        fecha_estimada_entrega: fechaEstimadaEntrega,
        estado_asignacion: estadoAsignacion,
        activo,
      },
    });
  }
  console.log("Pedido_Asignacion insertados correctamente");
}

module.exports = { insertPedidoAsignacion };
