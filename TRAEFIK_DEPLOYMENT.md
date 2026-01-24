# Deployment Guide для существующего Traefik сервера

## ✅ ВАЖНОЕ ЗАМЕЧАНИЕ

**На вашем сервере Traefik УЖЕ РАБОТАЕТ!**

Вам **НЕ нужно** устанавливать или настраивать Traefik.

Ваш проект просто **подключится к существующей сети `proxy`** и всё будет работать автоматически.

---

## 🚀 Пошаговое развертывание

### 1. Проверка предусловий

На вашем сервере должно быть **уже установлено:**

```bash
# ✅ Docker и Docker Compose
docker --version
docker-compose --version

# ✅ Traefik работает
docker ps | grep traefik

# ✅ Сеть 'proxy' существует
docker network ls | grep proxy
```

### 2. Клонирование / Копирование проекта

```bash
# Если еще нет папки
mkdir -p /opt/docker/compose/procurement

# Скопируйте файлы проекта
cp -r <локальный_путь>/procurement/* /opt/docker/compose/procurement/

### 2. Подготовка переменных окружения

```bash
cd /opt/docker/compose/procurement

# Скопируйте пример конфигурации
cp .env.production.example .env

# Отредактируйте .env с вашими значениями
nano .env
```

**Важные переменные в `.env`:**

```env
# Domain (используйте ваш домен)
DOMAIN=procurement.fros-ty.com

# Database (измените пароль!)
POSTGRES_DB=procurement_db
POSTGRES_USER=procurement_user
DB_PASSWORD=ИЗМЕНИТЕ_НА_НОВЫЙ_ПАРОЛЬ

# Email for Let's Encrypt renewal (используйте ваш email)
SSL_EMAIL=admin@fros-ty.com

# Timezone
GENERIC_TIMEZONE=Europe/Moscow
```

### 3. Запуск контейнеров

**Важно:** Сеть `proxy` уже существует (создана Traefik), поэтому просто запускаем:

```bash
# Построить образы
docker-compose build

# Запустить в фоне
docker-compose up -d

# Проверить статус
docker-compose ps
```

### 4. Проверка логов

```bash
# Логи всех сервисов
docker-compose logs -f

# Только backend
docker-compose logs -f backend

# Только frontend
docker-compose logs -f frontend

# Только база данных
docker-compose logs -f postgres
```

### 5. Проверка подключения к Traefik (ваш Traefik)

```bash
# Погодите 30-60 секунд для выдачи сертификата Let's Encrypt

# Проверьте, что контейнеры подключены к сети proxy
docker network inspect proxy | grep -A 10 "procurement"

# Проверьте, что Traefik видит маршруты (если dashboard открыт)
curl http://localhost:8080/api/routers/  # Может потребоваться доступ

# Проверьте здоровье сервисов
curl -k https://procurement.fros-ty.com/api/health
curl -k https://procurement.fros-ty.com/health

# Если сертификат самоподписанный или не готов:
curl -k https://procurement.fros-ty.com/  # -k игнорирует ошибку сертификата
```

## 🔍 Диагностика проблем

### Проблема: SSL сертификат не выдается

```bash
# Проверьте, что Traefik правильно настроен
docker logs traefik

# Проверьте permissions на папке с сертификатами
ls -la /opt/docker/traefik/data/acme.json

# Перезагрузите контейнеры
docker-compose down
docker-compose up -d
```

### Проблема: Backend не доступен

```bash
# Проверьте, что backend слушает правильный порт
docker-compose ps backend

# Проверьте логи backend
docker-compose logs backend

# Проверьте подключение к БД
docker-compose exec backend npm run db-test

# Проверьте networking
docker network inspect procurement_procurement-internal
```

### Проблема: Frontend не загружается

```bash
# Проверьте nginx конфигурацию
docker-compose exec frontend nginx -t

# Проверьте, что dist собран
docker-compose exec frontend ls -la /usr/share/nginx/html/

# Перестройте frontend
docker-compose build frontend
docker-compose up -d frontend
```

### Проблема: API запросы из frontend не работают

```bash
# Проверьте CORS заголовки
curl -i -X OPTIONS https://procurement.fros-ty.com/api/health \
  -H "Origin: https://procurement.fros-ty.com"

# Проверьте proxy headers
docker-compose logs backend | grep -i "cors\|origin"

# Проверьте, что Traefik правильно пробрасывает заголовки
curl -v https://procurement.fros-ty.com/api/health
```

## 📊 Мониторинг и логирование

### Просмотр логов Traefik

```bash
docker logs traefik -f
```

### Проверка статуса всех сервисов

```bash
# Детальный статус
docker-compose ps

# Здоровье сервисов
docker inspect procurement-backend --format='{{json .State.Health}}' | jq
docker inspect procurement-frontend --format='{{json .State.Health}}' | jq
```

### Доступ к базе данных

```bash
# Подключение к PostgreSQL
docker-compose exec postgres psql -U procurement_user -d procurement_db

# Проверка таблиц
\dt

# Выход
\q
```

## 🔄 Обновление приложения

### Обновить код и пересобрать

```bash
cd /opt/docker/compose/procurement

# Получить новый код
git pull origin main

# Пересобрать образы
docker-compose build --no-cache

# Перезагрузить контейнеры
docker-compose down
docker-compose up -d

# Проверить логи
docker-compose logs -f
```

### Обновить только переменные окружения

```bash
# Отредактировать .env
nano .env

# Перезагрузить контейнеры
docker-compose down
docker-compose up -d
```

## 🧹 Очистка и удаление

### Остановить приложение

```bash
docker-compose down
```

### Остановить и удалить все данные (ВНИМАНИЕ!)

```bash
docker-compose down -v
```

### Удалить образы

```bash
docker-compose down --rmi all
```

## 📝 Traefik Labels объяснение

В `docker-compose.yml` используются следующие Traefik labels:

**Frontend:**
- `traefik.http.routers.procurement-frontend.rule=Host(...)` - маршрутизация по домену
- `traefik.http.routers.procurement-frontend.entrypoints=websecure` - слушает только HTTPS
- `traefik.http.routers.procurement-frontend.tls.certresolver=le` - использует Let's Encrypt

**Backend:**
- `traefik.http.routers.procurement-backend.rule=Host(...) && PathPrefix(/api)` - маршрутизация по домену и пути
- `traefik.http.middlewares.stripprefix.stripprefix.prefixes=/api` - убирает `/api` префикс при проксировании
- `traefik.http.routers.procurement-backend.middlewares=stripprefix@docker` - применяет middleware

## ✨ Результат

После успешного развертывания приложение будет доступно по адресам:

- **Frontend**: `https://procurement.fros-ty.com/`
- **API (спец)**: `https://procurement.fros-ty.com/api/health`
- **Traefik Dashboard**: `http://localhost:8080/dashboard/` (если доступно)

## 📞 Поддержка

В случае проблем:

1. Проверьте логи сервисов (`docker-compose logs`)
2. Убедитесь в правильности `.env` файла
3. Проверьте сетевое подключение (`docker network inspect proxy`)
4. Перезагрузите контейнеры (`docker-compose restart`)
5. При необходимости пересобройте образы (`docker-compose build --no-cache`)
