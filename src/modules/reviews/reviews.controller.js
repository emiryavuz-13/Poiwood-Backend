const svc = require('./reviews.service');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');

exports.getByProduct = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const data = await svc.getByProduct(req.params.productId, {
    page: parseInt(page) || 1, limit: parseInt(limit) || 10,
  });
  res.json({ success: true, data });
});

exports.getMyReviews = asyncHandler(async (req, res) => {
  const data = await svc.getByUser(req.user.id);
  res.json({ success: true, data });
});

exports.create = asyncHandler(async (req, res) => {
  const { product_id, order_id, rating, comment } = req.body;
  if (!product_id || !rating) throw ApiError.badRequest('product_id ve rating gerekli');
  if (rating < 1 || rating > 5) throw ApiError.badRequest('Rating 1-5 arasında olmalı');

  const data = await svc.create(req.user.id, { product_id, order_id, rating, comment });
  res.status(201).json({ success: true, data });
});

exports.update = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  if (rating !== undefined && (rating < 1 || rating > 5))
    throw ApiError.badRequest('Rating 1-5 arasında olmalı');

  const data = await svc.update(req.params.id, req.user.id, { rating, comment });
  res.json({ success: true, data });
});

exports.remove = asyncHandler(async (req, res) => {
  await svc.remove(req.params.id, req.user.id);
  res.json({ success: true, message: 'Değerlendirme silindi' });
});

exports.addImage = asyncHandler(async (req, res) => {
  const { firebase_url, storage_path, display_order } = req.body;
  if (!firebase_url || !storage_path) throw ApiError.badRequest('firebase_url ve storage_path gerekli');

  const data = await svc.addImage(req.params.id, req.user.id, { firebase_url, storage_path, display_order });
  res.status(201).json({ success: true, data });
});

exports.removeImage = asyncHandler(async (req, res) => {
  await svc.removeImage(req.params.imageId, req.user.id);
  res.json({ success: true, message: 'Fotoğraf silindi' });
});

exports.getAllAdmin = asyncHandler(async (req, res) => {
  const { is_approved, page, limit } = req.query;
  const data = await svc.getAllAdmin({
    is_approved, page: parseInt(page) || 1, limit: parseInt(limit) || 20,
  });
  res.json({ success: true, data });
});

exports.approve = asyncHandler(async (req, res) => {
  const data = await svc.approve(req.params.id);
  res.json({ success: true, data });
});

exports.adminReply = asyncHandler(async (req, res) => {
  const { reply } = req.body;
  if (!reply) throw ApiError.badRequest('Yanıt metni gerekli');

  const data = await svc.adminReply(req.params.id, reply);
  res.json({ success: true, data });
});
