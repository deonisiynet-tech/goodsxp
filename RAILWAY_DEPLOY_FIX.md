# Railway Deployment Guide

## Виправлені проблеми

### 1. **SSR Errors (styled-jsx / useContext)**
- ✅ Виправлено неправильне використання `useRouter()` в `DashboardView.tsx`
- ✅ Додано `'use client'` директиви де потрібно
- ✅ Всі hook React тепер викликаються тільки в клієнтських компонентах

### 2. **window / location Reference Errors**
- ✅ Всі звернення до `window`, `localStorage`, `location` тепер захищені перевіркою `typeof window !== 'undefined'`
- ✅ Виправлено `api.ts`, `products-api.ts`, `Header.tsx`, `store.ts`
- ✅ Zustand persist middleware тепер SSR-safe

### 3. **React Version Mismatch**
- ✅ Перевірено: всі пакети використовують React 18.3.1
- ✅ styled-jsx сумісний з React 18

### 4. **Next.js Config**
- ✅ Додано `experimental.optimizePackageImports` для кращої SSR підтримки
- ✅ Збережено `output: 'standalone'` для Docker деплою

## Деплой на Railway

### 1. Структура проекту
```
shop-mvp/
├── client/          # Next.js фронтенд
├── server/          # Express + Prisma бекенд
└── .env             # DATABASE_URL та інші змінні
```

### 2. Змінні оточення (Railway)

Встановіть наступні змінні оточення в Railway:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Server
PORT=5000
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
CLIENT_URL=https://your-app.railway.app
ADMIN_EMAIL=goodsxp.net@gmail.com
ADMIN_PASSWORD=Admin123

# Client (якщо потрібно)
NEXT_PUBLIC_API_URL=/api
```

### 3. Build Commands

Railway автоматично визначить монорепозиторій. Налаштуйте:

**Root Command:**
```bash
npm install && npm run build
```

**Start Command:**
```bash
npm run start
```

Або створіть окремий service для client і server:

#### Server Service:
- Root directory: `server`
- Build command: `npm install && npm run build`
- Start command: `npm run start`

#### Client Service:
- Root directory: `client`
- Build command: `npm install && npm run build`
- Start command: `npm run start`

### 4. Docker (альтернативний варіант)

Якщо використовуєте Docker, створіть `Dockerfile` в корені:

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/
RUN npm install
RUN cd server && npm install
RUN cd client && npm install

# Build
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Copy built files
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/node_modules ./server/node_modules
COPY --from=builder /app/server/package.json ./server/
COPY --from=builder /app/client/.next ./client/.next
COPY --from=builder /app/client/public ./client/public
COPY --from=builder /app/client/node_modules ./client/node_modules
COPY --from=builder /app/client/package.json ./client/

EXPOSE 5000 3000

CMD ["npm", "run", "start"]
```

### 5. Перевірка після деплою

1. Відкрийте `/api/products` - має повернути список товарів
2. Відкрийте `/catalog` - каталог товарів має завантажитись
3. Відкрийте `/catalog/[slug]` - сторінка товару має працювати
4. Перевірте адмінку `/admin` - має працювати без SSR помилок

## Відомі проблеми та рішення

### Помилка: "Cannot read properties of null (reading 'useContext')"
**Причина:** React hook викликається поза компонентом
**Рішення:** Перевірте що всі hook викликаються тільки в `'use client'` компонентах

### Помилка: "location is not defined"
**Причина:** Використання `window.location` на сервері
**Рішення:** Обгорніть в `typeof window !== 'undefined'` або використовуйте `useRouter()`

### Помилка: "localStorage is not defined"
**Причина:** Виклик localStorage під час SSR
**Рішення:** Використовуйте localStorage тільки в `useEffect` або з перевіркою `typeof window`

## Контакти

Якщо виникли проблеми, перевірте:
1. Логи збірки в Railway
2. Консоль браузера на предмет помилок гідратації
3. Server logs на предмет помилок Prisma
