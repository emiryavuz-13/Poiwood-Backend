const svc = require('./stories.service');
const asyncHandler = require('../../utils/asyncHandler');

// Public
exports.getVisible = asyncHandler(async (req, res) => {
  const data = await svc.getVisibleGroups();
  res.json({ success: true, data });
});

// Admin
exports.getAll = asyncHandler(async (req, res) => {
  const data = await svc.getAllGroups();
  res.json({ success: true, data });
});

exports.createGroup = asyncHandler(async (req, res) => {
  const data = await svc.createGroup(req.body);
  res.status(201).json({ success: true, data });
});

exports.updateGroup = asyncHandler(async (req, res) => {
  const data = await svc.updateGroup(req.params.id, req.body);
  res.json({ success: true, data });
});

exports.deleteGroup = asyncHandler(async (req, res) => {
  await svc.deleteGroup(req.params.id);
  res.json({ success: true, message: 'Grup silindi' });
});

exports.createStory = asyncHandler(async (req, res) => {
  const data = await svc.createStory(req.params.groupId, req.body);
  res.status(201).json({ success: true, data });
});

exports.updateStory = asyncHandler(async (req, res) => {
  const data = await svc.updateStory(req.params.id, req.body);
  res.json({ success: true, data });
});

exports.deleteStory = asyncHandler(async (req, res) => {
  await svc.deleteStory(req.params.id);
  res.json({ success: true, message: 'Story silindi' });
});
