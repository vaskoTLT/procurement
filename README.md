# Smart Shopping List - Procurement System

Веб-приложение для управления списками покупок с отслеживанием бюджета, статистикой расходов и красивым интерфейсом.

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

## Быстрый старт

### На локальной машине
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

### Доступ к приложению
- Frontend: http://localhost/
- Backend API: http://localhost:3002/api/
- Health Check: http://localhost:3002/api/health
- Database Test: http://localhost:3002/api/db-test

### Остановка
```bash
docker compose down
```

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

## Переменные окружения (.env)

```env
# Database Configuration
DB_PASSWORD=shoper_password_123
POSTGRES_DB=shoper_db
POSTGRES_USER=shoper_user
POSTGRES_PORT=5432

# Backend Configuration
NODE_ENV=production
PORT=3002
POSTGRES_HOST=postgres

# Frontend Configuration
VITE_API_URL=/api
```

## Развертывание на сервере

Для развертывания на отдельном сервере смотрите [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

Краткие шаги:
```bash
# 1. Clone проект в /opt/docker/compose/procurement
cd /opt/docker/compose
git clone <repo-url> procurement
cd procurement

# 2. Обновить .env для вашего окружения
nano .env

# 3. Обновить /etc/hosts (или DNS)
# <server-ip> procurement.example.com

# 4. Запустить
docker compose up --build -d

# 5. Проверить
curl http://procurement.example.com/
```

## База данных

### Schema
- **users** - Пользователи
- **shopping_lists** - Списки покупок
- **items** - Товары в списках
- **list_participants** - Участники списков

Инициализация происходит автоматически при первом запуске.

## Troubleshooting

### Контейнер не запускается
```bash
docker compose logs <service-name>
docker compose down
docker compose up --build -d
```

### Нет доступа к приложению
```bash
# Проверить ports
docker compose ps

# Проверить nginx config
docker compose exec smart-shopping-list nginx -t

# Проверить frontend logs
docker compose logs smart-shopping-list
```

### Проблемы с БД
```bash
# Проверить database
docker compose exec shoper-db psql -U shoper_user -d shoper_db -c "\dt"

# Проверить backend logs
docker compose logs shoper-backend
```

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

## Лицензия

MIT

## Поддержка

Для вопросов и проблем смотрите лог файлы или DEPLOYMENT_GUIDE.md
