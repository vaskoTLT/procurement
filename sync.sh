#!/bin/bash

echo "=== $(date) Синхронизация пользователей ==="

# Функция для проверки существования пользователя
check_user_exists() {
    local telegram_id="$1"

    # Пробуем сравнить как bigint (приводим telegram_id к числу)
    EXISTS=$(docker exec procurement-db psql -U procurement_user -d procurement_db -t -c "
        SELECT EXISTS(
            SELECT 1 FROM authorized_users 
            WHERE telegram_id = $telegram_id::bigint
        );
    " | xargs)

    echo "$EXISTS"
}

# Получаем данные из supabase
echo "1. Получаем данные из supabase..."
SUPABASE_DATA=$(docker exec supabase-db psql -U postgres -d postgres --csv -t -c "
    SELECT 
        TRIM(telegram_id),
        COALESCE(NULLIF(TRIM(username), ''), ''),
        COALESCE(NULLIF(TRIM(CONCAT(first_name, ' ', COALESCE(last_name, ''))), ''), 'Новый пользователь'),
        email
    FROM public.n8n_registration 
    WHERE telegram_id IS NOT NULL 
    AND telegram_id != ''
    AND telegram_id ~ '^[0-9]+$'
    ORDER BY created_at;
")

echo "Данные из supabase:"
echo "$SUPABASE_DATA"

# Обрабатываем каждую запись
echo ""
echo "2. Обрабатываем записи..."
added_count=0
skipped_count=0

IFS=$'\n'
for line in $SUPABASE_DATA; do
    if [ -n "$line" ] && [ "$line" != "telegram_id,username,description,email" ]; then
        # Разбираем CSV строку
        IFS=',' read -r telegram_id username description email <<< "$line"

        # Убираем возможные кавычки и пробелы
        telegram_id=$(echo "$telegram_id" | tr -d '"' | xargs)
        username=$(echo "$username" | tr -d '"' | xargs)
        description=$(echo "$description" | tr -d '"' | xargs)

        echo "Обработка: telegram_id='$telegram_id'"

        if [ -n "$telegram_id" ]; then
            # Проверяем, что telegram_id состоит только из цифр
            if [[ "$telegram_id" =~ ^[0-9]+$ ]]; then
                echo "  Валидный ID: $telegram_id"

                # Проверяем существование
                EXISTS=$(check_user_exists "$telegram_id")

                if [ "$EXISTS" = "f" ]; then
                    echo "  → Добавляем нового пользователя: $description"

                    # Экранируем кавычки для SQL
                    safe_username=$(echo "$username" | sed "s/'/''/g")
                    safe_description=$(echo "$description" | sed "s/'/''/g")

                    # Добавляем пользователя (telegram_id приводим к bigint)
                    docker exec procurement-db psql -U procurement_user -d procurement_db -c "
                        INSERT INTO authorized_users (
                            telegram_id, 
                            username, 
                            description, 
                            is_active, 
                            authorized_at, 
                            authorized_by
                        ) VALUES (
                            $telegram_id::bigint,
                            '$safe_username',
                            '$safe_description',
                            true,
                            NOW(),
                            'system'
                        );
                    "

                    if [ $? -eq 0 ]; then
                        echo "  ✅ Успешно добавлен"
                        ((added_count++))
                    else
                        echo "  ❌ Ошибка при добавлении"
                    fi
                else
                    echo "  ⏭ Уже существует"
                    ((skipped_count++))
                fi
            else
                echo "  ❌ Невалидный telegram_id: '$telegram_id'"
            fi
        fi
    fi
done

echo ""
echo "3. Итоги: Добавлено: $added_count, Пропущено: $skipped_count"

echo ""
echo "4. Проверяем результат в procurement_db:"
docker exec procurement-db psql -U procurement_user -d procurement_db -c "SELECT id, telegram_id, description FROM authorized_users ORDER BY id;"

echo ""
echo "=== Синхронизация завершена ==="