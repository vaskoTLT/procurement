
-- Инициализация главного администратора
-- Пароль в открытом виде: 123123 (в реальности должен быть хеширован)
INSERT INTO users (email, username, password_hash, is_admin, created_at)
VALUES (
    'vasko8508@gmail.com', 
    'Admin', 
    '123123', 
    TRUE, 
    extract(epoch from now())::bigint * 1000
) ON CONFLICT (email) DO NOTHING;
