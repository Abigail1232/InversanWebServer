const disenosService = require("../Services/DisenosService");
const asyncHandler = require("../utils/asyncHandler");

const getDisenos = asyncHandler(async (req, res, next) => {
  const result = await disenosService.getDisenos(req.query);
  res.status(200).json({ success: true, ...result });
});

const getDisenoById = asyncHandler(async (req, res, next) => {
  const data = await disenosService.getDisenoById(req.params.id);
  res.status(200).json({ success: true, data });
});

const getProductosPorDiseno = asyncHandler(async (req, res, next) => {
  const result = await disenosService.getProductosPorDiseno(req.params.id, req.query);
  res.status(200).json({ success: true, ...result });
});

const createDiseno = asyncHandler(async (req, res, next) => {
  const dataToCreate = { ...req.body, filename: req.file?.filename };
  const nuevoDiseno = await disenosService.createDiseno(dataToCreate);
  res.status(201).json({
    success: true,
    message: "Diseño creado correctamente",
    data: nuevoDiseno,
    diseno: nuevoDiseno,
  });
});

const updateDiseno = asyncHandler(async (req, res, next) => {
  const dataToUpdate = { ...req.body, filename: req.file?.filename };
  const data = await disenosService.updateDiseno(req.params.id, dataToUpdate);
  res.status(200).json({ success: true, message: "Diseño actualizado correctamente", data });
});

const toggleActiveDiseno = asyncHandler(async (req, res, next) => {
  const data = await disenosService.toggleActiveDiseno(req.params.id);
  res.status(200).json({ success: true, message: "Estado del diseño actualizado correctamente", data });
});

module.exports = {
  getDisenos,
  getDisenoById,
  getProductosPorDiseno,
  createDiseno,
  updateDiseno,
  toggleActiveDiseno,
};