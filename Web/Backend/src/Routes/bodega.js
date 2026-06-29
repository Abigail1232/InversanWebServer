const express = require("express");
const router = express.Router();
const bodegaController = require("../Controllers/bodega");
const verificarToken = require("../middleware/verificarToken");
const verificarPrivilegios = require("../middleware/verificarPrivilegios");
const { PRIVILEGIOS } = require("../config/privileges");

// Lectura (pública)
router.get("/", bodegaController.getAllBodegas);
router.get("/:id", bodegaController.getBodegaByID);

// Gestión — requiere ADM_BODEGAS
router.post(
  "/",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.ADM_SUCURSALES),
  bodegaController.createBodega
);
router.put(
  "/:id",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.ADM_SUCURSALES),
  bodegaController.editBodega
);
router.patch(
  "/:id/active",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.ADM_SUCURSALES),
  bodegaController.toggleActiveBodega
);

module.exports = router;
