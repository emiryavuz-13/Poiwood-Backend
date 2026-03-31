const pool = require('../../config/db');
const ApiError = require('../../utils/ApiError');

async function getByProduct(productId, { page = 1, limit = 10 }) {
  const offset = (page - 1) * limit;

  const { rows } = await pool.query(
    `SELECT q.*, u.display_name AS user_name,
            au.display_name AS answered_by_name
     FROM product_questions q
     JOIN users u ON q.user_id = u.id
     LEFT JOIN users au ON q.answered_by = au.id
     WHERE q.product_id = $1 AND q.is_visible = true
     ORDER BY q.created_at DESC
     LIMIT $2 OFFSET $3`,
    [productId, limit, offset]
  );

  const { rows: countRows } = await pool.query(
    'SELECT COUNT(*) FROM product_questions WHERE product_id = $1 AND is_visible = true',
    [productId]
  );
  const total = parseInt(countRows[0].count);

  return {
    questions: rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

async function getMyQuestions(userId) {
  const { rows } = await pool.query(
    `SELECT q.*, p.name AS product_name, p.slug AS product_slug,
            au.display_name AS answered_by_name
     FROM product_questions q
     JOIN products p ON q.product_id = p.id
     LEFT JOIN users au ON q.answered_by = au.id
     WHERE q.user_id = $1
     ORDER BY q.created_at DESC`,
    [userId]
  );
  return rows;
}

async function create(userId, { product_id, question_text }) {
  const { rows } = await pool.query(
    `INSERT INTO product_questions (user_id, product_id, question_text)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [userId, product_id, question_text]
  );
  return rows[0];
}

async function remove(questionId, userId) {
  const { rows } = await pool.query(
    'DELETE FROM product_questions WHERE id = $1 AND user_id = $2 RETURNING id',
    [questionId, userId]
  );
  if (!rows[0]) throw ApiError.notFound('Soru bulunamadı');
  return rows[0];
}

async function getAllAdmin({ answered, search, page = 1, limit = 20 }) {
  const conditions = [];
  const params = [];
  let i = 1;

  if (answered === 'true') {
    conditions.push('q.answer_text IS NOT NULL');
  } else if (answered === 'false') {
    conditions.push('q.answer_text IS NULL');
  }
  if (search) {
    conditions.push(`(p.name ILIKE $${i} OR u.display_name ILIKE $${i} OR q.question_text ILIKE $${i})`);
    params.push(`%${search}%`);
    i++;
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const offset = (page - 1) * limit;

  const { rows } = await pool.query(
    `SELECT q.*, u.display_name AS user_name, u.email AS user_email,
            p.name AS product_name, p.slug AS product_slug,
            (SELECT pi.firebase_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true LIMIT 1) AS product_image,
            au.display_name AS answered_by_name
     FROM product_questions q
     JOIN users u ON q.user_id = u.id
     JOIN products p ON q.product_id = p.id
     LEFT JOIN users au ON q.answered_by = au.id
     ${where}
     ORDER BY q.created_at DESC
     LIMIT $${i++} OFFSET $${i++}`,
    [...params, limit, offset]
  );

  const { rows: countRows } = await pool.query(
    `SELECT COUNT(*) FROM product_questions q
     JOIN users u ON q.user_id = u.id
     JOIN products p ON q.product_id = p.id
     ${where}`, params
  );
  const total = parseInt(countRows[0].count);

  return {
    questions: rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

async function answer(questionId, adminUserId, answer_text) {
  const { rows } = await pool.query(
    `UPDATE product_questions
     SET answer_text = $1, answered_by = $2, answered_at = NOW()
     WHERE id = $3
     RETURNING *`,
    [answer_text, adminUserId, questionId]
  );
  if (!rows[0]) throw ApiError.notFound('Soru bulunamadı');
  return rows[0];
}

async function toggleVisibility(questionId) {
  const { rows } = await pool.query(
    `UPDATE product_questions SET is_visible = NOT is_visible WHERE id = $1 RETURNING *`,
    [questionId]
  );
  if (!rows[0]) throw ApiError.notFound('Soru bulunamadı');
  return rows[0];
}

module.exports = {
  getByProduct, getMyQuestions, create, remove,
  getAllAdmin, answer, toggleVisibility,
};
