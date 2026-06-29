const express = require("express");
const router = express.Router();
const marcaController = require("../Controllers/marca");
const upload = require("../middleware/uploads");
const verificarToken = require("../middleware/verificarToken");
const verificarPrivilegios = require("../middleware/verificarPrivilegios");
const { PRIVILEGIOS } = require("../config/privileges");

// Rutas públicas
router.get("/", marcaController.getMarcas);
router.get("/:id", marcaController.getMarcaById);
router.get("/:id/productos", marcaController.getProductosPorMarca);

// Gestión de marcas — requiere ADM_MARCAS
router.post(
  "/",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.ADM_MARCAS),
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "banner", maxCount: 1 },
  ]),
  marcaController.createMarca
);

router.put(
  "/:id",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.ADM_MARCAS),
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "banner", maxCount: 1 },
  ]),
  marcaController.updateMarca
);

router.patch(
  "/:id/active",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.ADM_MARCAS),
  marcaController.toggleActiveMarca
);

module.exports = router;
