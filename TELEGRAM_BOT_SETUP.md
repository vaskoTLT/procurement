# Настройка Telegram бота для безшовной авторизации

## Введение

Этот документ описывает как настроить Telegram бота для обеспечения безопасной и безшовной авторизации пользователей в приложении. Система позволяет открывать приложение только авторизованным пользователям, чьи Telegram ID хранятся в базе данных PostgreSQL.

## Шаг 1: Создание Telegram бота

1. **Откройте чат с @BotFather** в Telegram
2. **Создайте нового бота** с помощью команды `/newbot`
3. **Следуйте инструкциям** BotFather:
   - Укажите имя бота (например, "Procurement App Bot")
   - Укажите username бота (должен заканчиваться на `bot`, например `procurement_app_bot`)
4. **Сохраните токен бота** - он понадобится для настройки

## Шаг 2: Настройка бота

### Базовые настройки

1. **Установите описание бота**:
   ```
   /setdescription
   ```
   Описание: "Официальный бот для доступа к приложению закупок. Только для авторизованных пользователей."

2. **Установите команду меню**:
   ```
   /setcommands
   ```
   Команды:
   ```
   start - Открыть приложение
   help - Помощь
   ```

3. **Настройте приветственное сообщение**:
   ```
   /setabouttext
   ```
   Текст: "Этот бот предоставляет доступ к корпоративному приложению закупок. Доступ разрешен только авторизованным сотрудникам."

### Настройки конфиденциальности

1. **Отключите групповые чаты** (если не нужны):
   ```
   /setjoingroups - Отключить
   ```

2. **Отключите добавление в каналы**:
   ```
   /setprivacy - Включить режим конфиденциальности
   ```

## Шаг 3: Настройка WebApp

### Создание WebApp

1. **Создайте WebApp** для вашего приложения:
   ```
   /newapp
   ```
2. **Укажите URL вашего приложения**:
   ```
   https://ваш-домен.com
   ```
3. **Настройте параметры WebApp**:
   - Заголовок: "Procurement App"
   - Описание: "Корпоративное приложение закупок"
   - Версия: "1.0"
   - Платформы: "Все"

### Настройка домена

1. **Добавьте домен** для WebApp:
   ```
   /setdomain
   ```
   Укажите ваш домен:
   ```
   ваш-домен.com
   ```

2. **Настройте HTTPS** - Telegram требует HTTPS для WebApp

## Шаг 4: Настройка авторизации

### Добавление пользователей в базу данных

1. **Получите Telegram ID пользователя**:
   - Пользователь должен отправить сообщение боту @userinfobot
   - Бот вернет Telegram ID в формате: `Id: 123456789`

2. **Добавьте пользователя в базу данных**:
   ```sql
   INSERT INTO authorized_users (telegram_id, username, description)
   VALUES (123456789, 'ivan_petrov', 'Сотрудник отдела закупок')
   ON CONFLICT (telegram_id) DO NOTHING;
   ```

3. **Проверьте добавление**:
   ```sql
   SELECT * FROM authorized_users WHERE telegram_id = 123456789;
   ```

### Управление доступом

- **Добавить пользователя**:
  ```sql
  INSERT INTO authorized_users (telegram_id, username, description)
  VALUES (telegram_id, 'username', 'description');
  ```

- **Заблокировать пользователя**:
  ```sql
  UPDATE authorized_users SET is_active = false WHERE telegram_id = 123456789;
  ```

- **Удалить пользователя**:
  ```sql
  DELETE FROM authorized_users WHERE telegram_id = 123456789;
  ```

## Шаг 5: Создание deep links

### Формат deep links

Telegram поддерживает deep links для открытия WebApp:

```
https://t.me/ваш_bot_username/app?startapp=unique_token
```

### Генерация уникальных токенов

1. **Создайте endpoint для генерации токенов** (backend):

```javascript
// Пример генерации JWT токена
const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.TELEGRAM_TOKEN_SECRET || 'your-secret-key';

function generateTelegramToken(telegramId) {
  return jwt.sign(
    { telegramId, exp: Math.floor(Date.now() / 1000) + (60 * 5) }, // 5 минут
    SECRET_KEY
  );
}
```

2. **Создайте защищенную страницу** для генерации ссылок (только для администраторов)

### Проверка токенов

1. **Добавьте middleware для проверки токенов**:

```javascript
// Middleware для проверки Telegram токенов
const verifyTelegramToken = (req, res, next) => {
  try {
    const token = req.query.startapp;
    if (!token) return res.status(403).send('Токен не предоставлен');

    const decoded = jwt.verify(token, SECRET_KEY);
    req.telegramId = decoded.telegramId;
    next();
  } catch (error) {
    console.error('Ошибка проверки токена:', error);
    res.status(403).send('Неверный или просроченный токен');
  }
};
```

## Шаг 6: Интеграция с фронтендом

### Настройка Telegram WebApp API

1. **Инициализация WebApp**:

```javascript
// В основном компоненте приложения
useEffect(() => {
  if (window.Telegram?.WebApp) {
    const tg = window.Telegram.WebApp;

    // Развернуть WebApp на весь экран
    tg.expand();

    // Получить данные пользователя
    const userData = tg.initDataUnsafe?.user;

    if (userData?.id) {
      // Сохранить Telegram ID
      localStorage.setItem('telegramId', userData.id.toString());

      // Проверить авторизацию
      apiService.checkAuth();
    }
  }
}, []);
```

2. **Обработка ошибок авторизации**:

```javascript
// Если пользователь не авторизован
if (!isAuthorized) {
  return (
    <div className="error-screen">
      <h2>❌ Доступ запрещен</h2>
      <p>Ваш Telegram аккаунт не авторизован для использования этого приложения.</p>
      <p>Пожалуйста, обратитесь к администратору для получения доступа.</p>
      <button onClick={() => window.Telegram.WebApp.close()}>
        Закрыть приложение
      </button>
    </div>
  );
}
```

## Шаг 7: Безопасность

### Валидация initData

1. **Проверка подписи initData**:

```javascript
// Функция для проверки подписи initData
async function validateTelegramInitData(initData) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const secretKey = crypto.createHash('sha256').update(botToken).digest();

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  params.delete('hash');

  // Сортируем параметры
  const sortedParams = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  // Создаем HMAC
  const hmac = crypto.createHmac('sha256', secretKey)
    .update(sortedParams)
    .digest('hex');

  return hmac === hash;
}
```

2. **Использование в authMiddleware**:

```javascript
// Обновленный authMiddleware с проверкой initData
const authMiddleware = async (req, res, next) => {
  try {
    const initData = req.headers['x-init-data'];
    const telegramId = req.headers['x-telegram-id'];

    // Проверка initData
    if (initData && !validateTelegramInitData(initData)) {
      return res.status(403).json({
        success: false,
        error: 'INVALID_INIT_DATA',
        message: 'Неверные данные инициализации Telegram'
      });
    }

    // Остальная логика авторизации...
  } catch (error) {
    console.error('Ошибка авторизации:', error);
    res.status(500).json({
      success: false,
      error: 'AUTH_ERROR',
      message: 'Ошибка авторизации'
    });
  }
};
```

## Шаг 8: Тестирование

### План тестирования

1. **Тест авторизованного пользователя**:
   - Открыть WebApp через Telegram
   - Убедиться, что приложение загружается
   - Проверить, что все API запросы проходят

2. **Тест неавторизованного пользователя**:
   - Попробовать открыть WebApp с Telegram ID, которого нет в базе
   - Убедиться, что показывается сообщение об ошибке
   - Проверить, что API запросы блокируются

3. **Тест истекшего токена**:
   - Сгенерировать токен с коротким сроком жизни
   - Подождать истечения срока
   - Убедиться, что доступ блокируется

## Шаг 9: Развертывание

### Чеклист развертывания

- [ ] Создан и настроен Telegram бот
- [ ] Настроен WebApp в BotFather
- [ ] Добавлены авторизованные пользователи в базу данных
- [ ] Настроены переменные окружения:
  - `TELEGRAM_BOT_TOKEN` - токен бота
  - `TELEGRAM_TOKEN_SECRET` - секретный ключ для JWT
- [ ] Обновлены фронтенд и бэкенд с новыми функциями безопасности
- [ ] Проведено тестирование всех сценариев
- [ ] Обновлена документация

## Переменные окружения

Добавьте в `.env` файл:

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
TELEGRAM_TOKEN_SECRET=your_strong_secret_key_for_jwt
TELEGRAM_WEBAPP_DOMAIN=https://your-domain.com
```

## Рекомендации по безопасности

1. **Храните токены в безопасности** - никогда не коммитьте их в репозиторий
2. **Используйте короткие сроки жизни токенов** - 5-15 минут достаточно
3. **Регулярно обновляйте секретные ключи**
4. **Мониторьте логи авторизации** для обнаружения подозрительной активности
5. **Ограничьте доступ к боту** через настройки конфиденциальности

## Устранение неполадок

### Частые проблемы

1. **Бот не открывает WebApp**:
   - Проверьте, что домен добавлен в BotFather
   - Убедитесь, что используется HTTPS
   - Проверьте, что WebApp правильно настроен

2. **Пользователь авторизован, но доступ запрещен**:
   - Проверьте, что Telegram ID правильно добавлен в базу
   - Убедитесь, что `is_active = true`
   - Проверьте логи бэкенда на ошибки

3. **Ошибка валидации initData**:
   - Проверьте, что используется правильный токен бота
   - Убедитесь, что алгоритм HMAC правильный
   - Проверьте формат initData

## Заключение

После выполнения всех этих шагов ваш Telegram бот будет полностью настроен для безопасной и безшовной авторизации. Пользователи смогут открывать приложение только через Telegram, и доступ будет разрешен только тем, чьи Telegram ID находятся в базе данных.