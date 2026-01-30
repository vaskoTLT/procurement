const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const db = require('./models/database');
const authRouter = require('./routes/auth');
const telegramRouter = require('./routes/telegram');
const listsRouter = require('./routes/lists');
const itemsRouter = require('./routes/items');
const productPresetsRouter = require('./routes/productPresets');
const dishesRouter = require('./routes/dishes');
const { authMiddleware } = require('./models/auth');
const { startPeriodicSync, manualSync } = require('./models/syncUsers');

const app = express();
const port = process.env.PORT || 3002;

// Trust proxy (Traefik)
app.set('trust proxy', true);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || origin.includes('procurement.fros-ty.com') || origin.includes('localhost')) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Forwarded-For', 'X-Forwarded-Proto']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Публичные Auth Routes (без проверки авторизации)
app.use('/api/auth', authRouter);
app.use('/api/telegram', telegramRouter);

// Защищенные Routes (требуют авторизацию)
app.use('/api/lists', authMiddleware, listsRouter);
app.use('/api/items', authMiddleware, itemsRouter);
app.use('/api/product-presets', authMiddleware, productPresetsRouter);
app.use('/api/dishes', authMiddleware, dishesRouter);

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

// Инициализация базы данных и запуск миграций
async function initializeDatabase() {
  try {
    console.log('📊 Инициализация базы данных...');
    
    // Проверяем и добавляем поле telegram_id в users если его еще нет
    try {
      await db.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS telegram_id BIGINT UNIQUE;
      `);
      console.log('✅ Поле telegram_id в таблице users готово');
    } catch (error) {
      console.log('ℹ️ Поле telegram_id в таблице users уже существует');
    }
    
    // Проверяем есть ли таблица authorized_users
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'authorized_users'
      )
    `);

    const authorizedUsersExists = tableCheck.rows[0].exists;

    if (!authorizedUsersExists) {
      console.log('⚡ Таблица authorized_users не найдена. Выполняем миграцию...');
      
      // Читаем SQL файл миграции
      const migrationPath = path.join(__dirname, '../../init-db/05-add-telegram-auth.sql');
      
      if (fs.existsSync(migrationPath)) {
        const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
        
        // Выполняем миграцию
        await db.query(migrationSQL);
        console.log('✅ Миграция авторизации выполнена успешно');
      } else {
        console.warn('⚠️ Файл миграции не найден:', migrationPath);
      }
    } else {
      console.log('✅ Таблица authorized_users уже существует');
    }
    
    // Проверяем есть ли авторизованные пользователи
    const usersCheck = await db.query(
      'SELECT COUNT(*) as count FROM authorized_users WHERE is_active = true'
    );
    
    const authorizedCount = usersCheck.rows[0].count;
    if (authorizedCount === 0) {
      console.warn('⚠️ ВНИМАНИЕ: Нет авторизованных пользователей!');
      console.warn('⚠️ Добавьте первого пользователя используя SQL:');
      console.warn('⚠️ docker exec -it procurement-db psql -U procurement_user -d procurement_db');
      console.warn('⚠️ INSERT INTO authorized_users (telegram_id, username) VALUES (your_telegram_id, \'your_name\');');
    } else {
      console.log(`✅ Авторизованных пользователей: ${authorizedCount}`);
    }
    
    // Проверяем существование таблицы dish_products
    const dishProductsCheck = await db.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'dish_products'
      )
    `);

    const dishProductsExists = dishProductsCheck.rows[0].exists;

    if (!dishProductsExists) {
      console.log('⚡ Таблица dish_products не найдена. Выполняем миграцию...');
      
      // Читаем SQL файл миграции
      const dishProductsMigrationPath = path.join(__dirname, '../../init-db/06-add-dish-products.sql');
      
      if (fs.existsSync(dishProductsMigrationPath)) {
        const migrationSQL = fs.readFileSync(dishProductsMigrationPath, 'utf-8');
        
        // Выполняем миграцию
        await db.query(migrationSQL);
        console.log('✅ Миграция dish_products выполнена успешно');
      } else {
        console.warn('⚠️ Файл миграции dish_products не найден:', dishProductsMigrationPath);
      }
    } else {
      console.log('✅ Таблица dish_products уже существует');
    }

    // Проверяем существование таблиц
    const tables = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log(`✅ Таблицы в БД: ${tables.rows.map(t => t.table_name).join(', ')}`);
  } catch (error) {
    console.error('❌ Ошибка инициализации БД:', error.message);
    // Не прерываем работу сервера, он может работать с существующей структурой
  }
}

// API endpoint для ручной синхронизации
app.post('/api/sync-users', async (req, res) => {
  try {
    const result = await manualSync();
    res.json(result);
  } catch (error) {
    console.error('❌ Ошибка ручной синхронизации:', error.message);
    res.status(500).json({
      success: false,
      error: 'SYNC_ERROR',
      message: 'Ошибка синхронизации пользователей: ' + error.message
    });
  }
});

// Запуск сервера
async function startServer() {
  try {
    // Проверяем подключение к БД
    console.log('🔌 Проверяем подключение к PostgreSQL...');
    await db.query('SELECT 1');
    console.log('✅ Подключение к PostgreSQL успешно');

    // Инициализируем БД
    await initializeDatabase();

    // Запускаем периодическую синхронизацию пользователей
    startPeriodicSync();

    // Запускаем сервер
    app.listen(port, () => {
      console.log(`🚀 Сервер запущен на порту ${port}`);
      console.log(`📊 Health check: http://localhost:${port}/api/health`);
      console.log(`📊 DB test: http://localhost:${port}/api/db-test`);
      console.log(`📊 Lists API: http://localhost:${port}/api/lists`);
      console.log(`🔄 Синхронизация пользователей: http://localhost:${port}/api/sync-users`);
    });
  } catch (error) {
    console.error('❌ Не удалось запустить сервер:', error.message);
    process.exit(1);
  }
}

startServer();
