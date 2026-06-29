const express = require("express");
const router = express.Router();
const verificarToken = require("../middleware/verificarToken");
const verificarPrivilegios = require("../middleware/verificarPrivilegios");
const { PRIVILEGIOS } = require("../config/privileges");
const visitasController = require("../Controllers/visitas");

// Todos los reportes de visitas requieren REP_VISITAS
router.get(
  "/tendencia",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.REP_VISITAS),
  visitasController.getTendencia
);
router.get(
  "/top-productos",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.REP_VISITAS),
  visitasController.getTopProductos
);
router.get(
  "/sin-vistas",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.REP_VISITAS),
  visitasController.getSinVistas
);
router.get(
  "/comparativa",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.REP_VISITAS),
  visitasController.getComparativa
);
router.get(
  "/dashboard-avanzado",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.REP_VISITAS),
  visitasController.getDashboardAvanzado
);
router.get(
  "/oportunidades",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.REP_VISITAS),
  visitasController.getOportunidades
);

module.exports = router;
