const pool = require('../../config/db');
const ApiError = require('../../utils/ApiError');

// ============ PUBLIC ============

async function getVisibleGroups() {
  const { rows: groups } = await pool.query(
    `SELECT id, name, cover_image, display_order
     FROM story_groups
     WHERE is_visible = true
     ORDER BY display_order ASC, created_at ASC`
  );

  if (groups.length === 0) return [];

  const { rows: stories } = await pool.query(
    `SELECT id, group_id, title, image_url, description, display_order
     FROM stories
     WHERE is_visible = true AND group_id = ANY($1)
     ORDER BY display_order ASC, created_at ASC`,
    [groups.map((g) => g.id)]
  );

  return groups.map((g) => ({
    ...g,
    stories: stories.filter((s) => s.group_id === g.id),
  })).filter((g) => g.stories.length > 0);
}

// ============ ADMIN ============

async function getAllGroups() {
  const { rows: groups } = await pool.query(
    `SELECT * FROM story_groups ORDER BY display_order ASC, created_at ASC`
  );

  const { rows: stories } = await pool.query(
    `SELECT * FROM stories ORDER BY display_order ASC, created_at ASC`
  );

  return groups.map((g) => ({
    ...g,
    stories: stories.filter((s) => s.group_id === g.id),
  }));
}

async function createGroup({ name, cover_image, display_order = 0 }) {
  const { rows } = await pool.query(
    `INSERT INTO story_groups (name, cover_image, display_order)
     VALUES ($1, $2, $3) RETURNING *`,
    [name, cover_image, display_order]
  );
  return rows[0];
}

async function updateGroup(id, { name, cover_image, display_order, is_visible }) {
  const updates = [];
  const params = [id];
  let i = 2;

  if (name !== undefined) { updates.push(`name = $${i++}`); params.push(name); }
  if (cover_image !== undefined) { updates.push(`cover_image = $${i++}`); params.push(cover_image); }
  if (display_order !== undefined) { updates.push(`display_order = $${i++}`); params.push(display_order); }
  if (is_visible !== undefined) { updates.push(`is_visible = $${i++}`); params.push(is_visible); }

  if (updates.length === 0) throw ApiError.badRequest('Güncellenecek alan yok');

  updates.push('updated_at = NOW()');
  const { rows } = await pool.query(
    `UPDATE story_groups SET ${updates.join(', ')} WHERE id = $1 RETURNING *`,
    params
  );
  if (!rows[0]) throw ApiError.notFound('Grup bulunamadı');
  return rows[0];
}

async function deleteGroup(id) {
  const { rows } = await pool.query('DELETE FROM story_groups WHERE id = $1 RETURNING id', [id]);
  if (!rows[0]) throw ApiError.notFound('Grup bulunamadı');
  return rows[0];
}

async function createStory(groupId, { title, image_url, description, display_order = 0 }) {
  const { rows } = await pool.query(
    `INSERT INTO stories (group_id, title, image_url, description, display_order)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [groupId, title, image_url, description || null, display_order]
  );
  return rows[0];
}

async function updateStory(id, { title, image_url, description, display_order, is_visible }) {
  const updates = [];
  const params = [id];
  let i = 2;

  if (title !== undefined) { updates.push(`title = $${i++}`); params.push(title); }
  if (image_url !== undefined) { updates.push(`image_url = $${i++}`); params.push(image_url); }
  if (description !== undefined) { updates.push(`description = $${i++}`); params.push(description); }
  if (display_order !== undefined) { updates.push(`display_order = $${i++}`); params.push(display_order); }
  if (is_visible !== undefined) { updates.push(`is_visible = $${i++}`); params.push(is_visible); }

  if (updates.length === 0) throw ApiError.badRequest('Güncellenecek alan yok');

  updates.push('updated_at = NOW()');
  const { rows } = await pool.query(
    `UPDATE stories SET ${updates.join(', ')} WHERE id = $1 RETURNING *`,
    params
  );
  if (!rows[0]) throw ApiError.notFound('Story bulunamadı');
  return rows[0];
}

async function deleteStory(id) {
  const { rows } = await pool.query('DELETE FROM stories WHERE id = $1 RETURNING id', [id]);
  if (!rows[0]) throw ApiError.notFound('Story bulunamadı');
  return rows[0];
}

module.exports = {
  getVisibleGroups, getAllGroups,
  createGroup, updateGroup, deleteGroup,
  createStory, updateStory, deleteStory,
};
