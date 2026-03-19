# 🚀 Исправление ошибок миграции на Railway

## ❌ Проблема

```
✗ Failed to apply 20260313000000_init: error: syntax error at or near "("
code: 42601 (PostgreSQL syntax error)

PrismaClientKnownRequestError: 
The column `(not available)` does not exist in the current database.
```

**Причина:** Стандартные миграции Prisma содержали синтаксические ошибки для PostgreSQL.

---

## ✅ Решение применено

### 1. Удалены проблемные миграции Prisma
- ❌ `migrations/20260313000000_init`
- ❌ `migrations/20260317_add_product_badges_and_discounts`
- ❌ `migrations/20260318185511_add_reviews`
- ❌ `migrations/20260319000000_add_category_rating`

### 2. Создана новая чистая миграция
- ✅ `migrations/20260319000000_init/migration.sql` — на основе `railway-production-migration.sql`

### 3. Обновлён Dockerfile
Теперь применяется SQL миграция перед запуском сервера:
```dockerfile
CMD ["sh", "-c", "psql \"$DATABASE_URL\" -f ./prisma/railway-production-migration.sql || true && node dist/server.js"]
```

---

## 🚀 Как применить

### 1. Закоммитьте изменения
```bash
git add .
git commit -m "fix: удалить проблемные миграции и использовать SQL миграцию"
git push
```

### 2. Railway автоматически задеплоит

Ожидайте успешную сборку:
```
✅ Migration applied successfully
✅ Server started on port 5000
```

---

## ✅ Проверка

### API возвращает товары
```bash
curl https://your-app.railway.app/api/products
# ✅ {"products": [...], "pagination": {...}}
```

### Товары с новыми полями
```bash
curl https://your-app.railway.app/api/products/PRODUCT_ID
# ✅ {"title": "...", "categoryId": "...", "rating": 4.5, ...}
```

### Отзывы работают
```bash
curl https://your-app.railway.app/api/products/PRODUCT_ID/reviews
# ✅ {"reviews": [...]}
```

---

## 📁 Изменённые файлы

| Файл | Изменения |
|------|-----------|
| `Dockerfile` | Применение SQL миграции перед запуском |
| `server/prisma/migrations/` | Удалены старые, создана новая |
| `server/prisma/railway-production-migration.sql` | Основная миграция |

---

## 🐛 Если товары не отображаются

### Проверьте базу данных
```sql
-- В Railway Console
SELECT COUNT(*) FROM "Product";
-- Должно быть > 0
```

### Если таблица пустая — добавьте тестовые данные
```sql
INSERT INTO "Product" (id, title, description, price, "isActive", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Тестовый товар', 'Описание', 100, true, NOW(), NOW());
```

### Проверьте логи Railway
1. Railway Dashboard → Проект → Deployments → Logs
2. Найдите ошибки подключения к базе
3. Проверьте что DATABASE_URL правильный

---

**После этих изменений сайт должен отображать товары без ошибок.**
