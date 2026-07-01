const router = require("express").Router();
const auth = require("../Controllers/auth");
const verificarToken = require("../middleware/verificarToken");

router.post("/register", auth.register);
router.post("/login", auth.login);
router.post("/logout", auth.logout)
router.post("/solicitar-recuperacion", auth.solicitarRecuperacion);
router.post("/verificar-codigo-solo", auth.verificarCodigoSolo);
router.post("/verificar-codigo", auth.verificarCodigoYCambiarPassword);

// Ruta protegida de ejemplo
router.get("/protected", verificarToken, (req, res) => {
  res.json({ message: "Acceso a ruta protegida concedido!", user: req.user });
});

module.exports = router;
