-- Создание пользователя (если не существует)
CREATE USER IF NOT EXISTS procurement_user WITH PASSWORD 'procurement_password_123';
ALTER ROLE procurement_user WITH LOGIN;

-- Создание таблицы users
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    telegram_id BIGINT UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы shopping_lists
CREATE TABLE IF NOT EXISTS shopping_lists (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    is_public BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы items
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
);

-- Создание таблицы list_participants
CREATE TABLE IF NOT EXISTS list_participants (
    list_id INTEGER REFERENCES shopping_lists(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (list_id, user_id)
);

-- Создание индексов для ускорения запросов
CREATE INDEX IF NOT EXISTS idx_items_list_id ON items(list_id);
CREATE INDEX IF NOT EXISTS idx_items_is_bought ON items(is_bought);
CREATE INDEX IF NOT EXISTS idx_lists_created_by ON shopping_lists(created_by);

-- Вставляем тестового пользователя
INSERT INTO users (username) VALUES ('test_user')
ON CONFLICT (username) DO NOTHING;

-- Выдаём права пользователю procurement_user
GRANT USAGE ON SCHEMA public TO procurement_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO procurement_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO procurement_user;

-- Выдаём права на таблицы явно
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO procurement_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON shopping_lists TO procurement_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON items TO procurement_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON list_participants TO procurement_user;

-- Выдаём права на последовательности для ID
GRANT USAGE, SELECT ON users_id_seq TO procurement_user;
GRANT USAGE, SELECT ON shopping_lists_id_seq TO procurement_user;
GRANT USAGE, SELECT ON items_id_seq TO procurement_user;
