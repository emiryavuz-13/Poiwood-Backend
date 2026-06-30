const { Pool } = require('pg');

// SSL'i NODE_ENV'e değil, açık bir bayrağa bağla.
// DB_SSL=true verilmedikçe SSL kapalı (SSL desteklemeyen Postgres'ler için).
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

pool.on('error', (err) => {
  console.error('PostgreSQL bağlantı hatası:', err);
});

module.exports = pool;
