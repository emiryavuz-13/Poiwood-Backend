const Joi = require('joi');

const calculatePrice = Joi.object({
  width: Joi.number().positive().required(),
  height: Joi.number().positive().required(),
});

const createProduct = Joi.object({
  category_id: Joi.string().uuid().required(),
  name: Joi.string().required(),
  slug: Joi.string().required(),
  description: Joi.string().optional().allow('', null),
  pricing_type: Joi.string().valid('fixed', 'per_cm2', 'formula').default('fixed'),
  base_price: Joi.number().min(0).optional().allow(null),
  price_per_cm2: Joi.number().min(0).optional().allow(null),
  formula_json: Joi.object().optional().allow(null),
  min_width_cm: Joi.number().min(0).optional().allow(null),
  max_width_cm: Joi.number().min(0).optional().allow(null),
  min_height_cm: Joi.number().min(0).optional().allow(null),
  max_height_cm: Joi.number().min(0).optional().allow(null),
  stock_quantity: Joi.number().integer().min(0).default(0),
  is_featured: Joi.boolean().default(false),
  is_weekly_pick: Joi.boolean().default(false),
  is_active: Joi.boolean().default(true),
  discount_type: Joi.string().valid('percentage', 'fixed').optional().allow(null),
  discount_value: Joi.number().min(0).optional().allow(null),
});

const updateProduct = createProduct.fork(
  ['category_id', 'name', 'slug'],
  (schema) => schema.optional()
);

const updateStock = Joi.object({
  stock_quantity: Joi.number().integer().min(0).required(),
});

const addImage = Joi.object({
  firebase_url: Joi.string().uri().required(),
  storage_path: Joi.string().required(),
  display_order: Joi.number().integer().default(0),
  is_primary: Joi.boolean().default(false),
  thumbnail_url: Joi.string().uri().optional().allow(null),
});

module.exports = {
  calculatePrice,
  createProduct,
  updateProduct,
  updateStock,
  addImage,
};
