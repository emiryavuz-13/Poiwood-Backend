const pool = require('../../config/db');

async function getFavorites(userId) {
  const { rows } = await pool.query(
    `SELECT f.id, f.added_at, p.id AS product_id, p.name, p.slug, p.pricing_type,
            p.base_price, p.sale_price, p.discount_type, p.discount_value, p.price_per_cm2, p.stock_quantity,
            (SELECT pi.firebase_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true LIMIT 1) AS primary_image,
            (SELECT pi.thumbnail_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true LIMIT 1) AS primary_thumbnail,
            ROUND(AVG(r.rating), 1) AS avg_rating
     FROM favorites f
     JOIN products p ON f.product_id = p.id
     LEFT JOIN reviews r ON r.product_id = p.id AND r.is_approved = true
     WHERE f.user_id = $1
     GROUP BY f.id, p.id
     ORDER BY f.added_at DESC`,
    [userId]
  );
  return rows;
}

async function add(userId, productId) {
  const { rows } = await pool.query(
    `INSERT INTO favorites (user_id, product_id) VALUES ($1, $2)
     ON CONFLICT (user_id, product_id) DO NOTHING RETURNING *`,
    [userId, productId]
  );
  return rows[0] || null;
}

async function remove(userId, productId) {
  const { rows } = await pool.query(
    'DELETE FROM favorites WHERE user_id = $1 AND product_id = $2 RETURNING id',
    [userId, productId]
  );
  return rows[0] || null;
}

async function isFavorite(userId, productId) {
  const { rows } = await pool.query(
    'SELECT id FROM favorites WHERE user_id = $1 AND product_id = $2',
    [userId, productId]
  );
  return rows.length > 0;
}

module.exports = { getFavorites, add, remove, isFavorite };
