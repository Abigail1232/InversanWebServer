const express = require("express");
const router = express.Router();
const promocionesController = require("../Controllers/promociones");
const upload = require("../middleware/uploads");
const verificarToken = require("../middleware/verificarToken");
const verificarPrivilegios = require("../middleware/verificarPrivilegios");
const { PRIVILEGIOS } = require("../config/privileges");

// Crear promoción — requiere ADM_PROMOCIONES
router.post(
  "/",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.ADM_PROMOCIONES),
  upload.single("banner"),
  promocionesController.crearPromocion
);

// Obtener promociones (público)
router.get("/", promocionesController.obtenerPromociones);

// Actualizar configuración — requiere ADM_PROMOCIONES
router.put(
  "/config-visualizacion",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.ADM_PROMOCIONES),
  promocionesController.actualizarConfigVisualizacion
);

// Actualizar configuración por ID — requiere ADM_PROMOCIONES
router.put(
  "/:id/config-visualizacion",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.ADM_PROMOCIONES),
  promocionesController.actualizarConfigVisualizacionPorId
);

// Obtener detalle (público)
router.get("/:id", promocionesController.obtenerPromocionDetalle);

// Editar promoción — requiere ADM_PROMOCIONES
router.put(
  "/:id",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.ADM_PROMOCIONES),
  upload.single("banner"),
  promocionesController.editarPromocion
);

// Eliminar promoción — requiere ADM_PROMOCIONES
router.delete(
  "/:id",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.ADM_PROMOCIONES),
  promocionesController.eliminarPromocion
);

module.exports = router;
