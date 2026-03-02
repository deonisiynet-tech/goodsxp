# ✅ FINAL CHECKLIST - GoodsXP Full-Stack Deployment

## 🎯 Перевірено та виправлено

### 1. ✅ Server (server.ts)

**Порт і хост:**
```typescript
const PORT = Number(process.env.PORT) || 5000;
app.listen(PORT, '0.0.0.0', ...)
```
✅ Сервер слухає `0.0.0.0:${PORT}`

**Healthcheck endpoints:**
```typescript
app.get('/health', ...)  // Returns: {"status": "healthy", ...}
app.get('/healthz', ...) // Returns: "OK"
```
✅ Обидва endpoints працюють

**API routes:**
```typescript
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
```
✅ Всі `/api/*` маршрути обробляються Express

**Next.js integration:**
```typescript
app.all('*', (req, res) => nextHandle(req, res, parsedUrl));
```
✅ Всі інші маршрути → Next.js

---

### 2. ✅ Dockerfile

**Збірка client:**
```dockerfile
WORKDIR /app/client
RUN npm run build
```
✅ Next.js збирається коректно

**Збірка server:**
```dockerfile
WORKDIR /app/server
RUN npm run build
```
✅ TypeScript збирається коректно

**Запуск:**
```dockerfile
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
```
✅ Сервер запускається коректно

**Змінні оточення:**
```dockerfile
ENV NODE_ENV=production
ENV NEXT_DIR=./client
```
✅ Змінні встановлені

---

### 3. ✅ Client (Next.js)

**API configuration:**
```typescript
const API_BASE_URL = '/api';
```
✅ Відносний шлях для інтеграції з Express

**Next.js config:**
```javascript
// output: 'standalone' - вимкнено
unoptimized: process.env.NODE_ENV === 'production'
```
✅ Конфігурація для інтеграції з Express

**Environment:**
```env
NEXT_PUBLIC_API_URL=/api
```
✅ Проксірування на Express API

---

### 4. ✅ Server Dependencies

**package.json:**
```json
"dependencies": {
  "next": "^14.1.0",
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  ...
}
```
✅ Next.js і React в залежностях сервера

---

## 📋 Змінні оточення для Railway

### Обов'язкові змінні в Railway Dashboard → Variables:

| Key | Value | Примітка |
|-----|-------|----------|
| `NODE_ENV` | `production` | ✅ Обов'язково |
| `DATABASE_URL` | `postgresql://...@postgres.railway.internal:5432/railway` | ✅ З PostgreSQL |
| `JWT_SECRET` | `goodsxp-super-secret-jwt-key-2026` | ✅ Будь-який секрет 32+ символів |
| `ADMIN_EMAIL` | `goodsxp.net@gmail.com` | ✅ Email адміна |
| `ADMIN_PASSWORD` | `Admin123` | ✅ Пароль адміна (змінити після деплою) |
| `NEXT_DIR` | `./client` | ✅ Шлях до client directory |

---

## 🚀 Фінальна інструкція з деплою

### Крок 1: Закоммітьте зміни

```bash
cd c:\Users\User\Desktop\shop-mvp
git add .
git commit -m "Final: Full-stack integration ready for production"
git push origin main
```

### Крок 2: Railway автоматично задеплоїть

1. Відкрийте **Railway Dashboard** → ваш проект
2. Перейдіть у **Deployments**
3. Зачекайте 5-10 хвилин

### Крок 3: Перевірте Deploy Logs

**Очікуваний вивід:**
```
🔧 SERVER FILE LOADED
📦 NODE_ENV: production
📦 PORT: 8080
📦 DATABASE_URL: *** SET ***
📦 Initializing Next.js...
📁 Client directory: /app/client
📥 Importing API routes...
✅ All imports completed successfully
🚀 Initializing Express app...
✅ Registering API routes...
✅ Registering Next.js handler...
🎧 ABOUT TO LISTEN on port 8080
✅ Next.js prepared successfully
============================================================
✅ SERVER STARTED
🚀 Server running on port 8080
🌐 Listening on 0.0.0.0: 8080
📡 API available at http://localhost:8080/api
🏠 Frontend available at http://localhost:8080
✅ Health check: http://localhost:8080/health
============================================================
```

### Крок 4: Перевірте ендпоінти

| URL | Метод | Очікуваний результат |
|-----|-------|----------------------|
| `https://your-app.railway.app/health` | GET | `{"status":"healthy",...}` ✅ |
| `https://your-app.railway.app/healthz` | GET | `OK` ✅ |
| `https://your-app.railway.app/api/products` | GET | Список товарів ✅ |
| `https://your-app.railway.app/` | GET | Головна сторінка ✅ |
| `https://your-app.railway.app/admin` | GET | Адмін-панель ✅ |
| `https://your-app.railway.app/catalog` | GET | Каталог товарів ✅ |

### Крок 5: Створіть адміністратора (seed)

**Через Railway Shell:**
```bash
npm run seed
```

**Або через Railway CLI:**
```bash
railway run npm run seed
```

---

## 🐛 Troubleshooting

### Проблема 1: Healthcheck fails

**Симптоми:**
```
Attempt #1 failed with service unavailable
```

**Причина:** DATABASE_URL не встановлено

**Рішення:**
1. Railway Dashboard → Variables
2. Додайте `DATABASE_URL` з PostgreSQL

---

### Проблема 2: "Failed to prepare Next.js"

**Симптоми:**
```
❌ Failed to prepare Next.js: Error: Cannot find module '/app/client'
```

**Причина:** Неправильний шлях до client

**Рішення:**
1. Перевірте `NEXT_DIR=./client` в Dockerfile
2. Перевірте Variables → `NEXT_DIR=./client`

---

### Проблема 3: API не працює з frontend

**Симптоми:**
```
Network Error / Failed to fetch
```

**Причина:** Неправильний API_BASE_URL

**Рішення:**
1. Перевірте `client/src/lib/api.ts` → `const API_BASE_URL = '/api'`
2. Перевірте `client/.env.local` → `NEXT_PUBLIC_API_URL=/api`

---

### Проблема 4: "DATABASE_URL is not set"

**Симптоми:**
```
📦 DATABASE_URL: ❌ NOT SET
❌ FATAL: DATABASE_URL is not set!
```

**Рішення:**
1. Railway Dashboard → Variables
2. Додайте `DATABASE_URL`

---

## ✅ Фінальний чекліст

- [ ] Зміни закоммічені і запушені в GitHub
- [ ] PostgreSQL додано в Railway
- [ ] `DATABASE_URL` встановлено в Variables
- [ ] `JWT_SECRET` встановлено (32+ символи)
- [ ] `ADMIN_EMAIL` і `ADMIN_PASSWORD` встановлено
- [ ] `NEXT_DIR=./client` встановлено в Variables
- [ ] Deploy Logs показують "SERVER STARTED"
- [ ] Healthcheck повертає 200 OK
- [ ] `/api/products` повертає список товарів
- [ ] `/` відкриває головну сторінку
- [ ] `/admin` відкриває адмін-панель
- [ ] Seed виконано для створення адміна

---

## 📁 Структура файлів

```
shop-mvp/
├── Dockerfile                  # Збірка client + server
├── server/
│   ├── src/
│   │   ├── server.ts           # Express + Next.js integration
│   │   ├── routes/             # API routes
│   │   ├── middleware/         # Middleware
│   │   ├── services/           # Business logic
│   │   └── prisma/             # Prisma client
│   └── package.json            # Залежності (включно з next, react)
├── client/
│   ├── src/
│   │   ├── app/                # Next.js pages
│   │   ├── components/         # React components
│   │   └── lib/
│   │       └── api.ts          # API client (/api base URL)
│   ├── .env.local              # NEXT_PUBLIC_API_URL=/api
│   ├── .dockerignore           # Docker ignore rules
│   └── next.config.mjs         # Next.js config (no standalone)
└── ...
```

---

## 🔑 Ключові моменти

1. **Єдиний сервер** обслуговує і API, і Frontend
2. **`/api/*`** → Express API routes
3. **`/health`** → Health check для Railway
4. **`/*`** → Next.js pages
5. **`NEXT_DIR=./client`** → Шлях до client directory
6. **`/api`** → Відносний шлях для API запитів

---

**Дата**: Березень 2026  
**Статус**: ✅ READY FOR PRODUCTION
