const express = require('express');
const router = express.Router();
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const ctrl = require('./orders.controller');

// PUBLIC — Auth gerektirmeyen
router.post('/guest', ctrl.createGuestOrder);
router.get('/guest/track', ctrl.trackGuestOrder);

// AUTH — Giriş yapmış kullanıcılar
router.use(authenticate);

// Admin routes (daha spesifik path'ler önce)
router.get('/admin/all', authorize('admin'), ctrl.getAllOrders);
router.get('/admin/:id', authorize('admin'), ctrl.getOrderDetail);
router.patch('/admin/:id/status', authorize('admin'), ctrl.updateStatus);
router.patch('/admin/:id/tracking', authorize('admin'), ctrl.addTracking);

// User routes
router.post('/', ctrl.createOrder);
router.get('/', ctrl.getMyOrders);
router.get('/:id', ctrl.getMyOrderDetail);

module.exports = router;
