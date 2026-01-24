const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'postgres',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'procurement_db',
  user: process.env.POSTGRES_USER || 'procurement_user',
  password: process.env.DB_PASSWORD || 'procurement_password_123',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Тестовое соединение
pool.on('connect', () => {
  console.log('✅ Подключение к PostgreSQL установлено');
});

pool.on('error', (err) => {
  console.error('❌ Ошибка PostgreSQL:', err.message);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  end: () => pool.end(),
};
