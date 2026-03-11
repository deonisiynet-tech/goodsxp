# 🚀 ВІДПОВІДЬ НА ЗАПИТАННЯ - Повний робочий приклад

## ✅ 1. Робочий Dockerfile для Railway

Файл: `/Dockerfile`

```dockerfile
# Root Dockerfile for Railway - Fullstack Build
FROM node:20-alpine AS base
RUN apk add --no-cache openssl libc6-compat

# SERVER BUILD
FROM base AS server-builder
WORKDIR /app
COPY server/package*.json ./
RUN npm install
COPY server/tsconfig.json ./
COPY server/src ./src
COPY server/prisma ./prisma
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db"
RUN npx prisma generate --schema=./prisma/schema.prisma
RUN npm run build

# CLIENT BUILD
FROM base AS client-builder
WORKDIR /client
COPY client/package*.json ./
RUN npm install
COPY client/ .
COPY server/prisma ./prisma
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db"
RUN npx prisma generate --schema=./prisma/schema.prisma
RUN npm run build

# PRODUCTION IMAGE
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copy server build
COPY --from=server-builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=server-builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=server-builder --chown=nodejs:nodejs /app/package.json ./

# Copy Next.js standalone
RUN mkdir -p ./client
COPY --from=client-builder --chown=nodejs:nodejs /client/.next/standalone/. ./client/
COPY --from=client-builder --chown=nodejs:nodejs /client/.next/static ./client/.next/static
COPY --from=client-builder --chown=nodejs:nodejs /client/public ./client/public

# Create uploads directory
RUN mkdir -p ./uploads && chown nodejs:nodejs ./uploads
RUN mkdir -p /tmp && chown nodejs:nodejs /tmp
RUN chown -R nodejs:nodejs /app

USER nodejs
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/server.js"]
```

---

## ✅ 2. Команда запуску

**Railway автоматично запускає:**
```bash
node dist/server.js
```

**Локально для тестування:**
```bash
docker build -t shop-mvp .
docker run -p 5000:5000 \
  -e DATABASE_URL="postgresql://..." \
  -e CLOUDINARY_CLOUD_NAME="..." \
  -e CLOUDINARY_API_KEY="..." \
  -e CLOUDINARY_API_SECRET="..." \
  shop-mvp
```

---

## ✅ 3. Змінні оточення (Railway Variables)

```bash
# Database (Railway створює автоматично)
DATABASE_URL=postgresql://postgres:...@...:5432/...

# JWT
JWT_SECRET=your-super-secret-key-min-32-characters-long

# Cloudinary (ОБОВ'ЯЗКОВО)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Admin
ADMIN_EMAIL=goodsxp.net@gmail.com
ADMIN_PASSWORD=Admin123!

# Server
PORT=5000
NODE_ENV=production
```

---

## ✅ 4. Як працює завантаження фото

### Flow:
1. **Admin Panel** → ProductModal → Select Files
2. **POST /api/upload** (Next.js API route)
3. **Cloudinary** → повертає URL
4. **Save to DB** → масив URL у полі `images`
5. **First image** → `imageUrl` (основне фото)

### API Route: `/client/src/app/api/upload/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const b64 = buffer.toString('base64')
  const dataUri = `data:${file.type};base64,${b64}`

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: 'goodsxp-products',
    transformation: [
      { width: 1200, height: 1200, crop: 'limit' },
      { quality: 'auto:good' },
    ],
  })

  return NextResponse.json({ success: true, url: result.secure_url })
}
```

---

## ✅ 5. Адмінка захищена

### Middleware: `/server/src/middleware/auth.ts`

```typescript
export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Потрібна авторизація' })
  }
  
  const token = authHeader.split(' ')[1]
  const decoded = jwt.verify(token, process.env.JWT_SECRET)
  
  const user = await prisma.user.findUnique({ where: { id: decoded.id } })
  if (!user) return res.status(401).json({ error: 'Користувача не знайдено' })
  
  req.user = user
  next()
}

export const authorize = (...roles: Role[]) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Недостатньо прав' })
    }
    next()
  }
}
```

### Routes: `/server/src/routes/admin.routes.ts`

```typescript
router.use(authenticate)      // ✅ Захист
router.use(authorize(Role.ADMIN))  // ✅ Тільки адмін

router.get('/stats', adminController.getDashboardStats)
router.get('/products', productController.getAllAdmin)
// ...
```

---

## ✅ 6. Каталог + Modal

### Catalog: `/client/src/app/catalog/page.tsx`

```typescript
// Показує тільки title + price
<div className="product-card" onClick={() => handleProductClick(product)}>
  <img src={getProductImage(product)} />
  <h3>{product.title}</h3>
  <span>{product.price.toLocaleString()} ₴</span>
</div>

// Modal при кліку
{selectedProduct && (
  <ProductModal
    product={selectedProduct}
    isOpen={isModalOpen}
    onClose={handleCloseModal}
  />
)}
```

### Modal: `/client/src/components/ProductModal.tsx`

```typescript
// Всі фото + галерея
const images = getImageList()  // масив URL

{images.length > 0 ? (
  <>
    <img src={images[safeSelectedIndex]} />  // Основне
    {images.map((img, idx) => (            // Thumbnails
      <button onClick={() => setSelectedImage(idx)}>
        <img src={img} />
      </button>
    ))}
  </>
) : null}

// + title, description, price, stock
```

---

## ✅ 7. Статистика і графіки

### API: `/server/src/controllers/admin.controller.ts`

```typescript
async getDashboardStats(req, res) {
  const stats = await adminService.getDashboardStats({ days: 30 })
  res.json(stats)
}
```

### Service: `/server/src/services/admin.service.ts`

```typescript
async getDashboardStats({ days }) {
  const [totalUsers, totalOrders, totalRevenue, dailyOrders] = await Promise.all([
    prisma.user.count(),
    prisma.order.count(),
    prisma.order.aggregate({ _sum: { totalPrice: true } }),
    prisma.$queryRaw`SELECT DATE("createdAt") as date, COUNT(*) as orders 
                     FROM "Order" 
                     WHERE "createdAt" >= NOW() - INTERVAL '${days} days' 
                     GROUP BY DATE("createdAt")`
  ])
  
  return { totalUsers, totalOrders, totalRevenue, dailyOrders }
}
```

### Dashboard: `/client/src/app/admin/DashboardView.tsx`

```typescript
// Графік
const chartData = stats.dailyOrders.slice(0, 7)
const maxOrders = Math.max(...chartData.map(d => d.orders), 1)

{chartData.map((day) => (
  <div key={day.date}>
    <div style={{ height: `${(day.orders / maxOrders) * 100}%` }} />
    <span>{day.date}</span>
  </div>
))}
```

---

## ✅ 8. Перевірка /uploads і /client/public

### Server: `/server/src/server.ts`

```typescript
// Serve uploads from root level
const uploadsDir = path.join(process.cwd(), 'uploads')
app.use('/uploads', express.static(uploadsDir))

// Serve client public
const clientPublicDir = path.join(clientDir, 'public')
app.use(express.static(clientPublicDir))
```

### Dockerfile

```dockerfile
# Copy public directory
COPY --from=client-builder --chown=nodejs:nodejs /client/public ./client/public

# Create uploads directory
RUN mkdir -p ./uploads && chown nodejs:nodejs ./uploads
```

### Permissions

```dockerfile
RUN chown -R nodejs:nodejs /app
USER nodejs
```

---

## ✅ 9. Інструкція з перевірки

### 1. Health Check

```bash
curl https://your-app.railway.app/health
# {"status":"healthy","timestamp":"...","uptime":123,"port":5000}
```

### 2. Products API

```bash
curl https://your-app.railway.app/api/products
# [{"id":"...","title":"...","price":123,"imageUrl":"..."},...]
```

### 3. Admin Protection

```bash
# Без токену = 401
curl https://your-app.railway.app/api/admin/products
# {"error":"Потрібна авторизація"}

# З токеном = 200
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-app.railway.app/api/admin/products
```

### 4. Upload Test

```bash
curl -X POST https://your-app.railway.app/api/upload \
  -F "file=@test.jpg"
# {"success":true,"url":"https://res.cloudinary.com/..."}
```

### 5. Static Files

```bash
# Next.js assets
curl https://your-app.railway.app/_next/static/...

# Uploads
curl https://your-app.railway.app/uploads/test.jpg
```

---

## 🎯 Checklist перед деплоєм

```
✅ DATABASE_URL налаштовано
✅ CLOUDINARY_* змінні додано
✅ JWT_SECRET мінімум 32 символи
✅ Dockerfile використовує nodejs user
✅ /uploads і /client/public доступні
✅ Admin захищена middleware
✅ Cloudinary upload працює
✅ Product modal показує всі фото
✅ Catalog показує title + price
✅ Dashboard stats коректні
```

---

## 📚 Документація

- `DEPLOYMENT_GUIDE.md` - Повна інструкція
- `FINAL_DEPLOYMENT_CHECKLIST.md` - Checklist
- `Dockerfile` - Конфігурація build
- `/client/src/app/api/upload/route.ts` - Upload API
- `/server/src/middleware/auth.ts` - Auth middleware
