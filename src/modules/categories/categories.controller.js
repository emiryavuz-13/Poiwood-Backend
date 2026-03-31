const svc = require('./categories.service');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');

exports.getTree = asyncHandler(async (req, res) => {
  const tree = await svc.getTree();
  res.json({ success: true, data: tree });
});

exports.getAll = asyncHandler(async (req, res) => {
  const data = await svc.getAll();
  res.json({ success: true, data });
});

exports.getBySlug = asyncHandler(async (req, res) => {
  const data = await svc.getBySlug(req.params.slug);
  if (!data) throw ApiError.notFound('Kategori bulunamadı');
  res.json({ success: true, data });
});

exports.create = asyncHandler(async (req, res) => {
  const data = await svc.create(req.body);
  res.status(201).json({ success: true, data });
});

exports.update = asyncHandler(async (req, res) => {
  const data = await svc.update(req.params.id, req.body);
  if (!data) throw ApiError.notFound('Kategori bulunamadı');
  res.json({ success: true, data });
});

exports.remove = asyncHandler(async (req, res) => {
  const data = await svc.remove(req.params.id);
  if (!data) throw ApiError.notFound('Kategori bulunamadı');
  res.json({ success: true, message: 'Kategori silindi' });
});
