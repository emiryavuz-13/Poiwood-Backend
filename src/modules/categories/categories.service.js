const pool = require('../../config/db');

async function getAll() {
  const { rows } = await pool.query(`
    SELECT c.*,
           p.name AS parent_name,
           COUNT(sub.id) AS sub_count
    FROM categories c
    LEFT JOIN categories p ON c.parent_id = p.id
    LEFT JOIN categories sub ON sub.parent_id = c.id
    WHERE c.is_active = true
    GROUP BY c.id, p.name
    ORDER BY c.display_order, c.name
  `);
  return rows;
}

async function getTree() {
  const { rows } = await pool.query(`
    SELECT * FROM categories WHERE is_active = true ORDER BY display_order, name
  `);
  const map = {};
  rows.forEach(r => (map[r.id] = { ...r, children: [] }));
  const tree = [];
  rows.forEach(r => {
    if (r.parent_id) map[r.parent_id]?.children.push(map[r.id]);
    else tree.push(map[r.id]);
  });
  return tree;
}

async function getBySlug(slug) {
  const { rows } = await pool.query(
    `SELECT c.*,
            json_agg(sub ORDER BY sub.display_order) FILTER (WHERE sub.id IS NOT NULL) AS children
     FROM categories c
     LEFT JOIN categories sub ON sub.parent_id = c.id AND sub.is_active = true
     WHERE c.slug = $1 AND c.is_active = true
     GROUP BY c.id`,
    [slug]
  );
  return rows[0] || null;
}

async function create(data) {
  const { parent_id, name, slug, description, image_url, display_order } = data;
  const { rows } = await pool.query(
    `INSERT INTO categories (parent_id, name, slug, description, image_url, display_order)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [parent_id || null, name, slug, description || null, image_url || null, display_order || 0]
  );
  return rows[0];
}

async function update(id, data) {
  const { parent_id, name, slug, description, image_url, display_order, is_active } = data;
  const { rows } = await pool.query(
    `UPDATE categories SET
       parent_id = COALESCE($1, parent_id),
       name = COALESCE($2, name),
       slug = COALESCE($3, slug),
       description = COALESCE($4, description),
       image_url = COALESCE($5, image_url),
       display_order = COALESCE($6, display_order),
       is_active = COALESCE($7, is_active)
     WHERE id = $8 RETURNING *`,
    [parent_id, name, slug, description, image_url, display_order, is_active, id]
  );
  return rows[0] || null;
}

async function remove(id) {
  const { rows } = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING id', [id]);
  return rows[0] || null;
}

module.exports = { getAll, getTree, getBySlug, create, update, remove };
