/**
 * Manejador global de errores de Express.
 *
 * Detecta errores de Prisma, JWT y errores personalizados de la aplicación,
 * y devuelve respuestas HTTP con mensajes consistentes.
 */
const { Prisma } = require('@prisma/client');
const AppError = require('../utils/AppError');

const globalErrorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Siempre loguear para tener visibilidad en producción.
  // En desarrollo se agrega el stack trace completo.
  console.error(`[${new Date().toISOString()}] ERROR ${req.method} ${req.path}:`, err.message || err);
  if (process.env.NODE_ENV === 'development') {
    console.error('STACK:', err.stack);
  }

  // Manejo de errores conocidos de Prisma
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: 'El registro ya existe (valor duplicado).',
      });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'El registro no fue encontrado.',
      });
    }
  }

  // Soporta errores lanzados con formato { status, message }
  if (err.status && err.message) {
    return res.status(err.status).json({
      success: false,
      error: err.message,
      ...(err.campos && { campos: err.campos }),
    });
  }

  // Manejo de errores operacionales personalizados
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      ...(err.campos && { campos: err.campos }),
    });
  }

  // Manejo de errores de JWT comunes
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Token inválido. Por favor, inicie sesión nuevamente.',
    });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.',
    });
  }

  // Si no se reconoce el error, se responde con un error interno.
  console.error('ERROR NO ESPERADO:', err);
  return res.status(500).json({
    success: false,
    error: 'Ocurrió un error interno en el servidor.',
  });
};

module.exports = globalErrorHandler;
