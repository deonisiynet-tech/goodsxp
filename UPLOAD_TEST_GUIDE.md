# 🧪 ТЕСТУВАННЯ ЗАВАНТАЖЕННЯ ФОТО

## API Route: `/api/upload`

### ✅ Фінальний код API route

Файл: `/client/src/app/api/upload/route.ts`

**Ключові зміни:**

1. **Підтримка мульти-файлів:**
   - `formData.getAll('files')` - для кількох файлів
   - `formData.get('file')` - для одного файлу (backward compatibility)
   - `formData.getAll('image')` - альтернативне ім'я поля

2. **Вимкнено bodyParser:**
   - Next.js 14 App Router автоматично обробляє FormData
   - Не потрібно вимикати bodyParser явно

3. **Cloudinary конфігурація:**
   - Перевірка змінних оточення перед завантаженням
   - Логування для дебагінгу

4. **Обробка помилок:**
   - Коректний JSON з помилкою замість падіння сервера
   - Детальне логування кожної операції

---

## 🔧 Зміни в ProductModal

Файл: `/client/src/components/admin/ProductModal.tsx`

**Зміни:**

```typescript
// Було:
formData.append('file', file)

// Стало:
formData.append('files', file)  // Використовуємо 'files' замість 'file'
```

---

## 📋 Тестування

### 1. Перевірка змінних оточення

```bash
# На локальному сервері
echo $CLOUDINARY_CLOUD_NAME
echo $CLOUDINARY_API_KEY
echo $CLOUDINARY_API_SECRET

# На Railway
railway variables get CLOUDINARY_CLOUD_NAME
railway variables get CLOUDINARY_API_KEY
railway variables get CLOUDINARY_API_SECRET
```

### 2. Тест через curl

```bash
# Тест з одним файлом
curl -X POST http://localhost:3000/api/upload \
  -F "files=@test.jpg" \
  -H "Content-Type: multipart/form-data"

# Очікується:
{
  "success": true,
  "urls": ["https://res.cloudinary.com/..."],
  "files": [{"url": "...", "public_id": "...", "originalName": "test.jpg"}],
  "count": 1
}
```

### 3. Тест через браузер (DevTools)

1. Відкрийте DevTools → Network
2. Відкрийте Admin Panel → Додати товар
3. Оберіть файл(и)
4. Знайдіть запит `/api/upload`
5. Перевірте:
   - Request Payload: `files: File{...}`
   - Response: `{success: true, urls: [...]}`

### 4. Тест декількох файлів

```typescript
// Створіть FormData з кількома файлами
const formData = new FormData()
formData.append('files', file1)
formData.append('files', file2)
formData.append('files', file3)

fetch('/api/upload', {
  method: 'POST',
  body: formData,
})
// Очікується: 3 URL в response
```

---

## 🐛 Troubleshooting

### Помилка: "Файли не знайдено"

**Причина:** Неправильне ім'я поля у FormData

**Fix:**
```typescript
// Правильно:
formData.append('files', file)

// Неправильно:
formData.append('image', file)  // API не розпізнає
```

### Помилка: "Cloudinary не налаштовано"

**Причина:** Відсутні змінні оточення

**Fix:**
```bash
# Додайте у .env.local (локально)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Або на Railway Variables
```

### Помилка: "Request body too large"

**Причина:** Файл більший за 10MB

**Fix:**
- Зменште розмір файлу
- Або змініть ліміт у API route

### Файл завантажується але не відображається

**Причина:** ProductModal не правильно обробляє response

**Fix:**
```typescript
// Перевірте:
console.log('Upload result:', result)

// Має бути:
result.success === true
result.urls.length > 0
```

---

## 📊 Логування

API route логує:

```
📤 Upload request received
📦 Parsing FormData...
📁 Found 3 file(s) in 'files' field
✅ Processing 3 file(s)...
⬆️ Uploading file 1/3: image1.jpg (2.34 MB)
✅ Uploaded: image1.jpg → https://res.cloudinary.com/...
⬆️ Uploading file 2/3: image2.jpg (1.87 MB)
✅ Uploaded: image2.jpg → https://res.cloudinary.com/...
⬆️ Uploading file 3/3: image3.jpg (3.12 MB)
✅ Uploaded: image3.jpg → https://res.cloudinary.com/...
🎉 Upload completed in 4.23s: 3 success, 0 errors
```

---

## ✅ Checklist

```
✅ API route приймає 'files' і 'file'
✅ ProductModal відправляє через 'files'
✅ Cloudinary credentials перевіряються
✅ Файли валідуються (type, size)
✅ Кілька файлів завантажуються по черзі
✅ Response містить urls[] та files[]
✅ Помилки повертаються як JSON
✅ Логування працює
```

---

## 🚀 Deploy

```bash
git add client/src/app/api/upload/route.ts
git add client/src/components/admin/ProductModal.tsx
git commit -m "Fix: Multi-file upload with Cloudinary"
git push
```

Railway автоматично передеплоїть.
