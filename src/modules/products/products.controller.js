const svc = require('./products.service');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');

exports.getAll = asyncHandler(async (req, res) => {
  const data = await svc.getAll(req.query);
  res.json({ success: true, data });
});

exports.getAllAdmin = asyncHandler(async (req, res) => {
  const data = await svc.getAllAdmin(req.query);
  res.json({ success: true, data });
});

exports.getByIdAdmin = asyncHandler(async (req, res) => {
  const data = await svc.getById(req.params.id);
  if (!data) throw ApiError.notFound('Ürün bulunamadı');
  res.json({ success: true, data });
});

exports.getFeatured = asyncHandler(async (req, res) => {
  const data = await svc.getFeatured();
  res.json({ success: true, data });
});

exports.getWeeklyPicks = asyncHandler(async (req, res) => {
  const data = await svc.getWeeklyPicks();
  res.json({ success: true, data });
});

exports.getBySlug = asyncHandler(async (req, res) => {
  const data = await svc.getBySlug(req.params.slug);
  if (!data) throw ApiError.notFound('Ürün bulunamadı');
  res.json({ success: true, data });
});

exports.calculatePrice = asyncHandler(async (req, res) => {
  const product = await svc.getById(req.params.id);
  if (!product) throw ApiError.notFound('Ürün bulunamadı');
  const { width, height } = req.body;
  try {
    const price = await svc.computePrice(product, parseFloat(width), parseFloat(height));
    res.json({ success: true, data: { price } });
  } catch (err) {
    throw ApiError.badRequest(err.message);
  }
});

exports.create = asyncHandler(async (req, res) => {
  const data = await svc.create(req.body);
  res.status(201).json({ success: true, data });
});

exports.update = asyncHandler(async (req, res) => {
  const data = await svc.update(req.params.id, req.body);
  if (!data) throw ApiError.notFound('Ürün bulunamadı');
  res.json({ success: true, data });
});

exports.remove = asyncHandler(async (req, res) => {
  const data = await svc.remove(req.params.id);
  if (!data) throw ApiError.notFound('Ürün bulunamadı');
  res.json({ success: true, message: 'Ürün silindi' });
});

exports.addImage = asyncHandler(async (req, res) => {
  const data = await svc.addImage(req.params.id, req.body);
  res.status(201).json({ success: true, data });
});

exports.setPrimaryImage = asyncHandler(async (req, res) => {
  const data = await svc.setPrimaryImage(req.params.id, req.params.imageId, req.body.thumbnail_url);
  if (!data) throw ApiError.notFound('Fotoğraf bulunamadı');
  res.json({ success: true, data });
});

exports.removeImage = asyncHandler(async (req, res) => {
  const data = await svc.removeImage(req.params.id, req.params.imageId);
  if (!data) throw ApiError.notFound('Fotoğraf bulunamadı');
  res.json({ success: true, data });
});

exports.updateStock = asyncHandler(async (req, res) => {
  const data = await svc.update(req.params.id, { stock_quantity: req.body.stock_quantity });
  if (!data) throw ApiError.notFound('Ürün bulunamadı');
  res.json({ success: true, data });
});
