-- Добавляем колонку для частичной покупки
ALTER TABLE items ADD COLUMN IF NOT EXISTS purchased_quantity NUMERIC(10,2) DEFAULT 0;

-- Обновляем существующие записи
UPDATE items SET purchased_quantity = quantity WHERE is_bought = true;
UPDATE items SET purchased_quantity = 0 WHERE is_bought = false;

-- Обновляем логику is_bought
UPDATE items SET is_bought = (purchased_quantity >= quantity);
