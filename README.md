# GoodsXP | Інтернет-магазин електроніки

Сучасний інтернет-магазин електроніки з адмін-панеллю, готовий до деплою на Railway.

## 🚀 Стек технологій

### Backend
- **Node.js** + **Express** - REST API сервер
- **Prisma ORM** - робота з базою даних
- **PostgreSQL** - основна база даних
- **JWT** - автентифікація та авторизація
- **bcryptjs** - хешування паролів
- **Cloudinary** - зберігання зображень (опціонально)
- **Zod** - валідація даних
- **Helmet + CORS + Rate Limiting** - безпека

### Frontend
- **Next.js 14** - React фреймворк
- **TypeScript** - типізація
- **Tailwind CSS** - стилізація
- **Zustand** - управління станом (кошик)
- **React Hook Form** - форми
- **React Hot Toast** - сповіщення
- **Axios** - HTTP клієнт

## 📁 Структура проекту

```
shop-mvp/
├── server/                 # Backend
│   ├── src/
│   │   ├── controllers/   # Контролери
│   │   ├── services/      # Бізнес-логіка
│   │   ├── routes/        # Маршрути API
│   │   ├── middleware/    # Middleware (auth, upload, errors)
│   │   ├── prisma/        # Prisma клієнт і seed
│   │   ├── utils/         # Утиліти та валідатори
│   │   └── server.ts      # Точка входу
│   ├── prisma/
│   │   └── schema.prisma  # Схема БД
│   └── package.json
├── client/                # Frontend
│   ├── src/
│   │   ├── app/          # Next.js App Router
│   │   ├── components/   # React компоненти
│   │   ├── lib/          # API клієнт, store
│   │   └── ...
│   └── package.json
├── docker-compose.yml     # Docker конфігурація
└── README.md
```

## 🛠️ Встановлення та запуск

### Вимоги
- Node.js 18+
- PostgreSQL 15+
- npm або yarn

### 1. Встановлення залежностей

```bash
cd shop-mvp

# Встановлення залежностей для всіх проектів
npm run install:all

# Або окремо:
cd server && npm install
cd ../client && npm install
```

### 2. Налаштування змінних оточення

#### Backend (.env у папці server/)
```env
PORT=5000
NODE_ENV=development

DATABASE_URL="postgresql://postgres:ВАШ_ПАРОЛЬ@localhost:5432/shop_db?schema=public"

JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

REDIS_URL=redis://localhost:6379

CLIENT_URL=http://localhost:3000

ADMIN_EMAIL=admin@shop.com
ADMIN_PASSWORD=Admin123!
```

#### Frontend (.env.local у папці client/)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 3. Запуск бази даних

```bash
# Через Docker (рекомендується)
docker-compose up -d postgres

# Або локально встановіть PostgreSQL
```

### 4. Міграції та seed даних

```bash
cd server

# Генерація Prisma клієнта
npm run prisma:generate

# Застосування міграцій
npm run prisma:migrate

# Створення адміна та тестових товарів
npm run seed
```

### 5. Запуск проекту

```bash
# Запуск обох серверів одночасно (з кореня)
npm run dev

# Або окремо:
npm run dev:server  # Backend на http://localhost:5000
npm run dev:client  # Frontend на http://localhost:3000
```

## 📦 API Endpoints

### Аутентифікація
| Метод | Endpoint | Опис |
|-------|----------|------|
| POST | `/api/auth/register` | Реєстрація користувача |
| POST | `/api/auth/login` | Вхід в систему |
| GET | `/api/auth/profile` | Отримання профілю (потрібен auth) |

### Товари (публічні)
| Метод | Endpoint | Опис |
|-------|----------|------|
| GET | `/api/products` | Список товарів (з пагінацією) |
| GET | `/api/products/:id` | Деталі товару |

### Товари (адмін)
| Метод | Endpoint | Опис |
|-------|----------|------|
| GET | `/api/products/admin/all` | Всі товари (адмін) |
| POST | `/api/products` | Створити товар |
| PUT | `/api/products/:id` | Оновити товар |
| DELETE | `/api/products/:id` | Видалити товар |

### Замовлення
| Метод | Endpoint | Опис |
|-------|----------|------|
| POST | `/api/orders` | Створити замовлення |
| GET | `/api/orders/:id` | Деталі замовлення |
| GET | `/api/orders` | Список замовлень (адмін) |
| PATCH | `/api/orders/:id/status` | Змінити статус (адмін) |
| DELETE | `/api/orders/:id` | Видалити замовлення (адмін) |
| GET | `/api/orders/admin/stats` | Статистика (адмін) |

## 🔐 Доступ адміністратора

Після виконання seed скрипту:
- **Email:** `goodsxp.net@gmail.com`
- **Пароль:** `uR4!xZ9@pL2#vQ7$tM8^kW3&cN1*eH5%`

## 🌐 Сторінки сайту

### Публічні
- **Головна** - банер, популярні товари, переваги
- **Каталог** - всі товари з фільтрами та пошуком
- **Товар** - детальна сторінка з галереєю
- **Кошик** - перегляд та редагування замовлення
- **Оформлення** - форма оформлення замовлення
- **Доставка** - інформація про доставку
- **Оплата** - способи оплати
- **Гарантія** - гарантійні умови
- **Контакти** - контактна інформація та форма

### Адмін-панель
- **Огляд** - статистика та швидкі дії
- **Товари** - CRUD товарів
- **Замовлення** - управління замовленнями

## 🎨 Дизайн

- **Чорно-біла кольорова гама**
- **Мінімалізм**
- **Сучасний стиль електроніки**
- **Адаптивність (mobile-first)**
- **Плавні анімації та переходи**

## 🚢 Деплой на Railway

### 1. Підготовка бази даних

1. Створіть новий проект на Railway
2. Додайте PostgreSQL базу даних
3. Скопіюйте `DATABASE_URL` зі змінних оточення

### 2. Деплой backend

1. Створіть новий сервіс на Railway
2. Підключіть ваш GitHub репозиторій
3. Вкажіть кореневу директорію: `server`
4. Build Command: `npm install && npm run prisma:generate && npm run build`
5. Start Command: `npx prisma migrate deploy && node dist/server.js`
6. Додайте змінні оточення:
   ```
   DATABASE_URL=your-railway-postgres-url
   JWT_SECRET=your-secret-key
   CLIENT_URL=https://your-frontend-url.railway.app
   NODE_ENV=production
   ```

### 3. Деплой frontend

1. Створіть новий сервіс на Railway
2. Підключіть ваш GitHub репозиторій
3. Вкажіть кореневу директорію: `client`
4. Build Command: `npm install && npm run build`
5. Start Command: `npm run start`
6. Додайте змінні оточення:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app/api
   ```

### 4. Ініціалізація бази даних

Після першого деплою backend виконайте seed:
```bash
# Через Railway CLI
railway run npm run seed
```

## 🐳 Docker запуск

```bash
# Збірка та запуск всіх сервісів
docker-compose up --build

# Запуск у фоновому режимі
docker-compose up -d

# Зупинка
docker-compose down

# Зупинка з видаленням даних
docker-compose down -v
```

## 📊 База даних

### Таблиці

**User** - користувачі
- id, email, password, role (USER/ADMIN), createdAt, updatedAt

**Product** - товари
- id, title, description, price, imageUrl, images[], stock, isActive, createdAt, updatedAt

**Order** - замовлення
- id, name, phone, email, address, totalPrice, status, comment, createdAt, updatedAt

**OrderItem** - позиції замовлення
- id, orderId, productId, quantity, price

### Індекси
- User: email, role
- Product: isActive, createdAt, title
- Order: status, createdAt, email
- OrderItem: orderId, productId

## 🔒 Безпека

- ✅ Хешування паролів (bcrypt, 12 раундів)
- ✅ JWT токени з expiration
- ✅ Захист адмін-роутів middleware
- ✅ Валідація всіх вхідних даних (Zod)
- ✅ CORS налаштування
- ✅ Rate limiting (100 запитів/15 хв)
- ✅ Helmet.js заголовки безпеки
- ✅ Захист від SQL-ін'єкцій через Prisma ORM

## 📈 Масштабованість

- Модульна архітектура (controllers → services → routes)
- Пагінація на всіх списках
- Індекси в базі даних
- Опціональне кешування через Redis
- Легко додати:
  - Платежі (Stripe/CloudPayments)
  - Сповіщення (Telegram/Email)
  - Аналітику

## 🎯 Функціонал

### Для покупців
- ✅ Перегляд каталогу товарів
- ✅ Пошук товарів
- ✅ Фільтрація за ціною
- ✅ Сторінка товару з галереєю
- ✅ Кошик зі збереженням між сесіями
- ✅ Оформлення замовлення
- ✅ Реєстрація та вхід

### Для адміністратора
- ✅ Панель керування зі статистикою
- ✅ CRUD товарів з завантаженням зображень
- ✅ Управління замовленнями
- ✅ Зміна статусів замовлень
- ✅ Перегляд деталей замовлення

## 💰 Валюта

Всі ціни вказані в **гривнях (₴)**

## 📝 Ліцензія

MIT

## 👥 Контакти

Для питань та пропозицій створюйте Issues в репозиторії.
