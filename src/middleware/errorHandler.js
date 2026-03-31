const ApiError = require('../utils/ApiError');

const errorHandler = (err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors.length ? err.errors : undefined,
    });
  }

  // Joi validation errors
  if (err.isJoi) {
    return res.status(400).json({
      success: false,
      message: 'Geçersiz istek verisi',
      errors: err.details.map((d) => d.message),
    });
  }

  console.error(err);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Sunucu hatası' : err.message,
  });
};

module.exports = errorHandler;
