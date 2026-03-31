const pool = require('../../config/db');

async function getSummary() {
  // 1. Toplam sipariş sayısı ve toplam ciro (sadece başarılı ödemeler)
  const { rows: revenue } = await pool.query(`
    SELECT
      COUNT(*) as total_orders,
      COALESCE(SUM(total_amount), 0) as total_revenue
    FROM orders
    WHERE status NOT IN ('pending', 'cancelled', 'refunded')
  `);

  // 2. Kullanıcı sayısı
  const { rows: users } = await pool.query(`
    SELECT COUNT(*) as total_users FROM users WHERE role = 'customer'
  `);

  // 3. Ürün sayısı
  const { rows: products } = await pool.query(`
    SELECT COUNT(*) as total_products FROM products
  `);

  // 4. Bekleyen Yorumlar
  const { rows: pendingReviews } = await pool.query(`
    SELECT COUNT(*) as pending_reviews FROM reviews WHERE is_approved = false
  `);

  // 5. Cevaplanmamış Sorular
  const { rows: pendingQuestions } = await pool.query(`
    SELECT COUNT(*) as pending_questions FROM product_questions WHERE answer_text IS NULL
  `);

  return {
    total_revenue: parseFloat(revenue[0].total_revenue),
    total_orders: parseInt(revenue[0].total_orders),
    total_users: parseInt(users[0].total_users),
    total_products: parseInt(products[0].total_products),
    pending_reviews: parseInt(pendingReviews[0].pending_reviews),
    pending_questions: parseInt(pendingQuestions[0].pending_questions),
  };
}

// Son Gelen Siparişler (Dashboard'da hızlı bakış)
async function getRecentOrders(limit = 10) {
  const { rows } = await pool.query(`
    SELECT o.id, o.order_number, o.total_amount, o.status, o.created_at,
           u.display_name as user_name, u.email as user_email
    FROM orders o
    JOIN users u ON o.user_id = u.id
    ORDER BY o.created_at DESC
    LIMIT $1
  `, [limit]);
  return rows;
}

// En Çok Satan Ürünler
async function getTopSellingProducts(limit = 5) {
  const { rows } = await pool.query(`
    SELECT p.id, p.name, p.slug,
           (SELECT firebase_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true LIMIT 1) as image,
           COALESCE(SUM(oi.quantity), 0) as total_sold
    FROM products p
    JOIN order_items oi ON oi.product_id = p.id
    JOIN orders o ON oi.order_id = o.id
    WHERE o.status NOT IN ('pending', 'cancelled', 'refunded')
    GROUP BY p.id, p.name, p.slug
    ORDER BY total_sold DESC
    LIMIT $1
  `, [limit]);
  return rows.map(r => ({ ...r, total_sold: parseInt(r.total_sold) }));
}

// Son 7 Günlük Toplam Gelir ve Sipariş (Grafik İçin)
async function getWeeklyChart() {
  const { rows } = await pool.query(`
    SELECT
      DATE(created_at) as date,
      COUNT(*) as daily_orders,
      COALESCE(SUM(total_amount), 0) as daily_revenue
    FROM orders
    WHERE created_at >= CURRENT_DATE - INTERVAL '6 days'
      AND status NOT IN ('pending', 'cancelled', 'refunded')
    GROUP BY DATE(created_at)
    ORDER BY DATE(created_at) ASC;
  `);

  return rows.map(r => ({
    date: r.date,
    daily_orders: parseInt(r.daily_orders),
    daily_revenue: parseFloat(r.daily_revenue)
  }));
}

module.exports = {
  getSummary,
  getRecentOrders,
  getTopSellingProducts,
  getWeeklyChart
};