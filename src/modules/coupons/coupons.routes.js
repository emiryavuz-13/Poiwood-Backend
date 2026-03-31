const express = require('express');
const router = express.Router();
const authorize = require('../../middleware/authorize');
const authenticate = require('../../middleware/authenticate');
const ctrl = require('./coupons.controller');

router.use(authenticate);

// Herkesin erişebileceği (kullanıcı)
router.post('/validate', ctrl.validateCoupon);

// Profil / Admin routes
router.post('/admin', authorize('admin'), ctrl.createCoupon);
router.get('/admin/all', authorize('admin'), ctrl.getAllCoupons);
router.patch('/admin/:id', authorize('admin'), ctrl.updateCoupon);
router.delete('/admin/:id', authorize('admin'), ctrl.deleteCoupon);

module.exports = router;