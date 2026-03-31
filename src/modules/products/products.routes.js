const express = require('express');
const router = express.Router();
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const ctrl = require('./products.controller');
const { validate } = require('../../middleware/validate');
const schema = require('./products.validation');

// Public
router.get('/', ctrl.getAll);
router.get('/featured', ctrl.getFeatured);
router.get('/weekly-picks', ctrl.getWeeklyPicks);
router.get('/:slug', ctrl.getBySlug);
router.post('/:id/calculate-price', validate(schema.calculatePrice), ctrl.calculatePrice);

// Admin
router.get('/admin/all', authenticate, authorize('admin'), ctrl.getAllAdmin);
router.get('/admin/:id', authenticate, authorize('admin'), ctrl.getByIdAdmin);
router.post('/', authenticate, authorize('admin'), validate(schema.createProduct), ctrl.create);
router.patch('/:id', authenticate, authorize('admin'), validate(schema.updateProduct), ctrl.update);
router.delete('/:id', authenticate, authorize('admin'), ctrl.remove);
router.patch('/:id/stock', authenticate, authorize('admin'), validate(schema.updateStock), ctrl.updateStock);
router.post('/:id/images', authenticate, authorize('admin'), validate(schema.addImage), ctrl.addImage);
router.patch('/:id/images/:imageId/primary', authenticate, authorize('admin'), ctrl.setPrimaryImage);
router.delete('/:id/images/:imageId', authenticate, authorize('admin'), ctrl.removeImage);

module.exports = router;
