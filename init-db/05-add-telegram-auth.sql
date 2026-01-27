-- ===== ТАБЛИЦА ДЛЯ АВТОРИЗОВАННЫХ ПОЛЬЗОВАТЕЛЕЙ =====
-- Автоматически создается при поднятии сервера
-- Содержит только Telegram ID тех, кому разрешен доступ

CREATE TABLE IF NOT EXISTS authorized_users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(100),
    description VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    authorized_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    authorized_by VARCHAR(100) DEFAULT 'system'
);

-- Индекс для быстрого поиска по telegram_id
CREATE INDEX IF NOT EXISTS idx_authorized_users_telegram_id ON authorized_users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_authorized_users_active ON authorized_users(is_active);

-- ===== НАЧАЛЬНЫЕ АВТОРИЗОВАННЫЕ ПОЛЬЗОВАТЕЛИ =====
-- Добавьте здесь telegram_id пользователей которым разрешен доступ
-- Узнать свой telegram_id можно у @userinfobot в Telegram
INSERT INTO authorized_users (telegram_id, username, description) 
VALUES 
  (123456789, 'admin', 'Default admin user')
ON CONFLICT (telegram_id) DO NOTHING;

-- ===== УПРАВЛЕНИЕ ДОСТУПОМ О ЧЕРЕЗ SQL =====
-- Чтобы добавить нового пользователя:
--   INSERT INTO authorized_users (telegram_id, username, description) 
--   VALUES (telegram_id_пользователя, 'имя', 'описание');
--
-- Чтобы проверить всех авторизованных:
--   SELECT * FROM authorized_users WHERE is_active = true;
--
-- Чтобы запретить доступ:
--   UPDATE authorized_users SET is_active = false WHERE telegram_id = 123456789;
--
-- Чтобы удалить пользователя:
--   DELETE FROM authorized_users WHERE telegram_id = 123456789;
