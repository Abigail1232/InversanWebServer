const express = require("express");
const router = express.Router();

const { getMunicipios, getMunicipiosByDepartments, getDepartments } = require("../Controllers/departments");

router.get("/municipalities", getMunicipios);
router.get("/", getDepartments);
router.get("/:id/municipalities", getMunicipiosByDepartments);

module.exports = router;
