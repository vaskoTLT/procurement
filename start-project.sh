#!/bin/bash
echo "🚀 Запускаем Smart Shopping List..."
cd /home/vmorozov/shoper-project2

echo "🐳 Запускаем контейнеры..."
docker compose up -d

sleep 3

echo ""
echo "✅ Проект запущен!"
echo "================================"
echo "🌐 Frontend доступен по: http://localhost:8080"
echo "🔧 Backend API: http://localhost:3000/api/health"
echo "📊 Проверить статус: docker compose ps"
echo "📝 Логи backend: docker compose logs shoper-backend -f"
echo "📝 Логи frontend: docker compose logs smart-shopping-list -f"
echo "================================"
