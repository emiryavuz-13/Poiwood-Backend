const svc = require('./cart.service');
const productSvc = require('../products/products.service');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');

exports.getCart = asyncHandler(async (req, res) => {
  const data = await svc.getCart(req.user.id);
  res.json({ success: true, data });
});

exports.addItem = asyncHandler(async (req, res) => {
  const { product_id, quantity = 1, selected_width_cm, selected_height_cm } = req.body;
  if (!product_id) throw ApiError.badRequest('product_id gerekli');
  const qty = parseInt(quantity);
  if (!qty || qty < 1 || qty > 100) throw ApiError.badRequest('Geçersiz miktar (1-100 arası olmalı)');

  const product = await productSvc.getById(product_id);
  if (!product || !product.is_active) throw ApiError.notFound('Ürün bulunamadı');

  let unit_price;
  try {
    unit_price = await productSvc.computePrice(
      product,
      selected_width_cm ? parseFloat(selected_width_cm) : null,
      selected_height_cm ? parseFloat(selected_height_cm) : null
    );
  } catch (err) {
    throw ApiError.badRequest(err.message);
  }

  const data = await svc.addItem(req.user.id, {
    product_id, quantity: qty, selected_width_cm, selected_height_cm, unit_price,
  });
  res.status(201).json({ success: true, data });
});

exports.updateItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  if (!quantity || quantity < 1) throw ApiError.badRequest('Geçersiz miktar');
  const data = await svc.updateItem(req.user.id, req.params.itemId, quantity);
  if (!data) throw ApiError.notFound('Sepet kalemi bulunamadı');
  res.json({ success: true, data });
});

exports.removeItem = asyncHandler(async (req, res) => {
  const data = await svc.removeItem(req.user.id, req.params.itemId);
  if (!data) throw ApiError.notFound('Sepet kalemi bulunamadı');
  res.json({ success: true, message: 'Ürün sepetten çıkarıldı' });
});

exports.clearCart = asyncHandler(async (req, res) => {
  await svc.clearCart(req.user.id);
  res.json({ success: true, message: 'Sepet temizlendi' });
});
