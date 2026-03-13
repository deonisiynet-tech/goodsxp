# 🖼️ Product Images Fix - Catalog & Product Pages

## Проблема

**Зображення товарів видні в адмінці, але не відображаються в каталозі.**

## Знайдені проблеми

### 1. Неправильна обробка Cloudinary URL

Функція `normalizeImagePath` додавала `/uploads/` до будь-якого шляху:

```typescript
// ❌ WRONG - breaks Cloudinary URLs
const normalizeImagePath = (img: string): string => {
  if (!img) return ''
  if (img.startsWith('/uploads/')) return img
  if (img.startsWith('/')) return `/uploads${img}`
  return `/uploads/${img}`  // ❌ Breaks https://res.cloudinary.com/...
}
```

**Результат:**
- Cloudinary URL: `https://res.cloudinary.com/...`
- Після normalize: `/uploads/https://res.cloudinary.com/...` ❌
- Зображення не завантажується (404)

### 2. Next.js Image Configuration

В `next.config.mjs` не було повного шляху для Cloudinary:

```javascript
// ❌ MISSING pathname pattern
{
  protocol: 'https',
  hostname: 'res.cloudinary.com',
  // pathname: '/**' was missing
}
```

## Виправлення

### 1️⃣ client/src/app/catalog/page.tsx

**Виправлено `getProductImage`:**

```typescript
// ✅ CORRECT - handles both Cloudinary and local paths
const getProductImage = (prod: SafeProduct | null): string => {
  if (!prod) return '/placeholder.jpg';

  // Try imageUrl first
  if (prod.imageUrl) {
    // If it's already a full URL (Cloudinary), return as is
    if (prod.imageUrl.startsWith('http://') || prod.imageUrl.startsWith('https://')) {
      return prod.imageUrl;
    }
    // If it's a local path, return as is
    if (prod.imageUrl.startsWith('/')) {
      return prod.imageUrl;
    }
    return `/${prod.imageUrl}`;
  }

  // Try images array
  const images = Array.isArray(prod.images) ? prod.images : [];
  if (images.length > 0 && images[0]) {
    const firstImage = images[0];
    if (firstImage.startsWith('http://') || firstImage.startsWith('https://')) {
      return firstImage;
    }
    if (firstImage.startsWith('/')) {
      return firstImage;
    }
    return `/${firstImage}`;
  }

  return '/placeholder.jpg';
};
```

### 2️⃣ client/src/components/ProductModal.tsx

**Виправлено `getImageUrl`:**

```typescript
const getImageUrl = (img: string | null | undefined): string => {
  if (!img) return ''
  // If it's already a full URL (Cloudinary), return as is
  if (img.startsWith('http://') || img.startsWith('https://')) {
    return img
  }
  // If it's a local path starting with /, return as is
  if (img.startsWith('/')) {
    return img
  }
  // Otherwise prepend /
  return `/${img}`
}
```

### 3️⃣ client/src/app/catalog/[id]/page.tsx

**Виправлено `getImageUrl` та `getImageList`:**

```typescript
const getImageUrl = (img: string): string => {
  if (!img) return ''
  if (img.startsWith('http://') || img.startsWith('https://')) {
    return img  // Cloudinary URL
  }
  if (img.startsWith('/')) {
    return img  // Local path
  }
  return `/${img}`
}
```

### 4️⃣ client/next.config.mjs

**Додано повні remote patterns:**

```javascript
images: {
  domains: ['res.cloudinary.com', 'localhost', 'images.unsplash.com'],
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'res.cloudinary.com',
      pathname: '/**',  // ✅ Full path pattern
    },
    {
      protocol: 'https',
      hostname: 'images.unsplash.com',
      pathname: '/**',
    },
    {
      protocol: 'https',
      hostname: 'via.placeholder.com',
      pathname: '/**',
    },
    {
      protocol: 'http',
      hostname: 'localhost',
      port: '5000',
      pathname: '/uploads/**',
    },
    {
      protocol: 'https',
      hostname: 'goodsxp.store',
      pathname: '/uploads/**',
    },
  ],
}
```

## 📁 Виправлені файли

| Файл | Зміни |
|------|-------|
| `client/src/app/catalog/page.tsx` | Виправлено `getProductImage()` |
| `client/src/components/ProductModal.tsx` | Виправлено `getImageUrl()` |
| `client/src/app/catalog/[id]/page.tsx` | Виправлено `getImageUrl()` та `getImageList()` |
| `client/next.config.mjs` | Додано Cloudinary remote patterns |

## ✅ Перевірка

### 1. Каталог товарів
```
https://goodsxp.store/catalog
```
**Очікується:** Зображення товарів відображаються

### 2. Сторінка товару
```
https://goodsxp.store/catalog/{product-id}
```
**Очікується:** Галерея зображень працює

### 3. Network Tab

DevTools → Network → Filter: `res.cloudinary.com`

**Очікується:**
- Status: 200 OK
- Cloudinary URLs завантажуються

### 4. API Response

```bash
curl https://goodsxp.store/api/products
```

**Очікується:**
```json
{
  "products": [
    {
      "id": "...",
      "title": "...",
      "imageUrl": "https://res.cloudinary.com/.../image.jpg",
      "images": ["https://res.cloudinary.com/.../image1.jpg"]
    }
  ]
}
```

## 🔍 Debug Checklist

Якщо зображення все ще не відображаються:

1. **Check browser console:**
   ```
   F12 → Console → Look for image errors
   ```

2. **Check Network tab:**
   ```
   F12 → Network → Filter by image
   Look for 404 errors
   ```

3. **Check image URLs:**
   ```javascript
   // In browser console
   fetch('/api/products')
     .then(r => r.json())
     .then(d => console.log(d.products[0].imageUrl))
   ```

4. **Verify Cloudinary URLs:**
   ```
   Open image URL directly in browser
   Should display image from res.cloudinary.com
   ```

## 🎯 Image Flow

```
┌─────────────────────────────────────────────────────┐
│ 1. Admin uploads image via /api/admin/products     │
│    - FormData with image files                      │
│    - Server processes via uploadMiddleware          │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│ 2. Server uploads to Cloudinary                     │
│    - POST to cloudinary.uploader.upload()           │
│    - Returns: https://res.cloudinary.com/.../img.jpg│
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│ 3. Server saves URL to database                     │
│    - Prisma: product.imageUrl = cloudinaryUrl       │
│    - Prisma: product.images = [cloudinaryUrl, ...]  │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│ 4. API returns product with Cloudinary URLs         │
│    - GET /api/products                              │
│    - Response: { imageUrl: "https://res.cloudinary..│
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│ 5. Frontend displays image                          │
│    - getProductImage() returns Cloudinary URL as-is │
│    - <img src="https://res.cloudinary.com/..." />   │
│    - Next.js allows domain via remotePatterns       │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│ 6. Image loads successfully ✅                      │
└─────────────────────────────────────────────────────┘
```

## 🚀 Deploy

```bash
git add .
git commit -m "fix: product images not showing in catalog - Cloudinary URL handling"
git push origin main
```

Railway автоматично перебудує і запустить.

## ✅ Success Criteria

- ✅ Зображення в каталозі відображаються
- ✅ Зображення на сторінці товару відображаються
- ✅ Галерея зображень працює
- ✅ Cloudinary URLs завантажуються (200 OK)
- ✅ Ніяких 404 помилок в Network tab
- ✅ Admin бачить зображення в адмінці
- ✅ Користувачі бачать зображення в каталозі
