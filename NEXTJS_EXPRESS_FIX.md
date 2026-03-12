# Next.js + Express Integration Fix

## Вирішені проблеми

### 1. ❌ "Unexpected token 'export'" error
**Причина:** Next.js намагався використовувати Edge runtime замість Node.js

**Вирішення:**
- Видалено некоректну опцію `server: 'node'` з `next.config.mjs`
- Додано правильну конфігурацію webpack для SSR
- Middleware залишено на Edge runtime (це єдина правильна робота middleware в Next.js)

### 2. ❌ "Cannot convert undefined or null to object" error
**Причина:** Неправильна ініціалізація Next.js в Express server

**Вирішення:**
- Виправлено ініціалізацію Next.js з правильними параметрами `dev` та `dir`
- Додано логування для перевірки .next директорії
- API routes переміщено ПЕРЕД Next.js handler

### 3. ❌ "Cannot read properties of null (reading 'useContext')" error
**Причина:** React SSR не працював коректно через неправильну збірку

**Вирішення:**
- Додано express до client dependencies для custom server
- Створено окремий `client/server.js` для standalone build
- Оновлено Dockerfile для правильного копіювання файлів

## Змінені файли

### 1. `client/next.config.mjs`
```javascript
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsHmrCache: false,
  },
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    NODE_ENV: process.env.NODE_ENV,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), 'sharp', 'canvas'];
    }
    return config;
  },
};
```

### 2. `client/src/middleware.ts`
- Видалено некоректне `export const runtime = 'nodejs'`
- Middleware повинен працювати на Edge runtime

### 3. `server/src/server.ts`
- Додано логування для .next директорії
- API routes переміщено ПЕРЕД Next.js handler
- Виправлено ініціалізацію Next.js

### 4. `client/package.json`
- Додано `express` до dependencies
- Додано `@types/express` до devDependencies
- Додано скрипт `start:custom`

### 5. `client/server.js` (новий файл)
- Custom server для інтеграції з Express
- Правильно ініціалізує Next.js standalone build

### 6. `Dockerfile`
- Додано копіювання `client/server.js`
- Додано копіювання `client/package.json`
- Додано верифікацію структури build

## Як це працює

```
Express Server (port 5000)
├── /api/* → API routes (auth, products, orders, admin)
├── /uploads/* → Static files
├── /public/* → Public assets
└── /* → Next.js handler
    ├── /admin → Admin dashboard (SSR)
    ├── /catalog → Product catalog (SSR)
    └── /_next/static → Static Next.js assets
```

## Деплой на Railway

### 1. Переконайтесь що всі змінні оточення встановлені:
```bash
DATABASE_URL=postgresql://...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
NODE_ENV=production
PORT=5000
```

### 2. Запустіть build:
```bash
docker build -t shop-mvp .
```

### 3. Перевірте локально:
```bash
docker run -p 5000:5000 shop-mvp
```

### 4. Перевірте сторінки:
- http://localhost:5000/ - Головна
- http://localhost:5000/admin - Admin dashboard
- http://localhost:5000/health - Health check

## Перевірка правильності роботи

### 1. Переконайтесь що .next існує після build:
```bash
ls -la client/.next/
ls -la client/.next/standalone/
ls -la client/.next/static/
```

### 2. Переконайтесь що server.js існує:
```bash
ls -la client/server.js
```

### 3. Перевірте логи при запуску:
```
📦 Initializing Next.js...
🚀 PRODUCTION MODE: Using Next.js standalone
📁 Client directory: /app/client
📁 .next exists: true
✅ Next.js prepared successfully
✅ SERVER STARTED
```

### 4. Перевірте admin сторінку:
- Відкрийте http://localhost:5000/admin
- Не повинно бути помилок в консолі
- Сторінка повинна рендеритись коректно

## Можливі проблеми та вирішення

### Проблема: "Module not found: Can't resolve 'express'"
**Вирішення:** Переконайтесь що `express` додано до `client/package.json`

### Проблема: "ENOENT: no such file or directory, scandir '.next'"
**Вирішення:** Переконайтесь що `npm run build` виконався успішно в client директорії

### Проблема: Middleware не працює
**Вирішення:** Middleware повинен працювати на Edge runtime, не змінюйте на `nodejs`

### Проблема: CSS не завантажується
**Вирішення:** Переконайтесь що `.next/static` скопійовано в Dockerfile

## React версії

Перевірено сумісність:
- `client/package.json`: react@^18.2.0, react-dom@^18.2.0
- `server/package.json`: next@^14.1.0 (включає React 18)

Версії сумісні, конфліктів немає.
