class AppError extends Error {
  constructor(message, statusCode = 500, campos = null) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.campos = campos;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
