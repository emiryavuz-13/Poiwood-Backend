const svc = require('./orders.service');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');

// Üye siparişi (sepet DB'den)
exports.createOrder = asyncHandler(async (req, res) => {
  const { address_id, shipping_name, shipping_phone, shipping_address, shipping_city, shipping_district, shipping_apartment, customer_note, coupon_code } = req.body;

  if (!address_id && (!shipping_name || !shipping_phone || !shipping_address || !shipping_city))
    throw ApiError.badRequest('Teslimat bilgileri eksik');

  const data = await svc.createOrder(req.user.id, {
    address_id, shipping_name, shipping_phone, shipping_address,
    shipping_city, shipping_district, shipping_apartment, customer_note, coupon_code
  });
  res.status(201).json({ success: true, data });
});

// Misafir siparişi (sepet body'den)
exports.createGuestOrder = asyncHandler(async (req, res) => {
  const {
    guest_email, guest_name, guest_phone,
    shipping_name, shipping_phone, shipping_address,
    shipping_city, shipping_district, shipping_apartment,
    customer_note, coupon_code, cart_items
  } = req.body;

  if (!guest_email || !guest_name)
    throw ApiError.badRequest('İletişim bilgileri eksik');
  if (!shipping_name || !shipping_phone || !shipping_address || !shipping_city)
    throw ApiError.badRequest('Teslimat bilgileri eksik');
  if (!cart_items || cart_items.length === 0)
    throw ApiError.badRequest('Sepetiniz boş');

  const data = await svc.createGuestOrder({
    guest_email: guest_email.toLowerCase(),
    guest_name, guest_phone,
    shipping_name, shipping_phone, shipping_address,
    shipping_city, shipping_district, shipping_apartment,
    customer_note, coupon_code, cart_items
  });
  res.status(201).json({ success: true, data });
});

// Misafir sipariş takibi
exports.trackGuestOrder = asyncHandler(async (req, res) => {
  const { order_number, email } = req.query;
  if (!order_number)
    throw ApiError.badRequest('Sipariş numarası gerekli');
  if (!email)
    throw ApiError.badRequest('E-posta adresi gerekli');

  const data = await svc.getOrderByNumber(order_number, email.toLowerCase().trim());
  res.json({ success: true, data });
});

exports.getMyOrders = asyncHandler(async (req, res) => {
  const data = await svc.getOrdersByUser(req.user.id);
  res.json({ success: true, data });
});

exports.getMyOrderDetail = asyncHandler(async (req, res) => {
  const data = await svc.getOrderDetail(req.params.id, req.user.id);
  res.json({ success: true, data });
});

exports.getAllOrders = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const data = await svc.getAllOrders({ status, page, limit });
  res.json({ success: true, data });
});

exports.getOrderDetail = asyncHandler(async (req, res) => {
  const data = await svc.getOrderDetail(req.params.id, null);
  res.json({ success: true, data });
});

exports.updateStatus = asyncHandler(async (req, res) => {
  const { status, admin_note } = req.body;
  const validStatuses = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
  if (!status || !validStatuses.includes(status))
    throw ApiError.badRequest('Geçersiz sipariş durumu');

  const data = await svc.updateOrderStatus(req.params.id, status, admin_note);
  res.json({ success: true, data });
});

exports.addTracking = asyncHandler(async (req, res) => {
  const { cargo_company, cargo_tracking_no } = req.body;
  if (!cargo_company || !cargo_tracking_no)
    throw ApiError.badRequest('Kargo bilgileri eksik');

  const data = await svc.addTracking(req.params.id, { cargo_company, cargo_tracking_no });
  res.json({ success: true, data });
});
