const asyncHandler = require("../utils/asyncHandler");
const seoPublicService = require("../Services/SeoPublicService").createSeoPublicService();

const CACHE_CONTROL = "public, max-age=60, stale-while-revalidate=300";

const obtenerProductosPorMedida = asyncHandler(async (req, res) => {
  const data = await seoPublicService.getProductsBySize({
    width: req.query.width,
    profile: req.query.profile,
    rim: req.query.rim,
    page: req.query.page,
    pageSize: req.query.pageSize,
  });
  res.set("Cache-Control", CACHE_CONTROL).status(200).json(data);
});

const obtenerProductosPorVehiculo = asyncHandler(async (req, res) => {
  const data = await seoPublicService.getVehicleProducts({
    brand: req.query.brand,
    model: req.query.model,
    year: req.query.year,
    version: req.query.version,
    page: req.query.page,
    pageSize: req.query.pageSize,
  });
  res.set("Cache-Control", CACHE_CONTROL).status(200).json(data);
});

const obtenerCatalogoPublico = asyncHandler(async (_req, res) => {
  const data = await seoPublicService.getCatalog();
  res.set("Cache-Control", CACHE_CONTROL).status(200).json(data);
});

const obtenerSucursalesPublicas = asyncHandler(async (_req, res) => {
  const data = await seoPublicService.getBusinessLocations();
  res.set("Cache-Control", CACHE_CONTROL).status(200).json(data);
});

module.exports = {
  obtenerCatalogoPublico,
  obtenerProductosPorMedida,
  obtenerProductosPorVehiculo,
  obtenerSucursalesPublicas,
};
