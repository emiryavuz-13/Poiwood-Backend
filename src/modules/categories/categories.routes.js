const express = require('express');
const router = express.Router();
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const ctrl = require('./categories.controller');
const { validate } = require('../../middleware/validate');
const schema = require('./categories.validation');

router.get('/', ctrl.getTree);
router.get('/all', ctrl.getAll);
router.get('/:slug', ctrl.getBySlug);

router.post('/', authenticate, authorize('admin'), validate(schema.createCategory), ctrl.create);
router.patch('/:id', authenticate, authorize('admin'), validate(schema.updateCategory), ctrl.update);
router.delete('/:id', authenticate, authorize('admin'), ctrl.remove);

module.exports = router;
