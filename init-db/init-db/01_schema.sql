
-- Создание расширения для генерации UUID, если оно еще не установлено
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Таблица пользователей
CREATE TABLE users (
    email VARCHAR(255) PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- Рекомендуется хранить bcrypt хеш
    is_admin BOOLEAN DEFAULT FALSE,
    created_at BIGINT NOT NULL -- Используем BIGINT для JS Date.now()
);

-- Таблица списков покупок
CREATE TABLE shopping_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at BIGINT NOT NULL,
    owner_email VARCHAR(255) REFERENCES users(email) ON DELETE CASCADE,
    is_pinned BOOLEAN DEFAULT FALSE
);

-- Таблица элементов списка (поддерживает древовидную структуру)
CREATE TABLE shopping_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    list_id UUID NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES shopping_items(id) ON DELETE CASCADE, -- Для вложенных групп
    name VARCHAR(255) NOT NULL,
    quantity DECIMAL NOT NULL DEFAULT 1,
    unit VARCHAR(20) NOT NULL, -- pcs, kg, g, l, ml
    price DECIMAL NOT NULL DEFAULT 0,
    is_bought BOOLEAN DEFAULT FALSE,
    category VARCHAR(100),
    is_group BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0 -- Для сохранения порядка отображения
);

-- Таблица прав доступа
CREATE TABLE share_access (
    list_id UUID NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
    user_email VARCHAR(255) NOT NULL REFERENCES users(email) ON DELETE CASCADE,
    access_level VARCHAR(20) NOT NULL CHECK (access_level IN ('view', 'edit')),
    PRIMARY KEY (list_id, user_email)
);
