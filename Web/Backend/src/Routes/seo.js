const router = require("express").Router();
const seoController = require("../Controllers/seo");

router.get("/tire-size", seoController.obtenerProductosPorMedida);
router.get("/vehicle", seoController.obtenerProductosPorVehiculo);
router.get("/catalog", seoController.obtenerCatalogoPublico);
router.get("/business-locations", seoController.obtenerSucursalesPublicas);

module.exports = router;
