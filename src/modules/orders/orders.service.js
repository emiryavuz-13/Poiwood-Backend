const pool = require('../../config/db');
const ApiError = require('../../utils/ApiError');
const productSvc = require('../products/products.service');
const { sendOrderCreatedEmail, sendOrderPaidEmail, sendOrderShippedEmail } = require('../../utils/mailer');

function generateOrderNumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(16).substring(2, 6).toUpperCase();
  return `POI-${date}-${rand}`;
}

async function generateUniqueOrderNumber(client) {
  let retries = 3;
  while (retries > 0) {
    const orderNumber = generateOrderNumber();
    const { rows: existing } = await client.query(
      'SELECT 1 FROM orders WHERE order_number = $1', [orderNumber]
    );
    if (existing.length === 0) return orderNumber;
    retries--;
  }
  throw ApiError.badRequest('Sipariş numarası oluşturulamadı, tekrar deneyin');
}

// Kupon doğrula ve indirim hesapla
async function applyCoupon(client, couponCode, subtotal) {
  if (!couponCode) return { discountAmount: 0, appliedCode: null };

  const code = couponCode.toUpperCase();
  const { rows: couponRows } = await client.query(
    'SELECT * FROM coupons WHERE code = $1 FOR UPDATE', [code]
  );

  const coupon = couponRows[0];
  if (!coupon) throw ApiError.badRequest('Geçersiz kupon kodu');
  if (!coupon.is_active) throw ApiError.badRequest('Bu kupon artık kullanılamaz');
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) throw ApiError.badRequest('Bu kuponun süresi dolmuş');
  if (coupon.max_uses && coupon.used_count >= coupon.max_uses) throw ApiError.badRequest('Bu kuponun kullanım limiti dolmuş');
  if (subtotal < parseFloat(coupon.min_cart_amount)) throw ApiError.badRequest(`Bu kupon minimum ${coupon.min_cart_amount} TL sepet tutarı gerektirir`);

  let discountAmount;
  if (coupon.discount_type === 'fixed') {
    discountAmount = parseFloat(coupon.discount_amount);
  } else {
    discountAmount = subtotal * (parseFloat(coupon.discount_amount) / 100);
  }
  if (discountAmount > subtotal) discountAmount = subtotal;

  await client.query('UPDATE coupons SET used_count = used_count + 1 WHERE code = $1', [code]);

  return { discountAmount, appliedCode: code };
}

// Sipariş kalemlerini insert et ve stok düş
async function insertItemsAndDeductStock(client, orderId, cartItems) {
  const itemValues = [];
  const itemParams = [];
  let paramIndex = 1;

  for (const item of cartItems) {
    const totalPrice = parseFloat(item.unit_price) * item.quantity;
    itemValues.push(
      `($${paramIndex++},$${paramIndex++},$${paramIndex++},$${paramIndex++},$${paramIndex++},$${paramIndex++},$${paramIndex++},$${paramIndex++},$${paramIndex++})`
    );
    itemParams.push(
      orderId, item.product_id, item.product_name,
      item.product_image_url || null,
      item.selected_width_cm || null, item.selected_height_cm || null,
      item.quantity, item.unit_price, totalPrice.toFixed(2)
    );
  }

  const { rows: items } = await client.query(
    `INSERT INTO order_items (order_id, product_id, product_name, product_image_url,
      selected_width_cm, selected_height_cm, quantity, unit_price, total_price)
     VALUES ${itemValues.join(',')}
     RETURNING *`,
    itemParams
  );

  for (const item of cartItems) {
    await client.query(
      'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2',
      [item.quantity, item.product_id]
    );
  }

  return items;
}

/* ============================================================
   AUTHENTICATED USER — Sipariş oluştur (sepet DB'den)
   ============================================================ */
async function createOrder(userId, {
  address_id, shipping_name, shipping_phone, shipping_address,
  shipping_city, shipping_district, shipping_apartment, customer_note, coupon_code
}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (address_id) {
      const { rows: addressRows } = await client.query(
        'SELECT * FROM user_addresses WHERE id = $1 AND user_id = $2',
        [address_id, userId]
      );
      if (!addressRows[0]) throw ApiError.notFound('Adres bulunamadı');
      const addr = addressRows[0];
      shipping_name = addr.full_name;
      shipping_phone = addr.phone;
      shipping_address = addr.address_line;
      shipping_city = addr.city;
      shipping_district = addr.district;
      shipping_apartment = addr.apartment || 'x';
    }

    const { rows: cartItems } = await client.query(
      `SELECT ci.product_id, ci.quantity, ci.selected_width_cm, ci.selected_height_cm, ci.unit_price,
              p.name AS product_name, p.stock_quantity, p.is_active,
              (SELECT pi.firebase_url FROM product_images pi
               WHERE pi.product_id = p.id AND pi.is_primary = true LIMIT 1) AS product_image_url
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.user_id = $1
       FOR UPDATE OF p`,
      [userId]
    );

    if (cartItems.length === 0) throw ApiError.badRequest('Sepetiniz boş');

    for (const item of cartItems) {
      if (!item.is_active) throw ApiError.badRequest(`${item.product_name} artık satışta değil`);
      if (item.stock_quantity < item.quantity) {
        throw ApiError.badRequest(`${item.product_name} için yeterli stok yok (stok: ${item.stock_quantity}, talep: ${item.quantity})`);
      }
    }

    const subtotal = cartItems.reduce((sum, item) => sum + parseFloat(item.unit_price) * item.quantity, 0);
    const shippingFee = 0;
    const { discountAmount, appliedCode } = await applyCoupon(client, coupon_code, subtotal);
    const totalAmount = subtotal + shippingFee - discountAmount;
    const orderNumber = await generateUniqueOrderNumber(client);

    const { rows: [order] } = await client.query(
      `INSERT INTO orders (order_number, user_id, status,
        shipping_name, shipping_phone, shipping_address,
        shipping_city, shipping_district, shipping_apartment,
        subtotal, shipping_fee, discount_amount, total_amount, customer_note, coupon_code)
       VALUES ($1,$2,'pending',$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING *`,
      [orderNumber, userId, shipping_name, shipping_phone, shipping_address,
       shipping_city, shipping_district || null, shipping_apartment || 'x',
       subtotal.toFixed(2), shippingFee.toFixed(2), discountAmount.toFixed(2), totalAmount.toFixed(2),
       customer_note || null, appliedCode]
    );

    const items = await insertItemsAndDeductStock(client, order.id, cartItems);
    await client.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
    await client.query('COMMIT');

    const { rows: user } = await pool.query('SELECT email FROM users WHERE id = $1', [userId]);
    if (user[0]?.email) sendOrderCreatedEmail(user[0].email, order.order_number, totalAmount.toFixed(2)).catch(e => console.error('Mail gönderilemedi:', e.message));

    return { ...order, items };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/* ============================================================
   GUEST CHECKOUT — Misafir sipariş oluştur (sepet body'den)
   ============================================================ */
async function createGuestOrder({
  guest_email, guest_name, guest_phone,
  shipping_name, shipping_phone, shipping_address,
  shipping_city, shipping_district, shipping_apartment,
  customer_note, coupon_code, cart_items
}) {
  if (!cart_items || cart_items.length === 0) throw ApiError.badRequest('Sepetiniz boş');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Ürün bilgilerini ve stok kilidini al
    const productIds = cart_items.map((i) => i.product_id);
    const { rows: products } = await client.query(
      `SELECT p.*,
              (SELECT pi.firebase_url FROM product_images pi
               WHERE pi.product_id = p.id AND pi.is_primary = true LIMIT 1) AS product_image_url
       FROM products p
       WHERE p.id = ANY($1)
       FOR UPDATE`,
      [productIds]
    );

    const productMap = {};
    for (const p of products) productMap[p.id] = p;

    // Doğrulama + fiyat hesaplama
    const resolvedItems = [];
    for (const item of cart_items) {
      const product = productMap[item.product_id];
      if (!product) throw ApiError.badRequest('Ürün bulunamadı');
      if (!product.is_active) throw ApiError.badRequest(`${product.name} artık satışta değil`);
      if (product.stock_quantity < item.quantity) {
        throw ApiError.badRequest(`${product.name} için yeterli stok yok (stok: ${product.stock_quantity}, talep: ${item.quantity})`);
      }

      // Fiyatı backend'de yeniden hesapla (client'a güvenme)
      let unitPrice;
      if (product.pricing_type === 'fixed') {
        unitPrice = parseFloat(product.sale_price || product.base_price);
      } else {
        unitPrice = await productSvc.computePrice(product, item.selected_width_cm, item.selected_height_cm);
      }

      resolvedItems.push({
        product_id: product.id,
        product_name: product.name,
        product_image_url: product.product_image_url,
        selected_width_cm: item.selected_width_cm || null,
        selected_height_cm: item.selected_height_cm || null,
        quantity: item.quantity,
        unit_price: unitPrice,
        stock_quantity: product.stock_quantity,
      });
    }

    const subtotal = resolvedItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
    const shippingFee = 0;
    const { discountAmount, appliedCode } = await applyCoupon(client, coupon_code, subtotal);
    const totalAmount = subtotal + shippingFee - discountAmount;
    const orderNumber = await generateUniqueOrderNumber(client);

    const { rows: [order] } = await client.query(
      `INSERT INTO orders (order_number, user_id, guest_email, guest_name, guest_phone, status,
        shipping_name, shipping_phone, shipping_address,
        shipping_city, shipping_district, shipping_apartment,
        subtotal, shipping_fee, discount_amount, total_amount, customer_note, coupon_code)
       VALUES ($1, NULL, $2, $3, $4, 'pending', $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       RETURNING *`,
      [orderNumber, guest_email, guest_name, guest_phone,
       shipping_name, shipping_phone, shipping_address,
       shipping_city, shipping_district || null, shipping_apartment || 'x',
       subtotal.toFixed(2), shippingFee.toFixed(2), discountAmount.toFixed(2), totalAmount.toFixed(2),
       customer_note || null, appliedCode]
    );

    const items = await insertItemsAndDeductStock(client, order.id, resolvedItems);
    await client.query('COMMIT');

    sendOrderCreatedEmail(guest_email, order.order_number, totalAmount.toFixed(2)).catch(e => console.error('Mail gönderilemedi:', e.message));

    return { ...order, items };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/* ============================================================
   SIPARIŞ SORGULAMA
   ============================================================ */
async function getOrdersByUser(userId) {
  const { rows } = await pool.query(
    `SELECT o.*,
       (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS item_count
     FROM orders o
     WHERE o.user_id = $1
     ORDER BY o.created_at DESC`,
    [userId]
  );
  return rows;
}

async function getOrderDetail(orderId, userId) {
  const { rows } = await pool.query(
    `SELECT o.*,
            u.email AS user_email,
            u.display_name AS user_name,
            u.phone AS user_phone
     FROM orders o
     LEFT JOIN users u ON o.user_id = u.id
     WHERE o.id = $1 AND ($2::uuid IS NULL OR o.user_id = $2)`,
    [orderId, userId]
  );
  if (!rows[0]) throw ApiError.notFound('Sipariş bulunamadı');

  const { rows: items } = await pool.query(
    'SELECT * FROM order_items WHERE order_id = $1 ORDER BY id',
    [orderId]
  );
  return { ...rows[0], items };
}

// Misafir sipariş takibi: sipariş numarası + email ile
async function getOrderByNumber(orderNumber, email) {
  const { rows } = await pool.query(
    `SELECT * FROM orders WHERE order_number = $1`,
    [orderNumber]
  );
  if (!rows[0]) throw ApiError.notFound('Sipariş bulunamadı');

  // E-posta doğrulama: misafir siparişi için guest_email, üye siparişi için user e-postası
  const order = rows[0];
  const orderEmail = (order.guest_email || '').toLowerCase();
  if (orderEmail !== email) throw ApiError.notFound('Sipariş bulunamadı');

  const { rows: items } = await pool.query(
    'SELECT * FROM order_items WHERE order_id = $1 ORDER BY id',
    [order.id]
  );
  return { ...order, items };
}

async function getAllOrders({ status, page = 1, limit = 20 }) {
  const conditions = [];
  const params = [];
  let i = 1;

  if (status) {
    conditions.push(`o.status = $${i++}`);
    params.push(status);
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const offset = (page - 1) * limit;

  const { rows: orders } = await pool.query(
    `SELECT o.*,
       u.email AS user_email, u.display_name AS user_name,
       COALESCE(u.email, o.guest_email) AS customer_email,
       COALESCE(u.display_name, o.guest_name) AS customer_name,
       (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS item_count
     FROM orders o
     LEFT JOIN users u ON o.user_id = u.id
     ${where}
     ORDER BY o.created_at DESC
     LIMIT $${i++} OFFSET $${i++}`,
    [...params, limit, offset]
  );

  const { rows: countRows } = await pool.query(
    `SELECT COUNT(*) FROM orders o ${where}`, params
  );
  const total = parseInt(countRows[0].count);

  return {
    orders,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

/* ============================================================
   ADMIN İŞLEMLERİ
   ============================================================ */
async function updateOrderStatus(orderId, status, adminNote) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query('SELECT * FROM orders WHERE id = $1', [orderId]);
    if (!rows[0]) throw ApiError.notFound('Sipariş bulunamadı');

    const oldStatus = rows[0].status;

    if (['cancelled', 'refunded'].includes(status) && !['cancelled', 'refunded'].includes(oldStatus)) {
      const { rows: items } = await client.query(
        'SELECT product_id, quantity FROM order_items WHERE order_id = $1', [orderId]
      );
      for (const item of items) {
        if (item.product_id) {
          await client.query(
            'UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2',
            [item.quantity, item.product_id]
          );
        }
      }
    }

    const { rows: updated } = await client.query(
      `UPDATE orders SET status = $1, admin_note = COALESCE($2, admin_note), updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [status, adminNote || null, orderId]
    );

    await client.query('COMMIT');

    if (status === 'paid' && oldStatus === 'pending') {
      const email = updated[0].user_id
        ? (await pool.query('SELECT email FROM users WHERE id = $1', [updated[0].user_id])).rows[0]?.email
        : updated[0].guest_email;
      if (email) sendOrderPaidEmail(email, updated[0].order_number).catch(e => console.error('Mail gönderilemedi:', e.message));
    }

    return updated[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function addTracking(orderId, { cargo_company, cargo_tracking_no }) {
  const { rows } = await pool.query(
    `UPDATE orders
     SET cargo_company = $1, cargo_tracking_no = $2, cargo_updated_at = NOW(),
         status = 'shipped', updated_at = NOW()
     WHERE id = $3
     RETURNING *`,
    [cargo_company, cargo_tracking_no, orderId]
  );
  if (!rows[0]) throw ApiError.notFound('Sipariş bulunamadı');

  const email = rows[0].user_id
    ? (await pool.query('SELECT email FROM users WHERE id = $1', [rows[0].user_id])).rows[0]?.email
    : rows[0].guest_email;
  if (email) sendOrderShippedEmail(email, rows[0].order_number, cargo_company, cargo_tracking_no).catch(e => console.error('Mail gönderilemedi:', e.message));

  return rows[0];
}

async function setMerchantOid(orderId, merchantOid) {
  const { rows } = await pool.query(
    'UPDATE orders SET paytr_merchant_oid = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [merchantOid, orderId]
  );
  return rows[0];
}

async function getOrderByMerchantOid(merchantOid) {
  const { rows } = await pool.query(
    'SELECT * FROM orders WHERE paytr_merchant_oid = $1',
    [merchantOid]
  );
  return rows[0] || null;
}

async function updateOrderPayment(merchantOid, status) {
  const { rows } = await pool.query(
    `UPDATE orders SET status = $1, updated_at = NOW()
     WHERE paytr_merchant_oid = $2 AND status = 'pending'
     RETURNING *`,
    [status, merchantOid]
  );
  return rows[0] || null;
}

module.exports = {
  createOrder, createGuestOrder,
  getOrdersByUser, getOrderDetail, getOrderByNumber,
  getAllOrders, updateOrderStatus, addTracking,
  setMerchantOid, getOrderByMerchantOid, updateOrderPayment,
};
