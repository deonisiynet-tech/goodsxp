# 🛒 ШПАРГАЛКА: Сторінка товару

## ✅ Що вже працює

| Функція | Статус | Файл |
|---------|--------|------|
| Динамічний маршрут `/catalog/[slug]` | ✅ | `client/src/app/catalog/[id]/page.tsx` |
| Отримання товару по slug | ✅ | `server/src/services/product.service.ts` |
| Середній рейтинг | ✅ | Автоматично з Review |
| Кількість відгуків | ✅ | `product.reviewCount` |
| Сортировка відгуків | ✅ | Найновіші/Найкращі/Найгірші |
| Форма відгуків | ✅ | Модалка на сторінці товару |
| Знижки (стара ціна) | ✅ | `discountPrice` + `originalPrice` |
| Бейджі | ✅ | `isFeatured`, `isPopular`, `-X%` |
| Галерея фото | ✅ | З стрілками та thumbnails |

---

## 🔧 ВИРІШЕННЯ ПРОБЛЕМ

### 1. "Хіт продаж" застряг (не зникає)

**Проблема:** `isFeatured = true` не знімається в адмінці

**Рішення:** В адмін панель → Редагування товару → зніміть галочку "Хіт" → Збережіть

Якщо не працює, перевірте `server/src/controllers/product.controller.ts`:

```typescript
// Рядок 147-148
if (isFeatured !== undefined) updateData.isFeatured = isFeatured === 'true' || isFeatured === true;
if (isPopular !== undefined) updateData.isPopular = isPopular === 'true' || isPopular === true;
```

### 2. Товар не відкривається (нескінченна загрузка)

**Причина:** Міграція БД не виконана (немає поля `slug`)

**Рішення:** Виконайте SQL на Railway:

```sql
-- Скопіюйте з server/prisma/add-slug-migration.sql
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "slug" TEXT;
-- ... (весь SQL з файлу)
```

### 3. Відгуки не сортуються

**Перевірте:** `client/src/app/catalog/[id]/page.tsx` рядок 67:

```typescript
useEffect(() => {
  if (product) {
    loadReviews(product.id);
  }
}, [product, sortBy]); // ← sortBy має бути в залежностях
```

### 4. Знижка не відображається

**Умови:**
- `originalPrice` має бути > 0
- `discountPrice` має бути < `originalPrice`
- Обидва поля мають бути заповнені

**Приклад:**
```
Price: 1000 ₴
Original Price: 1500 ₴
Discount Price: 1200 ₴
↓
Відображається: 1200 ₴ (стара 1500 ₴)
Знижка: -20%
```

---

## 📊 API ЗАПИТИ

### Отримати товар по slug

```typescript
const product = await productsApi.getBySlug('smartphone-apple-iphone-15');
// Поверне: { id, slug, title, price, averageRating, reviewCount, ... }
```

### Отримати відгуки

```typescript
const reviews = await productsApi.getReviews(productId, 'best');
// sortBy: 'newest' | 'best' | 'worst'
```

### Додати відгук

```typescript
await productsApi.createReview(productId, {
  name: 'Іван',
  rating: 5,
  comment: 'Чудовий товар!'
});
```

---

## 🎨 UI КОМПОНЕНТИ

### Зірки рейтингу

```typescript
const renderStars = (rating: number, size: number = 16) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star key={star} size={size} className={`${
        star <= rating ? 'fill-yellow-500 text-yellow-500' : 'fill-gray-600 text-gray-600'
      }`} />
    ))}
  </div>
);

// Використання
{renderStars(Math.round(product.averageRating || 0), 18)}
<span>{product.averageRating?.toFixed(1) || '0.0'} з 5</span>
<span>({product.reviewCount || 0} відгуків)</span>
```

### Бейджі

```typescript
<div className="flex flex-wrap gap-2 mb-4">
  {product.isFeatured && (
    <span className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-bold rounded-lg shadow-lg">
      🔥 Хіт продажу
    </span>
  )}
  {product.isPopular && (
    <span className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold rounded-lg shadow-lg">
      ⭐ Популярний
    </span>
  )}
  {discountPercent > 0 && (
    <span className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-bold rounded-lg shadow-lg">
      -{discountPercent}% Знижка
    </span>
  )}
</div>
```

### Знижка

```typescript
const discountPercent = product.discountPrice && product.originalPrice
  ? Math.round((1 - product.discountPrice / product.originalPrice) * 100)
  : 0;

// UI
{product.discountPrice && product.originalPrice ? (
  <div className="flex items-baseline gap-4">
    <span className="text-4xl font-bold text-white">
      {Number(product.discountPrice).toLocaleString('uk-UA')} ₴
    </span>
    <span className="text-xl text-[#9ca3af] line-through">
      {Number(product.originalPrice).toLocaleString('uk-UA')} ₴
    </span>
  </div>
) : (
  <p className="text-4xl font-light text-white">
    {Number(product.price).toLocaleString('uk-UA')} ₴
  </p>
)}
```

---

## 🚀 РОЗГОРТАННЯ

### 1. Міграція БД (обов'язково!)

```bash
# Підключіться до Railway PostgreSQL через DBeaver
# Виконайте: server/prisma/add-slug-migration.sql
```

### 2. Збірка

```bash
# Server
cd server && npm run build

# Client
cd client && npm run build
```

### 3. Git push

```bash
git add .
git commit -m "feat: full product page with reviews and ratings"
git push
```

---

## 📁 КОРИСНІ ФАЙЛИ

| Файл | Для чого |
|------|----------|
| `FULL_PRODUCT_PAGE_SOLUTION.md` | Повна інструкція |
| `client/src/app/catalog/[id]/page.tsx` | Сторінка товару |
| `server/src/services/product.service.ts` | API товарів |
| `server/prisma/add-slug-migration.sql` | Міграція БД |
| `ENV_SINGLE_CONFIG.md` | Налаштування .env |

---

## ❓ FAQ

**Q: Як змінити URL з `/catalog/[id]` на `/product/[slug]`?**  
A: Перемістіть папку `[id]` в `client/src/app/product/[slug]` і оновіть посилання в CatalogContent.tsx

**Q: Чи можна додати фото до відгуків?**  
A: Так, потрібно додати поле `images: String[]` в модель Review і оновити форму

**Q: Як модерувати відгуки?**  
A: Додайте поле `isApproved: Boolean @default(false)` і фільтруйте при відображенні

**Q: Чому рейтинг не перераховується після додавання відгуку?**  
A: Функція `loadProduct(product.slug)` викликається після `submitReview` - перевірте консоль на помилки
