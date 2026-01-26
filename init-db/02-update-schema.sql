-- Миграция для расширения схемы (для совместимости с существующими БД)
-- Этот файл добавляет новые функции и таблицы если их еще нет

-- Добавляем поле description в shopping_lists если его нет
ALTER TABLE shopping_lists ADD COLUMN IF NOT EXISTS description VARCHAR(500) DEFAULT '';
ALTER TABLE shopping_lists ADD COLUMN IF NOT EXISTS is_editable BOOLEAN DEFAULT true;

-- Добавляем поля в items если их нет
ALTER TABLE items ADD COLUMN IF NOT EXISTS purchased_quantity NUMERIC(10,2) DEFAULT 0;
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_editable BOOLEAN DEFAULT true;
ALTER TABLE items ADD COLUMN IF NOT EXISTS notes VARCHAR(255) DEFAULT '';
ALTER TABLE items ADD COLUMN IF NOT EXISTS actual_purchase_price NUMERIC(10,2);

-- Создаем таблицу для отслеживания подсписков если она еще не существует
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

-- Создаем индексы если они еще не существуют
CREATE INDEX IF NOT EXISTS idx_item_purchases_item_id ON item_purchases(item_id);
CREATE INDEX IF NOT EXISTS idx_item_purchases_date ON item_purchases(purchase_date);

-- Создаем функцию для пересчета если она еще не существует
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

-- Удаляем старый триггер если он существует и создаем новый
DROP TRIGGER IF EXISTS trigger_recalculate_purchased ON item_purchases;
CREATE TRIGGER trigger_recalculate_purchased
AFTER INSERT OR UPDATE OR DELETE ON item_purchases
FOR EACH ROW
EXECUTE FUNCTION recalculate_purchased_quantity();

-- Убедимся что пользователь имеет правильные права доступа
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO procurement_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO procurement_user;
