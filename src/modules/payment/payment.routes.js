const express = require('express');
const router = express.Router();
const authenticate = require('../../middleware/authenticate');
const ctrl = require('./payment.controller');

// Ödeme başlatma (kullanıcı auth gerekli)
router.post('/initiate', authenticate, ctrl.initiatePayment);

// PayTR callback (auth YOK — PayTR sunucusu çağırır)
router.post('/callback', ctrl.paytrCallback);

module.exports = router;
