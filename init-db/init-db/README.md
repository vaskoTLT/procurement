
# Инструкция по развертыванию БД PostgreSQL

Для запуска приложения на новом сервере выполните следующие шаги:

1.  **Создайте базу данных**:
    ```bash
    psql -U postgres -c "CREATE DATABASE smart_shopping_list;"
    ```

2.  **Запустите скрипты инициализации в указанном порядке**:
    ```bash
    psql -U postgres -d smart_shopping_list -f 01_schema.sql
    psql -U postgres -d smart_shopping_list -f 02_indexes_and_perms.sql
    psql -U postgres -d smart_shopping_list -f 03_initial_data.sql
    ```

3.  **Настройка бэкенда**:
    Поскольку текущее приложение является фронтенд-частью (SPA), вам потребуется API-прослойка (например, на Node.js или n8n), которая будет выполнять SQL-запросы к этой базе данных вместо использования `localStorage`.

### Параметры подключения:
- **DB_NAME**: smart_shopping_list
- **DB_USER**: postgres (или созданный вами)
- **PORT**: 5432
