const svc = require('./favorites.service');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');

exports.getFavorites = asyncHandler(async (req, res) => {
  const data = await svc.getFavorites(req.user.id);
  res.json({ success: true, data });
});

exports.add = asyncHandler(async (req, res) => {
  const data = await svc.add(req.user.id, req.params.productId);
  res.status(201).json({ success: true, data });
});

exports.remove = asyncHandler(async (req, res) => {
  const data = await svc.remove(req.user.id, req.params.productId);
  if (!data) throw ApiError.notFound('Favori bulunamadı');
  res.json({ success: true, message: 'Favorilerden çıkarıldı' });
});

exports.check = asyncHandler(async (req, res) => {
  const isFav = await svc.isFavorite(req.user.id, req.params.productId);
  res.json({ success: true, data: { is_favorite: isFav } });
});
