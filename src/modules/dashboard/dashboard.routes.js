const express = require('express');
const router = express.Router();
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const ctrl = require('./dashboard.controller');

router.use(authenticate);
router.use(authorize('admin')); // Tüm dashboard admin'e aittir

router.get('/summary', ctrl.getSummary);

module.exports = router;
