class ApiError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }

  static badRequest(message, errors) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = 'Yetkisiz erişim') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Bu işlem için yetkiniz yok') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Kayıt bulunamadı') {
    return new ApiError(404, message);
  }
}

module.exports = ApiError;
