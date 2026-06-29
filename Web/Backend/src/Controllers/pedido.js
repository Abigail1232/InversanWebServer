const asyncHandler = require("../utils/asyncHandler");
const pedidosClientService = require("../Services/PedidosClientService");
const pedidosAdminService = require("../Services/PedidosAdminService");
const entregasService = require("../Services/EntregasService");

const realizarCompra = asyncHandler(async (req, res, next) => {
  const data = await pedidosClientService.realizarCompra(req.body, req.files || req.file, { ...req.params, ...req.query }, req.user);
  res.status(200).json(data);
});

const obtenerMisPedidosPendientes = asyncHandler(async (req, res, next) => {
  const data = await pedidosClientService.obtenerMisPedidosPendientes(req.body, req.files || req.file, { ...req.params, ...req.query }, req.user);
  res.status(200).json(data);
});

const obtenerMisPedidosFinalizados = asyncHandler(async (req, res, next) => {
  const data = await pedidosClientService.obtenerMisPedidosFinalizados(req.body, req.files || req.file, { ...req.params, ...req.query }, req.user);
  res.status(200).json(data);
});

const obtenerDetallePedido = asyncHandler(async (req, res, next) => {
  const data = await pedidosClientService.obtenerDetallePedido(req.body, req.files || req.file, { ...req.params, ...req.query }, req.user);
  res.status(200).json(data);
});

const obtenerResumenPedidosPorUsuario = asyncHandler(async (req, res, next) => {
  const data = await pedidosClientService.obtenerResumenPedidosPorUsuario(req.body, req.files || req.file, { ...req.params, ...req.query }, req.user);
  res.status(200).json(data);
});

const obtenerPedidoDeUsuario = asyncHandler(async (req, res, next) => {
  const data = await pedidosClientService.obtenerPedidoDeUsuario(req.body, req.files || req.file, { ...req.params, ...req.query }, req.user);
  res.status(200).json(data);
});

const subirComprobanteCompra = asyncHandler(async (req, res, next) => {
  const data = await pedidosClientService.subirComprobanteCompra(req.body, req.files || req.file, { ...req.params, ...req.query }, req.user);
  res.status(200).json(data);
});

const buscarPedidosConFiltros = asyncHandler(async (req, res, next) => {
  const data = await pedidosAdminService.buscarPedidosConFiltros(req.body, req.files || req.file, { ...req.params, ...req.query }, req.user);
  res.status(200).json(data);
});

const asignarPedidoARepartidor = asyncHandler(async (req, res, next) => {
  const data = await pedidosAdminService.asignarPedidoARepartidor(req.body, req.files || req.file, { ...req.params, ...req.query }, req.user);
  res.status(200).json(data);
});

const actualizarEstadoPedido = asyncHandler(async (req, res, next) => {
  const data = await entregasService.actualizarEstadoPedido(req.body, req.files || req.file, { ...req.params, ...req.query }, req.user);
  res.status(200).json(data);
});

const obtenerPedidosEntregasRepartidor = asyncHandler(async (req, res, next) => {
  const data = await entregasService.obtenerPedidosEntregasRepartidor(req.body, req.files || req.file, { ...req.params, ...req.query }, req.user);
  res.status(200).json(data);
});

const obtenerDetallePedidoEntrega = asyncHandler(async (req, res, next) => {
  const data = await entregasService.obtenerDetallePedidoEntrega(req.body, req.files || req.file, { ...req.params, ...req.query }, req.user);
  res.status(200).json(data);
});

const efectuarEntrega = asyncHandler(async (req, res, next) => {
  const data = await entregasService.efectuarEntrega(req.body, req.files || req.file, { ...req.params, ...req.query }, req.user);
  res.status(200).json(data);
});

const rechazarPedido = asyncHandler(async (req, res, next) => {
  const data = await entregasService.rechazarPedido(req.body, req.files || req.file, { ...req.params, ...req.query }, req.user);
  res.status(200).json(data);
});

const obtenerEntregasRealizadas = asyncHandler(async (req, res, next) => {
  const data = await entregasService.obtenerEntregasRealizadas(req.body, req.files || req.file, { ...req.params, ...req.query }, req.user);
  res.status(200).json(data);
});

const obtenerEntregasRealizadasFiltradas = asyncHandler(async (req, res, next) => {
  const data = await entregasService.obtenerEntregasRealizadasFiltradas(req.body, req.files || req.file, { ...req.params, ...req.query }, req.user);
  res.status(200).json(data);
});

const obtenerPedidoPublico = asyncHandler(async (req, res, next) => {
  const data = await pedidosClientService.obtenerPedidoPublico(req.body, req.files || req.file, { ...req.params, ...req.query }, req.user);
  res.status(200).json(data);
});

const verificarUsuarioPedido = asyncHandler(async (req, res, next) => {
  const data = await pedidosClientService.verificarUsuarioPedido(req.body, req.files || req.file, { ...req.params, ...req.query }, req.user);
  res.status(200).json(data);
});

const validateReorder = asyncHandler(async (req, res, next) => {
  const data = await pedidosClientService.validateReorder(req.body, req.files || req.file, { ...req.params, ...req.query }, req.user);
  res.status(200).json(data);
});

const actualizarEstadoPedidoAdmin = asyncHandler(async (req, res, next) => {
  const data = await pedidosAdminService.actualizarEstadoPedidoAdmin(req.body, req.files || req.file, { ...req.params, ...req.query }, req.user);
  res.status(200).json(data);
});

module.exports = {
  realizarCompra,
  obtenerMisPedidosPendientes,
  obtenerMisPedidosFinalizados,
  obtenerDetallePedido,
  obtenerResumenPedidosPorUsuario,
  obtenerPedidoDeUsuario,
  subirComprobanteCompra,
  buscarPedidosConFiltros,
  asignarPedidoARepartidor,
  actualizarEstadoPedido,
  obtenerPedidosEntregasRepartidor,
  obtenerDetallePedidoEntrega,
  efectuarEntrega,
  rechazarPedido,
  obtenerEntregasRealizadas,
  obtenerEntregasRealizadasFiltradas,
  obtenerPedidoPublico,
  verificarUsuarioPedido,
  validateReorder,
  actualizarEstadoPedidoAdmin
};
