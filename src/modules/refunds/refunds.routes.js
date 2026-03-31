const express = require('express');
const router = express.Router();
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const ctrl = require('./refunds.controller');

router.use(authenticate);

// Kullanıcı işlemleri
router.post('/', ctrl.createRefund);
router.get('/my', ctrl.getMyRefunds);

// Admin işlemleri
router.get('/admin', authorize('admin'), ctrl.getAllRefunds);
router.patch('/admin/:id/process', authorize('admin'), ctrl.processRefund);

module.exports = router;