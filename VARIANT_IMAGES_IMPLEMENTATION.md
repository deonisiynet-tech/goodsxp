# ✅ Система прив'язки фото до варіантів товару

**Дата:** 2026-04-21  
**Статус:** Завершено

---

## 📋 Що було реалізовано

Додано систему прив'язки фотографій до конкретних варіантів товару (як у Shopify).

### Основні можливості:

1. ✅ Кожне фото може бути прив'язане до конкретного варіанту
2. ✅ Фото без прив'язки показуються для всіх варіантів
3. ✅ Автоматичне перемикання галереї при виборі варіанту
4. ✅ UI в адмінці для управління прив'язками
5. ✅ Зворотна сумісність з існуючими товарами

---

## 🗄️ Зміни в базі даних

### Нова таблиця: ProductImage

```prisma
model ProductImage {
  id           String   @id @default(uuid())
  productId    String
  imageUrl     String
  variantValue String?  // null = для всіх варіантів
  position     Int      @default(0)
  createdAt    DateTime @default(now())
  product      Product  @relation(...)
}
```

**Приклад даних:**

| imageUrl | variantValue |
|----------|--------------|
| black1.jpg | black |
| black2.jpg | black |
| white1.jpg | white |
| white2.jpg | white |
| universal.jpg | null |

---

## 🔧 Backend API

### Нові ендпоінти:

```
GET    /api/product-images/:productId
GET    /api/product-images/:productId/variant?variantValue=black
POST   /api/product-images/:productId
PATCH  /api/product-images/:imageId/variant
DELETE /api/product-images/:imageId
PUT    /api/product-images/:productId/positions
POST   /api/product-images/:productId/migrate
```

### Приклад використання:

```typescript
// Додати фото для варіанту "black"
POST /api/product-images/abc123
{
  "imageUrl": "https://cloudinary.com/black1.jpg",
  "variantValue": "black"
}

// Отримати фото для варіанту
GET /api/product-images/abc123/variant?variantValue=black
```

---

## 🎨 Адмінка

### Як використовувати:

1. Відкрити товар в адмінці
2. Завантажити фото
3. Під кожним фото з'явиться dropdown:
   - **"Для всіх варіантів"** - фото показується завжди
   - **"Колір: Чорний"** - фото тільки для чорного кольору
   - **"Колір: Білий"** - фото тільки для білого кольору

### Скріншот UI:

```
┌─────────────────┐
│   [Фото 1]      │
│                 │
└─────────────────┘
┌─────────────────┐
│ Варіант:        │
│ [▼ Для всіх]    │ ← Dropdown
└─────────────────┘
```

---

## 🌐 Frontend (сторінка товару)

### Логіка роботи:

1. Користувач відкриває товар
2. Завантажуються всі фото з API
3. При виборі варіанту:
   - Фільтруються фото (universal + variant-specific)
   - Галерея автоматично показує перше фото варіанту
   - Мініатюри оновлюються

### Приклад:

```
Товар має:
- 4 фото "black"
- 4 фото "white"
- 2 універсальні фото

Користувач обирає "White":
→ Показується: 2 універсальні + 4 white = 6 фото
→ Галерея переключається на перше white фото
```

---

## 📦 Міграція існуючих товарів

### Автоматична міграція:

```bash
cd server
npx tsx scripts/migrate-product-images.ts
```

Скрипт:
- Знаходить всі товари з фото
- Створює записи ProductImage з variantValue=null
- Пропускає вже мігровані товари

### Ручна міграція через API:

```bash
POST /api/product-images/:productId/migrate
```

---

## 🔄 Зворотна сумісність

### Якщо ProductImage порожня:

Frontend автоматично використовує `Product.images` як fallback.

### Існуючі товари:

Працюють як раніше, поки не запустити міграцію.

---

## 🧪 Тестування

### Тест 1: Створення товару з варіантами

1. Створити товар
2. Додати опцію "Колір" з значеннями "Чорний", "Білий"
3. Завантажити 4 фото
4. Прив'язати 2 фото до "Чорний", 2 до "Білий"
5. Зберегти

**Очікуваний результат:**
- Фото збережені в ProductImage
- Прив'язки збережені

### Тест 2: Перемикання варіантів на сайті

1. Відкрити товар з варіантами
2. Обрати "Чорний"
3. Перевірити галерею

**Очікуваний результат:**
- Показуються тільки фото "Чорний" + універсальні
- Галерея на першому фото варіанту

### Тест 3: Товар без варіантів

1. Відкрити товар без варіантів
2. Перевірити галерею

**Очікуваний результат:**
- Показуються всі фото
- Працює як раніше

---

## 📊 Статистика змін

**Файлів створено:** 4
- `server/src/services/product-image.service.ts`
- `server/src/controllers/product-image.controller.ts`
- `server/src/routes/product-image.routes.ts`
- `server/scripts/migrate-product-images.ts`

**Файлів змінено:** 4
- `server/prisma/schema.prisma` - додано ProductImage
- `server/src/server.ts` - підключено роути
- `client/src/components/admin/ProductModal.tsx` - UI для прив'язки
- `client/src/app/catalog/[slug]/ProductClient.tsx` - логіка перемикання

**Рядків коду:** ~400

---

## 🚀 Деплой

### Крок 1: Оновити базу даних

```bash
cd server
npx prisma db push
```

### Крок 2: Мігрувати існуючі фото

```bash
npx tsx scripts/migrate-product-images.ts
```

### Крок 3: Перезапустити сервер

```bash
npm run build
npm start
```

---

## 🎯 Як це працює (технічно)

### 1. Адмін завантажує фото:

```typescript
// ProductModal.tsx
const imageVariants = { 
  "black1.jpg": "black",
  "white1.jpg": "white" 
}

// При збереженні товару:
for (const imageUrl of allImages) {
  await fetch(`/api/product-images/${productId}`, {
    method: 'POST',
    body: JSON.stringify({ 
      imageUrl, 
      variantValue: imageVariants[imageUrl] 
    })
  })
}
```

### 2. Frontend завантажує фото:

```typescript
// ProductClient.tsx
const [productImages, setProductImages] = useState([])
const [filteredImages, setFilteredImages] = useState([])

useEffect(() => {
  // Завантажити всі фото
  const images = await fetch(`/api/product-images/${productId}`)
  setProductImages(images)
}, [productId])

useEffect(() => {
  // Фільтрувати за варіантом
  const filtered = productImages.filter(img => 
    !img.variantValue || img.variantValue === selectedVariantValue
  )
  setFilteredImages(filtered)
  setSelectedImage(0) // Перше фото варіанту
}, [selectedVariant])
```

### 3. Галерея показує filteredImages:

```typescript
const effectiveImage = filteredImages.length > 0
  ? filteredImages
  : product.images // fallback
```

---

## ✅ Результат

Система варіантів з фото працює як у Shopify:

1. ✅ Адмін може прив'язати фото до варіантів
2. ✅ Користувач обирає варіант → фото змінюються миттєво
3. ✅ Без перезавантаження сторінки
4. ✅ Зворотна сумісність з існуючими товарами
5. ✅ Локалізація українською мовою

---

## 🔮 Можливі покращення (опціонально)

1. Bulk upload фото для варіантів
2. Drag & drop для зміни порядку фото
3. Автоматична прив'язка фото за назвою файлу (black1.jpg → black)
4. Попередній перегляд варіантів в адмінці
5. Аналітика: які варіанти найпопулярніші

---

**Система готова до використання!** 🎉
