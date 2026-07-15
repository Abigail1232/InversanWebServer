const asyncHandler = require("../utils/asyncHandler");
const prisma = require("../config/database");
const categoriasService = require("../Services/CategoriasService");
const marcasService = require("../Services/MarcasService");
const promocionesService = require("../Services/PromocionesService");
const productsAdminService = require("../Services/ProductsAdminService");
const productsClientService = require("../Services/ProductsClientService");
const llantasService = require("../Services/LlantasService");

// ----- RUTAS DE PRODUCTOS PARA ADMIN ----- //
const fs = require("fs");
const path = require("path");

const crearProducto = asyncHandler(async (req, res, next) => {
  const modelo3dPathsArray = Array.isArray(req.body.modelo_3d_paths) ? req.body.modelo_3d_paths : (req.body.modelo_3d_paths ? [req.body.modelo_3d_paths] : []);
  const producto = await productsAdminService.crearProducto(req.body, req.files || {}, modelo3dPathsArray);
  res.status(201).json({ mensaje: "Producto creado exitosamente", producto });
});

const obtenerProductoPorId = asyncHandler(async (req, res, next) => {
  const data = await productsClientService.obtenerProductoPorId(req.params.id, req.query);
  res.status(200).json(data);
});

const actualizarProducto = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const modelo3dPathsArray = Array.isArray(req.body.modelo_3d_paths) ? req.body.modelo_3d_paths : (req.body.modelo_3d_paths ? [req.body.modelo_3d_paths] : []);
  const producto = await productsAdminService.actualizarProducto(id, req.body, req.files || {}, modelo3dPathsArray);
  res.status(200).json({ mensaje: "Producto actualizado exitosamente", producto });
});

const cambiarEstadoProducto = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { activo } = req.query;
  const productoActualizado = await productsAdminService.cambiarEstadoProducto(id, activo);
  res.status(200).json({ success: true, mensaje: "Estado del producto cambiado exitosamente", producto: productoActualizado });
});

const obtenerProductosParaAdminProductos = asyncHandler(async (req, res, next) => {
  const result = await productsAdminService.obtenerProductosParaAdminProductos(req.query.page, req.query.pageSize, req.query);
  res.status(200).json({ success: true, data: result.productos, pagination: result.pagination });
});

const detalleProducto = asyncHandler(async (req, res, next) => {
  const data = await productsClientService.detalleProducto(req.params.id);
  res.status(200).json(data);
});

// ----- RUTAS DE PRODUCTOS PARA CLIENTES ----- //

const buscarProductos = asyncHandler(async (req, res, next) => {
  const data = await productsClientService.buscarProductos(req.query);
  res.status(200).json(data);
});

const obtenerDetallePromocionProductos = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { id_sucursal, page = 1, pageSize = 8 } = req.query;
  const respuesta = await promocionesService.obtenerDetallePromocionProductos(
    id,
    id_sucursal,
    page,
    pageSize
  );
  res.status(200).json(respuesta);
});

const obtenerCategorias = asyncHandler(async (req, res, next) => {
  const categorias = await categoriasService.obtenerCategoriasFiltro();
  res.status(200).json({ success: true, data: categorias, total: categorias.length });
});

const obtenerCategoriasAdmin = asyncHandler(async (req, res, next) => {
  const categorias = await categoriasService.obtenerCategoriasAdmin();
  res.status(200).json({ success: true, data: categorias, total: categorias.length });
});

const obtenerMarcas = asyncHandler(async (req, res, next) => {
  const data = await marcasService.obtenerMarcasFiltro();
  res.status(200).json({ success: true, data, total: data.length });
});

const obtenerProductosPorMarca = asyncHandler(async (req, res, next) => {
  const data = await productsClientService.obtenerProductosPorMarca(req.query);
  res.status(200).json(data);
});

const obtenerProductos = asyncHandler(async (req, res, next) => {
  const data = await productsClientService.obtenerProductos(req.query);
  res.status(200).json(data);
});

const obtenerAniosPorMarca = asyncHandler(async (req, res, next) => {
  const anios = await marcasService.obtenerAniosPorMarca(req.query.marca);
  res.status(200).json({ success: true, data: anios, total: anios.length });
});

const obtenerModelosPorMarcaYAnio = asyncHandler(async (req, res, next) => {
  const { marca, anio } = req.query;
  const modelos = await marcasService.obtenerModelosPorMarcaYAnio(marca, anio);
  res.status(200).json({ success: true, data: modelos, total: modelos.length });
});

const obtenerVersionesPorMarcaYModelo = asyncHandler(async (req, res, next) => {
  const { marca, anio, modelo } = req.query;
  const versiones = await marcasService.obtenerVersionesPorMarcaYModelo(marca, anio, modelo);
  res.status(200).json({ success: true, data: versiones, total: versiones.length });
});

const obtenerNombreMarcas = asyncHandler(async (req, res, next) => {
  const modelos = await marcasService.obtenerNombreMarcas();
  res.status(200).json({ success: true, data: modelos, total: modelos.length });
});

const obtenerRines = asyncHandler(async (req, res, next) => {
  const data = await llantasService.obtenerRines(req.query.id_categoria, req.query.numero_rin);
  res.status(200).json({ success: true, data, total: data.length });
});

const obtenerFiltrosLlantas = asyncHandler(async (req, res, next) => {
  const data = await llantasService.obtenerFiltrosLlantas(req.query);
  res.status(200).json({ success: true, ...data });
});

const obtenerEspecificacionesExistentes = asyncHandler(async (req, res, next) => {
  const data = await llantasService.obtenerEspecificacionesExistentes();
  res.status(200).json({ success: true, data });
});

const obtenerEspecificacionesRin = asyncHandler(async (req, res, next) => {
  const data = await llantasService.obtenerEspecificacionesRin(req.params.rin);
  res.status(200).json({ success: true, ...data });
});

const obtenerModelosPorMarca = asyncHandler(async (req, res, next) => {
  const { id_marca } = req.query;
  const modelos = await marcasService.obtenerModelosPorMarca(id_marca);
  res.status(200).json({ success: true, data: modelos, total: modelos.length });
});

const obtenerProductosRelacionados = asyncHandler(async (req, res, next) => {
  const data = await productsClientService.obtenerProductosRelacionados(req.params.id, req.query);
  res.status(200).json(data);
});

const obtenerPromociones = asyncHandler(async (req, res, next) => {
  const promociones = await promocionesService.obtenerPromociones();
  res.status(200).json(promociones);
});

const crearCategoria = asyncHandler(async (req, res, next) => {
  const adminId = req.user.id_usuario;
  const filename = req.file ? req.file.filename : null;
  const response = await categoriasService.crearCategoria(req.body, filename, adminId);
  res.status(201).json(response);
});

const modificarCategoria = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const filename = req.file ? req.file.filename : null;
  const response = await categoriasService.modificarCategoria(id, req.body, filename);
  res.status(200).json(response);
});

const eliminar_categoria = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const response = await categoriasService.eliminarCategoria(id);
  res.status(200).json(response);
});

const obtenerTodosModelos = asyncHandler(async (req, res, next) => {
  const modelos = await marcasService.obtenerTodosModelos();
  res.status(200).json({ success: true, data: modelos, total: modelos.length });
});

const actualizarConfigVisualizacion = asyncHandler(async (req, res, next) => {
  const { id_promocion } = req.params;
  const { mostrar_precio_porcentaje, mostrar_precio_tachado } = req.body;
  const result = await promocionesService.actualizarConfigVisualizacion(id_promocion, {
    mostrar_precio_porcentaje,
    mostrar_precio_tachado,
  });
  res.status(200).json(result);
});

module.exports = {
  crearProducto,
  obtenerProductoPorId,
  actualizarProducto,
  cambiarEstadoProducto,
  obtenerProductosParaAdminProductos,
  detalleProducto,
  buscarProductos,
  obtenerDetallePromocionProductos,
  obtenerCategorias,
  obtenerCategoriasAdmin,
  obtenerMarcas,
  obtenerProductosPorMarca,
  obtenerProductos,
  obtenerAniosPorMarca,
  obtenerModelosPorMarcaYAnio,
  obtenerVersionesPorMarcaYModelo,
  obtenerNombreMarcas,
  obtenerRines,
  obtenerFiltrosLlantas,
  obtenerEspecificacionesRin,
  obtenerEspecificacionesExistentes,
  obtenerModelosPorMarca,
  obtenerProductosRelacionados,
  obtenerPromociones,
  crearCategoria,
  modificarCategoria,
  eliminar_categoria,
  obtenerTodosModelos,
  actualizarConfigVisualizacion
};
