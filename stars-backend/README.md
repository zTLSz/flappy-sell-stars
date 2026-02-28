# Flappy Stars Backend

Node.js сервер для Telegram Stars платежей в Mini App игре.  
Сервис создаёт invoice-ссылки через Bot API и начисляет токены в Firebase RTDB после успешной оплаты.

## Что реализовано

- `POST /api/create-stars-invoice`:
  - валидирует `initData` (HMAC + `auth_date` <= 5 минут);
  - проверяет, что `userId` совпадает с пользователем из `initData`;
  - создаёт Telegram Stars invoice (`currency: XTR`, `provider_token: ''`).
- `GET /api/packages` — отдаёт доступные пакеты токенов.
- `GET /health` — health check для Railway.
- `POST /bot-webhook`:
  - проверяет `x-telegram-bot-api-secret-token`;
  - обрабатывает `pre_checkout_query` и `successful_payment`;
  - начисляет токены в `users/{userId}/coins`;
  - сохраняет транзакции и `purchaseHistory`.

## Структура

```text
stars-backend/
├── package.json
├── .env.example
├── src/
│   ├── index.js
│   ├── bot.js
│   ├── config.js
│   ├── firebase.js
│   ├── packages.js
│   ├── routes/
│   │   └── invoice.js
│   └── handlers/
│       └── payments.js
└── README.md
```

## Переменные окружения

Скопируй `.env.example` в `.env` и заполни:

```bash
BOT_TOKEN=
WEBHOOK_SECRET=
WEBAPP_URL=
PORT=3000

WEBHOOK_URL=
RAILWAY_PUBLIC_DOMAIN=

FIREBASE_SERVICE_ACCOUNT_JSON=
FIREBASE_DATABASE_URL=https://flappyleaders-default-rtdb.europe-west1.firebasedatabase.app
```

Примечания:
- `FIREBASE_SERVICE_ACCOUNT_JSON` — весь JSON service account одной строкой.
- `WEBHOOK_URL` имеет приоритет. Если он пустой, используется `RAILWAY_PUBLIC_DOMAIN` (`https://<domain>/bot-webhook`).

## Локальный запуск

```bash
npm install
npm run dev
```

## Деплой на Railway

1. Создай проект и подключи репозиторий.
2. Добавь env-переменные из списка выше.
3. Railway запустит `npm start`.
4. Проверь `GET /health`.
5. Убедись, что webhook установлен на `/bot-webhook`.

## Примеры запросов

### Получить пакеты

```bash
curl https://<host>/api/packages
```

### Создать инвойс

```bash
curl -X POST https://<host>/api/create-stars-invoice \
  -H "Content-Type: application/json" \
  -d '{
    "userId":"123456789",
    "packageId":"pack_500",
    "initData":"query_string_from_telegram_webapp"
  }'
```

## Важные нюансы

- Для Stars: `provider_token` всегда пустая строка `''`.
- `currency` строго `XTR`.
- Цены в `amount` указываются целыми числами Stars.
- `telegram_payment_charge_id` сохраняется в транзакции и может быть использован для рефанда.
