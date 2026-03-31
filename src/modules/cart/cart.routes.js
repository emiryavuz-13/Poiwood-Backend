const express = require('express');
const router = express.Router();
const authenticate = require('../../middleware/authenticate');
const ctrl = require('./cart.controller');

router.use(authenticate);

router.get('/', ctrl.getCart);
router.post('/', ctrl.addItem);
router.patch('/:itemId', ctrl.updateItem);
router.delete('/:itemId', ctrl.removeItem);
router.delete('/', ctrl.clearCart);

module.exports = router;
