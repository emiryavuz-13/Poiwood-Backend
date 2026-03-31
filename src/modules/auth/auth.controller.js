const asyncHandler = require('../../utils/asyncHandler');
const pool = require('../../config/db');
const admin = require('../../config/firebase-admin');

exports.syncUser = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

exports.getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const { display_name, phone } = req.body;
  const { rows } = await pool.query(
    `UPDATE users SET display_name = COALESCE($1, display_name),
     phone = COALESCE($2, phone), updated_at = NOW()
     WHERE id = $3 RETURNING *`,
    [display_name, phone, req.user.id]
  );
  res.json({ success: true, user: rows[0] });
});

exports.setAdminRole = asyncHandler(async (req, res) => {
  const { firebase_uid } = req.body;
  await admin.auth().setCustomUserClaims(firebase_uid, { role: 'admin' });
  await pool.query(`UPDATE users SET role = 'admin' WHERE firebase_uid = $1`, [firebase_uid]);
  res.json({ success: true, message: 'Admin rolü atandı' });
});
