/**
 * Envuelve controladores async para capturar errores y pasarlos al middleware
 * de manejo de errores de Express.
 *
 * @param {Function} fn - Controlador async que recibe (req, res, next)
 * @returns {Function} Función middleware con manejo de errores.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
