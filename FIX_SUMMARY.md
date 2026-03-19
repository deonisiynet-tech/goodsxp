# 🚨 FIX SUMMARY: Prisma P2022 Column Not Found

## ❌ Проблема

```
PrismaClientKnownRequestError: P2022
The column does not exist in the current database
Column: createdAt (або інша)
Table: Product
```

---

## ✅ Виконані виправлення

### 1. Оновлено Dockerfile

**Було:**
```dockerfile
CMD ["sh", "-c", "npx prisma db push --schema=./prisma/schema.prisma --accept-data-loss --skip-generate || true && node dist/server.js"]
```

**Стало:**
```dockerfile
CMD ["sh", "-c", "npx prisma migrate deploy --schema=./prisma/schema.prisma && node dist/server.js"]
```

**Чому:** `prisma db push --accept-data-loss` може **видаляти колонки** з бази даних. `prisma migrate deploy` безпечно застосовує міграції без втрати даних.

---

### 2. Оновлено package.json

**Було:**
```json
"build": "tsc && cp -r prisma/migrations dist/prisma/migrations 2>/dev/null || xcopy /E /I prisma\\migrations dist\\prisma\\migrations"
```

**Стало:**
```json
"build": "tsc && xcopy /E /I /Y prisma\\migrations dist\\prisma\\migrations"
```

**Чому:** Тепер міграції коректно копіюються в `dist/prisma/migrations/` під час збірки на Windows.

---

### 3. Оновлено src/prisma/migrate.ts

Додано перевірку кількох шляхів для пошуку міграцій:

```typescript
let migrationsDir = path.join(__dirname, '../../prisma/migrations')
if (!fs.existsSync(migrationsDir)) {
  migrationsDir = path.join(__dirname, '../prisma/migrations')  // dist шлях
}
if (!fs.existsSync(migrationsDir)) {
  migrationsDir = path.join(process.cwd(), 'prisma/migrations')  // cwd шлях
}
```

---

### 4. Створено SQL для ручного виправлення

Файл: `prisma/fix-product-createdAt.sql`

```sql
ALTER TABLE "Product" 
ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Product" 
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS "Product_createdAt_idx" ON "Product"("createdAt");
```

---

## 🚀 Як виправити на Railway

### Спосіб 1: Через Railway SQL Editor (НАЙШВИДШЕ)

1. Зайдіть на https://railway.app
2. Виберіть свій проект → PostgreSQL
3. Натисніть **"SQL Editor"**
4. Виконайте:

```sql
ALTER TABLE "Product" 
ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Product" 
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
```

5. Перезапустіть додаток (Deployments → Restart)

---

### Спосіб 2: Через новий деплой

1. Запуште зміни в Git:
```bash
git add .
git commit -m "fix: use prisma migrate deploy instead of db push"
git push
```

2. Railway автоматично задеплоїть
3. `prisma migrate deploy` застосує міграції
4. Додаток запуститься з правильною структурою БД

---

## ✅ Перевірка

### 1. Health Check

```bash
GET https://your-domain.railway.app/health
# Очікується: 200 OK
```

### 2. Products API

```bash
GET https://your-domain.railway.app/api/products?limit=50&sortBy=createdAt&sortOrder=desc
# Очікується: 200 OK з списком товарів
```

### 3. Перевірка БД

```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'Product' 
ORDER BY ordinal_position;

-- Очікується: id, title, description, price, categoryId, rating,
-- originalPrice, discountPrice, isFeatured, isPopular,
-- imageUrl, images, stock, isActive, createdAt, updatedAt
```

---

## 📁 Змінені файли

| Файл | Зміни |
|------|-------|
| `Dockerfile` | Замінено `db push` на `migrate deploy` |
| `server/package.json` | Виправлено скрипт `build` |
| `server/src/prisma/migrate.ts` | Додано перевірку 3 шляхів |
| `server/prisma/fix-product-createdAt.sql` | Створено SQL для ручного виправлення |
| `server/PRISMA_P2022_FIX.md` | Створено детальну інструкцію |
| `server/DEPLOYMENT_FIX_REPORT.md` | Створено звіт |

---

## ⚠️ Увага!

**Ніколи не використовуйте в production:**

```bash
❌ prisma db push --accept-data-loss
```

**Використовуйте тільки:**

```bash
✅ prisma migrate deploy
```

---

## 📞 Якщо не працює

1. Перевірте логи Railway: `railway logs`
2. Перевірте змінні оточення: `DATABASE_URL`
3. Виконайте SQL для додавання колонок вручну
4. Перезапустіть деплой
