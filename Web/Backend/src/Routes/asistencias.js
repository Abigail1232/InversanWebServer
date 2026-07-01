const express = require("express");
const router = express.Router();
const asistenciasController = require("../Controllers/asistencias");
const verificarToken = require("../middleware/verificarToken");
const verificarPrivilegios = require("../middleware/verificarPrivilegios");
const { PRIVILEGIOS } = require("../config/privileges");

router.use(verificarToken);

router.get(
  "/context",
  verificarPrivilegios(
    PRIVILEGIOS.ASI_MARCAR,
    PRIVILEGIOS.ASI_ADMINISTRAR,
    PRIVILEGIOS.ASI_REPORTES,
    PRIVILEGIOS.ALL_ACCESS,
  ),
  asistenciasController.getAttendanceContext,
);

router.get(
  "/empleados",
  verificarPrivilegios(PRIVILEGIOS.ASI_MARCAR, PRIVILEGIOS.ASI_ADMINISTRAR, PRIVILEGIOS.ALL_ACCESS),
  asistenciasController.getEmployeesForAttendance,
);

router.get(
  "/dia",
  verificarPrivilegios(PRIVILEGIOS.ASI_MARCAR, PRIVILEGIOS.ASI_ADMINISTRAR, PRIVILEGIOS.ALL_ACCESS),
  asistenciasController.getAttendanceDay,
);

router.post(
  "/marcar",
  verificarPrivilegios(PRIVILEGIOS.ASI_MARCAR, PRIVILEGIOS.ASI_ADMINISTRAR, PRIVILEGIOS.ALL_ACCESS),
  asistenciasController.markAttendance,
);

router.get(
  "/reportes",
  verificarPrivilegios(PRIVILEGIOS.ASI_REPORTES, PRIVILEGIOS.ALL_ACCESS),
  asistenciasController.getAttendanceReports,
);

router.get(
  "/reportes/:idUsuario/registros",
  verificarPrivilegios(PRIVILEGIOS.ASI_REPORTES, PRIVILEGIOS.ALL_ACCESS),
  asistenciasController.getUserAttendanceRecords,
);

router.put(
  "/:idAsistencia",
  verificarPrivilegios(PRIVILEGIOS.ASI_REPORTES, PRIVILEGIOS.ASI_ADMINISTRAR, PRIVILEGIOS.ALL_ACCESS),
  asistenciasController.updateAttendance,
);

module.exports = router;
