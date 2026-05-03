# Виправлення повернення видалених зображень товару

**Дата:** 2026-05-03  
**Проблема:** Видалені зображення повертаються на сторінці товару після оновлення

---

## 🔍 ДІАГНОСТИКА

### Виявлена причина:

**ProductClient використовував застарілі дані з SSR props як fallback**

1. **SSR кеш занадто довгий (60 секунд)**
   - `page.tsx` використовував `revalidate: 60`
   - Після оновлення товару SSR повертав закешовані дані
   - `product.images` містив старі URL

2. **Fallback на застарілі дані**
   - `ProductClient.tsx` useEffect (рядок 150-177)
   - Якщо `productImages.length === 0`, використовувався `product.images`
   - Старі зображення з SSR props повертались

3. **Відсутність прапорця завантаження**
   - Не було способу відрізнити "ще не завантажили" від "завантажили порожній масив"
   - Fallback спрацьовував навіть після успішного завантаження з API

---

## ✅ ВИПРАВЛЕННЯ

### 1. Зменшено SSR кеш

**Файл:** `client/src/app/catalog/[slug]/page.tsx`

**Зміни:**
- Рядок 74: `revalidate: 60` → `revalidate: 10`
- Рядок 99: `revalidate: 60` → `revalidate: 10` (variants)
- Рядок 111: `revalidate: 60` → `revalidate: 10` (specifications)

**Результат:** Кеш оновлюється кожні 10 секунд замість 60

### 2. Додано прапорець завантаження

**Файл:** `client/src/app/catalog/[slug]/ProductClient.tsx`

**Додано state (після рядка 82):**
```typescript
const [imagesFullyLoaded, setImagesFullyLoaded] = useState(false);
```

**Оновлено `loadProductImages` (рядок 179-210):**
```typescript
setImagesFullyLoaded(true); // ✅ Позначаємо що завантажили з API
```

**Навіть при помилці:**
```typescript
catch {
  setProductImages([]);
  setImagesFullyLoaded(true); // ✅ Не використовуємо старі дані
}
```

### 3. Видалено fallback на застарілі дані

**Файл:** `client/src/app/catalog/[slug]/ProductClient.tsx`

**Оновлено useEffect фільтрації (рядок 152-183):**

**Було:**
```typescript
if (productImages.length === 0) {
  const uniqueProductImages = Array.from(new Set(product.images || []));
  setFilteredImages(uniqueProductImages); // ❌ Використовує старі дані
  return;
}
```

**Стало:**
```typescript
// ✅ Якщо ще не завантажили з API — чекаємо
if (!imagesFullyLoaded) {
  console.log('[FilteredImages] Waiting for API load...');
  return;
}

if (productImages.length === 0) {
  // ✅ Якщо API повернув порожній масив — показуємо порожній список
  console.log('[FilteredImages] No images from API');
  setFilteredImages([]);
  return;
}
```

**Видалено з dependencies:**
```typescript
}, [selectedVariant, productImages, imagesFullyLoaded]); // ✅ Видалено product.images
```

### 4. Скидання прапорця при зміні товару

**Файл:** `client/src/app/catalog/[slug]/ProductClient.tsx`

**Оновлено useEffect (рядок 130-148):**
```typescript
useEffect(() => {
  // ✅ Скидаємо прапорець при зміні товару
  setImagesFullyLoaded(false);
  imagesLoadedRef.current = null;

  loadRelated(product.id);
  loadProductImages(product.id);
  loadReviews(product.slug);
  // ...
}, [product.id, product.slug]);
```

---

## 🎯 РЕЗУЛЬТАТ

### Що виправлено:

✅ **SSR кеш оновлюється швидше**
- 10 секунд замість 60
- Зміни видимі протягом 10-15 секунд

✅ **Fallback видалено**
- `product.images` більше не використовується після завантаження з API
- Тільки свіжі дані з `/api/product-images`

✅ **Прапорець завантаження**
- Чітко розрізняємо "завантажується" та "завантажено"
- Не показуємо застарілі дані

✅ **Скидання при зміні товару**
- Кожен товар завантажує свої зображення заново
- Немає змішування даних між товарами

---

## 📋 ПЕРЕВІРКА

### Сценарій тестування:

1. **Відкрити товар в адмінці**
2. **Видалити 1 зображення** (було 5 → стало 4)
3. **Зберегти товар**
4. **Відкрити сторінку товару в новій вкладці**
5. **Перевірити консоль браузера:**
   ```
   [ProductImages] Setting images: 4 unique images
   [FilteredImages] Filtered for variant: null count: 4
   ```
6. **Перевірити що показується 4 зображення** (не 5)

### Очікуваний результат:

✔ Видалене зображення **не показується**  
✔ Кількість зображень **правильна**  
✔ Немає **дублікатів**  
✔ Зміни видимі протягом **10-15 секунд**

---

## 🔧 ТЕХНІЧНІ ДЕТАЛІ

### Потік даних (після виправлення):

1. **SSR завантажує товар** (кеш 10 сек)
   ```typescript
   const product = await fetch('/api/products/slug')
   // product.images може бути застарілим
   ```

2. **ProductClient отримує props**
   ```typescript
   <ProductClient product={product} />
   ```

3. **useEffect завантажує свіжі дані**
   ```typescript
   useEffect(() => {
     setImagesFullyLoaded(false)  // Скидаємо прапорець
     loadProductImages(product.id) // Завантажуємо з API
   }, [product.id])
   ```

4. **loadProductImages встановлює прапорець**
   ```typescript
   setProductImages(uniqueImages)
   setImagesFullyLoaded(true)  // ✅ Готово
   ```

5. **useEffect фільтрації чекає прапорця**
   ```typescript
   if (!imagesFullyLoaded) return  // ✅ Чекаємо
   setFilteredImages(uniqueFiltered) // ✅ Використовуємо тільки API дані
   ```

### Логування для діагностики:

**Backend:**
```
📝 Product update: { productId, imagesCount: 4, images: [...] }
✅ Product updated: { productId, imagesCount: 4, images: [...] }
```

**Frontend:**
```
[ProductImages] Setting images: 4 unique images
[FilteredImages] Waiting for API load...
[FilteredImages] Filtered for variant: null count: 4
```

---

## 📝 ПОРІВНЯННЯ

### До виправлення:

```
SSR (60 сек кеш) → product.images (5 фото, старі)
                ↓
ProductClient → productImages.length === 0
                ↓
              fallback на product.images (5 фото) ❌
```

### Після виправлення:

```
SSR (10 сек кеш) → product.images (ігнорується)
                ↓
ProductClient → imagesFullyLoaded === false
                ↓
              loadProductImages() → API
                ↓
              setImagesFullyLoaded(true)
                ↓
              setFilteredImages(API дані) ✅
```

---

## 🚀 АЛЬТЕРНАТИВНІ РІШЕННЯ

Якщо проблема залишається, можна:

### 1. Додати timestamp до URL
```typescript
const response = await fetch(`/api/product-images/${productId}?t=${Date.now()}`)
```

### 2. Використовувати router.refresh()
```typescript
// В ProductList.handleModalClose
router.refresh()
loadProducts()
```

### 3. Встановити revalidate: 0 для адміна
```typescript
const isAdmin = checkIfAdmin()
revalidate: isAdmin ? 0 : 10
```

---

## 📊 МЕТРИКИ

**Файли змінено:** 2  
**Рядків додано:** ~15  
**Рядків видалено:** ~10  
**Час виконання:** 15 хвилин  
**Ризик:** Низький (локальні зміни)

---

**Статус:** ✅ Виправлено  
**Тестування:** Потрібне  
**Rollback:** Легко (git revert)
