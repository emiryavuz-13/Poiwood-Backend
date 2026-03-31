const express = require('express');
const router = express.Router();
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const ctrl = require('./auth.controller');
const { validate } = require('../../middleware/validate');
const schema = require('./auth.validation');

router.post('/sync', authenticate, ctrl.syncUser);
router.get('/me', authenticate, ctrl.getMe);
router.patch('/profile', authenticate, validate(schema.updateProfile), ctrl.updateProfile);
router.post('/set-admin', authenticate, authorize('admin'), validate(schema.setAdmin), ctrl.setAdminRole);

module.exports = router;
