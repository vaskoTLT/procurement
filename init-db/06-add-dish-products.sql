-- Создание таблицы dish_products для связи блюд с продуктами
CREATE TABLE IF NOT EXISTS dish_products (
    id SERIAL PRIMARY KEY,
    dish_item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    product_item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    quantity NUMERIC(10,2) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(dish_item_id, product_item_id)
);

-- Создание индексов для ускорения запросов
CREATE INDEX IF NOT EXISTS idx_dish_products_dish_id ON dish_products(dish_item_id);
CREATE INDEX IF NOT EXISTS idx_dish_products_product_id ON dish_products(product_item_id);

-- Даем пользователю доступ к новой таблице
GRANT ALL PRIVILEGES ON TABLE dish_products TO procurement_user;
GRANT ALL PRIVILEGES ON SEQUENCE dish_products_id_seq TO procurement_user;