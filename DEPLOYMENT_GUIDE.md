# 🚀 DEPLOYMENT GUIDE - GoodsXP Shop MVP

## ✅ Checklist перед деплоем

### 1. Змінні оточення (Railway Dashboard)

В Railway Dashboard → Variables додайте:

```bash
# Database (Railway автоматично створює DATABASE_URL)
DATABASE_URL=postgresql://...

# JWT
JWT_SECRET=your-super-secret-key-min-32-characters-long

# Cloudinary (ОБОВ'ЯЗКОВО для фото товарів)
CLOUDINARY_CLOUD_NAME=ваш-cloud-name
CLOUDINARY_API_KEY=ваш-api-key  
CLOUDINARY_API_SECRET=ваш-api-secret

# Admin credentials
ADMIN_EMAIL=goodsxp.net@gmail.com
ADMIN_PASSWORD=Admin123!

# Server
PORT=5000
NODE_ENV=production
```

### 2. Отримання Cloudinary credentials

1. Зареєструйтесь на https://cloudinary.com/users/register/free
2. У dashboard скопіюйте:
   - Cloud Name
   - API Key
   - API Secret
3. Додайте у Railway Variables

---

## 🔧 Dockerfile Configuration

### Структура Dockerfile:

```
├── server-builder    # Збірка Express сервера
├── client-builder    # Збірка Next.js (standalone)
└── runner           # Production image
    ├── /app/dist           # Express сервер
    ├── /app/node_modules   # Залежності
    ├── /app/client         # Next.js standalone
    ├── /app/client/.next/static  # Static assets
    ├── /app/client/public        # Public files
    └── /app/uploads              # Uploads directory
```

### Ключові моменти:

1. **Next.js Standalone** копіюється у `/app/client`
2. **Static files** з `.next/static` доступні через Express
3. **Uploads directory** створено у `/app/uploads`
4. **User nodejs** використовується для безпеки

---

## 🏗️ Railway Setup

### 1. Root Directory

В Railway:
- Root Directory: `.` (корінь репозиторію)
- Builder: `Dockerfile`
- Start Command: `node dist/server.js`

### 2. Health Check

Dockerfile включає health check:
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', ...)"
```

### 3. Ports

- Express сервер слухає порт **5000**
- Next.js обробляється через Express proxy
- Всі `/api/*` маршрути йдуть на Express API

---

## 📁 Static Files Configuration

### Як працює статика:

1. **Next.js Assets** (`.next/static`):
   - Копіюються у `/app/client/.next/static`
   - Доступні через `/_next/static/*`

2. **Public Files** (`/client/public`):
   - Копіюються у `/app/client/public`
   - Express serve: `app.use(express.static(clientPublicDir))`

3. **Uploads** (`/uploads`):
   - Створюється у `/app/uploads`
   - Express serve: `app.use('/uploads', express.static(uploadsDir))`

### Перевірка доступності:

```bash
# Після деплою перевірте:
curl https://your-app.railway.app/health
curl https://your-app.railway.app/uploads/test.jpg
```

---

## 🔐 Admin Protection

### Админка захищена:

1. **Middleware** `/server/src/middleware/auth.ts`:
   - `authenticate` - перевірка JWT токену
   - `authorize(Role.ADMIN)` - перевірка ролі

2. **API Routes** (`/api/admin/*`):
   ```typescript
   router.use(authenticate);
   router.use(authorize(Role.ADMIN));
   ```

3. **Frontend** (`/client/src/components/admin/AdminLayout.tsx`):
   - Перевірка токену в localStorage
   - Redirect на `/login` якщо немає доступу

### Default Admin Credentials:

```
Email: goodsxp.net@gmail.com
Password: Admin123!
```

**⚠️ Змініть пароль після першого входу!**

---

## 📸 Cloudinary Integration

### Flow завантаження фото:

1. **Admin Panel** → ProductModal
2. **Select Files** → `/api/upload` (Next.js API route)
3. **Upload to Cloudinary** → Отримання URL
4. **Save to Database** → Масив URL у полі `images`
5. **First image** → `imageUrl` (основне фото)

### API Route:

```typescript
// /client/src/app/api/upload/route.ts
POST /api/upload
Body: FormData { file: File }
Response: { success: true, url: "https://res.cloudinary.com/..." }
```

### Database Schema:

```prisma
model Product {
  imageUrl String?      // Основне фото (перше з images)
  images   String[]     // Всі фото товару
}
```

---

## 🛠️ Troubleshooting

### Server crash after deploy

**Symptoms:** Health check fails, 502 errors

**Solutions:**
1. Перевірте DATABASE_URL у Railway Variables
2. Перевірте логи: `railway logs`
3. Переконайтесь що Prisma generated: `npx prisma generate`

### Images not loading

**Symptoms:** Placeholder замість фото

**Solutions:**
1. Перевірте CLOUDINARY_* змінні
2. Перевірте `/api/upload` route: `curl -X POST ...`
3. Переконайтесь що images зберігаються як масив URL

### Admin page opens without login

**Symptoms:** /admin доступна без авторизації

**Solutions:**
1. Перевірте middleware у `/server/src/routes/admin.routes.ts`
2. Переконайтесь що API routes захищені
3. Очистіть localStorage у браузері

### Static files 404

**Symptoms:** CSS/JS не завантажуються

**Solutions:**
1. Перевірте що `.next/static` скопійовано у Dockerfile
2. Перевірте permissions: `chown nodejs:nodejs`
3. Переконайтесь що Express serve static правильно

---

## 🧪 Verification Commands

### Після деплою:

```bash
# 1. Health check
curl https://your-app.railway.app/health

# 2. API check
curl https://your-app.railway.app/api/products

# 3. Admin check (without token - має бути 401)
curl https://your-app.railway.app/api/admin/products

# 4. Static files
curl https://your-app.railway.app/_next/static/...

# 5. Upload test (Cloudinary)
curl -X POST https://your-app.railway.app/api/upload \
  -F "file=@test.jpg"
```

### Local testing:

```bash
# Build Docker image
docker build -t shop-mvp .

# Run container
docker run -p 5000:5000 \
  -e DATABASE_URL=... \
  -e CLOUDINARY_CLOUD_NAME=... \
  shop-mvp

# Check logs
docker logs <container-id>
```

---

## 📊 Statistics & Charts

### Dashboard Stats:

- **Total Users** - `prisma.user.count()`
- **Total Orders** - `prisma.order.count()`
- **Total Revenue** - `prisma.order.aggregate({ _sum: { totalPrice } })`
- **Orders Today** - Orders за сьогодні
- **Daily Orders Chart** - Останні 7 днів

### API Endpoint:

```typescript
GET /api/admin/stats?days=30
Response: {
  totalUsers: number,
  totalOrders: number,
  totalRevenue: number,
  dailyOrders: { date: string, orders: number }[]
}
```

---

## 🎯 Final Checklist

- [ ] DATABASE_URL налаштовано у Railway
- [ ] CLOUDINARY_* змінні додано
- [ ] JWT_SECRET мінімум 32 символи
- [ ] ADMIN_EMAIL/PASSWORD змінені
- [ ] Dockerfile використовує `nodejs` user
- [ ] Health check проходить
- [ ] Static files доступні
- [ ] Admin захищена middleware
- [ ] Cloudinary upload працює
- [ ] Product modal показує всі фото
- [ ] Catalog показує title + price
- [ ] Dashboard stats коректні

---

## 🚀 Quick Deploy

```bash
# 1. Push to Git
git add .
git commit -m "Fix deployment issues"
git push

# 2. Railway автоматично деплоїть
# 3. Перевірте логи у Railway Dashboard
# 4. Протестуйте endpoints

# 5. Змініть admin пароль
# Login → Admin Panel → Settings
```
