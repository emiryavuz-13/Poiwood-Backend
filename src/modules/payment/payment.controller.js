const paymentSvc = require('./payment.service');
const orderSvc = require('../orders/orders.service');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');

exports.initiatePayment = asyncHandler(async (req, res) => {
  const { order_id } = req.body;
  if (!order_id) throw ApiError.badRequest('order_id gerekli');

  // Sipariş ownership kontrolü
  const order = await orderSvc.getOrderDetail(order_id, req.user.id);

  if (order.status !== 'pending')
    throw ApiError.badRequest('Bu sipariş için ödeme başlatılamaz');

  // merchant_oid olarak order_number kullan
  await orderSvc.setMerchantOid(order.id, order.order_number);

  // Client IP
  const userIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || '127.0.0.1';

  // PayTR token al
  const token = await paymentSvc.generatePaytrToken(order, order.items, req.user, userIp);

  res.json({ success: true, data: { token } });
});

// PayTR callback — asyncHandler kullanılMAZ (plain text "OK" döndürmeli)
exports.paytrCallback = async (req, res) => {
  try {
    const { merchant_oid, status, total_amount, hash } = req.body;

    // Hash doğrulama
    const isValid = paymentSvc.verifyCallbackHash(merchant_oid, status, total_amount, hash);
    if (!isValid) {
      console.error('PayTR callback hash doğrulaması başarısız:', merchant_oid);
      return res.status(400).send('HASH_MISMATCH');
    }

    // Tutar doğrulama: callback'teki tutar DB'deki sipariş tutarıyla eşleşmeli
    const order = await orderSvc.getOrderByMerchantOid(merchant_oid);
    if (!order) {
      console.error('PayTR callback: sipariş bulunamadı:', merchant_oid);
      return res.status(400).send('ORDER_NOT_FOUND');
    }
    const expectedAmount = Math.round(parseFloat(order.total_amount) * 100); // PayTR kuruş cinsinden gönderir
    if (parseInt(total_amount) !== expectedAmount) {
      console.error(`PayTR tutar uyuşmazlığı: beklenen=${expectedAmount}, gelen=${total_amount}`);
      return res.status(400).send('AMOUNT_MISMATCH');
    }

    // Ödeme başarılıysa sipariş durumunu güncelle
    if (status === 'success') {
      await orderSvc.updateOrderPayment(merchant_oid, 'paid');
    }
    // 'failed' durumunda sipariş 'pending' kalır, kullanıcı tekrar deneyebilir

    res.status(200).send('OK');
  } catch (err) {
    console.error('PayTR callback hatası:', err);
    res.status(200).send('OK'); // PayTR'nin sonsuz retry yapmasını önle
  }
};
