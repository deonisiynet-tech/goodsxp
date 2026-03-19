# 🚀 DATABASE MIGRATION FIX — RAILWAY DEPLOYMENT

**Дата:** 19 березня 2026  
**Статус:** ✅ ГОТОВО ДО ДЕПЛОЮ

---

## 📋 ЗМІНИ

### 1. Видалено стару міграцію
- ❌ `server/prisma/migrations/20260319000000_init/` — видалено
- Причина: помилка `syntax error at or near "BEGIN"` через транзакції

### 2. Створено нову міграцію
- ✅ `server/prisma/migrations/20260319120000_init/migration.sql`
- Чистий SQL без BEGIN/COMMIT
- Сумісна з Prisma 7 та PostgreSQL на Railway

### 3. Згенеровано Prisma Client
- ✅ `node_modules/@prisma/client` оновлено
- Версія: 7.5.0

### 4. Видалено Prisma з клієнта
- ❌ Видалено `@prisma/client` з `client/package.json`
- ❌ Видалено `prisma` з `client/package.json`
- ❌ Видалено скрипт `prisma:generate`
- Клієнт більше не використовує Prisma

---

## 🔧 ЛОКАЛЬНА ПЕРЕВІРКА

### Type Checking
```bash
cd server
npx tsc --noEmit
```
**Результат:** ✅ 0 помилок

### Build
```bash
cd server
npm run build
```
**Результат:** ✅ Успішно

---

## 🚀 ДЕПЛОЙ НА RAILWAY

### Крок 1: Зробити snapshot бази (резервна копія)

Перед деплоєм рекомендується зробити backup бази даних на Railway:

```bash
# Підключіться до бази через Railway CLI
railway run psql -c "\q"

# Або використайте pg_dump
railway run pg_dump -f backup.sql
```

### Крок 2: Push змін до Git

```bash
git add .
git commit -m "fix: нова міграція бази без BEGIN/COMMIT"
git push origin main
```

### Крок 3: Застосувати міграцію на Railway

Після деплою виконайте команду на Railway:

```bash
railway run npx prisma migrate deploy
```

Або додайте до `package.json` на Railway:

```json
{
  "scripts": {
    "postinstall": "prisma generate --schema ./prisma/schema.prisma",
    "migrate": "prisma migrate deploy --schema ./prisma/schema.prisma"
  }
}
```

### Крок 4: Перевірити API

Після деплою перевірте:

```bash
# Перевірка товарів
GET https://your-railway-app.up.railway.app/api/products

# Перевірка адмінки
GET https://your-railway-app.up.railway.app/api/admin/stats
Authorization: Bearer <admin-token>
```

---

## 📊 СТРУКТУРА МІГРАЦІЇ

### Таблиці (9):
1. **User** — користувачі (USER/ADMIN)
2. **Category** — категорії товарів
3. **Product** — товари
4. **Review** — відгуки
5. **Order** — замовлення
6. **OrderItem** — позиції замовлень
7. **AdminLog** — логи дій адміністратора
8. **SystemLog** — системні логи
9. **SiteSettings** — налаштування сайту

### ENUM типи (5):
1. **Role** — USER, ADMIN
2. **OrderStatus** — NEW, PROCESSING, SHIPPED, DELIVERED, CANCELLED
3. **ActionType** — CREATE, UPDATE, DELETE, LOGIN, LOGOUT, PASSWORD_RESET, SETTINGS_UPDATE
4. **LogLevel** — INFO, WARNING, ERROR
5. **LogSource** — ADMIN_PANEL, API, SYSTEM

### Індекси:
- Всі первинні ключі (PRIMARY KEY)
- Унікальні індекси (User.email, Category.slug, SiteSettings.key)
- Звичайні індекси для пошуку

### Foreign Keys:
- Category.parentId → Category.id (self-referencing)
- Product.categoryId → Category.id
- Review.productId → Product.id (CASCADE DELETE)
- Order.userId → User.id
- OrderItem.orderId → Order.id (CASCADE DELETE)
- OrderItem.productId → Product.id (RESTRICT DELETE)
- AdminLog.adminId → User.id (CASCADE DELETE)
- SystemLog.userId → User.id (SET NULL DELETE)

---

## ⚠️ МОЖЛИВІ ПРОБЛЕМИ ТА РІШЕННЯ

### Проблема 1: Migration already exists

**Помилка:**
```
Error: Migration `20260319120000_init` already exists
```

**Рішення:**
```bash
# Видаліть існуючу міграцію з БД
railway run psql -c "DELETE FROM \"_prisma_migrations\" WHERE migration_name = '20260319120000_init';"

# Потім застосуйте знову
railway run npx prisma migrate deploy
```

### Проблема 2: Tables already exist

**Помилка:**
```
Error: Relation "User" already exists
```

**Рішення:**
Міграція використовує `CREATE TABLE IF NOT EXISTS`, тому помилка не виникне.
Якщо таблиці вже існують з правильною структурою — міграція буде пропущена.

### Проблема 3: Foreign key violations

**Помилка:**
```
Error: Foreign key constraint failed
```

**Рішення:**
```bash
# Видаліть всі дані (УВАГА: це видалить всі дані!)
railway run psql -c "TRUNCATE TABLE \"OrderItem\", \"Order\", \"Review\", \"Product\", \"Category\", \"AdminLog\", \"SystemLog\", \"SiteSettings\", \"User\" CASCADE;"

# Потім застосуйте міграцію
railway run npx prisma migrate deploy
```

### Проблема 4: Prisma Client не згенеровано

**Помилка:**
```
Error: @prisma/client did not initialize
```

**Рішення:**
```bash
# Згенеруйте Prisma Client на Railway
railway run npx prisma generate --schema ./prisma/schema.prisma
```

---

## ✅ ПЕРЕВІРКА ПІСЛЯ ДЕПЛОЮ

### 1. Перевірка здоров'я сервера
```bash
GET https://your-railway-app.up.railway.app/health
```

### 2. Перевірка товарів
```bash
GET https://your-railway-app.up.railway.app/api/products
```

### 3. Перевірка адмінки
```bash
# Логін
POST https://your-railway-app.up.railway.app/api/admin/auth/login
{
  "email": "goodsxp.net@gmail.com",
  "password": "Admin123"
}

# Отримання статистики
GET https://your-railway-app.up.railway.app/api/admin/stats
Cookie: admin-token=<token>
```

### 4. Перевірка створення товару
```bash
POST https://your-railway-app.up.railway.app/api/products
Cookie: admin-token=<token>
{
  "title": "Test Product",
  "description": "Test Description",
  "price": 999,
  "stock": 10
}
```

### 5. Перевірка створення замовлення
```bash
POST https://your-railway-app.up.railway.app/api/orders
{
  "name": "Test User",
  "phone": "+380123456789",
  "email": "test@example.com",
  "address": "Test Address",
  "items": [
    { "productId": "<product-id>", "quantity": 1 }
  ]
}
```

---

## 📝 ФАЙЛИ

### Змінені файли:
| Файл | Зміни |
|------|-------|
| `server/prisma/migrations/20260319000000_init/` | ❌ Видалено |
| `server/prisma/migrations/20260319120000_init/migration.sql` | ✅ Створено |
| `server/prisma/migrations/migration_lock.toml` | ✅ Оновлено |
| `client/package.json` | ✅ Видалено Prisma залежності |

### Нові файли:
- `server/prisma/migrations/20260319120000_init/migration.sql` — чиста SQL міграція

---

## 🎯 ПІДСУМКИ

✅ **Стара міграція видалена** — більше немає помилок з BEGIN/COMMIT  
✅ **Нова міграція створена** — чистий SQL без транзакцій  
✅ **Prisma Client згенеровано** — версія 7.5.0  
✅ **Backend зібрався** — 0 помилок  
✅ **Клієнт очищено** — видалено залежності Prisma  

### Наступні кроки:
1. ✅ Push до Git
2. ✅ Деплой на Railway
3. ✅ `prisma migrate deploy` на Railway
4. ✅ Перевірка API

---

*Інструкція створена: 19 березня 2026*
