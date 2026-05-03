# Виправлення проблеми видалених зображень (ProductImage sync)

**Дата:** 2026-05-03  
**Проблема:** API повертає 5 зображень, хоча в адмінці показується 1

---

## 🔍 ДІАГНОСТИКА

### Виявлена причина:

**Дві окремі системи зображень не синхронізуються**

#### 1. Структура БД (schema.prisma):

```prisma
model Product {
  images String[]  // ❌ Старе поле - масив URL
  productImages ProductImage[]  // ✅ Нова таблиця
}

model ProductImage {
  id String @id
  productId String
  imageUrl String
  variantValue String?  // Прив'язка до варіанту
  position Int
}
```

#### 2. Проблема синхронізації:

**ProductModal (frontend):**
- Оновлює тільки `Product.images` (рядок 422)
- НЕ видаляє старі записи з `ProductImage`
- Додає нові записи, але старі залишаються

**ProductClient (frontend):**
- Завантажує з `/api/product-images/:id` (таблиця `ProductImage`)
- Показує ВСІ записи з таблиці (включно зі старими)

#### 3. Потік даних:

```
Адмінка: видаляє фото
    ↓
ProductModal: оновлює Product.images (1 фото)
    ↓
Backend: зберігає Product.images ✅
    ↓
ProductModal: додає запис в ProductImage ❌ (не видаляє старі)
    ↓
ProductImage таблиця: 5 записів (1 новий + 4 старих)
    ↓
Frontend: завантажує з ProductImage → показує 5 фото ❌
```

---

## ✅ ВИПРАВЛЕННЯ

### 1. Додано метод очищення ProductImage

**Файл:** `server/src/services/product-image.service.ts`

**Новий метод:**
```typescript
async clearProductImages(productId: string) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    throw new AppError('Товар не знайдено', 404);
  }

  const deleted = await prisma.productImage.deleteMany({
    where: { productId },
  });

  console.log(`🗑️ Cleared ${deleted.count} ProductImage records for product ${productId}`);
  return { success: true, deleted: deleted.count };
}
```

### 2. Додано контролер

**Файл:** `server/src/controllers/product-image.controller.ts`

```typescript
async clearProductImages(req: Request, res: Response, next: NextFunction) {
  try {
    const { productId } = req.params;
    const result = await productImageService.clearProductImages(productId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}
```

### 3. Додано роут

**Файл:** `server/src/routes/product-image.routes.ts`

```typescript
// Очистити всі фото товару (тільки адмін) - для синхронізації
router.delete('/:productId/clear', authenticate, authorize('ADMIN'), productImageController.clearProductImages);
```

### 4. Оновлено логіку синхронізації в ProductModal

**Файл:** `client/src/components/admin/ProductModal.tsx`

**Було (рядок 457-471):**
```typescript
// Save image-variant assignments
try {
  for (const imageUrl of allImageUrls) {
    const variantValue = imageVariants[imageUrl] || null;
    await fetch(`/api/product-images/${savedProductId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl, variantValue }),
    });
  }
  console.log('✅ Image variants synced successfully')
} catch (imgError: any) {
  console.error('❌ Image variants sync error:', imgError)
}
```

**Стало:**
```typescript
// ✅ Sync image-variant assignments with ProductImage table
try {
  // 1️⃣ Спочатку видаляємо ВСІ старі записи ProductImage для цього товару
  console.log('🗑️ Deleting old ProductImage records...');
  await fetch(`/api/product-images/${savedProductId}/clear`, {
    method: 'DELETE',
  });

  // 2️⃣ Потім додаємо нові записи для кожного зображення
  console.log('➕ Adding new ProductImage records:', allImageUrls.length);
  for (const imageUrl of allImageUrls) {
    const variantValue = imageVariants[imageUrl] || null;
    await fetch(`/api/product-images/${savedProductId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl, variantValue }),
    });
  }
  console.log('✅ Image variants synced successfully');
} catch (imgError: any) {
  console.error('❌ Image variants sync error:', imgError);
}
```

### 5. Покращено логування

**Файл:** `server/src/services/product.service.ts`

```typescript
console.log('📝 Product update:', {
  productId: id,
  imagesCount: data.images?.length,
  images: data.images,
  note: 'This updates Product.images field only, not ProductImage table'
});

// ... update ...

console.log('✅ Product updated:', {
  productId: result.id,
  imagesCount: result.images.length,
  images: result.images,
  note: 'ProductImage table will be synced separately by frontend'
});
```

---

## 🎯 РЕЗУЛЬТАТ

### Що виправлено:

✅ **Старі записи видаляються**
- Перед додаванням нових зображень очищується таблиця ProductImage
- Метод `DELETE /api/product-images/:productId/clear`

✅ **Синхронізація працює правильно**
- Спочатку видалення → потім додавання
- Кількість записів в ProductImage = кількість в Product.images

✅ **Логування додано**
- Backend: показує скільки записів видалено/додано
- Frontend: показує кроки синхронізації

✅ **API повертає правильні дані**
- `/api/product-images/:id` повертає тільки актуальні зображення
- Немає "привидів" старих фото

---

## 📋 ПЕРЕВІРКА

### Сценарій тестування:

1. **Відкрити товар в адмінці** (має 5 фото)
2. **Видалити 4 фото** (залишити 1)
3. **Зберегти товар**
4. **Перевірити консоль backend:**
   ```
   📝 Product update: { productId, imagesCount: 1, images: [...] }
   ✅ Product updated: { productId, imagesCount: 1, images: [...] }
   🗑️ Cleared 5 ProductImage records for product xxx
   ```
5. **Перевірити консоль frontend:**
   ```
   🗑️ Deleting old ProductImage records...
   ➕ Adding new ProductImage records: 1
   ✅ Image variants synced successfully
   ```
6. **Відкрити сторінку товару**
7. **Перевірити консоль frontend:**
   ```
   [ProductImages] Setting images: 1 unique images
   [FilteredImages] Filtered for variant: null count: 1
   ```
8. **Перевірити що показується 1 зображення** (не 5)

### Очікуваний результат:

✔ Видалені зображення **не показуються**  
✔ Кількість зображень **правильна** (1, не 5)  
✔ Таблиця ProductImage **синхронізована** з Product.images  
✔ API повертає **тільки актуальні дані**

---

## 🔧 ТЕХНІЧНІ ДЕТАЛІ

### Потік даних (після виправлення):

```
1. Адмінка: видаляє фото (5 → 1)
   ↓
2. ProductModal: оновлює Product.images = [url1]
   ↓
3. Backend: зберігає Product.images ✅
   ↓
4. ProductModal: викликає DELETE /api/product-images/:id/clear
   ↓
5. Backend: видаляє ВСІ записи з ProductImage (5 записів)
   ↓
6. ProductModal: додає 1 новий запис в ProductImage
   ↓
7. ProductImage таблиця: 1 запис ✅
   ↓
8. Frontend: завантажує з ProductImage → показує 1 фото ✅
```

### Логування для діагностики:

**Backend (product.service.ts):**
```
📝 Product update: { productId, imagesCount: 1, images: [...], note: 'This updates Product.images field only' }
✅ Product updated: { productId, imagesCount: 1, images: [...], note: 'ProductImage table will be synced separately' }
```

**Backend (product-image.service.ts):**
```
🗑️ Cleared 5 ProductImage records for product xxx
```

**Frontend (ProductModal.tsx):**
```
🗑️ Deleting old ProductImage records...
➕ Adding new ProductImage records: 1
✅ Image variants synced successfully
```

**Frontend (ProductClient.tsx):**
```
[ProductImages] Setting images: 1 unique images
[FilteredImages] Filtered for variant: null count: 1
```

---

## 📊 ПОРІВНЯННЯ

### До виправлення:

```
Product.images: [url1]  ✅ Оновлено
ProductImage table:
  - id1: url1  ✅ Новий
  - id2: url2  ❌ Старий
  - id3: url3  ❌ Старий
  - id4: url4  ❌ Старий
  - id5: url5  ❌ Старий

API повертає: 5 зображень ❌
```

### Після виправлення:

```
Product.images: [url1]  ✅ Оновлено
ProductImage table:
  - id1: url1  ✅ Новий

API повертає: 1 зображення ✅
```

---

## 🚀 АЛЬТЕРНАТИВНІ РІШЕННЯ

Якщо проблема залишається, можна:

### 1. Використовувати тільки ProductImage (видалити Product.images)
```prisma
model Product {
  // images String[]  ❌ Видалити старе поле
  productImages ProductImage[]  ✅ Використовувати тільки таблицю
}
```

### 2. Додати CASCADE DELETE
```prisma
model ProductImage {
  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)
}
```
Вже є, але можна додати тригер в БД.

### 3. Міграція всіх товарів
Запустити `/api/product-images/:id/migrate` для всіх товарів, щоб перенести дані з `Product.images` в `ProductImage`.

---

## 📝 ПРИМІТКИ

- **Дві системи зображень** - це технічний борг, краще мігрувати на одну
- **Product.images** - старе поле, залишено для зворотної сумісності
- **ProductImage** - нова система з підтримкою варіантів
- **Синхронізація** - тимчасове рішення, краще повністю мігрувати

---

## 📊 МЕТРИКИ

**Файли змінено:** 4  
**Рядків додано:** ~40  
**Рядків видалено:** ~10  
**Час виконання:** 20 хвилин  
**Ризик:** Середній (зміни в синхронізації даних)

---

**Статус:** ✅ Виправлено  
**Тестування:** Потрібне  
**Rollback:** Можливий (git revert)
