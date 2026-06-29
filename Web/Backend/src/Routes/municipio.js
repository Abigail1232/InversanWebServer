const express = require("express");
const router = express.Router();
const verificarToken = require("../middleware/verificarToken");
const verificarPrivilegios = require("../middleware/verificarPrivilegios");
const { PRIVILEGIOS } = require("../config/privileges");
const municipioController = require("../Controllers/municipio");

// Lectura pública
router.get("/", municipioController.getAllMunicipios);
router.get("/nombre/:nombre", municipioController.getMunicipioByName);
router.get("/id_dept/:id_dept", municipioController.getAllMunicipiosPyDeptID);
router.get("/id/:id", municipioController.getMunicipioByID);

// Crear municipio — requiere ADM_SUCURSALES (forma parte de la admin de zonas)
router.post(
  "/",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.ADM_SUCURSALES),
  municipioController.createMunicipio
);

// Departamentos
router.get("/departamento/", municipioController.getAllDepartamentos);
router.get(
  "/departamento/nombre/:nombre",
  municipioController.getDepartamentoByName
);
router.get("/departamento/id/:id", municipioController.getDepartamentoByID);
router.post(
  "/departamento/",
  verificarToken,
  verificarPrivilegios(PRIVILEGIOS.ADM_SUCURSALES),
  municipioController.createDepartamento
);

module.exports = router;
