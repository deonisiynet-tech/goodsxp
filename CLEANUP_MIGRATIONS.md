# 🚨 RAILWAY MIGRATION FIX — ОЧИСТКА СТАРИХ МІГРАЦІЙ

**Проблема:** На Railway вже застосована стара міграція `20260301102331_init`

**Рішення:** Очистити таблицю `_prisma_migrations` на Railway

---

## ⚠️ ВАЖЛИВО

Ця операція **НЕ ВИДАЛЯЄ** дані з бази! Вона лише очищає історію застосованих міграцій Prisma.

Ваші таблиці, користувачі, замовлення — все залишиться.

---

## 📋 СПОСІБ 1: Через Railway Dashboard (найпростіший)

### Крок 1: Відкрийте Railway Dashboard

[https://railway.app](https://railway.app)

### Крок 2: Перейдіть до PostgreSQL бази

1. Оберіть ваш проект
2. Знайдіть службу **PostgreSQL**
3. Натисніть **Open Service**

### Крок 3: Відкрийте SQL Editor

1. Перейдіть на вкладку **SQL** або **Query**
2. Вставте та виконайте:

```sql
-- Очистити таблицю міграцій
DELETE FROM "_prisma_migrations";
```

### Крок 4: Перезапустіть сервер

1. Перейдіть до служби яка запускає сервер
2. Натисніть **Deployments**
3. Натисніть **Restart**

---

## 📋 СПОСІБ 2: Через psql (якщо є доступ)

```bash
# Підключіться до бази
psql <DATABASE_URL>

# Виконайте команду
DELETE FROM "_prisma_migrations";

# Вийдіть
\q
```

---

## 📋 СПОСІБ 3: Через Node.js скрипт

Створіть файл `cleanup-migrations.js`:

```javascript
const { Client } = require('pg');

async function cleanup() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    const result = await client.query('DELETE FROM "_prisma_migrations"');
    console.log(`✅ Deleted ${result.rowCount} migration records`);

    const check = await client.query('SELECT * FROM "_prisma_migrations"');
    console.log(`📊 Remaining migrations: ${check.rowCount}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

cleanup();
```

Запустіть локально:

```bash
DATABASE_URL="your-railway-db-url" node cleanup-migrations.js
```

---

## ✅ ПІСЛЯ ОЧИСТКИ

1. **Railway автоматично застосує нову міграцію** при наступному деплої
2. **Перевірте логи** — маєте побачити:
   ```
   Applying 20260319120000_init...
   ✔ Created 5 ENUM types
   ✔ Created 9 tables
   Applied migrations: Set(1) { '20260319120000_init' }
   ```

---

## 🔍 ПЕРЕВІРКА

Після очищення та перезапуску:

```bash
# Перевірка таблиць
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

# Перевірка міграцій
SELECT * FROM "_prisma_migrations";
```

Має бути:
- 9 таблиць: User, Category, Product, Review, Order, OrderItem, AdminLog, SystemLog, SiteSettings
- 1 міграція: `20260319120000_init`

---

## ⚠️ ЯК ЩОСЬ ПІШЛО НЕ ТАК

### Помилка: "relation does not exist"

Якщо таблиця `_prisma_migrations` не існує — це добре! Prisma створить її заново.

### Помилка: "foreign key constraint"

Це неможливо для цієї операції. Якщо бачите помилку — напишіть мені.

---

*Інструкція створена: 19 березня 2026*
