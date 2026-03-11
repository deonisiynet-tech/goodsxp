# 🐛 DEBUG: "No image file provided"

## Проблема

При завантаженні фото через админку з'являється помилка:
```
Помилка: No image file provided
```

## ✅ Рішення додано

Оновлено `/api/upload/route.ts` з детальним логуванням:

1. **Логування headers** - перевірка Content-Type
2. **Логування FormData** - що саме прийшло
3. **Перевірка полів** - 'files', 'file', 'image'
4. **Детальні помилки** - що саме не працює

---

## 🔍 Як дебажити

### 1. Відкрийте DevTools

1. Відкрийте Admin Panel (`/admin`)
2. Натисніть F12 → Console
3. Перейдіть на вкладку Network

### 2. Спробуйте завантажити фото

1. Admin → Товари → Додати товар
2. Оберіть файл
3. Подивіться в Console

### 3. Що шукати в логах

**Правильні логи:**
```
⬆️ Uploading: image.jpg (2.34 MB)
📤 Upload request received
📋 Headers: { content-type: 'multipart/form-data; boundary=...' }
📦 Parsing FormData...
📋 FormData contents: { files: { type: 'File', name: 'image.jpg', ... } }
🔍 Found 1 items in 'files' field
  ✅ File: image.jpg (2453678 bytes, image/jpeg)
✅ Processing 1 file(s)...
☁️ Uploading to Cloudinary...
✅ Uploaded: image.jpg → https://res.cloudinary.com/...
```

**Якщо файлів не знайдено:**
```
📤 Upload request received
📦 Parsing FormData...
📋 FormData contents: { }
🔍 Found 0 items in 'files' field
🔍 Trying "file" field...
  ❌ Not a File
🔍 Trying "image" field...
❌ No files found in request!
📋 Received fields: []
```

---

## 🐛 Можливі причини

### 1. Неправильне ім'я поля

**Проблема:**
```typescript
// ❌ Неправильно:
formData.append('image', file)
formData.append('photo', file)
```

**Рішення:**
```typescript
// ✅ Правильно:
formData.append('files', file)
// або
formData.append('file', file)
```

### 2. Відсутній Content-Type

**Проблема:**
```
Content-Type: text/plain
```

**Рішення:**
Не встановлюйте Content-Type вручну! Browser сам встановить `multipart/form-data` з правильним boundary.

```typescript
// ✅ Правильно:
fetch('/api/upload', {
  method: 'POST',
  body: formData,  // Browser сам встановить Content-Type
})

// ❌ Неправильно:
fetch('/api/upload', {
  method: 'POST',
  headers: { 'Content-Type': 'multipart/form-data' },  // Не робіть так!
  body: formData,
})
```

### 3. Файл не обрано

**Проблема:**
```javascript
const files = e.target.files  // null або empty
```

**Рішення:**
```typescript
if (!files || files.length === 0) {
  toast.error('Оберіть файл')
  return
}
```

### 4. Cloudinary credentials

**Проблема:**
```
❌ Cloudinary credentials missing
```

**Рішення:**
Перевірте `.env.local`:
```bash
CLOUDINARY_CLOUD_NAME=dxxxxx
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdef...
```

Перезапустіть dev server:
```bash
npm run dev
```

---

## 🧪 Тести

### Тест 1: Перевірка FormData

Відкрийте Console і виконайте:

```javascript
const formData = new FormData()
formData.append('files', new File(['test'], 'test.txt'))

for (const [key, value] of formData.entries()) {
  console.log(key, value)
}
// Має бути: files File {name: 'test.txt', ...}
```

### Тест 2: Перевірка запиту

Відкрийте Network → /api/upload → Payload:

```
------WebKitFormBoundary...
Content-Disposition: form-data; name="files"; filename="test.jpg"
Content-Type: image/jpeg

(binary data)
------WebKitFormBoundary...--
```

### Тест 3: Перевірка response

Має бути:
```json
{
  "success": true,
  "urls": ["https://res.cloudinary.com/..."],
  "count": 1
}
```

Якщо ні:
```json
{
  "error": "No files provided",
  "receivedFields": [],
  "formDataDebug": {}
}
```

---

## ✅ Checklist

```
✅ DevTools Console відкрито
✅ Network tab відкрито
✅ Файл обрано (input показує ім'я файлу)
✅ formData.append('files', file) використовується
✅ Content-Type не встановлено вручну
✅ CLOUDINARY_* змінні налаштовано
✅ Server перезапущено після змін .env
✅ Логи показують "✅ File: ..."
```

---

## 📞 Якщо не працює

### 1. Надішліть логи з Console

```
📤 Upload request received
📋 Headers: ...
📦 Parsing FormData...
📋 FormData contents: ...
```

### 2. Надішліть Network Payload

Network → /api/upload → Payload

### 3. Надішліть Network Response

Network → /api/upload → Response

---

## 🚀 Останнє рішення

Якщо нічого не допомагає, спробуйте:

```bash
# 1. Очистіть .next
cd client
rm -rf .next

# 2. Перевстановіть залежності
npm install

# 3. Перезапустіть
npm run dev

# 4. Спробуйте знову
```
