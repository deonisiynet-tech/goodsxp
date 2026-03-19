# 🚀 Исправление ошибок Railway — Итоговая инструкция

## 📋 Найденные проблемы

### Ошибка №1: SQL Syntax Error (42601)
**Причина:** В миграциях использовались конструкции, несовместимые с PostgreSQL.

### Ошибка №2: P2022 ColumnNotFound
**Причина:** Модель `Product` в `schema.prisma` содержит поля `categoryId` и `rating`, которых нет в базе данных.

### Ошибка №3: Конфликт миграций
**Причина:** В папке `migrations/` были лишние файлы (`00000000000000_init.sql`, `fix-migrations.sql`).

---

## ✅ Что исправлено

### 1. Удалены конфликтующие файлы
- ❌ `migrations/00000000000000_init.sql`
- ❌ `migrations/00000000000000_init.sql.deleted`
- ❌ `migrations/fix-migrations.sql`

### 2. Обновлён `package.json`
Добавлен скрипт `postinstall` для автоматической генерации Prisma Client:
```json
"postinstall": "prisma generate"
```

### 3. Обновлён `product.service.ts`
Добавлены поля в запросы:
- `categoryId`
- `rating`
- `originalPrice`
- `discountPrice`
- `isFeatured`
- `isPopular`

### 4. Создана единая миграция для Railway
Файл: `railway-production-migration.sql`
- Создаёт все таблицы с правильными типами PostgreSQL
- Добавляет все необходимые индексы
- Устанавливает foreign keys
- Совместима с Prisma 7

---

## 🔧 Применение исправлений

### Шаг 1: Бэкап базы (если нужно)

```bash
# Через Railway Console получите DATABASE_URL
pg_dump "YOUR_DATABASE_URL" --file=backup.sql
```

### Шаг 2: Применение миграции к Railway

**Вариант A: Через Railway Console (рекомендуется)**

1. Откройте Railway → Проект → Database → Console
2. Скопируйте содержимое `railway-production-migration.sql`
3. Вставьте в Console и нажмите **Run**

**Вариант B: Через psql**

```bash
psql "YOUR_DATABASE_URL" -f server/prisma/railway-production-migration.sql
```

### Шаг 3: Генерация Prisma Client

```bash
cd server
npm install  # postinstall автоматически выполнит prisma generate
```

Или вручную:
```bash
npx prisma generate --schema ./prisma/schema.prisma
```

### Шаг 4: Деплой

```bash
# Коммитим изменения
git add .
git commit -m "fix: исправить ошибки миграции и добавить поля Product"
git push

# Railway автоматически задеплоит
```

---

## ✅ Проверка после деплоя

### 1. Проверка таблиц

```sql
-- В Railway Console выполните:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Ожидаемый результат:**
```
AdminLog
Category
Order
OrderItem
Product
Review
SiteSettings
SystemLog
User
_prisma_migrations
```

### 2. Проверка полей Product

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'Product'
ORDER BY ordinal_position;
```

**Ожидаемые поля:**
| Поле | Тип | Nullable |
|------|-----|----------|
| id | text | NO |
| title | text | NO |
| description | text | NO |
| price | numeric | NO |
| categoryId | text | YES |
| rating | numeric | YES |
| originalPrice | numeric | YES |
| discountPrice | numeric | YES |
| isFeatured | boolean | NO |
| isPopular | boolean | NO |
| imageUrl | text | YES |
| images | text[] | YES |
| stock | integer | NO |
| isActive | boolean | NO |
| createdAt | timestamp | NO |
| updatedAt | timestamp | NO |

### 3. Проверка API

```bash
# Получить товары
curl https://your-app.railway.app/api/products

# Получить товар с рейтингом
curl https://your-app.railway.app/api/products/PRODUCT_ID

# Получить отзывы
curl https://your-app.railway.app/api/products/PRODUCT_ID/reviews

# Создать отзыв
curl -X POST https://your-app.railway.app/api/products/PRODUCT_ID/reviews \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","rating":5,"comment":"Great!"}'
```

---

## 🐛 Решение проблем

### Ошибка: "Table 'Review' does not exist"

```sql
-- Выполните railway-production-migration.sql полностью
```

### Ошибка: "Column 'rating' does not exist"

```sql
ALTER TABLE "Product" ADD COLUMN "rating" DECIMAL(3,2) DEFAULT 0;
CREATE INDEX "Product_rating_idx" ON "Product"("rating");
```

### Ошибка: "Column 'categoryId' does not exist"

```sql
ALTER TABLE "Product" ADD COLUMN "categoryId" TEXT;
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "Category"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
```

### Ошибка: Prisma Client не видит поля

```bash
cd server
rm -rf node_modules/.prisma
npx prisma generate --schema ./prisma/schema.prisma
```

### Ошибка: P2022 ColumnNotFound после деплоя

1. Проверьте что миграция применена:
```bash
npx prisma migrate status --schema ./prisma/schema.prisma
```

2. Если не применена — выполните Шаг 2

3. Синхронизируйте схему:
```bash
npx prisma db pull --schema ./prisma/schema.prisma
npx prisma generate --schema ./prisma/schema.prisma
```

---

## 📁 Изменённые файлы

| Файл | Изменения |
|------|-----------|
| `package.json` | Добавлен `postinstall` |
| `src/services/product.service.ts` | Добавлены поля в запросы |
| `prisma/migrations/` | Удалены конфликтующие файлы |
| `prisma/railway-production-migration.sql` | ✅ Новая единая миграция |

---

## 📊 Итоговая структура базы

```
User (1) ──< (N) Order
              │
              └──< (N) OrderItem >── (N) Product ──< (N) Review
                                      │
                                      └── (1) Category
                                      │
AdminLog >── (1) User                 └── (N) SystemLog >── (1) User

SiteSettings (standalone)
```

---

## ✅ Чек-лист проверки

- [ ] Миграция применена к Railway
- [ ] Prisma Client сгенерирован
- [ ] Таблицы созданы
- [ ] Foreign keys работают
- [ ] API возвращает товары с rating и categoryId
- [ ] Можно создать отзыв
- [ ] Рейтинг обновляется после создания отзыва
- [ ] Ошибки P2022 и 42601 не появляются

---

**После применения этой инструкции backend должен успешно запускаться на Railway без ошибок.**
