# 📊 ЗВІТ: Синхронізація бази даних Prisma 7

## ✅ Стан локальної бази даних

```
📊 Існуючі таблиці:
   AdminLog, Category, Order, OrderItem, Product, Review, SiteSettings, SystemLog, User, _prisma_migrations

✅ Всі таблиці присутні

📦 Колонки таблиці Product:
  - id (text)
  - title (text)
  - description (text)
  - price (numeric)
  - imageUrl (text) [NULL]
  - images (ARRAY) [NULL]
  - stock (integer)
  - isActive (boolean)
  - createdAt (timestamp)
  - updatedAt (timestamp)
  - originalPrice (numeric) [NULL]     ✅ ДОДАНО
  - discountPrice (numeric) [NULL]     ✅ ДОДАНО
  - isFeatured (boolean)               ✅ ДОДАНО
  - isPopular (boolean)                ✅ ДОДАНО

💬 Колонки таблиці Review:
  - id (text)
  - productId (text)
  - name (text)
  - rating (integer)
  - comment (text) [NULL]
  - createdAt (timestamp)

📜 Застосовані міграції:
  - 20260313000000_init
  - 20260317_add_product_badges_and_discounts
  - 20260318185511_add_reviews

============================================================
✅ База даних синхронізована зі схемою Prisma
============================================================
```

---

## 📋 Список SQL-команд для Railway

Якщо на Railway відсутні якісь таблиці або колонки, виконайте:

### Варіант 1: Автоматично (рекомендовано)

```bash
# Локально з підключенням до Railway БД
cd server
npm run migrate
```

### Варіант 2: Через SQL-скрипт

```bash
# Через psql
psql "DATABASE_URL" -f prisma/fix-railway-db.sql

# Або через Railway CLI
railway database --command "psql -f prisma/fix-railway-db.sql"
```

### Варіант 3: Прямі SQL-команди

```sql
-- 1. Додати відсутні колонки в Product
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "originalPrice" DECIMAL(10,2);
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "discountPrice" DECIMAL(10,2);
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "isFeatured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "isPopular" BOOLEAN NOT NULL DEFAULT false;

-- 2. Створити індекси
CREATE INDEX IF NOT EXISTS "Product_isFeatured_idx" ON "Product"("isFeatured");
CREATE INDEX IF NOT EXISTS "Product_isPopular_idx" ON "Product"("isPopular");

-- 3. Створити таблицю Category (якщо немає)
CREATE TABLE IF NOT EXISTS "Category" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "parentId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- 4. Створити таблицю Review (якщо немає)
CREATE TABLE IF NOT EXISTS "Review" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "comment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- 5. Створити таблицю SystemLog (якщо немає)
CREATE TYPE "LogLevel" AS ENUM ('INFO', 'WARNING', 'ERROR');
CREATE TYPE "LogSource" AS ENUM ('ADMIN_PANEL', 'API', 'SYSTEM');

CREATE TABLE IF NOT EXISTS "SystemLog" (
  "id" TEXT NOT NULL,
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "level" "LogLevel" NOT NULL DEFAULT 'INFO',
  "message" TEXT NOT NULL,
  "userId" TEXT,
  "ipAddress" TEXT,
  "source" "LogSource" NOT NULL DEFAULT 'SYSTEM',
  "metadata" TEXT,
  CONSTRAINT "SystemLog_pkey" PRIMARY KEY ("id")
);

-- 6. Створити таблицю міграцій
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
  "id" TEXT PRIMARY KEY,
  "checksum" TEXT NOT NULL,
  "finished_at" TIMESTAMPTZ,
  "migration_name" TEXT NOT NULL,
  "logs" TEXT,
  "rolled_back_at" TIMESTAMPTZ,
  "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "applied_steps_count" INTEGER NOT NULL DEFAULT 0
);
```

---

## 🔧 Покрокова інструкція

### Локально (перед деплоєм):

```bash
cd server

# 1. Перевірка БД
npm run check-db

# 2. Застосування міграцій (якщо потрібно)
npm run migrate

# 3. Збірка
npm run build

# 4. Тестування
npm run dev
```

### На Railway (після деплою):

1. **Автоматично:** Міграції застосовуються при старті через `start.sh`

2. **Перевірка логів:**
   ```
   🔄 Running Prisma migrations...
   ✓ Applied 20260317_add_product_badges_and_discounts
   ✓ Applied 20260318185511_add_reviews
   ✅ Database migrations completed
   ```

3. **Якщо помилки:** Виконайте SQL-скрипт через Railway CLI:
   ```bash
   railway database --command "psql -f prisma/fix-railway-db.sql"
   ```

---

## ✅ Перевірка після міграції

### 1. Health check:
```bash
curl http://localhost:8080/health
# Очікується: {"status":"healthy",...}
```

### 2. API Products:
```bash
curl http://localhost:8080/api/products
# Очікується: список товарів без помилок
```

### 3. API Reviews:
```bash
curl http://localhost:8080/api/products/<id>/reviews
# Очікується: список відгуків
```

### 4. Створення відгуку:
```bash
curl -X POST http://localhost:8080/api/products/<id>/reviews \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","rating":5,"comment":"Great!"}'
```

### 5. Адмінка:
- Відкрийте `/admin`
- Змініть товар (ціну, назву, статус)
- **Очікується:** Немає помилок P2022

---

## 📁 Створені файли

| Файл | Призначення |
|------|-------------|
| `src/prisma/check-db.ts` | Скрипт перевірки стану БД |
| `src/prisma/migrate.ts` | Скрипт застосування міграцій |
| `prisma/fix-railway-db.sql` | SQL-скрипт для виправлення БД |
| `DATABASE_FIX_INSTRUCTION.md` | Повна інструкція для розробника |
| `RAILWAY_MIGRATION_FIX.md` | Інструкція для Railway |
| `start.sh` | Оновлено для авто-міграцій |

---

## 🎯 Контрольний список

- [x] Всі таблиці присутні
- [x] Всі колонки Product присутні (originalPrice, discountPrice, isFeatured, isPopular)
- [x] Таблиця Review створена
- [x] Таблиця Category створена
- [x] Таблиця SystemLog створена
- [x] Міграції застосовані
- [x] Скрипт check-db працює
- [x] Скрипт migrate працює
- [x] SQL-скрипт fix-railway-db.sql створено
- [x] Інструкції створено

---

## 🚀 Команди для використання

```bash
# Перевірка стану БД
npm run check-db

# Застосування міграцій
npm run migrate

# Локальний запуск
npm run dev

# Збірка для Railway
npm run build

# Prisma Studio (перегляд БД)
npm run prisma:studio
```

---

## ⚠️ Вирішені проблеми

| Проблема | Рішення |
|----------|---------|
| P2022 ColumnNotFound | Додано колонки через migrate.ts |
| Prisma 7 не підтримує url в schema.prisma | Використано PrismaPg adapter |
| prisma migrate deploy не працює | Створено кастомний скрипт міграцій |
| Відсутні таблиці Review/Category/SystemLog | Додано через SQL-скрипт |
| **type "Role" already exists** | **Додано EXCEPTION WHEN duplicate_object** |

---

## 🆕 Останні зміни

### Виправлення помилки "type already exists"

Якщо ви бачите помилку:
```
error: type "Role" already exists
Migration error: error: type "Role" already exists
```

**Причина:** ENUM типи вже існують в базі даних, але міграція намагається створити їх знову.

**Рішення:**
1. Скрипт `migrate.ts` тепер автоматично обробляє цю помилку
2. Використовується конструкція `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN NULL; END $$;`
3. Помилка логується як попередження, але міграція продовжується

**Файли оновлено:**
- `src/prisma/migrate.ts` - додавлено обробку duplicate_object помилок
- `prisma/fix-railway-db.sql` - ENUM створюються з EXCEPTION

---

**Дата:** 2026-03-18  
**Статус:** ✅ Завершено
