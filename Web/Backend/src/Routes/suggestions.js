const express = require("express");
const router = express.Router();
const controller = require("../Controllers/suggestionsController");
const verificarTokenOpcional = require("../middleware/verificarTokenOpcional");

/*
  POST /api/suggestions
  Crear una sugerencia
*/
router.post("/", verificarTokenOpcional, controller.crearSugerencia);

/*
  GET /api/suggestions
  Obtener todas las sugerencias
*/
router.get("/", controller.obtenerSugerencias);

/*
  GET /api/suggestions/:id
  Obtener una sugerencia por id
*/
router.get("/:id", controller.obtenerSugerenciaPorId);

module.exports = router;