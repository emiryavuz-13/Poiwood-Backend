require('dotenv').config();
const app = require('./app');
const pool = require('./src/config/db');
const runMigrations = require('./src/db/migrate');

const PORT = process.env.PORT || 5000;

// Yakalanmamış hataların sunucuyu çökertmesini önle
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

// Sunucu neden kapanıyor bulmak için
process.on('exit', (code) => {
  console.error(`[EXIT] Process kapandı, exit code: ${code}`);
});

process.on('SIGTERM', () => {
  console.error('[SIGNAL] SIGTERM alındı');
});

process.on('SIGINT', () => {
  console.error('[SIGNAL] SIGINT alındı (Ctrl+C)');
  process.exit(0);
});

async function start() {
  try {
    await pool.query('SELECT 1');
    console.log('PostgreSQL bağlantısı OK');

    await runMigrations();

    app.listen(PORT, () => {
      console.log(`Poiwood Backend çalışıyor: http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Sunucu başlatılamadı:', err);
    process.exit(1);
  }
}

start();
