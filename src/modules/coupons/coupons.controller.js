const svc = require('./coupons.service');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');

// -- Admin Handlers --

exports.createCoupon = asyncHandler(async (req, res) => {
  const { code, discount_type, discount_amount } = req.body;

  if (!code || !discount_type || discount_amount === undefined) {
    throw ApiError.badRequest('Kupon kodu, indirim tipi ve miktarı zorunludur');
  }
  if (!['percentage', 'fixed'].includes(discount_type)) {
    throw ApiError.badRequest('Geçersiz indirim tipi (percentage veya fixed olmalı)');
  }

  const data = await svc.create(req.user.id, req.body);
  res.status(201).json({ success: true, data });
});

exports.getAllCoupons = asyncHandler(async (req, res) => {
  const data = await svc.getAll();
  res.json({ success: true, data });
});

exports.updateCoupon = asyncHandler(async (req, res) => {
  const data = await svc.update(req.params.id, req.body);
  res.json({ success: true, data });
});

exports.deleteCoupon = asyncHandler(async (req, res) => {
  await svc.remove(req.params.id);
  res.json({ success: true, message: 'Kupon başarıyla silindi' });
});

// -- User Handlers --

exports.validateCoupon = asyncHandler(async (req, res) => {
  const { code, cart_total } = req.body;

  if (!code || !cart_total) {
    throw ApiError.badRequest('Kupon kodu ve sepet tutarı zorunludur');
  }

  const data = await svc.validate(code, parseFloat(cart_total));
  res.json({ success: true, data });
});