const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { isTelegramWebApp } = require('../models/auth');

/**
 * GET /api/auth/check
 * Быстрая проверка авторизован ли пользователь
 * Требует запрос из Telegram WebApp
 */
router.get('/check', async (req, res) => {
  try {
    // Проверяем что это запрос из Telegram
    if (!isTelegramWebApp(req)) {
      return res.status(403).json({ 
        success: false,
        authorized: false,
        error: 'UNAUTHORIZED',
        message: 'Доступ только из Telegram WebApp'
      });
    }

    const telegramId = req.headers['x-telegram-id'];

    if (!telegramId) {
      return res.status(401).json({ 
        success: false, 
        authorized: false,
        error: 'MISSING_AUTH'
      });
    }

    const result = await db.query(
      'SELECT id, telegram_id FROM authorized_users WHERE telegram_id = $1 AND is_active = true',
      [telegramId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ 
        success: false,
        authorized: false,
        error: 'ACCESS_DENIED',
        message: 'Доступ запрещен. Ваш Telegram ID не авторизован.'
      });
    }

    res.json({ 
      success: true,
      authorized: true,
      userId: result.rows[0].id
    });

  } catch (error) {
    console.error('❌ Ошибка при проверке авторизации:', error.message);
    res.status(500).json({ 
      success: false,
      authorized: false,
      error: 'AUTH_ERROR',
      message: 'Ошибка: ' + error.message 
    });
  }
});

/**
 * GET /api/auth/me
 * Получает информацию о текущем авторизованном пользователе
 */
router.get('/me', async (req, res) => {
  try {
    // Проверяем что это запрос из Telegram
    if (!isTelegramWebApp(req)) {
      return res.status(403).json({ 
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Доступ только из Telegram WebApp'
      });
    }

    const telegramId = req.headers['x-telegram-id'];

    if (!telegramId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Не авторизован' 
      });
    }

    const result = await db.query(
      'SELECT id, telegram_id, username, authorized_at FROM authorized_users WHERE telegram_id = $1 AND is_active = true',
      [telegramId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ 
        success: false, 
        message: 'Доступ запрещен' 
      });
    }

    res.json({ 
      success: true,
      user: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Ошибка при получении информации о пользователе:', error.message);
    res.status(500).json({ 
      success: false, 
      error: 'AUTH_ERROR',
      message: 'Ошибка: ' + error.message 
    });
  }
});

module.exports = router;
