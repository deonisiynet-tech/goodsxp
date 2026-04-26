# Тест системи прав доступу для відгуків

## ✅ Що виправлено:

### 1. POST /api/reviews (створення відгуку)
- ✅ Доступ для ВСІХ користувачів (без авторизації)
- ✅ Rate limit: 20 відгуків за 15 хвилин
- ✅ CSRF exempt (не потрібен токен)
- ✅ Підтримка завантаження фото (до 5 шт, макс 5MB кожне)

### 2. DELETE /api/products/reviews/:reviewId (видалення)
- ✅ Тільки для ADMIN
- ✅ Вимагає authenticate + authorize(Role.ADMIN)

### 3. GET /api/products/:id/reviews (перегляд)
- ✅ Відкритий доступ для всіх

## 📍 Доступні endpoint'и для створення відгуків:

```bash
# 1. Через окремий роут (рекомендовано)
POST /api/reviews
Body: { productId, name, rating, text, pros?, cons?, images? }

# 2. Через product ID
POST /api/products/:id/reviews
Body: { name, rating, comment, pros?, cons?, images? }

# 3. Через product slug
POST /api/products/slug/:slug/reviews
Body: { name, rating, comment, pros?, cons?, images? }
```

## 🧪 Тестування:

```bash
# Тест 1: Створення відгуку без авторизації (має працювати)
curl -X POST http://localhost:3000/api/reviews \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "YOUR_PRODUCT_ID",
    "name": "Тестовий користувач",
    "rating": 5,
    "text": "Чудовий товар!"
  }'

# Очікуваний результат: 201 Created

# Тест 2: Видалення відгуку без авторизації (має бути 401)
curl -X DELETE http://localhost:3000/api/products/reviews/REVIEW_ID

# Очікуваний результат: 401 Unauthorized

# Тест 3: Видалення відгуку з admin токеном (має працювати)
curl -X DELETE http://localhost:3000/api/products/reviews/REVIEW_ID \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Очікуваний результат: 200 OK
```

## 🔒 Захист від спаму:

- Rate limiter: 20 відгуків за 15 хвилин на IP
- Валідація: рейтинг 1-5, обов'язкове ім'я
- Обмеження фото: макс 5 шт, кожне до 5MB
- Дозволені формати: JPG, PNG, WebP

## 📝 Зміни в коді:

1. **server/src/routes/product.routes.ts**
   - Перемістив DELETE /reviews/:reviewId ПЕРЕД admin middleware
   - Додав authenticate + authorize безпосередньо до DELETE роуту

2. **server/src/routes/review.routes.ts**
   - Видалив csrfProtection з POST роуту
   - Залишив тільки reviewRateLimiter + uploadMiddleware

3. **server/src/middleware/csrf.ts**
   - Додав '/api/reviews' до CSRF_EXEMPT_PATHS
