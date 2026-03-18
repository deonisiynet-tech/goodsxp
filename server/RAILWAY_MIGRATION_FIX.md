# Prisma 7 Migration Fix for Railway

## Проблема
Prisma 7 більше не підтримує властивість `url` в `schema.prisma`. Команда `prisma migrate deploy` вимагає `url` в схемі, тому ми використовуємо кастомний скрипт для міграцій.

## Рішення

### 1. Міграції тепер виконуються через `src/prisma/migrate.ts`
Цей скрипт:
- Підключається до бази даних через `pg` (node-postgres)
- Створює таблицю `_prisma_migrations` якщо її немає
- Застосовує всі SQL міграції з папки `prisma/migrations/`

### 2. Автоматичні міграції при старті
Сервер автоматично запускає міграції перед стартом через `src/server.ts`

### 3. Оновлений `start.sh` для Railway
```bash
#!/bin/bash
set -e

echo "🔄 Running Prisma migrations..."
node dist/prisma/migrate.js

echo "✅ Migrations complete"
echo "🚀 Starting server..."

exec node dist/server.js
```

## Команди для Railway

### Build Command (вже налаштовано):
```bash
cd server && npm run build
```

### Start Command (вже налаштовано):
```bash
cd server && ./start.sh
```

Або просто:
```bash
cd server && npm start
```

## Перевірка

### Локальна перевірка міграцій:
```bash
cd server
npm run migrate
```

### Локальний запуск:
```bash
cd server
npm run dev
```

## Структура міграцій

```
prisma/migrations/
├── 20260313000000_init/
│   └── migration.sql
├── 20260317_add_product_badges_and_discounts/
│   └── migration.sql
├── 20260318185511_add_reviews/
│   └── migration.sql
└── migration_lock.toml
```

## Помилка P2022 ColumnNotFound

Якщо ви бачите цю помилку в логах Railway:
```
Error: P2022 ColumnNotFound
meta: { modelName: 'Product' }
```

Це означає, що міграції не застосовані до бази даних.

### Виправлення:
1. Переконайтеся, що `start.sh` виконується при старті
2. Перевірте логи - має бути повідомлення "Running Prisma migrations..."
3. Якщо міграції не застосовуються, перевірте `DATABASE_URL`

## Змінні оточення (обов'язково)

```env
PORT=8080
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your-secret-key
```

## Примітки

- Міграції застосовуються тільки якщо ще не були застосовані
- Скрипт міграцій ігнорує вже застосовані міграції
- Помилки при міграції логуються, але не зупиняють сервер (warning)
