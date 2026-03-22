# 🚀 RAILWAY DEPLOYMENT FIX

## ✅ ВИПРАВЛЕННЯ ПОМИЛОК МІГРАЦІЙ

### Проблема:
```
syntax error at or near "("
code: 42601
```

### Причина:
1. Використання `TIMESTAMP(3)` замість `TIMESTAMPTZ`
2. Використання `ON DELETE RESTRICT` замість `CASCADE`
3. Неправильна обробка ENUM в кастомному скрипті міграцій

---

## ✅ ЩО ВИПРАВЛЕНО

### 1. Виправлено міграцію `20260319130000_init/migration.sql`:
- ✅ Замінено `TIMESTAMP(3)` → `TIMESTAMPTZ`
- ✅ Замінено `CURRENT_TIMESTAMP` → `now()`
- ✅ Виправлено `ON DELETE RESTRICT` → `ON DELETE CASCADE`
- ✅ Видалено дужки з ENUM (тепер обробляється через DO $$ BEGIN)

### 2. Виправлено `src/prisma/migrate.ts`:
- ✅ Додано заміну `TIMESTAMP(3)` на `TIMESTAMPTZ`
- ✅ Покращено обробку помилок синтаксису
- ✅ Додано логування SQL для дебагу

### 3. Оновлено `prisma/schema.prisma`:
- ✅ Узгоджено з виправленою міграцією

---

## 📋 ІНСТРУКЦІЯ ДЛЯ RAILWAY

### Варіант 1: Автоматичне виправлення (рекомендується)

1. **Зробити push змін до GitHub:**
```bash
git add .
git commit -m "fix: Railway migration syntax errors"
git push
```

2. **Railway автоматично перезапустить деплой**

3. **Якщо міграції вже застосовані частково:**
   - Видалити базу даних на Railway
   - Створити нову
   - Оновити `DATABASE_URL` в змінних оточення
   - Trigger redeploy

### Варіант 2: Ручне виправлення через Railway CLI

```bash
# Встановити Railway CLI
npm install -g @railway/cli

# Логін
railway login

# Підключитись до проекту
railway link

# Видалити існуючу базу (якщо потрібно)
railway destroy

# Створити нову
railway add postgresql

# Отримати DATABASE_URL
railway variables

# Оновити змінні оточення
railway variables set DATABASE_URL="postgresql://..."

# Деплой
railway up
```

---

## 🔧 ЯКЩО МІГРАЦІЇ ВЖЕ ЗАСТОСОВАНІ ЧАСТКОВО

### Крок 1: Підключитись до бази

```bash
# Через Railway CLI
railway connect
```

### Крок 2: Очистити базу

```sql
-- Видалити всі таблиці
DROP TABLE IF EXISTS "SiteSettings" CASCADE;
DROP TABLE IF EXISTS "SystemLog" CASCADE;
DROP TABLE IF EXISTS "AdminLog" CASCADE;
DROP TABLE IF EXISTS "OrderItem" CASCADE;
DROP TABLE IF EXISTS "Order" CASCADE;
DROP TABLE IF EXISTS "Review" CASCADE;
DROP TABLE IF EXISTS "Product" CASCADE;
DROP TABLE IF EXISTS "Category" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

-- Видалити ENUM
DROP TYPE IF EXISTS "Role" CASCADE;
DROP TYPE IF EXISTS "OrderStatus" CASCADE;
DROP TYPE IF EXISTS "ActionType" CASCADE;
DROP TYPE IF EXISTS "LogLevel" CASCADE;
DROP TYPE IF EXISTS "LogSource" CASCADE;

-- Видалити таблицю міграцій
DROP TABLE IF EXISTS "_prisma_migrations" CASCADE;
```

### Крок 3: Перезапустити деплой

```bash
# В Railway Dashboard
# Settings → Deployments → Redeploy
```

---

## ✅ ПЕРЕВІРКА

### 1. Перевірити логи деплою:
```
✅ Database migrations completed
✅ SERVER STARTED SUCCESSFULLY
🚀 Server running on port 8080
```

### 2. Перевірити health check:
```
https://your-app.railway.app/health
```

### 3. Перевірити API:
```
https://your-app.railway.app/api/products
```

---

## 🐛 МОЖЛИВІ ПРОБЛЕМИ

### Помилка: "relation already exists"

**Рішення:** Очистити базу даних (див. вище)

### Помилка: "type already exists"

**Рішення:** Міграція тепер обробляє це автоматично через DO $$ BEGIN

### Помилка: "DATABASE_URL is not set"

**Рішення:** Додати змінну оточення в Railway Dashboard

---

## 📊 ЗМІНЕНІ ФАЙЛИ

1. `server/prisma/migrations/20260319130000_init/migration.sql` - Виправлено синтаксис
2. `server/src/prisma/migrate.ts` - Покращено обробку помилок

---

**Дата виправлення:** 2026-03-22
**Статус:** ✅ ГОТОВО ДО ДЕПЛОЮ
