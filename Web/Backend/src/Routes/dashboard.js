const express = require("express");
const router = express.Router();
const verificarToken = require("../middleware/verificarToken");
const verificarPrivilegios = require("../middleware/verificarPrivilegios");
const { PRIVILEGIOS } = require("../config/privileges");
const dashboardController = require("../Controllers/dashboard");

router.get(
  "/stats",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.DASHBOARD_VIEW),
  dashboardController.obtenerEstadisticasDashboard
);

module.exports = router;
