const crypto = require('crypto');
const paytrConfig = require('../../config/paytr');

async function generatePaytrToken(order, orderItems, user, userIp) {
  const { merchantId, merchantKey, merchantSalt, callbackUrl, testMode } = paytrConfig;

  const merchantOid = order.order_number;
  const email = user.email;
  const paymentAmount = Math.round(parseFloat(order.total_amount) * 100); // TL → kuruş
  const currency = 'TL';
  const noInstallment = '1';
  const maxInstallment = '0';

  // user_basket: [[product_name, unit_price_kurus, quantity], ...]
  const basketItems = orderItems.map(item => [
    item.product_name,
    Math.round(parseFloat(item.unit_price) * 100).toString(),
    item.quantity.toString(),
  ]);
  const userBasket = Buffer.from(JSON.stringify(basketItems)).toString('base64');

  const merchantOkUrl = process.env.PAYTR_SUCCESS_URL || `${process.env.CLIENT_URL}/orders/success`;
  const merchantFailUrl = process.env.PAYTR_FAIL_URL || `${process.env.CLIENT_URL}/orders/fail`;

  // HMAC-SHA256 token
  const hashStr = merchantId + userIp + merchantOid + email + paymentAmount
    + userBasket + noInstallment + maxInstallment + currency + testMode + merchantSalt;
  const paytrToken = crypto.createHmac('sha256', merchantKey).update(hashStr).digest('base64');

  // PayTR API'ye POST
  const params = new URLSearchParams({
    merchant_id: merchantId,
    user_ip: userIp,
    merchant_oid: merchantOid,
    email,
    payment_amount: paymentAmount.toString(),
    paytr_token: paytrToken,
    user_basket: userBasket,
    no_installment: noInstallment,
    max_installment: maxInstallment,
    currency,
    test_mode: testMode,
    merchant_ok_url: merchantOkUrl,
    merchant_fail_url: merchantFailUrl,
    user_name: user.display_name || user.email,
    user_address: order.shipping_address,
    user_phone: order.shipping_phone,
    debug_on: testMode,
    merchant_notify_url: callbackUrl,
  });

  const response = await fetch('https://www.paytr.com/odeme/api/get-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  const result = await response.json();

  if (result.status !== 'success') {
    throw new Error(`PayTR token alınamadı: ${result.reason || 'Bilinmeyen hata'}`);
  }

  return result.token;
}

function verifyCallbackHash(merchantOid, status, totalAmount, incomingHash) {
  const { merchantKey, merchantSalt } = paytrConfig;
  const hashStr = merchantOid + merchantSalt + status + totalAmount;
  const expectedHash = crypto.createHmac('sha256', merchantKey).update(hashStr).digest('base64');
  return expectedHash === incomingHash;
}

module.exports = { generatePaytrToken, verifyCallbackHash };
