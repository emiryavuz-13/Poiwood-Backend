const admin = require('../config/firebase-admin');
const pool = require('../config/db');
const ApiError = require('../utils/ApiError');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw ApiError.unauthorized();
    }

    const token = authHeader.split('Bearer ')[1];
    const decoded = await admin.auth().verifyIdToken(token);

    // PostgreSQL'de user sync (UPSERT)
    const result = await pool.query(
      `INSERT INTO users (firebase_uid, email, phone, display_name, avatar_url)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (firebase_uid) DO UPDATE SET
         email = EXCLUDED.email,
         display_name = EXCLUDED.display_name,
         avatar_url = EXCLUDED.avatar_url,
         updated_at = NOW()
       RETURNING *`,
      [
        decoded.uid,
        decoded.email || null,
        decoded.phone_number || null,
        decoded.name || null,
        decoded.picture || null,
      ]
    );

    req.user = result.rows[0];
    req.firebaseUser = decoded;
    next();
  } catch (err) {
    if (err instanceof ApiError) return next(err);
    next(ApiError.unauthorized('Geçersiz veya süresi dolmuş token'));
  }
};

module.exports = authenticate;
