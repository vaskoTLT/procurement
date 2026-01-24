const express = require('express');
const cors = require('cors');
const db = require('./models/database');
const listsRouter = require('./routes/lists');
const itemsRouter = require('./routes/items');

const app = express();
const port = process.env.PORT || 3000;

// Trust proxy (Traefik)
app.set('trust proxy', true);

// CORS configuration for Traefik
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests from the same domain (Traefik will handle the request)
    // Also allow requests without origin (mobile apps, curl requests)
    if (!origin || origin.includes('procurement.fros-ty.com') || origin.includes('localhost')) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins for now, can be restricted later
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Forwarded-For', 'X-Forwarded-Proto']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api/lists', listsRouter);
app.use('/api/items', itemsRouter);

// Health check - for Traefik healthchecks
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// API Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Procurement API',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// DB test endpoint
app.get('/api/db-test', async (req, res) => {
  try {
    const result = await db.query('SELECT version()');
    res.json({
      success: true,
      message: 'Database connected',
      version: result.rows[0].version
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Инициализация базы данных
async function initializeDatabase() {
  try {
    console.log('📊 Проверяем существующие таблицы...');
    
    // Проверяем существование таблиц
    const tables = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log(`✅ Найдено таблиц: ${tables.rows.length}`);
    
    if (tables.rows.length === 0) {
      console.log('🔄 Создаем таблицы...');
      // Создаем простую схему
      await db.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      await db.query(`
        CREATE TABLE IF NOT EXISTS shopping_lists (
          id SERIAL PRIMARY KEY,
          name VARCHAR(200) NOT NULL,
          is_public BOOLEAN DEFAULT true,
          created_by INTEGER REFERENCES users(id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      await db.query(`
        CREATE TABLE IF NOT EXISTS items (
          id SERIAL PRIMARY KEY,
          list_id INTEGER REFERENCES shopping_lists(id) ON DELETE CASCADE,
          name VARCHAR(200) NOT NULL,
          quantity NUMERIC(10,2) DEFAULT 1,
          unit VARCHAR(10) DEFAULT 'pcs',
          price NUMERIC(10,2) DEFAULT 0,
          category VARCHAR(100),
          is_bought BOOLEAN DEFAULT false,
          added_by INTEGER REFERENCES users(id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Создаем тестового пользователя
      await db.query(`
        INSERT INTO users (username) 
        VALUES ('test_user')
        ON CONFLICT (username) DO NOTHING
      `);
      
      console.log('✅ База данных инициализирована');
    }
  } catch (error) {
    console.error('❌ Ошибка инициализации БД:', error.message);
  }
}

// Запуск сервера
async function startServer() {
  try {
    // Проверяем подключение к БД
    console.log('🔌 Проверяем подключение к PostgreSQL...');
    await db.query('SELECT 1');
    console.log('✅ Подключение к PostgreSQL успешно');
    
    // Инициализируем БД
    await initializeDatabase();
    
    // Запускаем сервер
    app.listen(port, () => {
      console.log(`🚀 Сервер запущен на порту ${port}`);
      console.log(`📊 Health check: http://localhost:${port}/api/health`);
      console.log(`📊 DB test: http://localhost:${port}/api/db-test`);
    });
  } catch (error) {
    console.error('❌ Не удалось запустить сервер:', error.message);
    process.exit(1);
  }
}

startServer();
