const express = require("express");
const router = express.Router();
const sucursalController = require("../Controllers/sucursal");
const verificarToken = require("../middleware/verificarToken");
const verificarPrivilegios = require("../middleware/verificarPrivilegios");
const { PRIVILEGIOS } = require("../config/privileges");

// Rutas públicas (cualquier visitante puede ver sucursales)
router.get("/", sucursalController.getAllSucursales);
router.get("/active", sucursalController.getAllActiveSucursales);
router.get("/:id", sucursalController.getSucursalByID);

// Gestión de sucursales — requiere ADM_SUCURSALES
router.post(
  "/",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.ADM_SUCURSALES),
  sucursalController.createSucursal
);
router.put(
  "/:id",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.ADM_SUCURSALES),
  sucursalController.editSucursal
);
router.patch(
  "/:id/active",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.ADM_SUCURSALES),
  sucursalController.toggleActiveSucursal
);

// Empleados de sucursal
router.get("/:id/empleados", sucursalController.getAllEmpleadosForSucursal);
router.post(
  "/:id/empleados",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.ADM_SUCURSALES, PRIVILEGIOS.ADM_USUARIOS),
  sucursalController.createAsignacion
);

module.exports = router;
