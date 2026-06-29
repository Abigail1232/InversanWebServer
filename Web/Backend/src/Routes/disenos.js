const express = require("express");
const router = express.Router();

const disenosController = require("../Controllers/disenos");
const upload = require("../middleware/uploads");
const verificarToken = require("../middleware/verificarToken");
const verificarPrivilegios = require("../middleware/verificarPrivilegios");
const { PRIVILEGIOS } = require("../config/privileges");

// Rutas públicas
router.get("/", disenosController.getDisenos);
router.get("/:id/productos", disenosController.getProductosPorDiseno);
router.get("/:id", disenosController.getDisenoById);

// Gestión de diseños — requiere ADM_DISENOS
router.post(
  "/",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.ADM_DISENOS),
  upload.single("imagen"),
  disenosController.createDiseno
);

router.put(
  "/:id",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.ADM_DISENOS),
  upload.single("imagen"),
  disenosController.updateDiseno
);

router.patch(
  "/:id/active",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.ADM_DISENOS),
  disenosController.toggleActiveDiseno
);

module.exports = router;
