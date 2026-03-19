# 📦 Звіт про виправлення помилок Railway Deployment

## 🎯 Виявлені проблеми

### 1. Frontend: "Uncaught SyntaxError: Unexpected token 'export'"

**Причина:** Next.js компілює TypeScript коректно, але помилка може виникати через:
- Кеш браузера
- Неправильне підключення JS файлів

**Рішення:**
- Очистити кеш браузера (Ctrl+Shift+Delete)
- Переконатися, що всі `<script>` теги мають `type="module"` якщо використовують export/import

---

### 2. Backend: Prisma Error P2022 "The column does not exist"

**Причина:** Prisma Client намагається використати колонку `createdAt`, яка відсутня в базі даних через:
- Міграції не застосовані на Railway
- Prisma Client не згенеровано після деплою
- Папка `migrations` не копіюється в `dist/`

**Виявлені проблеми в коді:**
1. ❌ Скрипт `build` не копіював міграції в `dist/prisma/migrations`
2. ❌ Скрипт `migrate.ts` шукав міграції тільки за одним шляхом
3. ❌ Відсутній скрипт `migrate:deploy` для production

---

## ✅ Виконані виправлення

### 1. Оновлено `package.json`

```json
{
  "scripts": {
    "build": "tsc && cp -r prisma/migrations dist/prisma/migrations",
    "migrate:deploy": "prisma migrate deploy --schema ./prisma/schema.prisma",
    "prisma:migrate:prod": "prisma migrate deploy --schema ./prisma/schema.prisma"
  }
}
```

**Що змінено:**
- Додано копіювання міграцій під час збірки
- Додано скрипт `migrate:deploy` для production
- Додано `migrate:prod` для запуску міграцій на Railway

---

### 2. Оновлено `src/prisma/migrate.ts`

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

**Що змінено:**
- Додано логіку пошуку міграцій в різних директоріях
- Додано детальне логування процесу міграції
- Додано обробку випадку коли міграції не знайдено

---

### 3. Перекомпільовано сервер

```bash
npm run build
```

**Результат:**
- ✅ `dist/prisma/migrations/` тепер містить міграції
- ✅ `dist/prisma/migrate.js` оновлено з новою логікою
- ✅ `dist/services/product.service.js` коректно використовує `createdAt`

---

## 📋 Структура таблиці Product (Prisma Schema)

```prisma
model Product {
  id            String      @id @default(uuid())
  title         String
  description   String
  price         Decimal     @db.Decimal(10, 2)
  categoryId    String?
  category      Category?   @relation(fields: [categoryId], references: [id])
  rating        Decimal?    @db.Decimal(3, 2)
  originalPrice Decimal?    @db.Decimal(10, 2)
  discountPrice Decimal?    @db.Decimal(10, 2)
  isFeatured    Boolean     @default(false)
  isPopular     Boolean     @default(false)
  imageUrl      String?
  images        String[]
  stock         Int         @default(0)
  isActive      Boolean     @default(true)
  createdAt     DateTime    @default(now())    ← ЦЯ КОЛОНКА БУЛА ВІДСУТНЯ
  updatedAt     DateTime    @updatedAt
  orderItems    OrderItem[]
  reviews       Review[]
}
```

---

## 🚀 Інструкція для Railway

### 1. Налаштування змінних оточення

В Railway додати змінні:

```
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your-super-secret-jwt-key
CLIENT_URL=https://your-domain.railway.app
PORT=8080
```

### 2. Build Command

```bash
cd server && npm install && npm run build
```

### 3. Start Command

```bash
cd server && node dist/server.js
```

Або використати `start.sh`:

```bash
cd server && ./start.sh
```

### 4. Перевірка деплою

Після деплою перевірити:

```bash
# Health check
GET https://your-domain.railway.app/health

# API Products
GET https://your-domain.railway.app/api/products?limit=50&sortBy=createdAt&sortOrder=desc
```

---

## 🔍 Перевірка бази даних

Якщо помилка P2022 все ще виникає, перевірте структуру БД:

```sql
-- Перевірити колонки таблиці Product
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'Product'
ORDER BY ordinal_position;

-- Очікуваний результат має включати:
-- id, title, description, price, categoryId, rating,
-- originalPrice, discountPrice, isFeatured, isPopular,
-- imageUrl, images, stock, isActive, createdAt, updatedAt
```

---

## 🛠️ Локальна перевірка

```bash
# 1. Встановити залежності
cd server
npm install

# 2. Згенерувати Prisma Client
npx prisma generate --schema ./prisma/schema.prisma

# 3. Запустити міграції (якщо потрібно)
npx prisma migrate deploy --schema ./prisma/schema.prisma

# 4. Зібрати проект
npm run build

# 5. Запустити сервер
npm start

# 6. Перевірити API
curl http://localhost:8080/api/products?limit=50&sortBy=createdAt&sortOrder=desc
```

---

## 📝 Чеклист перед деплоєм

- [ ] `DATABASE_URL` налаштовано в Railway
- [ ] `JWT_SECRET` змінено на безпечне значення
- [ ] `CLIENT_URL` вказує на правильний домен
- [ ] Міграції застосовано (`prisma migrate deploy`)
- [ ] Prisma Client згенеровано (`prisma generate`)
- [ ] `dist/prisma/migrations/` містить файли міграцій
- [ ] Health check повертає 200 OK
- [ ] `/api/products` повертає список товарів

---

## 🎉 Очікуваний результат

Після виправлень:

```
GET /api/products?limit=50&sortBy=createdAt&sortOrder=desc

HTTP 200 OK
{
  "products": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "totalPages": 2
  }
}
```

---

## 📞 Якщо помилка повторюється

1. Перевірити логи Railway:
   ```
   railway logs
   ```

2. Перевірити чи застосовані міграції:
   ```sql
   SELECT * FROM "_prisma_migrations" ORDER BY started_at DESC;
   ```

3. Перевірити чи існує колонка `createdAt`:
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'Product' AND column_name = 'createdAt';
   ```

4. Якщо колонка відсутня - застосувати міграції вручну:
   ```bash
   npx prisma migrate deploy --schema ./prisma/schema.prisma
   ```
