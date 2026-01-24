# Smart Shopping List - Procurement System

Веб-приложение для управления списками покупок с отслеживанием бюджета, статистикой расходов и красивым интерфейсом.

**🚀 Готовое решение для развертывания с Traefik и Let's Encrypt SSL**

## Возможности

✅ Создание и управление списками покупок  
✅ Добавление товаров с количеством, единицами измерения и ценами  
✅ Отслеживание статуса покупки (куплено/не куплено)  
✅ Управление бюджетом и расходами  
✅ Статистика по спискам и категориям  
✅ Красивый React UI с Tailwind CSS  
✅ REST API с Express.js  
✅ PostgreSQL база данных  
✅ Docker контейнеризация  
✅ **Traefik поддержка с автоматическим SSL**  
✅ **Docker health checks**  
✅ **Микросервисная архитектура**  

## Технологический стек

### Frontend
- React 19.2.3 + TypeScript
- Vite (сборка)
- Tailwind CSS (стили)
- Recharts (диаграммы)
- Lucide React (иконки)
- Nginx (веб-сервер)

### Backend
- Node.js 18
- Express 4.18.2
- PostgreSQL (pg 8.11.3)
- CORS поддержка

### Infrastructure
- Docker & Docker Compose
- PostgreSQL 15 с persistent volume
- Nginx reverse proxy

## Быстрый старт - Локальное развертывание

### Вариант 1: Простой старт (без Traefik)
```bash
# Запустить все сервисы
docker compose up --build -d

# Проверить статус
docker compose ps

# Просмотр логов
docker compose logs -f frontend
docker compose logs -f backend
docker compose logs -f postgres
```

### Доступ к приложению (локально)
- Frontend: http://localhost/
- Backend API: http://localhost:3002/api/
- Health Check: http://localhost:3002/api/health
- Database Test: http://localhost:3002/api/db-test

### Остановка
```bash
docker compose down
```

## 🚀 Развертывание на Production с Traefik

### ⚠️ ВАЖНО

**На вашем сервере Traefik УЖЕ РАБОТАЕТ** - вам нужно только развернуть приложение в существующий Traefik!

### Быстрое развертывание (на сервере)

```bash
# 1. Clone проект
cd /opt/docker/compose
git clone <repo-url> procurement
cd procurement

# 2. Подготовить конфиг
cp .env.production.example .env

# 3. Отредактировать .env (3 переменные):
# - DOMAIN=procurement.fros-ty.com
# - DB_PASSWORD=новый_пароль (ОБЯЗАТЕЛЬНО ИЗМЕНИТЕ!)
# - SSL_EMAIL=ваш-email@example.com
nano .env

# 4. Запустить
docker-compose build
docker-compose up -d

# 5. Проверить (после 30-60 сек для SSL)
curl https://procurement.fros-ty.com/
```

**После развертывания приложение будет доступно по адресу:**
```
https://procurement.fros-ty.com/
```

**Traefik автоматически:**
- ✅ Найдет ваши контейнеры через Docker labels
- ✅ Выдаст SSL сертификат от Let's Encrypt
- ✅ Будет направлять трафик на правильные контейнеры
- ✅ Обновлять сертификат за 30 дней до истечения

### Детальные инструкции

- **[TRAEFIK_DEPLOYMENT.md](./TRAEFIK_DEPLOYMENT.md)** - Полное руководство production развертывания
- **[LOCAL_TRAEFIK_TESTING.md](./LOCAL_TRAEFIK_TESTING.md)** - Тестирование локально перед production
- **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - Миграция со старой конфигурации
- **[TRAEFIK_UPDATES.md](./TRAEFIK_UPDATES.md)** - Список всех изменений для Traefik

## Структура проекта

```
procurement/
├── backend/              # Express.js API сервер
│   ├── src/
│   │   ├── server.js     # Точка входа
│   │   ├── models/       # Database models (database.js, ItemModel.js)
│   │   └── routes/       # API routes (lists.js, items.js)
│   ├── package.json
│   └── Dockerfile
├── frontend/             # React + Vite SPA
│   ├── src/components/   # HomeView, ListDetailView, StatsView
│   ├── src/services/     # apiService.ts
│   ├── App.tsx           # Main component
│   ├── package.json
│   ├── Dockerfile
│   └── nginx.conf        # Nginx конфиг с SPA routing
├── init-db/              # Инициализация БД
│   └── init.sql          # Schema и данные
├── docker-compose.yml    # Оркестрация сервисов
├── .env                  # Переменные окружения
└── DEPLOYMENT_GUIDE.md   # Гайд развертывания на сервере
```

## API Endpoints

### Shopping Lists
```
GET    /api/lists              # Все списки
POST   /api/lists              # Создать список
PUT    /api/lists/:id          # Обновить список
DELETE /api/lists/:id          # Удалить список
```

### Items
```
GET    /api/items/:listId      # Товары в списке
POST   /api/items              # Создать товар
PUT    /api/items/:id          # Обновить товар
DELETE /api/items/:id          # Удалить товар
```

### Health & Status
```
GET    /api/health             # Статус API
GET    /api/db-test            # Проверка БД
```

## Переменные окружения

### Базовая конфигурация (.env)

```env
# Traefik & Домен (для production)
DOMAIN=procurement.fros-ty.com
SSL_EMAIL=admin@fros-ty.com
GENERIC_TIMEZONE=Europe/Moscow

# Database Configuration
DB_PASSWORD=shoper_password_123
POSTGRES_DB=procurement_db
POSTGRES_USER=procurement_user
POSTGRES_PORT=5432

# Backend Configuration
NODE_ENV=production
PORT=3002
POSTGRES_HOST=postgres

# Frontend Configuration
VITE_API_URL=/api
```

### Пример для production (.env.production.example)

Копируйте `.env.production.example` → `.env` перед развертыванием:

## Развертывание на Production с Traefik

### Быстрое развертывание (на сервере)

```bash
# 1. Предусловие: Traefik уже работает на сервере

# 2. Clone проект
cd /opt/docker/compose
git clone <repo-url> procurement
cd procurement

# 3. Подготовить конфиг
cp .env.production.example .env
nano .env  # Отредактировать с вашими значениями

# 4. Запустить автоматизированный скрипт
chmod +x deploy-traefik.sh
./deploy-traefik.sh
```

**После развертывания приложение будет доступно по адресу:**
```
https://procurement.fros-ty.com/
```

### Детальные инструкции

- **[TRAEFIK_DEPLOYMENT.md](./TRAEFIK_DEPLOYMENT.md)** - Полное руководство production развертывания
- **[LOCAL_TRAEFIK_TESTING.md](./LOCAL_TRAEFIK_TESTING.md)** - Тестирование локально перед production
- **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - Миграция со старой конфигурации
- **[TRAEFIK_UPDATES.md](./TRAEFIK_UPDATES.md)** - Список всех изменений для Traefik

## 🏗️ Архитектура

### Локальное развертывание
```
┌────────────────────────────┐
│  Localhost (Docker)        │
├─────────────┬──────────────┤
│  Frontend   │  Backend     │
│  :80        │  :3002       │
│  (React)    │  (Express)   │
└─────────────┴──────────────┘
        ▲
        │
    PostgreSQL
     :5432
```

### Production с Traefik
```
┌───────────────────────────────────┐
│  Internet                         │
│ procurement.fros-ty.com:443       │
└────────────────┬──────────────────┘
                 │
         ┌───────▼────────┐
         │    Traefik     │
         │  (SSL/Router)  │
         └───────┬────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
    ▼            ▼            ▼
┌─────────┐ ┌─────────┐ ┌──────────┐
│Frontend │ │ Backend │ │Database  │
│(nginx)  │ │(Express)│ │(Postgres)│
└─────────┘ └─────────┘ └──────────┘
```

## 📊 Компоненты

### Frontend (React + Vite)
- SPA с маршрутизацией
- Real-time обновления
- Responsive дизайн (Tailwind CSS)
- Графики и статистика (Recharts)
- **Health check**: `GET /health`

### Backend (Express.js)
- REST API для всех операций
- CORS поддержка для Traefik
- Automatic health checks
- **Health check**: `GET /health` и `GET /api/health`

### Database (PostgreSQL 15)
- Persistent volume для данных
- Automatic schema initialization
- Connection pooling
- Full text search готовность

## База данных

### Schema
- **users** - Пользователи
- **shopping_lists** - Списки покупок
- **items** - Товары в списках
- **list_participants** - Участники списков

Инициализация происходит автоматически при первом запуске.

## 🔧 Troubleshooting

### Локальное развертывание

**Контейнер не запускается**
```bash
docker compose logs <service-name>
docker compose down
docker compose up --build -d
```

**Нет доступа к приложению**
```bash
# Проверить ports
docker compose ps

# Проверить nginx config
docker compose exec smart-shopping-list nginx -t

# Проверить frontend logs
docker compose logs smart-shopping-list
```

**Проблемы с БД**
```bash
# Проверить database
docker compose exec shoper-db psql -U shoper_user -d shoper_db -c "\dt"

# Проверить backend logs
docker compose logs shoper-backend
```

### Production с Traefik

Для проблем с production развертыванием смотрите [TRAEFIK_DEPLOYMENT.md#-диагностика-проблем](./TRAEFIK_DEPLOYMENT.md#-диагностика-проблем)

**Основные команды для отладки:**

```bash
# Статус сервисов
docker-compose ps

# Логи приложения
docker-compose logs -f

# Проверить Traefik
docker logs traefik
docker network inspect proxy

# Тестировать endpoints
curl -k https://procurement.fros-ty.com/
curl -k https://procurement.fros-ty.com/api/health
```

## 📚 Полная документация

| Документ | Описание |
|----------|---------|
| [TRAEFIK_DEPLOYMENT.md](./TRAEFIK_DEPLOYMENT.md) | 🚀 **Основной гайд** - Развертывание на production сервере с Traefik |
| [LOCAL_TRAEFIK_TESTING.md](./LOCAL_TRAEFIK_TESTING.md) | 🧪 Локальное тестирование с Traefik перед production |
| [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) | 🔄 Миграция со старой конфигурации на Traefik |
| [TRAEFIK_UPDATES.md](./TRAEFIK_UPDATES.md) | 📋 Список всех изменений для поддержки Traefik |
| [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) | 📖 Оригинальный гайд (архив) |

## Разработка

### Frontend разработка
```bash
cd frontend
npm install
npm run dev  # Vite dev server на :5173
```

### Backend разработка
```bash
cd backend
npm install
npm run dev  # Nodemon на :3002
```

## ✅ Чеклист перед production

- [ ] Все файлы обновлены для Traefik (см. TRAEFIK_UPDATES.md)
- [ ] Локально протестировано с Traefik (см. LOCAL_TRAEFIK_TESTING.md)
- [ ] DNS записи настроены
- [ ] Traefik работает на сервере
- [ ] .env файл подготовлен
- [ ] Резервные копии созданы
- [ ] deploy-traefik.sh скрипт готов к запуску

## 🆘 Быстрая помощь

**Проблема:** SSL сертификат не выдается  
**Решение:** Погодите 30-60 сек, проверьте логи Traefik `docker logs traefik | tail -20`

**Проблема:** API недоступна  
**Решение:** Проверьте CORS: `docker-compose logs backend | grep -i cors`

**Проблема:** Frontend показывает ошибку  
**Решение:** Проверьте health: `curl -k https://procurement.fros-ty.com/health`

## Лицензия

MIT

## Поддержка

Для полной поддержки смотрите соответствующую документацию:
- **Локальное тестирование**: [LOCAL_TRAEFIK_TESTING.md](./LOCAL_TRAEFIK_TESTING.md)
- **Production**: [TRAEFIK_DEPLOYMENT.md](./TRAEFIK_DEPLOYMENT.md)
- **Диагностика**: Смотрите раздел Troubleshooting выше
