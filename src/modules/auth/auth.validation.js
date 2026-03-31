const Joi = require('joi');

const updateProfile = Joi.object({
  display_name: Joi.string().min(2).max(50).optional().messages({
    'string.min': 'İsim en az 2 karakter olmalıdır',
    'string.max': 'İsim en fazla 50 karakter olmalıdır',
  }),
  phone: Joi.string()
    .pattern(/^[0-9+\-\s()]+$/)
    .optional()
    .messages({
      'string.pattern.base': 'Geçerli bir telefon numarası giriniz',
    }),
});

const setAdmin = Joi.object({
  firebase_uid: Joi.string().required().messages({
    'any.required': 'Firebase UID zorunludur',
    'string.empty': 'Firebase UID boş bırakılamaz'
  }),
});

module.exports = {
  updateProfile,
  setAdmin,
};
