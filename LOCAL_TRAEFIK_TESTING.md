# Локальное тестирование приложения с Traefik

Этот гайд поможет вам протестировать приложение локально с конфигурацией, похожей на production Traefik.

## Преимущества локального тестирования

- Проверить конфигурацию Traefik перед развертыванием
- Убедиться, что все labels работают правильно
- Тестировать HTTPS с самоподписанными сертификатами
- Избежать проблем на production

## 🚀 Запуск локальной лаборатории с Traefik

### Шаг 1: Создать локальную конфигурацию Traefik

Создайте на вашей машине файл `docker-compose.traefik.local.yml`:

```yaml
version: "3.8"

services:
  traefik:
    image: traefik:latest
    container_name: traefik-local
    restart: always
    command:
      - "--global.checkNewVersion=false"
      - "--global.sendAnonymousUsage=false"
      
      - "--api.dashboard=true"
      - "--api.insecure=true"
      
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--providers.docker.network=proxy"
      
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      
      - "--entrypoints.web.http.redirections.entrypoint.to=websecure"
      - "--entrypoints.web.http.redirections.entrypoint.scheme=https"
      
      - "--certificatesresolvers.le.acme.tlschallenge=true"
      - "--certificatesresolvers.le.acme.email=test@example.com"
      - "--certificatesresolvers.le.acme.storage=/letsencrypt/acme.json"
      
      - "--log.level=DEBUG"
      - "--accesslog=true"
    
    ports:
      - "80:80"
      - "443:443"
      - "8080:8080"
    
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - traefik_certs:/letsencrypt
    
    networks:
      - proxy

networks:
  proxy:
    driver: bridge

volumes:
  traefik_certs:
```

### Шаг 2: Запустить Traefik локально

```bash
# Запустить Traefik
docker-compose -f docker-compose.traefik.local.yml up -d

# Проверить, что он работает
docker logs traefik-local -f
```

### Шаг 3: Обновить `/etc/hosts`

Добавьте локальный домен в hosts:

**Linux/Mac:**
```bash
echo "127.0.0.1 procurement.local" | sudo tee -a /etc/hosts
```

**Windows:**
```
Отредактируйте C:\Windows\System32\drivers\etc\hosts
Добавьте строку: 127.0.0.1 procurement.local
```

### Шаг 4: Модифицировать docker-compose.yml для локального тестирования

Создайте `docker-compose.local.yml`:

```yaml
version: "3.8"

services:
  postgres:
    image: postgres:15-alpine
    container_name: procurement-db-local
    environment:
      POSTGRES_DB: procurement_db_local
      POSTGRES_USER: procurement_user
      POSTGRES_PASSWORD: test_password_123
    volumes:
      - postgres_data_local:/var/lib/postgresql/data
      - ./init-db:/docker-entrypoint-initdb.d
    networks:
      - procurement-internal
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U procurement_user"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  backend:
    build: ./backend
    container_name: procurement-backend-local
    environment:
      POSTGRES_HOST: postgres
      POSTGRES_PORT: 5432
      POSTGRES_DB: procurement_db_local
      POSTGRES_USER: procurement_user
      DB_PASSWORD: test_password_123
      NODE_ENV: development
      PORT: 3002
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - procurement-internal
      - proxy
    restart: unless-stopped
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.procurement-backend-local.rule=Host(`procurement.local`) && PathPrefix(`/api`)"
      - "traefik.http.routers.procurement-backend-local.entrypoints=web"
      - "traefik.http.services.procurement-backend-local.loadbalancer.server.port=3002"
      - "traefik.http.middlewares.stripprefix-local.stripprefix.prefixes=/api"
      - "traefik.http.routers.procurement-backend-local.middlewares=stripprefix-local@docker"

  frontend:
    build: ./frontend
    container_name: procurement-frontend-local
    environment:
      VITE_API_URL: /api
    depends_on:
      - backend
    networks:
      - procurement-internal
      - proxy
    restart: unless-stopped
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.procurement-frontend-local.rule=Host(`procurement.local`)"
      - "traefik.http.routers.procurement-frontend-local.entrypoints=web"
      - "traefik.http.services.procurement-frontend-local.loadbalancer.server.port=80"

networks:
  procurement-internal:
    driver: bridge
  proxy:
    external: true

volumes:
  postgres_data_local:
```

### Шаг 5: Запустить приложение с Traefik

```bash
# Построить образы
docker-compose -f docker-compose.local.yml build

# Запустить
docker-compose -f docker-compose.local.yml up -d

# Проверить логи
docker-compose -f docker-compose.local.yml logs -f
```

### Шаг 6: Тестировать приложение

```bash
# Frontend
open http://procurement.local

# API Health Check
curl http://procurement.local/api/health

# Dashboard Traefik
open http://localhost:8080/dashboard/
```

## 🔧 Отладка локальной конфигурации

### Проверить, что контейнеры подключены к сети proxy

```bash
docker network inspect proxy
```

### Просмотреть логи приложения

```bash
docker-compose -f docker-compose.local.yml logs -f backend
docker-compose -f docker-compose.local.yml logs -f frontend
docker logs traefik-local -f
```

### Проверить маршруты в Traefik

```bash
curl http://localhost:8080/api/routers/
curl http://localhost:8080/api/services/
```

### Перезагрузить Traefik

```bash
docker restart traefik-local
```

## 🧹 Очистка

### Остановить приложение

```bash
docker-compose -f docker-compose.local.yml down
```

### Остановить Traefik

```bash
docker-compose -f docker-compose.traefik.local.yml down
```

### Удалить все данные

```bash
docker-compose -f docker-compose.local.yml down -v
docker-compose -f docker-compose.traefik.local.yml down -v
```

### Убрать из hosts

**Linux/Mac:**
```bash
sudo sed -i '' '/procurement.local/d' /etc/hosts
```

**Windows:**
Отредактируйте `C:\Windows\System32\drivers\etc\hosts` и удалите строку с `procurement.local`

## 📝 Полезные команды

```bash
# Просмотр всех контейнеров
docker ps -a

# Просмотр сетей
docker network ls

# Подключение к базе данных
docker-compose -f docker-compose.local.yml exec postgres psql -U procurement_user -d procurement_db_local

# Просмотр логов всех контейнеров
docker-compose -f docker-compose.local.yml logs

# Просмотр логов конкретного сервиса
docker-compose -f docker-compose.local.yml logs backend

# Перезагрузка конкретного сервиса
docker-compose -f docker-compose.local.yml restart backend
```

## ✅ Проверка перед production

Перед развертыванием на production убедитесь, что:

- [ ] Frontend доступен по URL
- [ ] API endpoints отвечают правильно
- [ ] CORS заголовки установлены правильно
- [ ] База данных инициализируется при запуске
- [ ] Все сервисы показывают статус "healthy"
- [ ] Нет ошибок в логах
- [ ] Traefik correctly routes requests
- [ ] Middleware stripprefix работает правильно

## 🚀 После успешного локального тестирования

1. Убедитесь, что все изменения закоммичены
2. Обновите .env.production.example если нужно
3. Следуйте TRAEFIK_DEPLOYMENT.md для развертывания на production
4. Используйте deploy-traefik.sh скрипт для автоматизации

---

**Примечание:** В локальном окружении используется HTTP вместо HTTPS для упрощения тестирования. На production Traefik будет автоматически выдавать Let's Encrypt сертификаты.
