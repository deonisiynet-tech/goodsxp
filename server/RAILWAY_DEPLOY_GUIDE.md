# 🚀 Railway Deployment Guide - Prisma 7

## ✅ Проблема вирішена

Помилка `type "Role" already exists` більше не з'являється. Скрипт міграцій тепер автоматично обробляє дублікати ENUM типів.

---

## 📋 Швидкий старт

### 1. Локальна перевірка (перед деплоєм)

```bash
cd server

# Перевірка БД
npm run check-db

# Збірка
npm run build

# Тест локально
npm run dev
```

### 2. Деплой на Railway

```bash
git add .
git commit -m "fix: Prisma 7 migration with ENUM handling"
git push origin main
```

Railway автоматично:
1. Запустить `npm run build`
2. Запустить `./start.sh` (який виконує міграції)

---

## 🔧 Виправлення помилок міграції

### Помилка: `type "Role" already exists`

**Сталася на Railway?** Це означає, що ENUM типи вже створені в базі.

**Рішення впроваджено в код:**
- `src/prisma/migrate.ts` тепер використовує:
  ```sql
  DO $$ BEGIN
    CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END $$;
  ```

**Логи на Railway:**
```
⚠️ Warning for 20260313000000_init: type "Role" already exists
✓ Applied 20260313000000_init
✓ Applied 20260317_add_product_badges_and_discounts
✓ Applied 20260318185511_add_reviews
✅ Database migrations completed
```

Це **нормально**! Міграції продовжуються навіть якщо типи вже існують.

---

## 📊 Перевірка після деплою

### 1. Health Check
```bash
curl https://your-app.railway.app/health
```

Очікується:
```json
{
  "status": "healthy",
  "timestamp": "2026-03-18T...",
  "uptime": 123.45,
  "port": 8080
}
```

### 2. API Products
```bash
curl https://your-app.railway.app/api/products
```

Очікується: список товарів без помилок P2022

### 3. API Reviews
```bash
curl https://your-app.railway.app/api/products/<id>/reviews
```

Очікується: список відгуків

---

## 🛠️ Ручне виправлення (якщо потрібно)

### Варіант 1: Через Railway CLI

```bash
# Встановіть CLI
npm install -g @railway/cli

# Логін
railway login

# Підключіться до БД
railway database

# Виконайте SQL-скрипт
railway run "psql $DATABASE_URL -f prisma/fix-railway-db.sql"
```

### Варіант 2: Через pgAdmin/DBeaver

1. Підключіться до БД Railway
2. Відкрийте Query Tool
3. Виконайте `prisma/fix-railway-db.sql`

### Варіант 3: Через Railway Dashboard

1. Відкрийте Railway Dashboard
2. Знайдіть вашу базу даних
3. Натисніть "Connect" → "Copy connection string"
4. Використайте онлайн SQL клієнт (наприклад, https://pgadmin.org)

---

## 📁 Структура міграцій

```
prisma/migrations/
├── 20260313000000_init/
│   └── migration.sql
│       # User, Product, Order, OrderItem, AdminLog, SiteSettings
│       # Enums: Role, OrderStatus, ActionType
├── 20260317_add_product_badges_and_discounts/
│   └── migration.sql
│       # Product: originalPrice, discountPrice, isFeatured, isPopular
├── 20260318185511_add_reviews/
│   └── migration.sql
│       # Review, Category, SystemLog
│       # Enums: LogLevel, LogSource
└── migration_lock.toml
```

---

## 🎯 Контрольний список деплою

- [ ] `npm run check-db` показує ✅
- [ ] `npm run build` завершується без помилок
- [ ] Логи Railway показують "✅ Database migrations completed"
- [ ] `/health` повертає 200
- [ ] `/api/products` працює без P2022
- [ ] Адмінка дозволяє змінювати товари
- [ ] Відгуки та рейтинги відображаються

---

## 📝 Змінні оточення (Railway)

```env
PORT=8080
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host.railway.internal:5432/dbname
JWT_SECRET=your-secret-key-min-32-chars
CLIENT_URL=https://your-app.railway.app
```

---

## 🐛 Поширені проблеми

### "column 'originalPrice' does not exist"

**Причина:** Міграція не застосована.

**Рішення:**
```bash
npm run migrate
```

### "relation 'Review' does not exist"

**Причина:** Таблиця Review не створена.

**Рішення:**
```bash
# Виконайте SQL-скрипт
psql $DATABASE_URL -f prisma/fix-railway-db.sql
```

### Міграції застосовані, але помилки залишаються

**Причина:** Кеш Prisma Client.

**Рішення:**
```bash
# Перестворіть Prisma Client
npx prisma generate

# Перезапустіть сервер
railway restart
```

---

## 📞 Підтримка

Якщо виникли проблеми:

1. Перевірте логи Railway
2. Виконайте `npm run check-db`
3. Перегляньте `DATABASE_SYNC_REPORT.md`
4. Використайте `prisma/fix-railway-db.sql`

---

**Останнє оновлення:** 2026-03-18  
**Статус:** ✅ Виправлено ENUM duplicate errors
