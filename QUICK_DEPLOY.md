# 🚀 ШВИДКА ІНСТРУКЦІЯ З ДЕПЛОЮ

## 1. Змінні оточення на Railway

Відкрийте Railway Dashboard → Your Project → Variables

Додайте всі змінні:

```bash
# Database (Railway автоматично створює)
DATABASE_URL=postgresql://postgres:...

# JWT (мінімум 32 символи!)
JWT_SECRET=super-secret-jwt-key-min-32-characters-long-xyz123

# Cloudinary (ОБОВ'ЯЗКОВО для фото!)
# Отримати на https://cloudinary.com/users/register/free
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

---

## 2. Деплой

```bash
# 1. Зробити commit всіх змін
git add .
git commit -m "Fix: Dockerfile, Cloudinary upload, admin auth"
git push

# 2. Railway автоматично почне деплой
# 3. Моніторьте логи у Railway Dashboard
```

---

## 3. Перевірка після деплою

### Health check (через 1-2 хвилини)
```bash
https://your-app.railway.app/health
```

### Головна сторінка
```bash
https://your-app.railway.app/
```

### Каталог товарів
```bash
https://your-app.railway.app/catalog
```

### Admin login
```bash
https://your-app.railway.app/login
Email: goodsxp.net@gmail.com
Password: Admin123!
```

### Admin panel
```bash
https://your-app.railway.app/admin
```

---

## 4. Тестування фото (Cloudinary)

1. Зайдіть в Admin Panel
2. Товари → Додати товар
3. Заповніть назву, опис, ціну
4. Завантажте кілька фото (drag & drop)
5. Натисніть "Зберегти"
6. **Перевірте:** фото з'явилися в каталозі

---

## 5. Тестування каталогу

1. Відкрийте https://your-app.railway.app/catalog
2. **Перевірте:** видно тільки фото + назву + ціну
3. Клікніть на товар
4. **Перевірте:** відкрився modal з усіма фото, описом, ціною

---

## 6. Тестування адмінки

1. Спробуйте відкрити /admin без login
2. **Перевірте:** redirect на /login
3. Залогіньтесь як адмін
4. **Перевірте:** відкрився dashboard зі статистикою

---

## 🐛 Якщо щось не працює

### Server не запускається

```bash
# Railway Dashboard → Logs
# Шукайте помилки:
❌ DATABASE_URL is not set
❌ Cannot find module '@prisma/client'
❌ Port 5000 is already in use
```

**Fix:**
1. Перевірте DATABASE_URL у Variables
2. Натисніть "Redeploy" у Railway

### Фото не завантажуються

```bash
# Перевірте змінні
CLOUDINARY_CLOUD_NAME=???
CLOUDINARY_API_KEY=???
CLOUDINARY_API_SECRET=???
```

**Fix:**
1. Зареєструйтесь на https://cloudinary.com
2. Скопіюйте credentials
3. Додайте у Railway Variables
4. Redeploy

### Адмінка відкривається без login

**Fix:**
1. Очистіть localStorage у браузері (F12 → Application → Clear storage)
2. Оновіть сторінку
3. Залогіньтесь знову

---

## ✅ Success Criteria

```
✅ Server запускається (health check 200)
✅ Головна сторінка працює
✅ Каталог показує title + price
✅ Клік відкриває modal з фото
✅ Admin захищена (redirect на /login)
✅ Login працює
✅ Dashboard показує статистику
✅ Завантаження фото працює
✅ Кілька фото = галерея
✅ Перше фото = основне
```

---

## 📞 Contact Info

Якщо виникли проблеми:
1. Перевірте логи у Railway Dashboard
2. Перевірте змінні оточення
3. Переконайтесь що Cloudinary налаштовано

---

## 📚 Файли

- `Dockerfile` - конфігурація build
- `RESPONSE.md` - повна відповідь з прикладами
- `DEPLOYMENT_GUIDE.md` - детальна інструкція
- `FINAL_DEPLOYMENT_CHECKLIST.md` - checklist
