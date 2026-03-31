const express = require('express');
const router = express.Router();
const authenticate = require('../../middleware/authenticate');
const ctrl = require('./favorites.controller');

router.use(authenticate);

router.get('/', ctrl.getFavorites);
router.get('/:productId/check', ctrl.check);
router.post('/:productId', ctrl.add);
router.delete('/:productId', ctrl.remove);

module.exports = router;
