const express = require('express');
const router = express.Router();
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const ctrl = require('./questions.controller');

// Public
router.get('/product/:productId', ctrl.getByProduct);

// Admin (spesifik path'ler önce)
router.get('/admin/all', authenticate, authorize('admin'), ctrl.getAllAdmin);
router.patch('/admin/:id/answer', authenticate, authorize('admin'), ctrl.answer);
router.patch('/admin/:id/visibility', authenticate, authorize('admin'), ctrl.toggleVisibility);

// User
router.get('/my', authenticate, ctrl.getMyQuestions);
router.post('/', authenticate, ctrl.create);
router.delete('/:id', authenticate, ctrl.remove);

module.exports = router;
