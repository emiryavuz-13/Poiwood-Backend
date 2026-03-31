const svc = require('./questions.service');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');

exports.getByProduct = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const data = await svc.getByProduct(req.params.productId, {
    page: parseInt(page) || 1, limit: parseInt(limit) || 10,
  });
  res.json({ success: true, data });
});

exports.getMyQuestions = asyncHandler(async (req, res) => {
  const data = await svc.getMyQuestions(req.user.id);
  res.json({ success: true, data });
});

exports.create = asyncHandler(async (req, res) => {
  const { product_id, question_text } = req.body;
  if (!product_id || !question_text) throw ApiError.badRequest('product_id ve question_text gerekli');

  const data = await svc.create(req.user.id, { product_id, question_text });
  res.status(201).json({ success: true, data });
});

exports.remove = asyncHandler(async (req, res) => {
  await svc.remove(req.params.id, req.user.id);
  res.json({ success: true, message: 'Soru silindi' });
});

exports.getAllAdmin = asyncHandler(async (req, res) => {
  const { answered, page, limit } = req.query;
  const data = await svc.getAllAdmin({
    answered, page: parseInt(page) || 1, limit: parseInt(limit) || 20,
  });
  res.json({ success: true, data });
});

exports.answer = asyncHandler(async (req, res) => {
  const { answer_text } = req.body;
  if (!answer_text) throw ApiError.badRequest('Cevap metni gerekli');

  const data = await svc.answer(req.params.id, req.user.id, answer_text);
  res.json({ success: true, data });
});

exports.toggleVisibility = asyncHandler(async (req, res) => {
  const data = await svc.toggleVisibility(req.params.id);
  res.json({ success: true, data });
});
