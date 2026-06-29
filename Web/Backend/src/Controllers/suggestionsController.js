const asyncHandler = require("../utils/asyncHandler");
const suggestionsService = require("../Services/SuggestionsService");

const crearSugerencia = asyncHandler(async (req, res, next) => {
  const nuevaSugerencia = await suggestionsService.crearSugerencia(req.body, req.user);
  res.status(201).json(nuevaSugerencia);
});

const obtenerSugerencias = asyncHandler(async (req, res, next) => {
  const sugerencias = await suggestionsService.obtenerSugerencias();
  res.status(200).json(sugerencias);
});

const obtenerSugerenciaPorId = asyncHandler(async (req, res, next) => {
  const sugerencia = await suggestionsService.obtenerSugerenciaPorId(req.params.id);
  res.status(200).json(sugerencia);
});

module.exports = {
  crearSugerencia,
  obtenerSugerencias,
  obtenerSugerenciaPorId
};
