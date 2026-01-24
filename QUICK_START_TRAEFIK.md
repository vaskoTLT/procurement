# 🎯 Быстрый старт для развертывания на Traefik сервере

**⚠️ ВАЖНО:** На вашем сервере Traefik **уже работает**! Просто развертываем в существующий Traefik.

## ⚡ Минимум 5 минут на сервере

```bash
# ===== ШАГ 1: Clone проект =====
cd /opt/docker/compose
git clone https://github.com/your-repo/procurement.git procurement
cd procurement

# ===== ШАГ 2: Подготовить .env =====
cp .env.production.example .env

# Отредактировать 3 переменные:
# DOMAIN=procurement.fros-ty.com
# DB_PASSWORD=ваш_новый_пароль_БД
# SSL_EMAIL=admin@fros-ty.com
nano .env

# ===== ШАГ 3: Запустить =====
docker-compose build
docker-compose up -d

# ===== ШАГ 4: Проверить =====
sleep 30  # Дождитесь выдачи SSL сертификата
curl -I https://procurement.fros-ty.com/

# ✅ Готово!
```

## 📋 Что происходит автоматически

**При запуске docker-compose:**

✅ Контейнеры **автоматически подключаются к сети `proxy`**  
✅ Traefik **автоматически находит новые контейнеры** через labels  
✅ Traefik **автоматически выдает SSL сертификат** от Let's Encrypt  
✅ Приложение доступно по `https://procurement.fros-ty.com/`  
✅ База данных инициализируется автоматически  
✅ Health checks работают автоматически  

## 🔍 Проверка после развертывания

```bash
# Все контейнеры работают?
docker-compose ps

# Frontend доступен?
curl https://procurement.fros-ty.com/ --insecure

# API доступна?
curl https://procurement.fros-ty.com/api/health --insecure

# Traefik видит приложение?
curl http://localhost:8080/api/routers/

# БД работает?
docker-compose exec postgres psql -U procurement_user -d procurement_db -c "SELECT 1"
```

## 🚨 Если что-то не работает

```bash
# 1. Проверьте логи
docker-compose logs -f

# 2. Проверьте определенный сервис
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres

# 3. Перезагрузите
docker-compose restart

# 4. Полная пересборка (если критично)
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

## 📱 Доступ после развертывания

| Адрес | Описание |
|-------|---------|
| `https://procurement.fros-ty.com/` | Frontend приложение |
| `https://procurement.fros-ty.com/api/health` | API health check |
| `http://server-ip:8080/dashboard/` | Traefik dashboard (если открыт) |

## 💾 Резервная копия перед стартом

```bash
# ПЕРЕД развертыванием, если на сервере уже что-то было
docker-compose down -v
tar -czf /backups/procurement-before-migration-$(date +%Y%m%d).tar.gz \
  /opt/docker/compose/procurement/
```

## 🔧 Минимальные требования .env

Только эти 3 переменные ОБЯЗАТЕЛЬНЫ, остальное имеет defaults:

```env
DOMAIN=procurement.fros-ty.com
DB_PASSWORD=secure_password_here
SSL_EMAIL=admin@example.com
```

## 🆘 Самые частные проблемы

### 1. "Cannot connect to Docker daemon"

```bash
# Нужен sudo или добавить пользователя в docker group
sudo docker compose ps
# ИЛИ
sudo usermod -aG docker $USER
newgrp docker
```

### 2. "Network proxy not found"

```bash
# Traefik еще не создал сеть, скрипт создаст её сам
# Или создайте вручную:
docker network create proxy
```

### 3. "Port 80/443 already in use"

```bash
# Остановить Traefik или другое приложение
docker stop traefik
# ИЛИ найти процесс
sudo lsof -i :80
sudo lsof -i :443
```

### 4. SSL сертификат выдается долго

```bash
# Normal - может занять до 1 минуты первый раз
# Проверьте логи
docker logs traefik | tail -50
```

### 5. API возвращает CORS ошибку

```bash
# Proверьте, что backend здоров
docker-compose logs backend

# Проверьте CORS заголовки
curl -i -X OPTIONS https://procurement.fros-ty.com/api/health
```

## 📚 Полная документация

Для более подробной информации смотрите:

- **Полный гайд развертывания**: [TRAEFIK_DEPLOYMENT.md](./TRAEFIK_DEPLOYMENT.md)
- **Локальное тестирование**: [LOCAL_TRAEFIK_TESTING.md](./LOCAL_TRAEFIK_TESTING.md)
- **Миграция с старого**: [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)

## 💡 Pro Tips

```bash
# Смотреть логи real-time со всех сервисов
docker-compose logs -f

# Только backend логи
docker-compose logs -f backend

# Последние 20 строк логов
docker-compose logs --tail 20

# Перезагрузить только backend
docker-compose restart backend

# Очистить все (ВНИМАНИЕ - потеря данных!)
docker-compose down -v
docker volume prune
docker image prune
```

## ✅ Финальный чеклист

- [x] Traefik работает на сервере
- [x] DNS указывает на сервер
- [x] Git репозиторий приватный (если нужно)
- [ ] Clone проект
- [ ] Отредактировать .env
- [ ] Запустить deploy-traefik.sh
- [ ] Проверить https://procurement.fros-ty.com/
- [ ] Проверить логи
- [ ] Создать резервную копию БД

## 🎉 Поздравляем!

Ваше приложение теперь работает на production сервере с:
- ✅ Автоматическим SSL от Let's Encrypt
- ✅ Auto-renewal сертификатов
- ✅ Health checks
- ✅ Docker monitoring
- ✅ Полной безопасностью

---

**В случае вопросов:** Проверьте соответствующий раздел в [TRAEFIK_DEPLOYMENT.md](./TRAEFIK_DEPLOYMENT.md)
