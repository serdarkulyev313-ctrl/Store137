# Store 137 — Telegram Mini App-магазин

Готовый MVP-магазин смартфонов и гаджетов для Москвы: витрина, корзина, заявки, админка и Telegram-бот.

## Что внутри

- **Mini App (витрина)**: каталог, фильтры, корзина, оформление заявки.
- **Админка**: управление товарами и заказами (внутри Mini App по `/admin`).
- **Telegram-бот**: кнопка открытия магазина, уведомления и смена статусов.
- **Хранилище**: JSON-файлы в `/data` (легко заменить на Postgres позже).

## Быстрый запуск (Windows)

1. Установите Node.js 18+ и Git.
2. Скачайте проект и перейдите в папку:
   ```bash
   npm install
   ```
3. Скопируйте `.env.local.example` в `.env.local` и заполните значения.
4. Запустите веб-приложение:
   ```bash
   npm run dev
   ```
5. В отдельном окне запустите бота:
   ```bash
   node bot/index.js
   ```

Откройте `http://localhost:3000` в браузере, чтобы посмотреть витрину.

## Как получить публичный HTTPS URL для Telegram

Для Mini App нужен HTTPS-домен. Самый простой вариант — **Cloudflare Tunnel**:

1. Скачайте `cloudflared` для Windows: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
2. Запустите туннель:
   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```
3. Скопируйте адрес вида `https://random.trycloudflare.com` и вставьте его в `.env.local` как `MINI_APP_URL`.

## Настройка бота в BotFather

1. Создайте бота и получите `TELEGRAM_BOT_TOKEN`.
2. В BotFather:
   - `/setdomain` → выберите бота → вставьте `https://...trycloudflare.com`
   - `/setmenubutton` → выберите бота → Web App → URL `https://...trycloudflare.com`

## Как проверить, что initData приходит

- Откройте бота и нажмите **«🛒 Открыть магазин»**.
- В Mini App можно открыть DevTools → Console и выполнить:
  ```js
  window.Telegram?.WebApp?.initData
  ```
  Должна появиться строка с параметрами.

## Важные правила и безопасность

- Оформление заказа работает **только внутри Telegram**.
- Админка доступна **только** пользователям из `ADMIN_TG_IDS`.
- Telegram initData проходит серверную проверку подписи.
- Оплата — **только наличными**.

## Данные

Все данные лежат в `/data`:

- `products.json` — товары (включая варианты)
- `orders.json` — заявки

Формат можно расширять и переносить в БД.

## Фотографии

MVP-версия хранит ссылки на изображения. Самый простой способ:

- загрузить фото в любое облако
- вставить URL в админке

Позже можно добавить загрузку в `/public/uploads`.

## Основные маршруты

- `/` — витрина
- `/admin` — меню админки
- `/admin/products` — товары
- `/admin/orders` — заказы
- `/api/products` — публичный список товаров
- `/api/orders` — создание заказа
- `/api/admin/me` — проверка админа
- `/api/admin/products` — CRUD товаров
- `/api/admin/orders` — управление заказами
- `/api/ping` — проверка сервера

## Типичные ошибки

- **403 Forbidden при `npm install`**:
  - убедитесь, что используется публичный npm registry:
    ```bash
    npm config set registry https://registry.npmjs.org/
    ```
  - удалите приватные настройки в пользовательском `.npmrc` (например в `C:\Users\<ваш_пользователь>\.npmrc`)
  - повторите `npm install`
- **ERR_NAME_NOT_RESOLVED** при `trycloudflare`:
  - перезапустите туннель, получите новый адрес
- **502/1033 от Cloudflare**:
  - убедитесь, что `npm run dev` работает
  - проверьте, что туннель указывает на `http://localhost:3000`
- **TELEGRAM_BOT_TOKEN missing**:
  - проверьте `.env.local`
- **Нет initData в браузере**:
  - это нормально, открывайте через Telegram
- **VS Code не установлен**:
  - можно использовать любой редактор, это не обязательно

## Переход на прод в будущем

1. Перенесите JSON-данные в Postgres (структура уже подготовлена).
2. Разместите Next.js и бота на VPS.
3. Укажите боевой HTTPS-домен в `MINI_APP_URL` и BotFather.

---

Если нужно расширить функциональность (оплаты, доставка, CRM), это можно сделать поверх текущей структуры.
