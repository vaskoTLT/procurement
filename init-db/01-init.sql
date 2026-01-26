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
    description VARCHAR(500) DEFAULT '',
    is_editable BOOLEAN DEFAULT true,
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
    purchased_quantity NUMERIC(10,2) DEFAULT 0,
    unit VARCHAR(10) DEFAULT 'pcs',
    price NUMERIC(10,2) DEFAULT 0,
    category VARCHAR(100),
    notes VARCHAR(255) DEFAULT '',
    actual_purchase_price NUMERIC(10,2),
    is_bought BOOLEAN DEFAULT false,
    is_editable BOOLEAN DEFAULT true,
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

-- Создание таблицы item_purchases (подсписки)
CREATE TABLE IF NOT EXISTS item_purchases (
    id SERIAL PRIMARY KEY,
    item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    quantity NUMERIC(10,2) NOT NULL,
    price_per_unit NUMERIC(10,2),
    purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание индексов для ускорения запросов
CREATE INDEX IF NOT EXISTS idx_items_list_id ON items(list_id);
CREATE INDEX IF NOT EXISTS idx_items_is_bought ON items(is_bought);
CREATE INDEX IF NOT EXISTS idx_lists_created_by ON shopping_lists(created_by);
CREATE INDEX IF NOT EXISTS idx_item_purchases_item_id ON item_purchases(item_id);
CREATE INDEX IF NOT EXISTS idx_item_purchases_date ON item_purchases(purchase_date);

-- Функция для автоматического пересчета купленного количества
CREATE OR REPLACE FUNCTION recalculate_purchased_quantity()
RETURNS TRIGGER AS $$
BEGIN
    -- Пересчитываем общее купленное количество из подсписков
    UPDATE items 
    SET purchased_quantity = COALESCE((
        SELECT SUM(quantity) FROM item_purchases WHERE item_id = NEW.item_id
    ), 0),
    is_bought = (
        COALESCE((SELECT SUM(quantity) FROM item_purchases WHERE item_id = NEW.item_id), 0) >= quantity
    ),
    updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.item_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического пересчета при добавлении/удалении подсписков
DROP TRIGGER IF EXISTS trigger_recalculate_purchased ON item_purchases;
CREATE TRIGGER trigger_recalculate_purchased
AFTER INSERT OR UPDATE OR DELETE ON item_purchases
FOR EACH ROW
EXECUTE FUNCTION recalculate_purchased_quantity();

-- Даем пользователю доступ ко всем таблицам
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO procurement_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO procurement_user;

-- Вставляем тестового пользователя если его еще нет
INSERT INTO users (username, telegram_id) 
VALUES ('test_user', NULL)
ON CONFLICT (username) DO NOTHING;
