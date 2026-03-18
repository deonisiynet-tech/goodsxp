# Інструкція з виправлення бази даних на Railway

## Проблема
Помилка `P2022 ColumnNotFound` виникає через те, що база даних на Railway не синхронізована з поточною схемою Prisma 7.

## Діагностика

### Крок 1: Перевірка поточного стану БД

**Локально (підключення до Railway БД):**
```bash
cd server
npm run check-db
```

Це покаже:
- Які таблиці існують
- Які колонки відсутні в Product
- Чи застосовані міграції

---

## Варіант 1: Автоматичне виправлення (рекомендовано)

### Локально:
```bash
cd server
npm run migrate
```

Скрипт автоматично:
1. Підключиться до бази даних
2. Перевірить застосовані міграції
3. Застосує відсутні міграції
4. Збереже інформацію в `_prisma_migrations`

### На Railway:
Міграції застосовуються автоматично при кожному старті сервера через `start.sh`.

---

## Варіант 2: Ручне виправлення через SQL

Якщо автоматичні міграції не працюють:

### Крок 1: Підключення до БД Railway

1. Відкрийте панель Railway
2. Знайдіть вашу базу даних PostgreSQL
3. Натисніть "Connect" → "Copy connection string"
4. Підключіться через psql або pgAdmin:

```bash
psql "postgresql://user:password@host:port/database"
```

### Крок 2: Виконання SQL-скрипта

```bash
# Виконайте SQL-скрипт fix-railway-db.sql
psql "postgresql://user:password@host:port/database" -f prisma/fix-railway-db.sql
```

Або через pgAdmin:
1. Відкрийте Query Tool
2. Скопіюйте вміст `prisma/fix-railway-db.sql`
3. Виконайте (F5)

### Крок 3: Перевірка результату

```bash
npm run check-db
```

Має з'явитися:
```
✅ База даних синхронізована зі схемою Prisma
```

---

## Варіант 3: Prisma Migrate (якщо працює)

```bash
cd server
npx prisma migrate deploy --schema=./prisma/schema.prisma
```

**Примітка:** Для Prisma 7 цей спосіб може не працювати через відсутність `url` в schema.prisma.

---

## Перевірка після міграції

### 1. Health check:
```bash
curl http://localhost:8080/health
```

### 2. API Products:
```bash
curl http://localhost:8080/api/products
```

### 3. API Reviews:
```bash
curl http://localhost:8080/api/products/<product-id>/reviews
```

### 4. Адмінка:
- Відкрийте `http://localhost:8080/admin`
- Спробуйте змінити товар (змінити ціну, назву, статус)
- Перевірте, що немає помилок P2022

---

## Поширені проблеми

### Помилка: "relation 'Product' does not exist"
**Рішення:** Таблиця Product не існує. Виконайте повну міграцію:
```bash
npm run migrate
```

### Помилка: "column 'originalPrice' does not exist"
**Рішення:** Виконайте SQL-скрипт або міграції:
```bash
npm run migrate
```

### Помилка: "type 'LogLevel' does not exist"
**Рішення:** Enums не створені. Виконайте SQL-скрипт:
```bash
psql "DATABASE_URL" -f prisma/fix-railway-db.sql
```

### Міграції вже застосовані, але помилки залишаються
**Рішення:** Перевірте `_prisma_migrations`:
```sql
SELECT * FROM "_prisma_migrations" ORDER BY started_at;
```

Якщо міграції є, але помилки залишаються - виконайте SQL-скрипт напряму.

---

## Інструкція для Railway (деплой)

### 1. Перед деплоєм:
```bash
cd server
npm run build
git add .
git commit -m "fix: Prisma 7 migration support"
git push origin main
```

### 2. Railway автоматично:
- Запустить `npm run build`
- Запустить `./start.sh` (який виконує міграції)

### 3. Перевірка логів:
У панелі Railway перевірте логи:
```
🔄 Running Prisma migrations...
Applied migrations: [...]
✓ Applied 20260317_add_product_badges_and_discounts
✓ Applied 20260318185511_add_reviews
✅ Database migrations completed
```

### 4. Якщо помилки залишаються:
Виконайте SQL-скрипт через Railway CLI:

```bash
# Встановіть Railway CLI
npm install -g @railway/cli

# Підключіться до БД
railway database

# Виконайте SQL
railway database --command "psql -f prisma/fix-railway-db.sql"
```

---

## Структура міграцій

```
prisma/migrations/
├── 20260313000000_init/
│   └── migration.sql          # User, Product, Order, OrderItem, AdminLog, SiteSettings
├── 20260317_add_product_badges_and_discounts/
│   └── migration.sql          # originalPrice, discountPrice, isFeatured, isPopular
├── 20260318185511_add_reviews/
│   └── migration.sql          # Review, Category, SystemLog
└── migration_lock.toml
```

---

## Контрольний список

- [ ] Виконано `npm run check-db`
- [ ] Всі таблиці присутні (User, Product, Order, Review, Category, SystemLog, AdminLog, SiteSettings)
- [ ] Всі колонки Product присутні (originalPrice, discountPrice, isFeatured, isPopular)
- [ ] Міграції застосовані (`_prisma_migrations` не порожня)
- [ ] `/api/products` працює без помилок
- [ ] Адмінка дозволяє змінювати товари
- [ ] Відгуки та рейтинги відображаються

---

## Додаткові команди

```bash
# Перегляд БД через Prisma Studio
npm run prisma:studio

# Генерація Prisma Client
npm run prisma:generate

# Локальна міграція (dev mode)
npm run migrate:dev

# Сід даних (тестові дані)
npm run seed
```
