# GoodsXP - Інтернет-магазин електроніки

Сучасний інтернет-магазин з повнофункціональною адмін-панеллю.

## 🚀 Швидкий старт

### 1. Встановлення залежностей

```bash
# Кореневі залежності
npm install

# Залежності сервера
cd server && npm install

# Залежності клієнта
cd ../client && npm install
```

### 2. Налаштування бази даних

Встановіть PostgreSQL та створіть базу даних:

```bash
# Після встановлення PostgreSQL
psql -U postgres
CREATE DATABASE shop_db;
\q
```

### 3. Налаштування .env

**server/.env:**
```env
PORT=5000
NODE_ENV=development

DATABASE_URL="postgresql://postgres:ВАШ_ПАРОЛЬ@localhost:5432/shop_db?schema=public"

JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

CLIENT_URL=http://localhost:3000

ADMIN_EMAIL=admin@shop.com
ADMIN_PASSWORD=Admin123!
```

**client/.env.local:**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 4. Ініціалізація бази даних

```bash
cd server
npm run prisma:generate
npm run prisma:migrate
npm run seed
```

### 5. Запуск проекту

```bash
# З кореневої папки
npm run dev
```

**Frontend:** http://localhost:3000  
**Backend:** http://localhost:5000/api  
**Адмінка:** http://localhost:3000/admin

---

## 🔐 Доступ адміністратора

- **Email:** `admin@shop.com`
- **Пароль:** `Admin123!`

---

## 📦 Функціонал адмін-панелі

### Авторизація
- Вхід за email та паролем
- JWT токени
- Перевірка ролі ADMIN

### Управління товарами
- ✅ Додати новий товар
- ✅ Редагувати існуючий товар
- ✅ Видалити товар
- ✅ Завантажити зображення
- ✅ Змінити ціну, назву, опис
- ✅ Керування залишками
- ✅ Активувати/деактивувати товар

### Зображення
- Завантаження через drag & drop
- Попередній перегляд
- Автоматичне стиснення
- Зберігання локально або в Cloudinary

---

## 🎨 Дизайн

- Тёмна тема
- Premium tech стиль
- Glassmorphism елементи
- Сине-фіолетові акценти
- Плавні анімації
- Повна адаптивність

---

## 🛠️ Технології

### Backend
- Node.js + Express
- Prisma ORM
- PostgreSQL
- JWT
- bcryptjs
- express-fileupload

### Frontend
- Next.js 14
- React
- TypeScript
- Tailwind CSS
- Zustand
- React Hook Form
- React Hot Toast

---

## 📁 Структура проекту

```
shop-mvp/
├── server/
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── prisma/
│   │   └── server.ts
│   └── prisma/
│       └── schema.prisma
├── client/
│   └── src/
│       ├── app/
│       │   ├── admin/
│       │   ├── catalog/
│       │   ├── contacts/
│       │   └── ...
│       └── components/
└── README.md
```

---

## 🔒 Безпека

- Хешування паролів (bcrypt, 12 раундів)
- JWT токени з expiration
- Захист адмін-роутів
- Валідація даних (Zod)
- CORS налаштування
- Rate limiting
- Helmet.js заголовки

---

## 🚢 Деплой

### Railway

1. Створіть PostgreSQL базу на Railway
2. Отримайте DATABASE_URL
3. Оновіть server/.env
4. Задеплойте backend:
   - Root: `server`
   - Build: `npm install && npm run prisma:generate && npm run build`
   - Start: `npx prisma migrate deploy && node dist/server.js`
5. Задеплойте frontend:
   - Root: `client`
   - Build: `npm install && npm run build`
   - Start: `npm run start`

---

## 📝 API Endpoints

### Auth
- POST `/api/auth/register` - Реєстрація
- POST `/api/auth/login` - Вхід
- GET `/api/auth/profile` - Профіль

### Products
- GET `/api/products` - Список товарів
- GET `/api/products/:id` - Деталі товару
- POST `/api/products` - Створити (ADMIN)
- PUT `/api/products/:id` - Оновити (ADMIN)
- DELETE `/api/products/:id` - Видалити (ADMIN)

### Orders
- POST `/api/orders` - Створити замовлення
- GET `/api/orders` - Список (ADMIN)
- PATCH `/api/orders/:id/status` - Статус (ADMIN)

---

## 💡 Майбутні покращення

- [ ] Платіжна система (Stripe/CloudPayments)
- [ ] Telegram сповіщення
- [ ] Email розсилка
- [ ] Аналітика продажів
- [ ] Export замовлень (CSV/XLSX)
- [ ] Multiple images per product
- [ ] Product categories
- [ ] Reviews & ratings

---

## 📞 Контакти

- **Email:** support@goodsxp.store
- **Telegram:** @goodsxp

---

© 2026 GoodsXP. Всі права захищено.
