# GitHub Deployment Instructions

## 1. Инициализация Git репозитория

```bash
cd /home/vmorozov/shoper-project2
git init
git add .
git commit -m "Initial commit: Smart Shopping List application with Docker setup"
```

## 2. Создание репозитория на GitHub

1. Перейти на https://github.com/new
2. Заполнить:
   - Repository name: `procurement` (или другое)
   - Description: "Smart Shopping List - Procurement System"
   - Выбрать Public/Private
   - НЕ инициализировать с README, .gitignore, лицензией (уже есть)
   - Нажать "Create repository"

## 3. Добавление удаленного репозитория и push

```bash
git remote add origin https://github.com/YOUR_USERNAME/procurement.git
git branch -M main
git push -u origin main
```

## 4. Проверка на GitHub

- Открыть https://github.com/YOUR_USERNAME/procurement
- Убедиться что все файлы загружены
- Проверить структуру проекта

## 5. Развертывание на сервере

После push на GitHub, для развертывания на `/opt/docker/compose/procurement`:

```bash
# На целевом сервере:
cd /opt/docker/compose
git clone https://github.com/YOUR_USERNAME/procurement.git procurement
cd procurement

# Настроить окружение
nano .env  # Обновить если нужны другие значения

# Обновить /etc/hosts
sudo bash -c 'echo "YOUR_SERVER_IP procurement.fros-ty.com" >> /etc/hosts'

# Запустить
docker compose up --build -d

# Проверить
curl http://procurement.fros-ty.com/
```

## Структура для развертывания

```
/opt/docker/compose/
└── procurement/          # <- git clone сюда
    ├── backend/
    ├── frontend/
    ├── init-db/
    ├── docker-compose.yml
    ├── .env
    └── ...
```

## Важные переменные в .env

Для production сервера может потребоваться обновить:

```env
# На production, если отличается от localhost
POSTGRES_HOST=postgres      # Остается postgres (service name в Docker)
POSTGRES_USER=shoper_user
DB_PASSWORD=shoper_password_123  # ⚠️ Изменить на production!
POSTGRES_DB=shoper_db

# Port остается 3002 для backend
PORT=3002
VITE_API_URL=/api
```

## Что находится в репозитории

✅ Готовый код frontend (React + TypeScript)
✅ Готовый код backend (Express + Node.js)
✅ Docker конфигурация (Dockerfile, docker-compose.yml)
✅ Nginx конфигурация (с SPA routing)
✅ Database schema (init.sql)
✅ .gitignore (исключены node_modules, .env, etc.)
✅ README.md (документация)
✅ DEPLOYMENT_GUIDE.md (подробный гайд)

## После успешного развертывания

1. Приложение доступно на: http://procurement.fros-ty.com/
2. API доступно на: http://procurement.fros-ty.com/api/
3. Health check: http://procurement.fros-ty.com/api/health
4. Логи: `docker compose logs -f`
5. Управление: `docker compose up/down/restart`

---

**Следующие шаги:**
1. Нажать кнопку GitHub desktop или использовать CLI команды выше
2. Подождать загрузки на GitHub
3. Развернуть на сервере согласно инструкциям выше
