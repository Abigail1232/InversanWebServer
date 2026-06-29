const express = require("express");
const router = express.Router();
const verificarToken = require("../middleware/verificarToken");
const verificarTokenOpcional = require("../middleware/verificarTokenOpcional");
const verificarPrivilegios = require("../middleware/verificarPrivilegios");
const upload = require("../middleware/uploads");
const { PRIVILEGIOS } = require("../config/privileges");

const {
  realizarCompra,
  obtenerEntregasRealizadas,
  obtenerEntregasRealizadasFiltradas,
  obtenerMisPedidosPendientes,
  obtenerMisPedidosFinalizados,
  obtenerDetallePedido,
  obtenerResumenPedidosPorUsuario,
  obtenerPedidoDeUsuario,
  buscarPedidosConFiltros,
  asignarPedidoARepartidor,
  actualizarEstadoPedido,
  obtenerPedidosEntregasRepartidor,
  obtenerDetallePedidoEntrega,
  efectuarEntrega,
  rechazarPedido,
  subirComprobanteCompra,
  obtenerPedidoPublico,
  verificarUsuarioPedido,
  validateReorder,
  actualizarEstadoPedidoAdmin,
} = require("../Controllers/pedido.js");

// ===== RUTA PARA REALIZAR COMPRA (pública / con token opcional) =====
router.post("/realizar_compra", verificarTokenOpcional, realizarCompra);

// ===== ENTREGAS DEL REPARTIDOR — requiere PED_ENTREGA =====
router.get(
  "/entregas/mis_pedidos",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.PED_ENTREGA),
  obtenerPedidosEntregasRepartidor
);
router.get(
  "/entregas/detalle/:id_pedido",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.PED_ENTREGA, PRIVILEGIOS.PED_PEDIDOS),
  obtenerDetallePedidoEntrega
);
router.patch(
  "/entregas/efectuar/:id_pedido",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.PED_ENTREGA),
  efectuarEntrega
);
router.patch(
  "/entregas/rechazar/:id_pedido",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.PED_ENTREGA),
  rechazarPedido
);

// ===== HISTORIAL DE ENTREGAS — PED_HISTORIAL (propio) o PED_HISTORIAL_ALL (todos) =====
router.get(
  "/entregas/historial",
  verificarToken,
  verificarPrivilegios(
    PRIVILEGIOS.PED_HISTORIAL
  ),
  obtenerEntregasRealizadas
);
router.get(
  "/entregas/historial/filtrado",
  verificarToken,
  verificarPrivilegios(
    PRIVILEGIOS.PED_HISTORIAL
  ),
  obtenerEntregasRealizadasFiltradas
);

// ===== PEDIDOS DEL CLIENTE (token opcional) =====
router.get(
  "/mis_pedidos_pendientes",
  verificarTokenOpcional,
  obtenerMisPedidosPendientes
);
router.get(
  "/mis_pedidos_finalizados",
  verificarTokenOpcional,
  obtenerMisPedidosFinalizados
);
router.get(
  "/detalle_pedido/:id_pedido",
  verificarTokenOpcional,
  obtenerDetallePedido
);
router.get(
  "/resumen_pedidos",
  verificarTokenOpcional,
  obtenerResumenPedidosPorUsuario
);
router.get("/buscar_pedidos", verificarTokenOpcional, buscarPedidosConFiltros);

// ===== GESTIÓN DE PEDIDOS POR ADMIN — requiere PED_PEDIDOS =====
router.patch(
  "/rechazar_pedido/:id_pedido",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.PED_PEDIDOS),
  actualizarEstadoPedidoAdmin
);
router.post(
  "/asignar_pedido",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.PED_PEDIDOS),
  asignarPedidoARepartidor
);
router.patch(
  "/actualizar_estado/:id_pedido",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.PED_PEDIDOS, PRIVILEGIOS.PED_ENTREGA),
  actualizarEstadoPedido
);

// ===== REPETIR PEDIDO Y SUBIR COMPROBANTE (cualquiera logueado) =====
router.post("/reorder/validate", verificarTokenOpcional, validateReorder);
router.post(
  "/subir_comprobante/:id_pedido",
  verificarTokenOpcional,
  upload.single("comprobante"),
  subirComprobanteCompra
);

// ===== RUTAS PÚBLICAS (desde correos) =====
router.get("/publico/:id_pedido", obtenerPedidoPublico);
router.get("/verificar/:id_pedido", verificarUsuarioPedido);

// ===== Pedido por ID — al final por orden de prioridad de rutas dinámicas =====
router.get("/:id_pedido", obtenerPedidoDeUsuario);

module.exports = router;
