#!/bin/bash
echo "🔨 Пересобираем проект..."
cd /home/vmorozov/shoper-project2

echo "1. Останавливаем контейнеры..."
docker compose down

echo "2. Пересобираем образы..."
docker compose build --no-cache

echo "3. Запускаем проект..."
docker compose up -d

sleep 3

echo "4. Проверяем статус..."
docker compose ps

echo "✅ Проект пересобран и запущен!"
echo "🌐 Frontend: http://localhost:8080"
echo "🔧 Backend API: http://localhost:3000/api/health"
