# Авторизация через Telegram ID

## Описание

Приложение теперь требует авторизацию через Telegram для доступа. Доступ разрешается только пользователям, чьи Telegram ID добавлены в базу данных.

## Как это работает

1. **Фронтенд** получает Telegram ID из Telegram WebApp API
2. **Фронтенд** отправляет Telegram ID на бэкенд в заголовке `X-Telegram-Id`
3. **Бэкенд** проверяет есть ли этот Telegram ID в таблице `users` в базе данных
4. Если ID найден - доступ РАЗРЕШЕН, если нет - доступ ЗАПРЕЩЕН

## Добавление авторизованных пользователей

### Способ 1: SQL запрос (напрямую в PostgreSQL)

```sql
-- Добавить нового авторизованного пользователя
INSERT INTO users (username, telegram_id) 
VALUES ('имя_пользователя', 123456789)
ON CONFLICT (telegram_id) DO NOTHING;
```

Замените:
- `имя_пользователя` - имя пользователя (может быть любое)
- `123456789` - реальный Telegram ID пользователя

### Способ 2: Добавить несколько пользователей сразу

```sql
INSERT INTO users (username, telegram_id) 
VALUES 
  ('ivan', 123456789),
  ('maria', 987654321),
  ('petr', 555555555)
ON CONFLICT (telegram_id) DO NOTHING;
```

### Как узнать Telegram ID пользователя?

1. Откройте чат с ботом [@userinfobot](https://t.me/userinfobot) в Telegram
2. Отправьте ему свое сообщение
3. Бот вернет ваш Telegram ID (поле `Id`)

Или попросите пользователя отправить вам скриншот из @userinfobot

## Структура таблицы users

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,              -- Внутренний ID приложения
    username VARCHAR(50) UNIQUE NOT NULL, -- Имя пользователя
    telegram_id BIGINT UNIQUE,          -- Telegram ID (ключевое поле для авторизации!)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Важно:** Авторизация работает по полю `telegram_id`, поэтому оно не должно быть NULL для активных пользователей.

## Проверка кто авторизован

### Получить всех авторизованных пользователей

```sql
SELECT id, username, telegram_id, created_at 
FROM users 
WHERE telegram_id IS NOT NULL
ORDER BY created_at DESC;
```

### Проверить есть ли конкретный пользователь

```sql
SELECT * FROM users WHERE telegram_id = 123456789;
```

## Удаление доступа пользователе

Чтобы запретить доступ пользователю, установите его `telegram_id` на NULL:

```sql
UPDATE users SET telegram_id = NULL WHERE id = 5;
```

Или удалите пользователя полностью:

```sql
DELETE FROM users WHERE telegram_id = 123456789;
```

## Миграция БД

При развертывании приложения будет выполнен файл миграции:
- `init-db/05-add-telegram-auth.sql` - создает индекс для быстрого поиска по telegram_id

## Endpoints авторизации (для фронтенда)

### POST /api/auth/check
Быстрая проверка авторизован ли пользователь.

**Заголовки:**
```
X-Telegram-Id: 123456789
```

**Ответ (авторизован):**
```json
{
  "success": true,
  "authorized": true,
  "userId": 1
}
```

**Ответ (не авторизован):**
```json
{
  "success": false,
  "authorized": false,
  "message": "Доступ запрещен"
}
```

### GET /api/auth/me
Получить информацию о текущем авторизованном пользователе.

**Заголовки:**
```
X-Telegram-Id: 123456789
```

**Ответ:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "ivan",
    "telegram_id": 123456789,
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

## Все защищенные endpoints

После добавления авторизации, ВСЕ API endpoints требуют заголовок `X-Telegram-Id`:

- `GET /api/lists` - получить все списки
- `POST /api/lists` - создать новый список
- `GET /api/lists/:id` - получить один список
- `PUT /api/lists/:id` - обновить список
- `DELETE /api/lists/:id` - удалить список
- `GET /api/items/list/:listId` - получить товары списка
- `POST /api/items` - создать новый товар
- И все остальные endpoints с товарами и подсписками

## Логирование

Приложение логирует все попытки авторизации:
- Успешная авторизация: `✅ Пользователь авторизован. Telegram ID: 123456789`
- Отказ в доступе: `❌ Доступ запрещен. Ваш Telegram ID не авторизован.`

## Используемая переменная окружения (если нужна)

На данный момент авторизация не требует переменных окружения, так как просто проверяет наличие telegram_id в БД.

Если в будущем понадобится, можно добавить:
- `ADMIN_TELEGRAM_IDS` - список ID администраторов
- `REQUIRE_AUTH` - включить/отключить авторизацию (по умолчанию включена)
