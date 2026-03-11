# 📤 CLOUDINARY UPLOAD - ПОВНЕ РІШЕННЯ

## ✅ Фінальна реалізація

### 1. API Route `/api/upload`

**Файл:** `client/src/app/api/upload/route.ts`

**Ключові особливості:**
- ✅ Приймає `files` (multiple) або `file` (single)
- ✅ Автоматично парсить FormData без вимкнення bodyParser
- ✅ Завантажує всі файли на Cloudinary паралельно
- ✅ Повертає `{ success: true, urls: [...], count: N }`
- ✅ Детальне логування кожної операції
- ✅ Обробка помилок для кожного файлу окремо

**Приклад запиту:**
```typescript
const formData = new FormData()
formData.append('files', file1)
formData.append('files', file2)

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData,
})

const result = await response.json()
// { success: true, urls: ["url1", "url2"], count: 2 }
```

---

### 2. ProductModal (Admin)

**Файл:** `client/src/components/admin/ProductModal.tsx`

**Зміни:**
- ✅ `input type="file" multiple` - вибір кількох файлів
- ✅ `formData.append('files', file)` - правильне ім'я поля
- ✅ `Promise.all()` - паралельне завантаження
- ✅ `result.urls` - отримання масиву URL
- ✅ `images` - збереження всіх URL в масив
- ✅ `imageUrl` - перше зображення як основне

**Приклад використання:**
```typescript
const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files
  
  const uploadPromises = Array.from(files).map(async (file) => {
    const formData = new FormData()
    formData.append('files', file)
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })
    
    const result = await response.json()
    return result.urls[0] // Return first URL
  })
  
  const urls = await Promise.all(uploadPromises)
  setNewImages((prev) => [...prev, ...urls])
}
```

---

### 3. Збереження в Database

**Файл:** `client/src/actions/products.ts`

```typescript
export async function createProduct(data: {
  title: string
  description: string
  price: number
  stock: number
  isActive: boolean
  images: string[]  // Масив Cloudinary URL
}): Promise<{ success: boolean }> {
  const imagesArray = Array.isArray(images) ? images : []
  const imageUrl = imagesArray.length > 0 ? imagesArray[0] : null
  
  await prisma.product.create({
    data: {
      title,
      description,
      price,
      stock,
      isActive,
      imageUrl,    // Основне фото (перше)
      images: imagesArray,  // Всі фото
    },
  })
}
```

---

### 4. Змінні оточення

**Файл:** `.env.local` (локально) або Railway Variables (production)

```bash
# Cloudinary credentials
CLOUDINARY_CLOUD_NAME=dxxxxx
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwx

# Optional: для серверної завантаження
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dxxxxx
```

---

## 🧪 Тестування

### 1. Перевірка змінних оточення

```bash
# Локально
cat .env.local | grep CLOUDINARY

# На Railway
railway variables list
```

### 2. Тест через curl

```bash
# Один файл
curl -X POST http://localhost:3000/api/upload \
  -F "files=@test1.jpg" \
  -H "Content-Type: multipart/form-data"

# Кілька файлів
curl -X POST http://localhost:3000/api/upload \
  -F "files=@test1.jpg" \
  -F "files=@test2.jpg" \
  -F "files=@test3.jpg"

# Очікується:
{
  "success": true,
  "urls": [
    "https://res.cloudinary.com/xxx/image/upload/v123/goodsxp-products/...",
    "https://res.cloudinary.com/xxx/image/upload/v123/goodsxp-products/...",
    "https://res.cloudinary.com/xxx/image/upload/v123/goodsxp-products/..."
  ],
  "count": 3,
  "files": [...]
}
```

### 3. Тест через браузер

1. Відкрийте DevTools → Network
2. Admin Panel → Додати товар
3. Оберіть 3 файли одночасно
4. Знайдіть запит `/api/upload`
5. Перевірте:
   - **Request Payload:** `files: File{}, files: File{}, files: File{}`
   - **Response:** `{success: true, urls: [...], count: 3}`

---

## 🐛 Troubleshooting

### Помилка: "No files provided"

**Причина:** Неправильне ім'я поля у FormData

**Fix:**
```typescript
// ✅ Правильно:
formData.append('files', file)

// ❌ Неправильно:
formData.append('image', file)
formData.append('photo', file)
```

### Помилка: "Cloudinary не налаштовано"

**Причина:** Відсутні змінні оточення

**Fix:**
```bash
# Додайте у .env.local
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Перезапустіть dev server
npm run dev
```

### Помилка: "Файл завеликий"

**Причина:** Обмеження 10MB

**Fix:**
- Зменште розмір файлу
- Або змініть ліміт у `route.ts`:
  ```typescript
  if (fileSize > 20 * 1024 * 1024) {  // 20MB
    throw new Error(...)
  }
  ```

### Файл завантажується але не відображається

**Причина:** ProductModal не зберігає URL правильно

**Fix:**
```typescript
// Перевірте console.log
console.log('Upload result:', result)

// Має бути:
result.success === true
result.urls.length > 0

// Перевірте збереження:
setNewImages((prev) => [...prev, ...uploadedUrls])
```

---

## 📊 Логування

**Приклад логів успішного завантаження:**

```
📤 Upload request received
📦 Parsing FormData...
✅ Found 3 file(s) to upload
⬆️ Uploading file 1/3: image1.jpg (2.34 MB)
✅ Uploaded: image1.jpg → https://res.cloudinary.com/...
⬆️ Uploading file 2/3: image2.jpg (1.87 MB)
✅ Uploaded: image2.jpg → https://res.cloudinary.com/...
⬆️ Uploading file 3/3: image3.jpg (3.12 MB)
✅ Uploaded: image3.jpg → https://res.cloudinary.com/...
🎉 Upload completed: 3 success, 0 errors
```

---

## ✅ Checklist

```
✅ API route приймає 'files' і 'file'
✅ ProductModal відправляє через 'files'
✅ input type="file" multiple працює
✅ Cloudinary credentials перевіряються
✅ Файли валідуються (type, size)
✅ Кілька файлів завантажуються паралельно
✅ Response містить urls[] та count
✅ Pomилки повертаються як JSON
✅ Логування працює
✅ images зберігаються як масив
✅ imageUrl = перше зображення
```

---

## 🚀 Deploy

```bash
git add .
git commit -m "Fix: Cloudinary multi-file upload"
git push
```

Railway автоматично передеплоїть.

---

## 📚 Структура файлів

```
shop-mvp/
├── client/
│   ├── src/
│   │   ├── app/
│   │   │   └── api/
│   │   │       └── upload/
│   │   │           └── route.ts          ← API route
│   │   └── components/
│   │       └── admin/
│   │           └── ProductModal.tsx      ← Admin UI
│   └── .env.local                        ← Cloudinary credentials
└── server/
    └── .env                              ← Server credentials
```
