const svc = require('./refunds.service');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');

// -- Kullanıcı --
exports.createRefund = asyncHandler(async (req, res) => {
  const { order_id, reason } = req.body;

  if (!order_id || !reason) throw ApiError.badRequest('Sipariş numarası ve iade nedeni zorunludur');

  const data = await svc.createRefundRequest(req.user.id, order_id, reason);
  res.status(201).json({ success: true, data });
});

exports.getMyRefunds = asyncHandler(async (req, res) => {
  const data = await svc.getMyRefundRequests(req.user.id);
  res.json({ success: true, data });
});

// -- Admin --
exports.getAllRefunds = asyncHandler(async (req, res) => {
  const { status, page, limit } = req.query;
  const data = await svc.getAllRefundRequests({
    status, page: parseInt(page) || 1, limit: parseInt(limit) || 20,
  });
  res.json({ success: true, data });
});

exports.processRefund = asyncHandler(async (req, res) => {
  const { action, admin_note } = req.body; // 'approve' veya 'reject'

  if (!action || !['approve', 'reject'].includes(action)) {
    throw ApiError.badRequest("İşlem tipi eksik veya hatalı ('approve' / 'reject')");
  }

  const data = await svc.processRefundRequest(req.params.id, action, admin_note);
  res.json({ success: true, data });
});