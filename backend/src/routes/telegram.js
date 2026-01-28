const express = require('express');
const router = express.Router();
const { generateTelegramToken, verifyTelegramToken } = require('../models/auth');
const db = require('../models/database');

/**
 * POST /api/telegram/generate-token
 * Генерация токена для Telegram deep link
 * Требует авторизации администратора
 */
router.post('/generate-token', async (req, res) => {
  try {
    const { telegramId } = req.body;

    if (!telegramId) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_TELEGRAM_ID',
        message: 'Telegram ID не предоставлен'
      });
    }

    // Проверяем что пользователь существует и активен
    const userResult = await db.query(
      'SELECT id FROM authorized_users WHERE telegram_id = $1 AND is_active = true',
      [telegramId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'Пользователь с таким Telegram ID не найден или не активен'
      });
    }

    // Генерируем токен
    const secretKey = process.env.TELEGRAM_TOKEN_SECRET || 'default-secret-key';
    const token = generateTelegramToken(telegramId, secretKey);

    res.json({
      success: true,
      token,
      deepLink: `https://t.me/${process.env.TELEGRAM_BOT_USERNAME}/app?startapp=${token}`
    });

  } catch (error) {
    console.error('❌ Ошибка при генерации токена:', error.message);
    res.status(500).json({
      success: false,
      error: 'TOKEN_GENERATION_ERROR',
      message: 'Ошибка при генерации токена: ' + error.message
    });
  }
});

/**
 * GET /api/telegram/verify-token
 * Проверка токена из Telegram deep link
 * Используется при открытии приложения через deep link
 */
router.get('/verify-token', async (req, res) => {
  try {
    const { startapp: token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_TOKEN',
        message: 'Токен не предоставлен'
      });
    }

    // Проверяем токен
    const secretKey = process.env.TELEGRAM_TOKEN_SECRET || 'default-secret-key';
    const decoded = verifyTelegramToken(token, secretKey);

    if (!decoded || !decoded.telegramId) {
      return res.status(403).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Неверный или просроченный токен'
      });
    }

    // Проверяем что пользователь авторизован
    const userResult = await db.query(
      'SELECT id, telegram_id, username FROM authorized_users WHERE telegram_id = $1 AND is_active = true',
      [decoded.telegramId]
    );

    if (userResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'ACCESS_DENIED',
        message: 'Доступ запрещен. Пользователь не авторизован.'
      });
    }

    res.json({
      success: true,
      authorized: true,
      telegramId: decoded.telegramId,
      user: userResult.rows[0]
    });

  } catch (error) {
    console.error('❌ Ошибка при проверке токена:', error.message);
    res.status(500).json({
      success: false,
      error: 'TOKEN_VERIFICATION_ERROR',
      message: 'Ошибка при проверке токена: ' + error.message
    });
  }
});

/**
 * GET /api/telegram/authorized-users
 * Получение списка авторизованных пользователей
 * Требует авторизации администратора
 */
router.get('/authorized-users', async (req, res) => {
  try {
    // В будущем добавить проверку прав администратора
    const result = await db.query(
      'SELECT id, telegram_id, username, description, is_active, authorized_at FROM authorized_users ORDER BY authorized_at DESC'
    );

    res.json({
      success: true,
      users: result.rows
    });

  } catch (error) {
    console.error('❌ Ошибка при получении списка пользователей:', error.message);
    res.status(500).json({
      success: false,
      error: 'DATABASE_ERROR',
      message: 'Ошибка при получении списка пользователей: ' + error.message
    });
  }
});

module.exports = router;