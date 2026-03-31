const express = require('express');
const router = express.Router();
const authenticate = require('../../middleware/authenticate');
const ctrl = require('./addresses.controller');

router.use(authenticate);

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', ctrl.create);
router.patch('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);
router.patch('/:id/default', ctrl.setDefault);

module.exports = router;
