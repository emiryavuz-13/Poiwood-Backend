const ApiError = require('../utils/ApiError');

const validate = (schema) => (req, res, next) => {
  const { value, error } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true, // Şemada olmayan verileri temizler
  });

  if (error) {
    const errorMessages = error.details.map((detail) => detail.message).join(', ');
    return next(ApiError.badRequest(`Validasyon Hatası: ${errorMessages}`));
  }

  // İstek gövdesini doğrulanmış ve temizlenmiş verilerle değiştir
  req.body = value;
  next();
};

const validateParams = (schema) => (req, res, next) => {
  const { value, error } = schema.validate(req.params, { abortEarly: false });
  if (error) {
    return next(ApiError.badRequest('Geçersiz parametreler'));
  }
  req.params = value;
  next();
};

module.exports = { validate, validateParams };
