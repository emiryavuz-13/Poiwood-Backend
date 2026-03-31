const svc = require('./addresses.service');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');

exports.getAll = asyncHandler(async (req, res) => {
  const data = await svc.getByUser(req.user.id);
  res.json({ success: true, data });
});

exports.getById = asyncHandler(async (req, res) => {
  const data = await svc.getById(req.params.id, req.user.id);
  res.json({ success: true, data });
});

exports.create = asyncHandler(async (req, res) => {
  const { title, full_name, phone, address_line, city, district, zip_code, is_default } = req.body;

  if (!title || !full_name || !phone || !address_line || !city)
    throw ApiError.badRequest('Zorunlu adres alanları eksik (title, full_name, phone, address_line, city)');

  const data = await svc.create(req.user.id, {
    title, full_name, phone, address_line, city, district, zip_code, is_default,
  });
  res.status(201).json({ success: true, data });
});

exports.update = asyncHandler(async (req, res) => {
  const data = await svc.update(req.params.id, req.user.id, req.body);
  res.json({ success: true, data });
});

exports.remove = asyncHandler(async (req, res) => {
  await svc.remove(req.params.id, req.user.id);
  res.json({ success: true, message: 'Adres silindi' });
});

exports.setDefault = asyncHandler(async (req, res) => {
  const data = await svc.setDefault(req.params.id, req.user.id);
  res.json({ success: true, data });
});
