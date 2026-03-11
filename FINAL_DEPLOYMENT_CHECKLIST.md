# ✅ FINAL DEPLOYMENT CHECKLIST

## 🎯 Швидка перевірка перед деплоем

### 1. Змінні оточення Railway

```
✅ DATABASE_URL - автоматично від Railway PostgreSQL
✅ JWT_SECRET - мінімум 32 символи
✅ CLOUDINARY_CLOUD_NAME - з cloudinary.com
✅ CLOUDINARY_API_KEY - з cloudinary.com  
✅ CLOUDINARY_API_SECRET - з cloudinary.com
✅ ADMIN_EMAIL - goodsxp.net@gmail.com
✅ ADMIN_PASSWORD - змініть після деплою!
✅ PORT=5000
✅ NODE_ENV=production
```

### 2. Перевірка Dockerfile

```
✅ Next.js standalone копіюється у /app/client
✅ .next/static доступний
✅ public directory скопійовано
✅ uploads directory створено
✅ user nodejs використовується
✅ permissions встановлено
✅ health check налаштовано
```

### 3. API Routes

```
✅ /api/auth/* - реєстрація/вхід
✅ /api/products/* - публічні endpoints
✅ /api/admin/* - захищено middleware
✅ /api/upload - завантаження фото
✅ /health - health check
```

### 4. Static Files

```
✅ /_next/static/* - Next.js assets
✅ /uploads/* - локальні файли
✅ /public/* - public files
```

### 5. Admin Protection

```
✅ /api/admin/* вимагає JWT + ADMIN role
✅ authenticate middleware працює
✅ authorize(Role.ADMIN) перевіряє роль
✅ frontend redirect на /login
```

### 6. Cloudinary Upload

```
✅ /api/upload route існує
✅ POST /api/upload приймає FormData
✅ повертає { success: true, url: "..." }
✅ ProductModal використовує API
✅ images зберігаються як масив URL
✅ перше фото = основне (imageUrl)
```

### 7. Product Catalog

```
✅ каталог показує title + price
✅ клік відкриває ProductModal
✅ modal показує всі фото
✅ галерея з навігацією
✅ ціна, опис, наявність
```

### 8. Dashboard Stats

```
✅ GET /api/admin/stats працює
✅ totalUsers, totalOrders, totalRevenue
✅ dailyOrders для графіка
✅ recentOrders таблиця
```

---

## 🧪 Тестування після деплою

### 1. Health Check

```bash
curl https://your-app.railway.app/health
# Очікується: {"status":"healthy",...}
```

### 2. Products API

```bash
curl https://your-app.railway.app/api/products
# Очікується: масив товарів
```

### 3. Admin Protection

```bash
# Без токену - має бути 401
curl https://your-app.railway.app/api/admin/products
# Очікується: {"error":"Потрібна авторизація"}
```

### 4. Upload Test

```bash
# Через curl (Cloudinary)
curl -X POST https://your-app.railway.app/api/upload \
  -F "image=@test.jpg"
# Очікується: {"success":true,"url":"https://res.cloudinary.com/..."}
```

### 5. Static Files

```bash
# Next.js CSS/JS
curl https://your-app.railway.app/_next/static/...

# Uploads
curl https://your-app.railway.app/uploads/test.jpg
```

---

## 🐛 Troubleshooting

### Server не запускається

```bash
# Railway Dashboard → Logs
# Шукайте:
❌ "DATABASE_URL is not set"
❌ "Cannot find module"
❌ "EADDRINUSE"
```

**Fix:**
1. Перевірте DATABASE_URL у Variables
2. `npm run build` локально для перевірки
3. Переконайтесь що PORT=5000

### Cloudinary не працює

```bash
# Перевірте змінні
echo $CLOUDINARY_CLOUD_NAME
echo $CLOUDINARY_API_KEY

# Test upload
curl -X POST /api/upload -F "image=@test.jpg"
```

**Fix:**
1. Перевірте credentials на cloudinary.com
2. Перезапустіть контейнер на Railway
3. Перевірте логи

### Admin відкривається без login

**Fix:**
1. Очистіть localStorage
2. Перевірте /api/admin/products без токену
3. Оновіть middleware

### Фото не вантажаться

**Fix:**
1. Перевірте console.log у ProductModal
2. Перевірте /api/upload response
3. Переконайтесь що images - масив URL

---

## 🚀 Deploy Command

```bash
# 1. Commit changes
git add .
git commit -m "Fix deployment - Dockerfile, upload, admin auth"
git push

# 2. Railway автоматично деплоїть
# 3. Моніторьте Logs у Railway Dashboard
```

---

## 📊 Post-Deploy Verification

### 1. Головна сторінка
- [ ] https://your-app.railway.app/ завантажується
- [ ] CSS/JS працюють
- [ ] Товари відображаються

### 2. Каталог
- [ ] https://your-app.railway.app/catalog показує товари
- [ ] Клік відкриває modal
- [ ] Галерея фото працює

### 3. Admin Login
- [ ] https://your-app.railway.app/login працює
- [ ] goodsxp.net@gmail.com / Admin123! входить
- [ ] токен зберігається в localStorage

### 4. Admin Panel
- [ ] https://your-app.railway.app/admin відкривається
- [ ] Stats показують цифри
- [ ] Графік замовлень працює

### 5. Product Management
- [ ] Додавання товару працює
- [ ] Upload фото працює
- [ ] Кілька фото = масив
- [ ] Перше фото = основне

### 6. Orders
- [ ] Замовлення відображаються
- [ ] Статуси змінюються

---

## 🎯 Критичні Issues

### 🔴 CRITICAL - Server crash

**Symptom:** Health check fail, 502 Bad Gateway

**Fix:**
```bash
# 1. Перевірте DATABASE_URL
railway variables get DATABASE_URL

# 2. Перевірте логи
railway logs

# 3. Rebuild
railway deploy --build
```

### 🔴 CRITICAL - Cloudinary не працює

**Symptom:** Фото не завантажуються, помилка 500

**Fix:**
```bash
# 1. Перевірте змінні
railway variables get CLOUDINARY_CLOUD_NAME

# 2. Test API
curl -X POST /api/upload -F "image=@test.jpg"

# 3. Перезапустіть
railway restart
```

### 🟡 WARNING - Admin без захисту

**Symptom:** /admin відкривається без login

**Fix:**
```bash
# 1. Очистіть токени
localStorage.clear()

# 2. Перевірте middleware
# /server/src/routes/admin.routes.ts
router.use(authenticate);
router.use(authorize(Role.ADMIN));
```

---

## ✅ Success Criteria

```
✅ Server запускається без помилок
✅ Health check повертає 200
✅ Static files доступні
✅ Admin захищена
✅ Cloudinary upload працює
✅ Фото відображаються всюди
✅ Catalog показує title+price
✅ Modal показує всі фото
✅ Stats коректні
✅ Графіки працюють
```
