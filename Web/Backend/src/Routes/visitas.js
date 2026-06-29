const express = require("express");
const router = express.Router();
const visitasController = require("../Controllers/visitas");

// Tracking
router.get("/:id", visitasController.getVisitasProductoByProd);
router.post("/", visitasController.createVisitaProd);
router.post("/busqueda", visitasController.createBusquedaInterna);

module.exports = router;
