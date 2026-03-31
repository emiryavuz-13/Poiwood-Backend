const pool = require('../../config/db');
const ApiError = require('../../utils/ApiError');

async function getByUser(userId) {
  const { rows } = await pool.query(
    'SELECT * FROM user_addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC',
    [userId]
  );
  return rows;
}

async function getById(addressId, userId) {
  const { rows } = await pool.query(
    'SELECT * FROM user_addresses WHERE id = $1 AND user_id = $2',
    [addressId, userId]
  );
  if (!rows[0]) throw ApiError.notFound('Adres bulunamadı');
  return rows[0];
}

async function create(userId, { title, full_name, phone, address_line, city, district, zip_code, is_default }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (is_default) {
      await client.query(
        'UPDATE user_addresses SET is_default = false WHERE user_id = $1 AND is_default = true',
        [userId]
      );
    }

    const { rows } = await client.query(
      `INSERT INTO user_addresses (user_id, title, full_name, phone, address_line, city, district, zip_code, is_default)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [userId, title, full_name, phone, address_line, city, district || null, zip_code || null, is_default || false]
    );

    await client.query('COMMIT');
    return rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function update(addressId, userId, { title, full_name, phone, address_line, city, district, zip_code, is_default }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Ownership kontrolü
    const { rows: existing } = await client.query(
      'SELECT id FROM user_addresses WHERE id = $1 AND user_id = $2',
      [addressId, userId]
    );
    if (!existing[0]) throw ApiError.notFound('Adres bulunamadı');

    if (is_default) {
      await client.query(
        'UPDATE user_addresses SET is_default = false WHERE user_id = $1 AND is_default = true',
        [userId]
      );
    }

    const fields = [];
    const params = [];
    let i = 1;

    if (title !== undefined)        { fields.push(`title = $${i++}`);        params.push(title); }
    if (full_name !== undefined)    { fields.push(`full_name = $${i++}`);    params.push(full_name); }
    if (phone !== undefined)        { fields.push(`phone = $${i++}`);        params.push(phone); }
    if (address_line !== undefined)  { fields.push(`address_line = $${i++}`); params.push(address_line); }
    if (city !== undefined)         { fields.push(`city = $${i++}`);         params.push(city); }
    if (district !== undefined)     { fields.push(`district = $${i++}`);     params.push(district); }
    if (zip_code !== undefined)     { fields.push(`zip_code = $${i++}`);     params.push(zip_code); }
    if (is_default !== undefined)   { fields.push(`is_default = $${i++}`);   params.push(is_default); }

    if (fields.length === 0) throw ApiError.badRequest('Güncellenecek alan belirtilmedi');

    params.push(addressId, userId);
    const { rows } = await client.query(
      `UPDATE user_addresses SET ${fields.join(', ')} WHERE id = $${i++} AND user_id = $${i++} RETURNING *`,
      params
    );

    await client.query('COMMIT');
    return rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function remove(addressId, userId) {
  const { rows } = await pool.query(
    'DELETE FROM user_addresses WHERE id = $1 AND user_id = $2 RETURNING id',
    [addressId, userId]
  );
  if (!rows[0]) throw ApiError.notFound('Adres bulunamadı');
}

async function setDefault(addressId, userId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: existing } = await client.query(
      'SELECT id FROM user_addresses WHERE id = $1 AND user_id = $2',
      [addressId, userId]
    );
    if (!existing[0]) throw ApiError.notFound('Adres bulunamadı');

    await client.query(
      'UPDATE user_addresses SET is_default = false WHERE user_id = $1 AND is_default = true',
      [userId]
    );

    const { rows } = await client.query(
      'UPDATE user_addresses SET is_default = true WHERE id = $1 AND user_id = $2 RETURNING *',
      [addressId, userId]
    );

    await client.query('COMMIT');
    return rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { getByUser, getById, create, update, remove, setDefault };
