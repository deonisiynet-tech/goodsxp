# 🚀 Инструкция по применению миграции для Railway PostgreSQL

## 📋 Обзор изменений

Эта миграция добавляет:
- **Таблица `Review`** — отзывы о товарах (rating, comment, createdAt)
- **Таблица `Category`** — категории товаров
- **Таблица `SystemLog`** — системное логирование
- **Поля в Product**: `sku`, `categoryId`, `rating`, `originalPrice`, `discountPrice`, `isFeatured`, `isPopular`

---

## 🔧 Шаг 1: Бэкап текущей базы данных

### Вариант A: Через pg_dump (рекомендуется)

```bash
# Подключитесь к Railway и получите DATABASE_URL
# В терминале Railway: Variables → DATABASE_URL → Copy

# Замените YOUR_DATABASE_URL на ваше значение из Railway
pg_dump "YOUR_DATABASE_URL" --file=backup_$(date +%Y%m%d_%H%M%S).sql

# Пример для Windows (PowerShell):
pg_dump "postgresql://postgres:password@host.railway.internal:5432/shop_db" --file=backup_20260319.sql
```

### Вариант B: Через Railway CLI

```bash
# Установите Railway CLI если ещё нет
npm install -g @railway/cli

# Авторизуйтесь
railway login

# Сделайте бэкап
railway backup create
```

### Вариант C: Через pgAdmin/DBeaver

1. Подключитесь к базе Railway через pgAdmin/DBeaver
2. Правой кнопкой на базу → Backup
3. Сохраните файл `.backup` или `.sql`

---

## 📦 Шаг 2: Применение миграции к Railway базе

### Вариант A: Прямое выполнение SQL (рекомендуется для fixes)

```bash
# 1. Скопируйте содержимое railway-fix-migration.sql
# 2. В Railway Console выполните:

psql "YOUR_DATABASE_URL" -f server/prisma/railway-fix-migration.sql

# Или через Railway CLI:
railway run psql "YOUR_DATABASE_URL" -f server/prisma/railway-fix-migration.sql
```

### Вариант B: Через Prisma Migrate

```bash
# Перейдите в директорию сервера
cd server

# Примените миграции
npx prisma migrate deploy --schema ./prisma/schema.prisma

# Если есть неприменённые миграции, Prisma применит их автоматически
```

### Вариант C: Через Railway Web Console

1. Откройте Railway проект
2. Выберите вашу базу данных
3. Откройте **Console** tab
4. Вставьте содержимое `railway-fix-migration.sql`
5. Нажмите **Run**

---

## 🔨 Шаг 3: Генерация Prisma Client

```bash
# Перейдите в директорию сервера
cd server

# Перегенерируйте Prisma Client
npx prisma generate --schema ./prisma/schema.prisma

# Или с указанием output directory (если нужно)
npx prisma generate --schema ./prisma/schema.prisma --output ./node_modules/.prisma/client
```

**Ожидаемый вывод:**
```
✔ Generated Prisma Client (v7.x.x) to ./node_modules/@prisma/client
```

---

## ✅ Шаг 4: Проверка применения миграции

### Проверка через SQL

```sql
-- Проверка существования таблицы Review
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'Review';

-- Проверка структуры Review
\d "Review"

-- Проверка новых полей в Product
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'Product' 
  AND column_name IN ('categoryId', 'rating');

-- Проверка foreign keys
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'Product';
```

### Проверка через Prisma

```bash
# Проверка состояния миграций
npx prisma migrate status --schema ./prisma/schema.prisma

# Проверка схемы базы
npx prisma db pull --schema ./prisma/schema.prisma --print
```

---

## 🌐 Шаг 5: Проверка на сайте и в админке

### 1. Карточки товаров — Рейтинг (⭐4.7)

**Где проверять:**
- Главная страница (блок "Популярные товары")
- Страница категории
- Страница товара

**Что должно отображаться:**
```
┌─────────────────────┐
│  Товар              │
│  ⭐⭐⭐⭐⭐ 4.7 (12)   │
│  Цена: 1 299 ₴      │
└─────────────────────┘
```

**API для проверки:**
```bash
curl http://localhost:5001/api/products | jq '.[] | {title, rating, reviews}'
```

### 2. Отзывы на товары

**Где проверять:**
- Страница товара (блок "Отзывы")
- Админка → Товары → Редактирование → Отзывы

**Что должно работать:**
- ✅ Отображение списка отзывов
- ✅ Добавление нового отзыва
- ✅ Рейтинг (1-5 звёзд)
- ✅ Текст комментария
- ✅ Дата создания

**API для проверки:**
```bash
# Получить отзывы товара
curl http://localhost:5001/api/products/PRODUCT_ID/reviews

# Создать отзыв
curl -X POST http://localhost:5001/api/products/PRODUCT_ID/reviews \
  -H "Content-Type: application/json" \
  -d '{"name":"Имя","rating":5,"comment":"Отличный товар!"}'
```

### 3. Категория товара

**Где проверять:**
- Хлебные крошки на странице товара
- Фильтр по категориям
- Админка → Товары → Редактирование → Категория

**Что должно работать:**
- ✅ Выбор категории при создании/редактировании
- ✅ Отображение категории в карточке
- ✅ Фильтрация по категориям

**API для проверки:**
```bash
# Получить товары с категорией
curl http://localhost:5001/api/products?categoryId=CATEGORY_ID

# Получить все категории
curl http://localhost:5001/api/categories
```

### 4. Цена со скидкой (Discounted Price)

**Где проверять:**
- Карточка товара (старая цена зачёркнута, новая выделена)
- Админка → Товары → Редактирование → Цены

**Что должно отображаться:**
```
┌─────────────────────┐
│  Старая: 1 599 ₴    │
│  Новая: 1 299 ₴     │
│  Скидка: -20%       │
└─────────────────────┘
```

**API для проверки:**
```bash
curl http://localhost:5001/api/products | jq '.[] | {title, price, originalPrice, discountPrice}'
```

---

## 🔍 Чек-лист проверки

| Компонент | Поле | Страница | Статус |
|-----------|------|----------|--------|
| Product | rating | Карточка товара | ⬜ |
| Product | categoryId | Категория + Фильтры | ⬜ |
| Product | discountPrice | Цена со скидкой | ⬜ |
| Review | вся таблица | Отзывы на товаре | ⬜ |
| Category | вся таблица | Категории | ⬜ |

---

## 🐛 Решение проблем

### Ошибка: "Table 'Review' does not exist"

```sql
-- Выполните вручную в Railway Console:
CREATE TABLE "Review" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "comment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Review" ADD CONSTRAINT "Review_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
```

### Ошибка: "Column 'categoryId' not found"

```sql
ALTER TABLE "Product" ADD COLUMN "categoryId" TEXT;
ALTER TABLE "Product" ADD COLUMN "rating" DECIMAL(3,2) DEFAULT 0;
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");
CREATE INDEX "Product_rating_idx" ON "Product"("rating");
```

### Ошибка: Prisma Client не видит новые поля

```bash
# Удалите кэш Prisma
rm -rf node_modules/.prisma

# Перегенерируйте клиент
npx prisma generate --schema ./prisma/schema.prisma

# Перезапустите сервер
npm run dev
```

### Ошибка: P2022 ColumnNotFound

1. Проверьте что миграция применена:
```bash
npx prisma migrate status --schema ./prisma/schema.prisma
```

2. Если миграция не применена — выполните Шаг 2

3. Если проблема остаётся — синхронизируйте схему:
```bash
npx prisma db pull --schema ./prisma/schema.prisma
npx prisma generate --schema ./prisma/schema.prisma
```

---

## 📝 Команды для быстрой проверки

```bash
# 1. Статус миграций
npx prisma migrate status --schema ./server/prisma/schema.prisma

# 2. Проверка схемы БД
npx prisma db pull --schema ./server/prisma/schema.prisma --print

# 3. Генерация клиента
npx prisma generate --schema ./server/prisma/schema.prisma

# 4. Студия для просмотра данных
npx prisma studio --schema ./server/prisma/schema.prisma
```

---

## 📞 Если что-то пошло не так

1. **Восстановите бэкап:**
```bash
psql "YOUR_DATABASE_URL" -f backup_20260319.sql
```

2. **Проверьте логи Railway:**
   - Railway Dashboard → Ваш проект → Deployments → Logs

3. **Проверьте переменные окружения:**
```bash
# В server/.env должно быть:
DATABASE_URL="postgresql://..."
```

4. **Перезапустите сервер:**
```bash
cd server
npm run dev
```
