const prisma = require("../config/database");

const getMunicipios = async (req, res) => {
  try {
    const municipios = await prisma.municipio.findMany({
      include: {
        departamento: true,
      },
    });

    res.json(municipios);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error al obtener municipios",
    });
  }
};

const getMunicipiosByDepartments = async (req, res) => {
  const { id } = req.params;
  try {
    const municipios = await prisma.municipio.findMany({
      where: {
        id_departamento: parseInt(id),
      },
    });
    res.json(municipios);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error al obtener municipios",
    });
  }
};

const getDepartments = async (req, res) => {
  const { id } = req.params;
  try {
    const departamentos = await prisma.departamento.findMany();
    res.json(departamentos);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error al obtener municipios",
    });
  }
};

module.exports = {
  getMunicipios,
  getMunicipiosByDepartments,
  getDepartments,
};
