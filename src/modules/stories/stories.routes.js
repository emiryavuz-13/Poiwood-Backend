const router = require('express').Router();
const ctrl = require('./stories.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');

// Public
router.get('/', ctrl.getVisible);

// Admin
router.get('/admin/all', authenticate, authorize('admin'), ctrl.getAll);
router.post('/admin/groups', authenticate, authorize('admin'), ctrl.createGroup);
router.patch('/admin/groups/:id', authenticate, authorize('admin'), ctrl.updateGroup);
router.delete('/admin/groups/:id', authenticate, authorize('admin'), ctrl.deleteGroup);
router.post('/admin/groups/:groupId/stories', authenticate, authorize('admin'), ctrl.createStory);
router.patch('/admin/stories/:id', authenticate, authorize('admin'), ctrl.updateStory);
router.delete('/admin/stories/:id', authenticate, authorize('admin'), ctrl.deleteStory);

module.exports = router;
