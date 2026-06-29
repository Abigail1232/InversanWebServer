const router = require("express").Router();
const verificarToken = require("../middleware/verificarToken");
const verificarPrivilegios = require("../middleware/verificarPrivilegios");
const { PRIVILEGIOS } = require("../config/privileges");
const {
  getAllRoles,
  createRole,
  deleteRole,
  updateRole,
  activateRole,
  deactivateRole,
} = require("../Controllers/roles");

// Solo quien tenga ADM_ROLES puede administrar roles
router.get(
  "/",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.ADM_ROLES),
  getAllRoles
);
router.post(
  "/create",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.ADM_ROLES),
  createRole
);
router.delete(
  "/delete/:id",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.ADM_ROLES),
  deleteRole
);
router.patch(
  "/update/:id",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.ADM_ROLES),
  updateRole
);
router.patch(
  "/activate/:id",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.ADM_ROLES),
  activateRole
);
router.patch(
  "/deactivate/:id",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.ADM_ROLES),
  deactivateRole
);

module.exports = router;
