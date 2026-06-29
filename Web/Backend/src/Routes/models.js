const express = require("express");
const router = express.Router();
const {
  getModelsController,
  upsertModelController,
  toggleModelStatusController,
  getAllBrands,
} = require("../Controllers/models");
const verificarToken = require("../middleware/verificarToken");
const verificarPrivilegios = require("../middleware/verificarPrivilegios");
const { PRIVILEGIOS } = require("../config/privileges");

// Todo requiere ADM_MODELOS
router.get(
  "/",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.ADM_MODELOS),
  getModelsController
);
router.post(
  "/",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.ADM_MODELOS),
  upsertModelController
);
router.post(
  "/active/:id",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.ADM_MODELOS),
  toggleModelStatusController
);
router.get(
  "/brand",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.ADM_MODELOS, PRIVILEGIOS.ADM_MARCAS),
  getAllBrands
);

module.exports = router;
