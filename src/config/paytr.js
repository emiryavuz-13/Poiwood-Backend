module.exports = {
  merchantId: process.env.PAYTR_MERCHANT_ID,
  merchantKey: process.env.PAYTR_MERCHANT_KEY,
  merchantSalt: process.env.PAYTR_MERCHANT_SALT,
  callbackUrl: process.env.PAYTR_CALLBACK_URL,
  testMode: process.env.NODE_ENV !== 'production' ? '1' : '0',
};
