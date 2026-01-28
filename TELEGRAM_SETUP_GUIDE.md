# 🚀 Настройка Telegram Авторизации для Procurement System

Этот гайд поможет вам настроить Telegram авторизацию с вашими конкретными данными бота и пользователя.

## 📋 Ваши данные

На основе предоставленной информации:

- **Telegram Bot Token**: `8460277345:AAG12dtV1AmEOPepIwMjGZi5xsBoKwxNf-Q`
- **Bot ID**: `8460277345`
- **Bot Username**: `@frostyhelperfrendlybot`
- **Ваш Telegram ID**: `610248913`

## 🔧 Шаг 1: Настройка переменных окружения

Создайте файл `.env` в корне проекта:

```bash
cp .env.production.example .env
```

Отредактируйте `.env` файл с вашими данными:

```env
# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_USER=procurement_user
DB_PASSWORD=Ckfdfhjccbb85
DB_NAME=procurement_db

# Server Configuration
PORT=3002
NODE_ENV=development

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=8460277345:AAG12dtV1AmEOPepIwMjGZi5xsBoKwxNf-Q
TELEGRAM_TOKEN_SECRET=your_strong_secret_key_for_jwt_12345
TELEGRAM_BOT_USERNAME=frostyhelperfrendlybot

# CORS Configuration (для локального тестирования)
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://localhost

# Security
JWT_SECRET=your_jwt_secret_key_12345
SESSION_SECRET=your_session_secret_key_12345

# Logging
LOG_LEVEL=debug
```

> ⚠️ **ВАЖНО**: Замените `your_strong_secret_key_for_jwt_12345`, `your_jwt_secret_key_12345` и `your_session_secret_key_12345` на реальные случайные строки для безопасности!

## 🛠️ Шаг 2: Добавление вашего Telegram ID в авторизованные пользователи

Есть два способа добавить ваш Telegram ID в базу данных:

### Способ 1: Через SQL (рекомендуется)

```bash
# Подключитесь к базе данных
docker exec -it procurement-db psql -U procurement_user -d procurement_db

# Выполните SQL команду для добавления вашего Telegram ID
INSERT INTO authorized_users (telegram_id, username, description)
VALUES (610248913, 'admin', 'Main administrator')
ON CONFLICT (telegram_id) DO UPDATE
SET username = EXCLUDED.username, description = EXCLUDED.description, is_active = true;

# Проверьте добавление
SELECT * FROM authorized_users WHERE telegram_id = 610248913;
```

### Способ 2: Через SQL файл (альтернатива)

Отредактируйте файл `init-db/05-add-telegram-auth.sql` и добавьте ваш Telegram ID:

```sql
-- Добавьте ваш Telegram ID
INSERT INTO authorized_users (telegram_id, username, description)
VALUES
  (610248913, 'admin', 'Main administrator')
ON CONFLICT (telegram_id) DO NOTHING;
```

## 🔄 Шаг 3: Настройка Telegram WebApp

Убедитесь, что ваш бот правильно настроен в BotFather:

1. **WebApp должен быть настроен**:
   ```
   /newapp
   ```
   - URL: `https://ваш-домен.com` (или `http://localhost` для локального тестирования)
   - Заголовок: "Procurement App"
   - Описание: "Корпоративное приложение закупок"

2. **Добавьте домен**:
   ```
   /setdomain
   ```
   - Домен: `ваш-домен.com` или `localhost`

3. **Настройте команды**:
   ```
   /setcommands
   ```
   - Команды:
     ```
     start - Открыть приложение
     help - Помощь
     ```

## 🚀 Шаг 4: Запуск проекта

### Локальный запуск (для тестирования)

```bash
# Запустить все сервисы
docker compose up --build -d

# Проверить статус
docker compose ps

# Просмотр логов
docker compose logs -f backend
```

### Доступ к приложению

- **Frontend**: http://localhost
- **Backend API**: http://localhost:3002/api/
- **Health Check**: http://localhost:3002/api/health
- **DB Test**: http://localhost:3002/api/db-test

## 🔐 Шаг 5: Тестирование Telegram авторизации

1. **Откройте ваш бот в Telegram**: `@frostyhelperfrendlybot`
2. **Нажмите кнопку "Start"** или используйте команду `/start`
3. **Бот должен открыть WebApp** с вашим приложением
4. **Приложение должно автоматически авторизовать вас** через Telegram ID

## 📊 Шаг 6: Проверка авторизации

Вы можете проверить авторизацию через API:

```bash
# Проверить авторизацию через curl
curl -X GET "http://localhost:3002/api/auth/check" \
  -H "X-Telegram-Id: 610248913" \
  -H "X-Telegram-WebApp: true"

# Ожидаемый ответ:
# {"success":true,"authorized":true,"user":{"id":1,"telegram_id":610248913,"username":"admin"}}
```

## 🛡️ Шаг 7: Генерация токенов для deep links

Вы можете сгенерировать токены для deep links:

```bash
# Сгенерировать токен через API
curl -X POST "http://localhost:3002/api/telegram/generate-token" \
  -H "Content-Type: application/json" \
  -d '{"telegramId": 610248913}'

# Ожидаемый ответ:
# {
#   "success": true,
#   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "deepLink": "https://t.me/frostyhelperfrendlybot/app?startapp=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
# }
```

## 🔧 Устранение неполадок

### Проблема: Приложение не открывается через Telegram

**Решения:**
1. Убедитесь, что WebApp настроен в BotFather
2. Проверьте, что домен добавлен в BotFather
3. Убедитесь, что используется HTTPS (или localhost для тестирования)

### Проблема: Ошибка авторизации

**Решения:**
1. Проверьте, что ваш Telegram ID добавлен в базу данных
2. Убедитесь, что `is_active = true` для вашего пользователя
3. Проверьте логи бэкенда: `docker compose logs backend`

### Проблема: Бот не отвечает

**Решения:**
1. Проверьте, что токен бота правильный в `.env`
2. Убедитесь, что бот не заблокирован
3. Проверьте настройки конфиденциальности бота

## 📝 Полезные команды

```bash
# Просмотр логов бэкенда
docker compose logs -f backend

# Просмотр логов фронтенда
docker compose logs -f frontend

# Просмотр логов базы данных
docker compose logs -f postgres

# Перезапуск сервисов
docker compose restart

# Остановка сервисов
docker compose down

# Подключение к базе данных
docker exec -it procurement-db psql -U procurement_user -d procurement_db
```

## 🎯 Следующие шаги

1. **Настройте production домен** в `.env` для реального развертывания
2. **Добавьте дополнительных пользователей** в таблицу `authorized_users`
3. **Настройте Traefik** для production развертывания (см. TRAEFIK_DEPLOYMENT.md)
4. **Настройте резервное копирование** базы данных

## 📚 Дополнительная документация

- **[TELEGRAM_BOT_SETUP.md](TELEGRAM_BOT_SETUP.md)** - Полное руководство по настройке Telegram бота
- **[TRAEFIK_DEPLOYMENT.md](TRAEFIK_DEPLOYMENT.md)** - Развертывание с Traefik и SSL
- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Общее руководство по развертыванию

Теперь ваш проект должен быть полностью настроен для работы с Telegram авторизацией! 🎉