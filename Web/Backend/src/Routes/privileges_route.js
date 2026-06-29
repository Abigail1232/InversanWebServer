const router = require("express").Router();
const verificarToken = require("../middleware/verificarToken");
const verificarPrivilegios = require("../middleware/verificarPrivilegios");
const { PRIVILEGIOS } = require("../config/privileges");
const {
  getAllPrivilegios,
  createPrivilegio,
  AsignPrivilegioToRole,
  removePrivilegioFromRole,
  ListarPrivilegiosIdRol,
} = require("../Controllers/privileges");

// Solo quien tenga ADM_ROLES puede gestionar privilegios
router.get(
  "/",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.ADM_ROLES),
  getAllPrivilegios
);
router.post(
  "/create",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.ADM_ROLES),
  createPrivilegio
);
router.post(
  "/assign",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.ADM_ROLES),
  AsignPrivilegioToRole
);
router.delete(
  "/remove",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.ADM_ROLES),
  removePrivilegioFromRole
);
router.get(
  "/role/:id",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.ADM_ROLES),
  ListarPrivilegiosIdRol
);

module.exports = router;
