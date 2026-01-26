-- Добавляем поле для отметки подсписка как купленного
ALTER TABLE item_purchases ADD COLUMN IF NOT EXISTS is_purchased BOOLEAN DEFAULT false;
ALTER TABLE item_purchases ADD COLUMN IF NOT EXISTS purchased_at TIMESTAMP;

-- Создаем индекс для быстрого поиска купленных подсписков
CREATE INDEX IF NOT EXISTS idx_item_purchases_purchased ON item_purchases(item_id, is_purchased);
