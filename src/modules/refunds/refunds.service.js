const pool = require('../../config/db');
const ApiError = require('../../utils/ApiError');

// -- Kullanıcı Fonksiyonları --
async function createRefundRequest(userId, orderId, reason) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Sipariş kontrolü
    const { rows: order } = await client.query('SELECT status FROM orders WHERE id = $1 AND user_id = $2', [orderId, userId]);
    if (!order[0]) throw ApiError.notFound('Sipariş bulunamadı veya size ait değil');

    // Yalnızca teslim edilmiş veya kargoya verilmiş siparişler iade edilebilir
    // (Bunu kendi is mantığınıza göre değiştirebilirsiniz)
    if (!['shipped', 'delivered', 'paid'].includes(order[0].status)) {
      throw ApiError.badRequest('Bu sipariş durumu için iade talebi oluşturulamaz');
    }

    // Mevcut bir talep var mı kontrolü
    const { rows: existing } = await client.query('SELECT id FROM refund_requests WHERE order_id = $1', [orderId]);
    if (existing[0]) throw ApiError.badRequest('Bu sipariş için zaten bir iade talebi mevcut');

    const { rows } = await client.query(
      `INSERT INTO refund_requests (order_id, user_id, reason) VALUES ($1, $2, $3) RETURNING *`,
      [orderId, userId, reason]
    );

    // Sipariş durumunu markala (opsiyonel ama mantıklı)
    await client.query('UPDATE orders SET status = $1 WHERE id = $2', ['processing', orderId]);

    await client.query('COMMIT');
    return rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function getMyRefundRequests(userId) {
  const { rows } = await pool.query(
    `SELECT r.*, o.order_number, o.total_amount
     FROM refund_requests r
     JOIN orders o ON r.order_id = o.id
     WHERE r.user_id = $1
     ORDER BY r.created_at DESC`,
    [userId]
  );
  return rows;
}

// -- Admin Fonksiyonları --
async function getAllRefundRequests({ status, page = 1, limit = 20 }) {
  const conditions = [];
  const params = [];
  let i = 1;

  if (status) {
    conditions.push(`r.status = $${i++}`);
    params.push(status);
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const offset = (page - 1) * limit;

  const { rows: requests } = await pool.query(
    `SELECT r.*,
            o.order_number, o.total_amount,
            u.email as user_email, u.display_name as user_name
     FROM refund_requests r
     JOIN orders o ON r.order_id = o.id
     JOIN users u ON r.user_id = u.id
     ${where}
     ORDER BY r.created_at DESC
     LIMIT $${i++} OFFSET $${i++}`,
    [...params, limit, offset]
  );

  const { rows: countRows } = await pool.query(`SELECT COUNT(*) FROM refund_requests r ${where}`, params);
  const total = parseInt(countRows[0].count);

  return {
    requests,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

async function processRefundRequest(requestId, action, adminNote) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: request } = await client.query(
      'SELECT * FROM refund_requests WHERE id = $1 FOR UPDATE',
      [requestId]
    );

    if (!request[0]) throw ApiError.notFound('İade talebi bulunamadı');
    if (request[0].status !== 'pending') throw ApiError.badRequest('Bu talep zaten işlenmiş');

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    const { rows: updatedRequest } = await client.query(
      `UPDATE refund_requests SET status = $1, admin_note = COALESCE($2, admin_note), updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [newStatus, adminNote || null, requestId]
    );

    if (action === 'approve') {
      // Siparişi iptal edildi olarak işaretle ve stokları geri yükle
      const orderId = request[0].order_id;

      const { rows: items } = await client.query(
        'SELECT product_id, quantity FROM order_items WHERE order_id = $1', [orderId]
      );

      // Siparişin durumunu çek ki birden fazla iade stok geri yüklemesine yol açmasın
      const { rows: order } = await client.query('SELECT status FROM orders WHERE id = $1', [orderId]);

      if (!['cancelled', 'refunded'].includes(order[0].status)) {
         for (const item of items) {
           if (item.product_id) {
             await client.query(
               'UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2',
               [item.quantity, item.product_id]
             );
           }
         }
      }

      await client.query(
        'UPDATE orders SET status = $1, admin_note = COALESCE($2, admin_note), updated_at = NOW() WHERE id = $3',
        ['refunded', adminNote || 'İade onaylandı', orderId]
      );
    } else {
       const orderId = request[0].order_id;
       await client.query(
        'UPDATE orders SET status = $1, admin_note = COALESCE($2, admin_note), updated_at = NOW() WHERE id = $3',
        ['shipped', adminNote || 'İade reddedildi', orderId] // Yada önceki durumuna döndürülebilir. Basitlik adına..
      );
    }

    await client.query('COMMIT');
    return updatedRequest[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  createRefundRequest,
  getMyRefundRequests,
  getAllRefundRequests,
  processRefundRequest
};