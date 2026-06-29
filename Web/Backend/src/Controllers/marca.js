const marcasService = require("../Services/MarcasService");
const asyncHandler = require("../utils/asyncHandler");

const getMarcas = asyncHandler(async (req, res, next) => {
  const marcas = await marcasService.obtenerMarcas(req.query);
  res.status(200).json({
    success: true,
    data: marcas,
    total: marcas.length,
  });
});

const getMarcaById = asyncHandler(async (req, res, next) => {
  const data = await marcasService.getMarcaById(req.params.id);
  res.status(200).json({ success: true, data });
});

const createMarca = asyncHandler(async (req, res, next) => {
  const logo = req.files?.logo?.[0]?.filename || null;
  const banner = req.files?.banner?.[0]?.filename || null;
  const datos = { ...req.body, logo, banner };
  const nuevaMarca = await marcasService.createMarca(datos);
  res.status(201).json({ success: true, marca: nuevaMarca });
});

const updateMarca = asyncHandler(async (req, res, next) => {
  const logo = req.files?.logo?.[0]?.filename;
  const banner = req.files?.banner?.[0]?.filename;
  const datos = { ...req.body, logo, banner };
  const marcaActualizada = await marcasService.updateMarca(req.params.id, datos);
  res.status(200).json({ success: true, marca: marcaActualizada });
});

const toggleActiveMarca = asyncHandler(async (req, res, next) => {
  const marcaActualizada = await marcasService.toggleActiveMarca(req.params.id);
  res.status(200).json({ success: true, marca: marcaActualizada });
});

const getProductosPorMarca = asyncHandler(async (req, res, next) => {
  const productos = await marcasService.getProductosPorMarca(req.params.id);
  res.status(200).json({
    success: true,
    data: productos,
    total: productos.length,
  });
});

module.exports = {
  getMarcas,
  getMarcaById,
  createMarca,
  updateMarca,
  toggleActiveMarca,
  getProductosPorMarca,
};
