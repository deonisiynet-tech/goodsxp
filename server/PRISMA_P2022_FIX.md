# 🚨 TERMINAL FIX: Prisma P2022 Column Not Found

## Проблема

```
PrismaClientKnownRequestError: P2022
The column does not exist in the current database
Column: createdAt
Table: Product
```

**Причина:** `prisma db push --accept-data-loss` видалив колонку `createdAt` з бази даних на Railway.

---

## 🔧 Рішення 1: Виправлення через Railway SQL (НАДШВИДШЕ)

### Крок 1: Відкрийте Railway Dashboard

1. Зайдіть на https://railway.app
2. Виберіть свій проект
3. Перейдіть на вкладку **PostgreSQL**
4. Натисніть **"Open Service"** → **"SQL Editor"**

### Крок 2: Виконайте SQL для додавання колонки

```sql
-- Додати createdAt якщо відсутня
ALTER TABLE "Product" 
ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Додати updatedAt якщо відсутній
ALTER TABLE "Product" 
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Створити індекс
CREATE INDEX IF NOT EXISTS "Product_createdAt_idx" ON "Product"("createdAt");
```

### Крок 3: Перезапустіть додаток

1. Перейдіть на вкладку **Deployments**
2. Натисніть **"Restart"**

### Крок 4: Перевірте API

```bash
GET https://your-domain.railway.app/api/products?limit=50&sortBy=createdAt&sortOrder=desc
```

---

## 🔧 Рішення 2: Виправлення через Prisma Migrate

### Крок 1: Підключіться до Railway PostgreSQL

```bash
# Отримайте DATABASE_URL з Railway Dashboard
# Змінні → DATABASE_URL → Copy

# Підключіться через psql
psql $DATABASE_URL
```

### Крок 2: Застосуйте міграцію

```bash
# Локально в проекті
cd server
npx prisma migrate deploy --schema ./prisma/schema.prisma
```

### Крок 3: Перезапустіть деплой на Railway

```bash
# Railway автоматично застосує міграції при деплої
# Переконайтеся що Dockerfile має:
CMD ["sh", "-c", "npx prisma migrate deploy --schema=./prisma/schema.prisma && node dist/server.js"]
```

---

## 🔧 Рішення 3: Повне відновлення таблиці Product

Якщо нічого не допомагає, створіть таблицю заново:

```sql
-- 1. Видалити стару таблицю (УВАГА: втратите дані!)
DROP TABLE IF EXISTS "OrderItem" CASCADE;
DROP TABLE IF EXISTS "Review" CASCADE;
DROP TABLE IF EXISTS "Product" CASCADE;

-- 2. Створити таблицю Product знову
CREATE TABLE "Product" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "price" DECIMAL(10,2) NOT NULL,
  "categoryId" TEXT,
  "rating" DECIMAL(3,2) DEFAULT 0,
  "originalPrice" DECIMAL(10,2),
  "discountPrice" DECIMAL(10,2),
  "isFeatured" BOOLEAN NOT NULL DEFAULT false,
  "isPopular" BOOLEAN NOT NULL DEFAULT false,
  "imageUrl" TEXT,
  "images" TEXT[],
  "stock" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- 3. Створити індекси
CREATE INDEX "Product_isActive_idx" ON "Product"("isActive");
CREATE INDEX "Product_createdAt_idx" ON "Product"("createdAt");
CREATE INDEX "Product_title_idx" ON "Product"("title");
CREATE INDEX "Product_isFeatured_idx" ON "Product"("isFeatured");
CREATE INDEX "Product_isPopular_idx" ON "Product"("isPopular");
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");
CREATE INDEX "Product_rating_idx" ON "Product"("rating");

-- 4. Створити інші таблиці
-- (див. повний SQL в prisma/migrations/20260319000000_init/migration.sql)
```

---

## ✅ Перевірка результату

### SQL Перевірка

```sql
-- Перевірити колонки Product
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'Product'
ORDER BY ordinal_position;

-- Очікуваний результат:
-- id, title, description, price, categoryId, rating,
-- originalPrice, discountPrice, isFeatured, isPopular,
-- imageUrl, images, stock, isActive, createdAt, updatedAt
```

### API Перевірка

```bash
# Health check
curl https://your-domain.railway.app/health

# Products API
curl "https://your-domain.railway.app/api/products?limit=50&sortBy=createdAt&sortOrder=desc"
```

---

## 🛡️ Профілактика

### Ніколи не використовуйте в production:

```bash
# ❌ НЕБЕЗПЕЧНО - може видалити дані!
prisma db push --accept-data-loss
```

### Використовуйте тільки:

```bash
# ✅ БЕЗПЕЧНО - застосовує міграції без втрати даних
prisma migrate deploy
```

### Оновлений Dockerfile:

```dockerfile
# ✅ Правильний CMD для production
CMD ["sh", "-c", "npx prisma migrate deploy --schema=./prisma/schema.prisma && node dist/server.js"]
```

---

## 📞 Швидка допомога

### Якщо помилка все ще виникає:

1. **Перевірте логи Railway:**
   ```
   railway logs
   ```

2. **Перевірте змінні оточення:**
   ```
   railway variables
   ```

3. **Перевірте чи застосовані міграції:**
   ```sql
   SELECT * FROM "_prisma_migrations" 
   ORDER BY started_at DESC 
   LIMIT 5;
   ```

4. **Перевірте структуру БД:**
   ```sql
   \d "Product"
   ```

---

## 📝 Чеклист

- [ ] `DATABASE_URL` налаштовано в Railway
- [ ] SQL для додавання `createdAt` виконано
- [ ] Dockerfile оновлено (використовує `migrate deploy`)
- [ ] Деплой перезапущено
- [ ] `/health` повертає 200 OK
- [ ] `/api/products` повертає товари без помилок
