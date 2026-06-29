const express = require("express");
const router = express.Router();
const verificarToken = require("../middleware/verificarToken");
const verificarPrivilegios = require("../middleware/verificarPrivilegios");
const { PRIVILEGIOS } = require("../config/privileges");

const {
  validarCompra,
  obtenerFacturas,
  obtenerDetallePorPedido,
  obtenerCantidadVentas,
  filtrarFacturas,
} = require("../Controllers/factura.js");

// Validar compra (pública)
router.post("/validar_compra", validarCompra);

// Reportes de ventas — requiere REP_VENTAS
router.get(
  "/obtener_facturas",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.REP_VENTAS),
  obtenerFacturas
);
router.get(
  "/cantidad_ventas",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.REP_VENTAS),
  obtenerCantidadVentas
);
router.get(
  "/filtrar_facturas",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.REP_VENTAS),
  filtrarFacturas
);
router.get(
  "/obtener_detalle/:id_pedido",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.REP_VENTAS, PRIVILEGIOS.PED_PEDIDOS),
  obtenerDetallePorPedido
);

module.exports = router;
