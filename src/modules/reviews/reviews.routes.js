const express = require('express');
const router = express.Router();
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const ctrl = require('./reviews.controller');

// Public
router.get('/product/:productId', ctrl.getByProduct);

// Admin (spesifik path'ler önce)
router.get('/admin/all', authenticate, authorize('admin'), ctrl.getAllAdmin);
router.patch('/admin/:id/approve', authenticate, authorize('admin'), ctrl.approve);
router.patch('/admin/:id/reply', authenticate, authorize('admin'), ctrl.adminReply);

// User
router.get('/my', authenticate, ctrl.getMyReviews);
router.post('/', authenticate, ctrl.create);
router.patch('/:id', authenticate, ctrl.update);
router.delete('/:id', authenticate, ctrl.remove);
router.post('/:id/images', authenticate, ctrl.addImage);
router.delete('/:id/images/:imageId', authenticate, ctrl.removeImage);

module.exports = router;
