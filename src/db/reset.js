require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const pool = require('../config/db');

async function resetDatabase() {
  console.log('Veritabanı sıfırlanıyor...\n');

  // Tüm tabloları sırayla drop et (foreign key bağımlılık sırasına göre)
  const tables = [
    'refund_requests',
    'review_images',
    'reviews',
    'product_questions',
    'order_items',
    'orders',
    'cart_items',
    'favorites',
    'user_addresses',
    'coupons',
    'product_images',
    'products',
    'categories',
    'users',
    '_migrations',
  ];

  for (const table of tables) {
    await pool.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
    console.log(`  [DROP] ${table}`);
  }

  // Trigger fonksiyonunu da temizle
  await pool.query('DROP FUNCTION IF EXISTS trigger_set_updated_at() CASCADE');
  console.log('  [DROP] trigger_set_updated_at()\n');

  console.log('Veritabanı sıfırlandı.');
  await pool.end();
}

resetDatabase().catch(err => {
  console.error('Reset hatası:', err);
  process.exit(1);
});
