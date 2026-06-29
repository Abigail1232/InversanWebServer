const express = require("express");
const router = express.Router();
const verificarToken = require("../middleware/verificarToken");
const verificarPrivilegios = require("../middleware/verificarPrivilegios");
const { PRIVILEGIOS } = require("../config/privileges");
const productoIngresoController = require("../Controllers/producto_ingreso");

// Crear ingreso — requiere INV_INGRESO
router.post(
  "/register",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.INV_INGRESO),
  productoIngresoController.create
);

// Búsqueda y opciones para registrar — requiere INV_INGRESO o INV_HISTORIAL
router.get(
  "/search",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.INV_INGRESO, PRIVILEGIOS.INV_HISTORIAL),
  productoIngresoController.getIngresos
);
router.get(
  "/products/options",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.INV_INGRESO),
  productoIngresoController.getProductosOptions
);
router.get(
  "/bodegas/options",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.INV_INGRESO),
  productoIngresoController.getBodegasOptions
);

// Ver historial — requiere INV_HISTORIAL
router.get(
  "/",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.INV_HISTORIAL),
  productoIngresoController.getAllIngresos
);
router.get(
  "/:id",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.INV_HISTORIAL),
  productoIngresoController.getIngresoByID
);

module.exports = router;
