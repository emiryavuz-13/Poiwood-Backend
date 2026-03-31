const pool = require('../../config/db');
const ApiError = require('../../utils/ApiError');

// -- Admin Fonksiyonları --
async function create(adminUser, data) {
  const { code, discount_type, discount_amount, min_cart_amount, max_uses, expires_at, is_active } = data;

  const { rows } = await pool.query(
    `INSERT INTO coupons (code, discount_type, discount_amount, min_cart_amount, max_uses, expires_at, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      code.toUpperCase(),
      discount_type,
      discount_amount,
      min_cart_amount || 0,
      max_uses || null,
      expires_at || null,
      is_active !== undefined ? is_active : true
    ]
  );
  return rows[0];
}

async function getAll() {
  const { rows } = await pool.query('SELECT * FROM coupons ORDER BY created_at DESC');
  return rows;
}

async function update(id, data) {
  const { is_active, expires_at, max_uses, min_cart_amount } = data;

  const updates = [];
  const params = [id];
  let paramIndex = 2;

  if (is_active !== undefined) {
    updates.push(`is_active = $${paramIndex++}`);
    params.push(is_active);
  }
  if (expires_at !== undefined) {
    updates.push(`expires_at = $${paramIndex++}`);
    params.push(expires_at);
  }
  if (max_uses !== undefined) {
    updates.push(`max_uses = $${paramIndex++}`);
    params.push(max_uses);
  }
  if (min_cart_amount !== undefined) {
    updates.push(`min_cart_amount = $${paramIndex++}`);
    params.push(min_cart_amount);
  }

  if (updates.length === 0) throw ApiError.badRequest('Güncellenecek alan bulunamadı');

  const { rows } = await pool.query(
    `UPDATE coupons SET ${updates.join(', ')} WHERE id = $1 RETURNING *`,
    params
  );

  if (!rows[0]) throw ApiError.notFound('Kupon bulunamadı');
  return rows[0];
}

async function remove(id) {
  const { rows } = await pool.query('DELETE FROM coupons WHERE id = $1 RETURNING id', [id]);
  if (!rows[0]) throw ApiError.notFound('Kupon bulunamadı');
}

// -- Kullanıcı Doğrulama --
async function validate(code, cartTotal) {
  const { rows } = await pool.query(
    'SELECT * FROM coupons WHERE code = $1',
    [code.toUpperCase()]
  );

  const coupon = rows[0];

  if (!coupon) {
    throw ApiError.badRequest('Geçersiz kupon kodu');
  }
  if (!coupon.is_active) {
    throw ApiError.badRequest('Bu kupon artık kullanılamaz');
  }
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    throw ApiError.badRequest('Bu kuponun süresi dolmuş');
  }
  if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
    throw ApiError.badRequest('Bu kuponun kullanım limiti dolmuş');
  }
  if (cartTotal < parseFloat(coupon.min_cart_amount)) {
    throw ApiError.badRequest(`Bu kupon minimum ${coupon.min_cart_amount} TL sepet tutarı gerektirir`);
  }

  // Hesaplanan İndirim
  let discountAmount = 0;
  if (coupon.discount_type === 'fixed') {
    discountAmount = parseFloat(coupon.discount_amount);
  } else if (coupon.discount_type === 'percentage') {
    discountAmount = cartTotal * (parseFloat(coupon.discount_amount) / 100);
  }

  // İndirim sepet tutarını aşamaz
  if (discountAmount > cartTotal) {
    discountAmount = cartTotal;
  }

  return {
    ...coupon,
    calculated_discount: discountAmount.toFixed(2),
    final_total: (cartTotal - discountAmount).toFixed(2)
  };
}

module.exports = {
  create,
  getAll,
  update,
  remove,
  validate
};