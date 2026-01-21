import express from 'express';
import pkg from 'pg';
const { Pool } = pkg;
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@db:5432/shopmaster'
});

// Инициализация таблицы
const initDb = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shopping_data (
        id SERIAL PRIMARY KEY,
        key TEXT UNIQUE,
        content JSONB,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Database initialized');
  } catch (err) {
    console.error('DB Init Error:', err);
  }
};
initDb();

const STORAGE_KEY = 'global_shared_state';

app.get('/api/data', async (req, res) => {
  try {
    const result = await pool.query('SELECT content FROM shopping_data WHERE key = $1', [STORAGE_KEY]);
    res.json(result.rows[0]?.content || { activeLists: [], history: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/data', async (req, res) => {
  try {
    const { activeLists, history } = req.body;
    await pool.query(`
      INSERT INTO shopping_data (key, content, updated_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      ON CONFLICT (key) DO UPDATE SET content = $2, updated_at = CURRENT_TIMESTAMP
    `, [STORAGE_KEY, { activeLists, history }]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => console.log('Backend running on port 3000'));
