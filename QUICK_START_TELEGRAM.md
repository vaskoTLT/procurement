# 🚀 Быстрый старт с Telegram Авторизацией

Этот гайд содержит все необходимые шаги для запуска проекта с Telegram авторизацией.

## ✅ Что уже настроено для вас

1. **Создан файл `.env`** с вашими Telegram данными:
   - `TELEGRAM_BOT_TOKEN=8460277345:AAG12dtV1AmEOPepIwMjGZi5xsBoKwxNf-Q`
   - `TELEGRAM_BOT_USERNAME=frostyhelperfrendlybot`
   - `TELEGRAM_TOKEN_SECRET=your_strong_secret_key_for_jwt_12345`

2. **Добавлен ваш Telegram ID** в базу данных:
   - `610248913` - ваш Telegram ID как администратор

3. **Создан подробный гайд** `TELEGRAM_SETUP_GUIDE.md` с пошаговыми инструкциями

## 🔥 Быстрый запуск (3 команды)

```bash
# 1. Запустить все сервисы
docker compose up --build -d

# 2. Проверить статус
docker compose ps

# 3. Просмотр логов бэкенда
docker compose logs -f backend
```

## 📋 Доступ к приложению

- **Frontend**: http://localhost
- **Backend API**: http://localhost:3002/api/
- **Health Check**: http://localhost:3002/api/health
- **DB Test**: http://localhost:3002/api/db-test

## 🤖 Тестирование Telegram Авторизации

### Шаг 1: Проверка авторизации через API

```bash
curl -X GET "http://localhost:3002/api/auth/check" \
  -H "X-Telegram-Id: 610248913" \
  -H "X-Telegram-WebApp: true"
```

**Ожидаемый ответ:**
```json
{
  "success": true,
  "authorized": true,
  "user": {
    "id": 1,
    "telegram_id": 610248913,
    "username": "admin"
  }
}
```

### Шаг 2: Генерация токена для Telegram Deep Link

```bash
curl -X POST "http://localhost:3002/api/telegram/generate-token" \
  -H "Content-Type: application/json" \
  -d '{"telegramId": 610248913}'
```

**Ожидаемый ответ:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "deepLink": "https://t.me/frostyhelperfrendlybot/app?startapp=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Шаг 3: Тестирование через Telegram

1. **Откройте ваш бот**: `@frostyhelperfrendlybot`
2. **Нажмите "Start"** или используйте команду `/start`
3. **Бот должен открыть WebApp** с вашим приложением
4. **Приложение должно автоматически авторизовать вас**

## 🛠️ Полезные команды

```bash
# Просмотр логов всех сервисов
docker compose logs -f

# Просмотр логов конкретного сервиса
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres

# Перезапуск сервисов
docker compose restart

# Остановка сервисов
docker compose down

# Подключение к базе данных
docker exec -it procurement-db psql -U procurement_user -d procurement_db

# Проверка авторизованных пользователей
docker exec -it procurement-db psql -U procurement_user -d procurement_db -c "SELECT * FROM authorized_users;"
```

## 🔐 Безопасность

⚠️ **ВАЖНО**: Перед production развертыванием:

1. **Измените секретные ключи** в `.env`:
   - `TELEGRAM_TOKEN_SECRET`
   - `JWT_SECRET`
   - `SESSION_SECRET`

2. **Используйте сложные пароли** для базы данных

3. **Настройте Traefik** для HTTPS и SSL

## 📚 Документация

- **[TELEGRAM_SETUP_GUIDE.md](TELEGRAM_SETUP_GUIDE.md)** - Полное руководство по настройке
- **[TELEGRAM_BOT_SETUP.md](TELEGRAM_BOT_SETUP.md)** - Настройка Telegram бота
- **[TRAEFIK_DEPLOYMENT.md](TRAEFIK_DEPLOYMENT.md)** - Production развертывание
- **[README.md](README.md)** - Основная документация

## 🎯 Следующие шаги

1. **Протестируйте локально** - убедитесь что все работает
2. **Добавьте дополнительных пользователей** в базу данных
3. **Настройте production домен** для реального развертывания
4. **Настройте Traefik** для HTTPS и SSL

Теперь ваш проект полностью настроен и готов к работе! 🎉