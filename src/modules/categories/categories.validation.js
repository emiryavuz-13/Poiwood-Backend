const Joi = require('joi');

const createCategory = Joi.object({
  name: Joi.string().required(),
  slug: Joi.string().required(),
  parent_id: Joi.string().uuid().allow(null).optional(),
});

const updateCategory = Joi.object({
  name: Joi.string().optional(),
  slug: Joi.string().optional(),
  parent_id: Joi.string().uuid().allow(null).optional(),
});

module.exports = {
  createCategory,
  updateCategory,
};