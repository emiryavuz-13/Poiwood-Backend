const pool = require('../../config/db');
const ApiError = require('../../utils/ApiError');

async function getByProduct(productId, { page = 1, limit = 10 }) {
  const offset = (page - 1) * limit;

  const { rows } = await pool.query(
    `SELECT r.*, u.display_name AS user_name, u.avatar_url AS user_avatar,
            COALESCE(
              (SELECT json_agg(json_build_object('id', ri.id, 'firebase_url', ri.firebase_url, 'display_order', ri.display_order)
               ORDER BY ri.display_order)
               FROM review_images ri WHERE ri.review_id = r.id), '[]'
            ) AS images
     FROM reviews r
     JOIN users u ON r.user_id = u.id
     WHERE r.product_id = $1 AND r.is_approved = true
     ORDER BY r.created_at DESC
     LIMIT $2 OFFSET $3`,
    [productId, limit, offset]
  );

  const { rows: countRows } = await pool.query(
    'SELECT COUNT(*) FROM reviews WHERE product_id = $1 AND is_approved = true',
    [productId]
  );
  const total = parseInt(countRows[0].count);

  // Ortalama puan
  const { rows: avgRows } = await pool.query(
    'SELECT ROUND(AVG(rating), 1) AS avg_rating FROM reviews WHERE product_id = $1 AND is_approved = true',
    [productId]
  );

  return {
    reviews: rows,
    avg_rating: avgRows[0].avg_rating ? parseFloat(avgRows[0].avg_rating) : null,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

async function getByUser(userId) {
  const { rows } = await pool.query(
    `SELECT r.*, p.name AS product_name, p.slug AS product_slug,
            (SELECT pi.firebase_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true LIMIT 1) AS product_image,
            COALESCE((SELECT json_agg(json_build_object('id', ri.id, 'firebase_url', ri.firebase_url, 'display_order', ri.display_order) ORDER BY ri.display_order)
               FROM review_images ri WHERE ri.review_id = r.id), '[]') AS images
     FROM reviews r
     JOIN products p ON r.product_id = p.id
     WHERE r.user_id = $1
     ORDER BY r.created_at DESC`,
    [userId]
  );
  return rows;
}

async function create(userId, { product_id, order_id, rating, comment }) {
  const { rows } = await pool.query(
    `INSERT INTO reviews (user_id, product_id, order_id, rating, comment)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, product_id, order_id || null, rating, comment || null]
  );
  return rows[0];
}

async function update(reviewId, userId, { rating, comment }) {
  const updates = [];
  const params = [];
  let i = 1;

  if (rating !== undefined) { updates.push(`rating = $${i++}`); params.push(rating); }
  if (comment !== undefined) { updates.push(`comment = $${i++}`); params.push(comment); }
  if (!updates.length) throw ApiError.badRequest('Güncellenecek alan belirtilmedi');

  params.push(reviewId, userId);
  const { rows } = await pool.query(
    `UPDATE reviews SET ${updates.join(', ')}, is_approved = false, updated_at = NOW()
     WHERE id = $${i++} AND user_id = $${i++}
     RETURNING *`,
    params
  );
  if (!rows[0]) throw ApiError.notFound('Değerlendirme bulunamadı');
  return rows[0];
}

async function remove(reviewId, userId) {
  const { rows } = await pool.query(
    'DELETE FROM reviews WHERE id = $1 AND user_id = $2 RETURNING id',
    [reviewId, userId]
  );
  if (!rows[0]) throw ApiError.notFound('Değerlendirme bulunamadı');
  return rows[0];
}

async function addImage(reviewId, userId, { firebase_url, storage_path, display_order }) {
  // Ownership kontrolü
  const { rows: review } = await pool.query(
    'SELECT id FROM reviews WHERE id = $1 AND user_id = $2',
    [reviewId, userId]
  );
  if (!review[0]) throw ApiError.notFound('Değerlendirme bulunamadı');

  const { rows } = await pool.query(
    `INSERT INTO review_images (review_id, firebase_url, storage_path, display_order)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [reviewId, firebase_url, storage_path, display_order || 0]
  );
  return rows[0];
}

async function removeImage(imageId, userId) {
  const { rows } = await pool.query(
    `DELETE FROM review_images ri
     USING reviews r
     WHERE ri.id = $1 AND ri.review_id = r.id AND r.user_id = $2
     RETURNING ri.storage_path`,
    [imageId, userId]
  );
  if (!rows[0]) throw ApiError.notFound('Fotoğraf bulunamadı');
  return rows[0];
}

async function getAllAdmin({ is_approved, search, page = 1, limit = 20 }) {
  const conditions = [];
  const params = [];
  let i = 1;

  if (is_approved !== undefined) {
    conditions.push(`r.is_approved = $${i++}`);
    params.push(is_approved === 'true');
  }
  if (search) {
    conditions.push(`(p.name ILIKE $${i} OR u.display_name ILIKE $${i} OR r.comment ILIKE $${i})`);
    params.push(`%${search}%`);
    i++;
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const offset = (page - 1) * limit;

  const { rows } = await pool.query(
    `SELECT r.*, u.display_name AS user_name, u.email AS user_email,
            p.name AS product_name, p.slug AS product_slug,
            (SELECT pi.firebase_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true LIMIT 1) AS product_image,
            COALESCE((SELECT json_agg(json_build_object('id', ri.id, 'firebase_url', ri.firebase_url) ORDER BY ri.display_order)
               FROM review_images ri WHERE ri.review_id = r.id), '[]') AS images
     FROM reviews r
     JOIN users u ON r.user_id = u.id
     JOIN products p ON r.product_id = p.id
     ${where}
     ORDER BY r.created_at DESC
     LIMIT $${i++} OFFSET $${i++}`,
    [...params, limit, offset]
  );

  const { rows: countRows } = await pool.query(
    `SELECT COUNT(*) FROM reviews r
     JOIN users u ON r.user_id = u.id
     JOIN products p ON r.product_id = p.id
     ${where}`, params
  );
  const total = parseInt(countRows[0].count);

  return {
    reviews: rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

async function approve(reviewId) {
  const { rows } = await pool.query(
    'UPDATE reviews SET is_approved = true, updated_at = NOW() WHERE id = $1 RETURNING *',
    [reviewId]
  );
  if (!rows[0]) throw ApiError.notFound('Değerlendirme bulunamadı');
  return rows[0];
}

async function adminReply(reviewId, reply) {
  const { rows } = await pool.query(
    'UPDATE reviews SET admin_reply = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [reply, reviewId]
  );
  if (!rows[0]) throw ApiError.notFound('Değerlendirme bulunamadı');
  return rows[0];
}

module.exports = {
  getByProduct, getByUser, create, update, remove,
  addImage, removeImage, getAllAdmin, approve, adminReply,
};
