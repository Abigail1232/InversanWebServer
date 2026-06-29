const express = require("express");
const router = express.Router();
const verificarToken = require("../middleware/verificarToken");
const {
  listarMisNotificaciones,
  marcarNotificacionLeida,
  marcarTodasLeidas,
  eliminarNotificacion,
  eliminarTodasNotificaciones,
} = require("../Controllers/notificaciones");

router.get("/me", verificarToken, listarMisNotificaciones);
router.patch("/me/read-all", verificarToken, marcarTodasLeidas);
router.delete("/me", verificarToken, eliminarTodasNotificaciones);
router.patch("/:id/read", verificarToken, marcarNotificacionLeida);
router.delete("/:id", verificarToken, eliminarNotificacion);

module.exports = router;
