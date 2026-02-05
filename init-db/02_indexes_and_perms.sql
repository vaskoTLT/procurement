
-- Индексы для ускорения выборок
CREATE INDEX idx_lists_owner ON shopping_lists(owner_email);
CREATE INDEX idx_items_list ON shopping_items(list_id);
CREATE INDEX idx_items_parent ON shopping_items(parent_id);
CREATE INDEX idx_shares_user ON share_access(user_email);

-- Пример создания роли для приложения (опционально)
-- CREATE ROLE shopping_app_user WITH LOGIN PASSWORD 'your_secure_password';
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO shopping_app_user;
