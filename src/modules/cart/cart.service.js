const pool = require('../../config/db');

async function getCart(userId) {
  const { rows } = await pool.query(
    `SELECT ci.*, p.name, p.slug, p.stock_quantity, p.is_active,
            (SELECT pi.firebase_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true LIMIT 1) AS primary_image,
            (SELECT pi.thumbnail_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true LIMIT 1) AS primary_thumbnail
     FROM cart_items ci
     JOIN products p ON ci.product_id = p.id
     WHERE ci.user_id = $1
     ORDER BY ci.added_at DESC`,
    [userId]
  );
  const subtotal = rows.reduce((sum, r) => sum + r.unit_price * r.quantity, 0);
  return { items: rows, subtotal: parseFloat(subtotal.toFixed(2)) };
}

async function addItem(userId, { product_id, quantity, selected_width_cm, selected_height_cm, unit_price }) {
  const { rows } = await pool.query(
    `INSERT INTO cart_items (user_id, product_id, quantity, selected_width_cm, selected_height_cm, unit_price)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (user_id, product_id, selected_width_cm, selected_height_cm)
     DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
     RETURNING *`,
    [userId, product_id, quantity || 1, selected_width_cm || null, selected_height_cm || null, unit_price]
  );
  return rows[0];
}

async function updateItem(userId, itemId, quantity) {
  const { rows } = await pool.query(
    `UPDATE cart_items SET quantity = $1 WHERE id = $2 AND user_id = $3 RETURNING *`,
    [quantity, itemId, userId]
  );
  return rows[0] || null;
}

async function removeItem(userId, itemId) {
  const { rows } = await pool.query(
    'DELETE FROM cart_items WHERE id = $1 AND user_id = $2 RETURNING id',
    [itemId, userId]
  );
  return rows[0] || null;
}

async function clearCart(userId) {
  await pool.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
}

module.exports = { getCart, addItem, updateItem, removeItem, clearCart };
