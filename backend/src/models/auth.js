const db = require('./database');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

/**
 * Проверяет что запрос приходит из Telegram WebApp контекста
 * Telegram клиент всегда отправляет X-Telegram-WebApp заголовок
 */
const isTelegramWebApp = (req) => {
  // Проверяем специальный заголовок который отправляет Telegram
  const isTg = req.headers['x-telegram-webapp'] ||
               req.headers['user-agent']?.includes('Telegram') ||
               req.headers['x-telegram-id'];

  return !!isTg;
};

/**
 * Валидация подписи initData от Telegram
 */
const validateTelegramInitData = (initData, botToken) => {
  try {
    const secretKey = crypto.createHash('sha256').update(botToken).digest();
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    params.delete('hash');

    // Сортируем параметры
    const sortedParams = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Создаем HMAC
    const hmac = crypto.createHmac('sha256', secretKey)
      .update(sortedParams)
      .digest('hex');

    return hmac === hash;
  } catch (error) {
    console.error('Ошибка валидации initData:', error);
    return false;
  }
};

/**
 * Генерация JWT токена для Telegram deep links
 */
const generateTelegramToken = (telegramId, secretKey) => {
  return jwt.sign(
    { telegramId, exp: Math.floor(Date.now() / 1000) + (60 * 15) }, // 15 минут
    secretKey
  );
};

/**
 * Проверка JWT токена из deep links
 */
const verifyTelegramToken = (token, secretKey) => {
  try {
    return jwt.verify(token, secretKey);
  } catch (error) {
    console.error('Ошибка проверки токена:', error);
    return null;
  }
};

/**
 * Middleware для проверки авторизации через Telegram ID
 * Ожидает telegram_id в заголовке X-Telegram-Id
 * Отклоняет запросы из браузера (не из Telegram)
 */
const authMiddleware = async (req, res, next) => {
  try {
    const telegramId = req.headers['x-telegram-id'];

    // Проверяем что это запрос из Telegram WebApp
    if (!isTelegramWebApp(req)) {
      return res.status(403).json({ 
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Доступ только из Telegram. Откройте приложение через бота в Telegram.' 
      });
    }

    if (!telegramId) {
      return res.status(401).json({ 
        success: false, 
        error: 'MISSING_AUTH',
        message: 'Телеграм ID не передан. Требуется авторизация через Telegram.' 
      });
    }

    // Проверяем что пользователь есть в таблице авторизованных
    const authResult = await db.query(
      'SELECT id, telegram_id, username FROM authorized_users WHERE telegram_id = $1 AND is_active = true',
      [telegramId]
    );

    if (authResult.rows.length === 0) {
      return res.status(403).json({ 
        success: false, 
        error: 'ACCESS_DENIED',
        message: 'Доступ запрещен. Ваш Telegram ID не авторизован.' 
      });
    }

    const authUser = authResult.rows[0];
    
    // Гарантируем что у этого пользователя есть запись в таблице users
    // (нужна для relationships в items, lists и т.д.)
    const username = authUser.username || `user_${authUser.telegram_id}`;
    const userResult = await db.query(
      `INSERT INTO users (username, telegram_id) 
       VALUES ($1, $2)
       ON CONFLICT (telegram_id) DO UPDATE 
       SET username = EXCLUDED.username
       RETURNING id, username, telegram_id`,
      [username, telegramId]
    );

    const user = userResult.rows[0];

    // Сохраняем информацию о пользователе в request
    req.user = {
      id: user.id,
      telegram_id: user.telegram_id,
      username: user.username,
      authorized_user_id: authUser.id
    };
    
    next();
  } catch (error) {
    console.error('❌ Ошибка авторизации:', error.message);
    res.status(500).json({ 
      success: false, 
      error: 'AUTH_ERROR',
      message: 'Ошибка авторизации: ' + error.message 
    });
  }
};

module.exports = {
  authMiddleware,
  isTelegramWebApp,
  validateTelegramInitData,
  generateTelegramToken,
  verifyTelegramToken
};
