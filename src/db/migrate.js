const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

async function runMigrations() {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir).sort();

  // Migration takip tablosu
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  for (const file of files) {
    if (!file.endsWith('.sql')) continue;

    const { rows } = await pool.query('SELECT id FROM _migrations WHERE filename = $1', [file]);
    if (rows.length > 0) {
      console.log(`[SKIP] ${file}`);
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    await pool.query(sql);
    await pool.query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
    console.log(`[OK]   ${file}`);
  }

  console.log('Migrations tamamlandı.');
}

module.exports = runMigrations;
