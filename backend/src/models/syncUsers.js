const { Pool } = require('pg');
const db = require('./database');

// Конфигурация для подключения к supabase-db
const supabaseConfig = {
  host: 'supabase-db',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: '', // нет пароля для локального подключения
  max: 5,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
};

// Создаем отдельный пул для supabase
const supabasePool = new Pool(supabaseConfig);

// Флаг для отслеживания последней синхронизации
let lastSyncTime = null;
const SYNC_INTERVAL_MINUTES = 1; // Синхронизация раз в минуту

/**
 * Синхронизация пользователей из supabase-db в procurement-db
 * Добавляет только новые telegram_id, не обновляет существующие
 */
async function syncUsersFromSupabase() {
  try {
    console.log('🔄 Начало синхронизации пользователей из supabase-db...');

    // Проверяем время последней синхронизации
    const currentTime = new Date();
    if (lastSyncTime && (currentTime - lastSyncTime) < (SYNC_INTERVAL_MINUTES * 60 * 1000)) {
      console.log('⏳ Синхронизация пропущена (еще не прошло достаточно времени)');
      return;
    }

    // Проверяем подключение к supabase
    let supabaseClient;
    try {
      supabaseClient = await supabasePool.connect();
      console.log('✅ Подключение к supabase-db успешно');
    } catch (error) {
      console.warn('⚠️ Не удалось подключиться к supabase-db:', error.message);
      console.log('🔄 Продолжаем работу без синхронизации');
      return;
    }

    // Получаем все telegram_id из supabase
    const supabaseResult = await supabaseClient.query(
      'SELECT telegram_id FROM public.n8n_registration WHERE telegram_id IS NOT NULL'
    );

    const supabaseTelegramIds = supabaseResult.rows
      .map(row => row.telegram_id)
      .filter(id => id !== null && id !== undefined);

    console.log(`📊 Найдено ${supabaseTelegramIds.length} Telegram ID в supabase`);

    // Получаем текущие telegram_id из procurement-db
    const currentResult = await db.query(
      'SELECT telegram_id FROM authorized_users'
    );

    const currentTelegramIds = currentResult.rows
      .map(row => row.telegram_id);

    console.log(`📊 Найдено ${currentTelegramIds.length} Telegram ID в procurement`);

    // Находим новые telegram_id, которые нужно добавить
    const newTelegramIds = supabaseTelegramIds.filter(
      id => !currentTelegramIds.includes(id)
    );

    if (newTelegramIds.length === 0) {
      console.log('✅ Нет новых пользователей для добавления');
      lastSyncTime = currentTime;
      supabaseClient.release();
      return;
    }

    console.log(`🆕 Найдено ${newTelegramIds.length} новых пользователей для добавления`);

    // Добавляем новых пользователей
    for (const telegramId of newTelegramIds) {
      try {
        await db.query(
          `INSERT INTO authorized_users (telegram_id, username, description, is_active)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (telegram_id) DO NOTHING`,
          [telegramId, `user_${telegramId}`, 'Auto-sync from supabase', true]
        );
        console.log(`✅ Добавлен пользователь с Telegram ID: ${telegramId}`);
      } catch (error) {
        console.error(`❌ Ошибка при добавлении пользователя ${telegramId}:`, error.message);
      }
    }

    lastSyncTime = currentTime;
    supabaseClient.release();
    console.log('🔄 Синхронизация пользователей завершена успешно');

  } catch (error) {
    console.error('❌ Ошибка синхронизации пользователей:', error.message);
    // Не прерываем работу основного приложения
  }
}

/**
 * Проверка и синхронизация при запросе к authorized_users
 * Вызывается перед каждым запросом к таблице authorized_users
 */
async function syncOnDemand() {
  try {
    // Проверяем, прошло ли достаточно времени с последней синхронизации
    const currentTime = new Date();
    const shouldSync = !lastSyncTime ||
                      (currentTime - lastSyncTime) >= (SYNC_INTERVAL_MINUTES * 60 * 1000);

    if (shouldSync) {
      await syncUsersFromSupabase();
    }
  } catch (error) {
    console.error('❌ Ошибка синхронизации по требованию:', error.message);
  }
}

/**
 * Периодическая синхронизация
 * Запускается раз в минуту
 */
function startPeriodicSync() {
  console.log('⏰ Запуск периодической синхронизации пользователей...');

  // Первая синхронизация сразу
  syncUsersFromSupabase();

  // Затем каждую минуту
  setInterval(() => {
    syncUsersFromSupabase();
  }, SYNC_INTERVAL_MINUTES * 60 * 1000);
}

/**
 * Ручная синхронизация
 * Может быть вызвана из API или CLI
 */
async function manualSync() {
  console.log('🔄 Запуск ручной синхронизации...');
  await syncUsersFromSupabase();
  return { success: true, message: 'Синхронизация завершена' };
}

module.exports = {
  syncUsersFromSupabase,
  syncOnDemand,
  startPeriodicSync,
  manualSync
};