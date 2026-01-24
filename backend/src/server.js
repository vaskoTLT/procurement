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
    console.log('📊 Проверяем таблицы...');
    
    // Проверяем существование таблиц
    const tables = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log(`✅ Таблицы в БД: ${tables.rows.map(t => t.table_name).join(', ')}`);
  } catch (error) {
    console.error('❌ Ошибка проверки БД:', error.message);
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
