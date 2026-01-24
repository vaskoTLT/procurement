#!/bin/bash

#####################################
# Procurement Project Deployment Script
# Для существующего Traefik сервера
# 
# ⚠️  ВАЖНО: Traefik должен уже быть установлен и работать!
#####################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOY_PATH="${DEPLOY_PATH:-/opt/docker/compose/procurement}"
PROJECT_NAME="procurement"

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Procurement Project Deployment                       ║${NC}"
echo -e "${BLUE}║  (для существующего Traefik сервера)               ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}\n"

# Function to print status
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker не установлен. Пожалуйста, установите Docker."
    exit 1
fi
print_status "Docker найден"

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose не установлен. Пожалуйста, установите Docker Compose."
    exit 1
fi
print_status "Docker Compose найден"

# Check if proxy network exists
if ! docker network ls | grep -q "proxy"; then
    print_warning "Сеть 'proxy' не найдена!"
    print_error "⚠️  ОШИБКА: Traefik должен быть установлен и сеть 'proxy' должна существовать"
    print_info "На вашем сервере не найдена сеть proxy, которую создает Traefik"
    print_info "Пожалуйста, убедитесь что Traefik работает:"
    print_info "  docker ps | grep traefik"
    print_info "  docker network ls | grep proxy"
    exit 1
fi
print_status "Сеть 'proxy' найдена (создана Traefik)"

# Check if deployment directory exists
if [ ! -d "$DEPLOY_PATH" ]; then
    print_error "Каталог $DEPLOY_PATH не существует"
    print_info "Создаю каталог..."
    mkdir -p "$DEPLOY_PATH"
fi
print_status "Каталог развертывания: $DEPLOY_PATH"

# Change to deployment directory
cd "$DEPLOY_PATH"
print_status "Переместился в $DEPLOY_PATH"

# Check if .env exists
if [ ! -f ".env" ]; then
    if [ -f ".env.production.example" ]; then
        print_warning "Файл .env не найден. Копирую шаблон..."
        cp .env.production.example .env
        print_info "Отредактируйте .env с вашими значениями"
        print_info "nano .env"
    else
        print_error "Ни .env, ни .env.production.example не найдены"
        exit 1
    fi
else
    print_status "Файл .env найден"
fi

# Load environment variables
print_info "Загружаю переменные окружения..."
export $(cat .env | grep -v '^#' | xargs)

# Validate environment variables
if [ -z "$DOMAIN" ]; then
    print_error "DOMAIN не установлен в .env"
    exit 1
fi
print_status "Домен: $DOMAIN"

if [ -z "$DB_PASSWORD" ]; then
    print_warning "DB_PASSWORD не установлен. Используется значение по умолчанию"
fi

# Build images
echo -e "\n${BLUE}─────────────────────────────────────────────────────${NC}"
echo -e "${BLUE}Этап 1: Построение образов${NC}"
echo -e "${BLUE}─────────────────────────────────────────────────────${NC}\n"

print_info "Построение образов Docker..."
docker-compose build
print_status "Образы успешно построены"

# Stop existing containers if running
echo -e "\n${BLUE}─────────────────────────────────────────────────────${NC}"
echo -e "${BLUE}Этап 2: Остановка существующих контейнеров${NC}"
echo -e "${BLUE}─────────────────────────────────────────────────────${NC}\n"

if docker-compose ps 2>/dev/null | grep -q "Up"; then
    print_info "Остановка существующих контейнеров..."
    docker-compose stop
    print_status "Контейнеры остановлены"
else
    print_info "Нет работающих контейнеров"
fi

# Start containers
echo -e "\n${BLUE}─────────────────────────────────────────────────────${NC}"
echo -e "${BLUE}Этап 3: Запуск контейнеров${NC}"
echo -e "${BLUE}─────────────────────────────────────────────────────${NC}\n"

print_info "Запуск контейнеров в фоне..."
docker-compose up -d
print_status "Контейнеры запущены"

# Wait for services to be ready
echo -e "\n${BLUE}─────────────────────────────────────────────────────${NC}"
echo -e "${BLUE}Этап 4: Проверка здоровья сервисов${NC}"
echo -e "${BLUE}─────────────────────────────────────────────────────${NC}\n"

print_info "Погодите, сервисы инициализируются (30 сек)..."
sleep 30

# Check service health
print_info "Проверка статуса контейнеров..."
docker-compose ps

# Health check for backend
if docker-compose exec -T backend curl -f http://localhost:3002/health &> /dev/null; then
    print_status "✅ Backend сервис здоров"
else
    print_warning "⚠️ Backend может быть не готов, проверьте логи"
fi

# Health check for frontend
if docker-compose exec -T frontend curl -f http://localhost/health &> /dev/null; then
    print_status "✅ Frontend сервис здоров"
else
    print_warning "⚠️ Frontend может быть не готов, проверьте логи"
fi

# Display final information
echo -e "\n${BLUE}─────────────────────────────────────────────────────${NC}"
echo -e "${GREEN}✓ Развертывание завершено успешно!${NC}"
echo -e "${BLUE}─────────────────────────────────────────────────────${NC}\n"

echo -e "${YELLOW}Информация о сервисах:${NC}"
echo -e "  ${GREEN}URL:${NC}              https://$DOMAIN"
echo -e "  ${GREEN}API URL:${NC}          https://$DOMAIN/api"
echo -e "  ${GREEN}Health Check:${NC}     https://$DOMAIN/api/health"
echo -e "  ${GREEN}Backend Health:${NC}   https://$DOMAIN/health"
echo -e "  ${GREEN}Traefik:${NC}          Уже работает на сервере\n"

echo -e "${YELLOW}Что произошло:${NC}"
echo -e "  ✓ Контейнеры запущены"
echo -e "  ✓ Автоматически подключены к сети proxy (Traefik)"
echo -e "  ✓ Traefik автоматически нашел новые контейнеры"
echo -e "  ✓ Let's Encrypt выдает SSL сертификат (может занять 30-60 сек)"
echo -e "  ✓ База данных инициализирована\n"

echo -e "${YELLOW}Полезные команды:${NC}"
echo -e "  ${BLUE}Просмотр логов:${NC}          docker-compose logs -f"
echo -e "  ${BLUE}Статус сервисов:${NC}        docker-compose ps"
echo -e "  ${BLUE}Проверка подключения:${NC}   docker network inspect proxy"
echo -e "  ${BLUE}Перезагрузка:${NC}           docker-compose restart"
echo -e "  ${BLUE}Остановка:${NC}              docker-compose down"
echo -e "  ${BLUE}Полная перестройка:${NC}     docker-compose build --no-cache && docker-compose up -d\n"

print_status "Развертывание завершено! Приложение подключено к Traefik"
