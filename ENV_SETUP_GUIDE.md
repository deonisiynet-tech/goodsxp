# Налаштування .env файлів в проекті

## 📁 Структура

```
shop-mvp/
├── .env                 ← ЄДИНИЙ загальний файл (корінь)
├── client/
│   └── .env.local       ← Мінімум змінних, решта з кореня
└── server/
    └── .env             ← ВИДАЛЕНО
```

## ✅ Виконані зміни

### 1. Створено єдиний `.env` в корені проекту

Всі змінні тепер в одному місці:
- `DATABASE_URL` - підключення до бази даних
- `JWT_SECRET`, `JWT_EXPIRES_IN` - JWT налаштування
- `PORT`, `NODE_ENV` - сервер налаштування
- `ADMIN_EMAIL`, `ADMIN_PASSWORD` - адмінка
- `CLOUDINARY_*` - завантаження зображень
- `REDIS_URL` - Redis підключення
- `CLIENT_URL`, `NEXT_PUBLIC_API_URL` - frontend налаштування

### 2. Оновлено сервер для читання кореня `.env`

**Файл:** `server/src/server.ts`
```typescript
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
```

### 3. Оновлено Prisma Client для читання кореня `.env`

**Файл:** `server/src/prisma/config.ts`
```typescript
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
```

### 4. Оновлено скрипти в `server/package.json`

```json
{
  "prisma:generate": "dotenv -e ../.env -- prisma generate",
  "prisma:migrate": "dotenv -e ../.env -- prisma migrate dev",
  "prisma:studio": "dotenv -e ../.env -- prisma studio"
}
```

### 5. Видалено `server/.env`

Цей файл більше не потрібен - всі змінні в корені `.env`.

### 6. Спрощено `client/.env.local`

Залишені тільки frontend змінні, решта береться з кореня.

## 🚀 Використання

### Локальна розробка

1. **Встановіть залежності:**
```bash
# Корінь
npm install

# Server
cd server && npm install

# Client
cd ../client && npm install
```

2. **Запустіть проект:**
```bash
# Server (з кореня)
cd server && npm run dev

# Client (в іншому терміналі)
cd client && npm run dev
```

3. **Prisma команди (використовують корінь .env):**
```bash
cd server

# Генерація Prisma Client
npm run prisma:generate

# Міграція БД
npm run prisma:migrate

# Prisma Studio
npm run prisma:studio
```

### Міграції Prisma

```bash
# Створити нову міграцію
cd server
npm run prisma:migrate -- --name add_new_field

# Або напряму
npx prisma migrate dev --schema ./prisma/schema.prisma

# Для Railway (продакшен)
npm run prisma:migrate:prod
```

### Railway (продакшен)

На Railway потрібно встановити змінні оточення:

1. Відкрийте проект на Railway
2. Вкладка **Variables**
3. Додайте всі змінні з кореня `.env` (окрім локальних)

**Або** використайте Railway PostgreSQL:
- Скопіюйте `DATABASE_URL` з Railway PostgreSQL Variables
- Вставте в корінь `.env` (розкоментуйте Railway версію)

## 📝 Змінні оточення

### Обов'язкові для сервера:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-min-32-chars
JWT_EXPIRES_IN=7d
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Admin123
```

### Обов'язкові для бази даних:
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/shop_db?schema=public
```

### Обов'язкові для Redis:
```env
REDIS_URL=redis://localhost:6379
```

### Обов'язкові для Cloudinary:
```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Обов'язкові для frontend:
```env
CLIENT_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=/api
```

## 🔧 Вирішення проблем

### Помилка: DATABASE_URL is not set

Переконайтеся що:
1. Файл `.env` існує в корені проекту
2. `DATABASE_URL` прописано в `.env`
3. Сервер читає правильний шлях до `.env`

### Помилка: Prisma cannot find .env

Використовуйте команди з префіксом `dotenv -e ../.env`:
```bash
dotenv -e ../.env -- prisma generate
```

### Помилка: Module not found dotenv

Встановіть dotenv:
```bash
npm install dotenv dotenv-cli
```

## 📂 Файли які читають .env

| Файл | Як читає |
|------|----------|
| `server/src/server.ts` | `dotenv.config({ path: '../../.env' })` |
| `server/src/prisma/config.ts` | `dotenv.config({ path: '../../.env' })` |
| `server/package.json` (скрипти) | `dotenv -e ../.env -- prisma ...` |
| `client/.env.local` | Next.js автоматично |

## ✅ Перевірка

Після налаштування перевірте:

1. **Сервер запускається:**
```bash
cd server && npm run dev
```
Повинно показати: `📦 DATABASE_URL: *** SET ***`

2. **Prisma бачить базу:**
```bash
cd server && npm run prisma:generate
```
Повинно показати: `✔ Generated Prisma Client`

3. **Frontend бачить API:**
```bash
cd client && npm run dev
```
Відкрийте `http://localhost:3000` - має працювати.
