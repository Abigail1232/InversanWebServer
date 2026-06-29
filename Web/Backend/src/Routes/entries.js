const express = require("express");
const router = express.Router();
const verificarToken = require("../middleware/verificarToken");
const verificarPrivilegios = require("../middleware/verificarPrivilegios");
const { PRIVILEGIOS } = require("../config/privileges");
const { getEntryDetail, getEntry } = require("../Controllers/entries");

// Ver entradas — requiere INV_HISTORIAL
router.get(
  "/",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.INV_HISTORIAL),
  getEntry
);
router.get(
  "/details/:id_entry",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.INV_HISTORIAL),
  getEntryDetail
);

module.exports = router;
