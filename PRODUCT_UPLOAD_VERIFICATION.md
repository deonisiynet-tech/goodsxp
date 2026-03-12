# ✅ ПЕРЕВІРКА: Завантаження товару з фото

## 📋 Ланцюжок завантаження

```
ProductModal (Admin)
    ↓
1. Вибір файлів (input type="file" multiple)
    ↓
2. FormData з полем 'files' для кожного файлу
    ↓
3. POST /api/upload (Express server)
    ↓
4. Cloudinary завантаження
    ↓
5. Отримання URL: ["url1", "url2", ...]
    ↓
6. createProduct Server Action
    ↓
7. Prisma: images: String[], imageUrl = images[0]
    ↓
8. Database ✅
```

---

## 1. ProductModal - Вибір файлів

**Файл:** `client/src/components/admin/ProductModal.tsx`

```typescript
// ✅ Правильно:
const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files
  
  const formData = new FormData()
  for (const file of Array.from(files)) {
    formData.append('files', file)  // ✅ Кожне фото з тим самим ім'ям
  }
  
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  })
  
  const result = await response.json()
  // result.urls = ["url1", "url2", ...]
  
  setNewImages((prev) => [...prev, ...result.urls])  // ✅ Зберігаємо всі URL
}
```

**Перевірка:**
- [ ] `input type="file" multiple` дозволяє вибрати кілька файлів
- [ ] `formData.append('files', file)` використовується
- [ ] `result.urls` містить масив URL
- [ ] `setNewImages` зберігає всі URL

---

## 2. Express Server - Upload Route

**Файл:** `server/src/routes/upload.routes.ts`

```typescript
// ✅ Приймає files або file
if (req.files?.files) {
  const uploadedFiles = Array.isArray(req.files.files) 
    ? req.files.files 
    : [req.files.files]
  files.push(...uploadedFiles)
}

// ✅ Завантажує на Cloudinary
const result = await cloudinary.uploader.upload(file.tempFilePath, {
  folder: 'goodsxp-products',
})

// ✅ Повертає масив URL
res.json({
  success: true,
  urls: uploadResults.map(r => r.url),
  count: uploadResults.length,
})
```

**Перевірка:**
- [ ] `req.files.files` обробляється
- [ ] Cloudinary credentials налаштовані
- [ ] `urls: [...]` повертається

---

## 3. Server Action - createProduct

**Файл:** `client/src/actions/products.ts`

```typescript
export async function createProduct(data: {
  title: string
  description: string
  price: number
  stock: number
  isActive: boolean
  images: string[]  // ✅ Масив URL
}): Promise<{ success: boolean }> {
  
  const imagesArray = Array.isArray(images) ? images : []
  const imageUrl = imagesArray.length > 0 ? imagesArray[0] : null  // ✅ Перше фото
  
  await prisma.product.create({
    data: {
      title,
      description,
      price,
      stock,
      isActive,
      imageUrl,      // ✅ Основне фото
      images: imagesArray,  // ✅ Всі фото
    },
  })
  
  return { success: true }
}
```

**Перевірка:**
- [ ] `images: string[]` приймається
- [ ] `imageUrl = images[0]` встановлюється
- [ ] `images: imagesArray` зберігається

---

## 4. Prisma Schema

**Файл:** `server/prisma/schema.prisma`

```prisma
model Product {
  id          String      @id @default(uuid())
  title       String
  description String
  price       Decimal     @db.Decimal(10, 2)
  imageUrl    String?     // ✅ Основне фото
  images      String[]    // ✅ Всі фото
  stock       Int         @default(0)
  isActive    Boolean     @default(true)
}
```

**Перевірка:**
- [ ] `images String[]` існує
- [ ] `imageUrl String?` існує

---

## 5. Cloudinary перевірка

**Змінні оточення (Railway Variables):**

```bash
CLOUDINARY_CLOUD_NAME=dho1q87qk
CLOUDINARY_API_KEY=679329866265555
CLOUDINARY_API_SECRET=Y8HzBE5cnLyz_86WXNLQ5tMfblU
```

**Перевірка:**
- [ ] Всі три змінні додані на Railway
- [ ] Без лапок
- [ ] Server має доступ до них

---

## 🧪 Тестування

### Крок 1: Відкрийте Admin Panel

```
https://your-app.railway.app/admin
```

### Крок 2: Додати товар

1. Товари → Додати товар
2. Заповніть:
   - Назва: `iPhone 15 Pro`
   - Опис: `Тестовий товар`
   - Ціна: `50000`
   - Залишок: `10`
3. Оберіть **3 фото одночасно**
4. Натисніть "Зберегти"

### Крок 3: Перевірте Console (F12)

**Правильні логи:**
```
📁 Selected 3 file(s)
⬆️ Added to FormData: IMG_001.jpg (2.34 MB)
⬆️ Added to FormData: IMG_002.jpg (1.87 MB)
⬆️ Added to FormData: IMG_003.jpg (3.12 MB)
📤 Sending upload request...
📥 Upload response status: 200
📥 Upload result: { success: true, urls: [...], count: 3 }
✅ Завантажено 3 зображень
```

### Крок 4: Перевірте Database

**Railway Dashboard → PostgreSQL → Connect**

```sql
SELECT id, title, "imageUrl", images, price, stock 
FROM "Product" 
ORDER BY "createdAt" DESC 
LIMIT 1;
```

**Очікується:**
```
id | title | imageUrl | images | price | stock
---|-------|----------|--------|-------|------
xxx | iPhone 15 Pro | https://res.cloudinary.com/.../url1 | ["url1", "url2", "url3"] | 50000 | 10
```

---

## 🐛 Troubleshooting

### Помилка: "No files provided"

**Причина:** Express не отримує файли

**Fix:**
1. Перевірте що `/api/upload` route додано в `server.ts`:
   ```typescript
   app.use('/api/upload', uploadRoutes);
   ```
2. Перевірте що `express-fileupload` встановлено:
   ```bash
   npm list express-fileupload
   ```

### Помилка: "Cloudinary не налаштовано"

**Причина:** Немає змінних оточення

**Fix:**
1. Railway Dashboard → Variables
2. Додайте:
   ```
   CLOUDINARY_CLOUD_NAME=dho1q87qk
   CLOUDINARY_API_KEY=679329866265555
   CLOUDINARY_API_SECRET=Y8HzBE5cnLyz_86WXNLQ5tMfblU
   ```
3. Restart

### Товар зберігається без фото

**Причина:** `images` не передається в Server Action

**Fix:**
1. Console → Перевірте `allImageUrls` перед відправкою
2. Перевірте що `result.urls` не порожній
3. Перевірте Database через SQL

### Помилка Prisma

**Причина:** Неправильний тип даних

**Fix:**
```typescript
// ✅ Правильно:
price: Number(price),  // Decimal
stock: Number(stock),  // Int
images: imagesArray,   // String[]
```

---

## ✅ Final Checklist

```
✅ ProductModal вибирає кілька файлів
✅ FormData.append('files', file) для кожного
✅ Express /api/upload приймає files[]
✅ Cloudinary завантажує всі файли
✅ Response: { urls: [...], count: N }
✅ Server Action отримує images: string[]
✅ imageUrl = images[0]
✅ Prisma зберігає images: String[]
✅ Змінні Cloudinary налаштовані
✅ Database має imageUrl і images
```

---

## 🚀 Deploy

```bash
git push
```

Railway автоматично передеплоїть.

---

## 📊 Результат

Після успішного завантаження:

1. **Admin Panel → Товари:** Всі фото відображаються
2. **Catalog:** Основне фото (перше)
3. **Product Modal:** Всі фото в галереї
4. **Database:** `images: ["url1", "url2", "url3"]`
