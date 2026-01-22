#!/bin/bash
echo "📊 Проверка статуса проекта..."
cd /home/vmorozov/shoper-project2

echo "1. Проверяем контейнеры:"
docker compose ps

echo ""
echo "2. Проверяем логи Backend (последние 5 строк):"
docker compose logs shoper-backend --tail 5

echo ""
echo "3. Проверяем логи Frontend (последние 5 строк):"
docker compose logs smart-shopping-list --tail 5

echo ""
echo "4. Проверяем подключение к БД:"
docker compose exec -T postgres pg_isready -U shoper_user 2>/dev/null || echo "Проверка невозможна"

echo ""
echo "✅ Проверка завершена"
