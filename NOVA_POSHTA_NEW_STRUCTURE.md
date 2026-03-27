# ✅ Nova Poshta Integration - Нова Структура

**Дата:** 27 березня 2026  
**Статус:** ✅ Інтеграцію виконано за правильною архітектурою

---

## 📁 Структура файлів

```
shop-mvp/
├── server/
│   └── src/
│       └── services/
│           └── novaPoshtaService.ts    # ✅ Сервіс для Express (опціонально)
│
└── client/
    └── src/
        ├── app/
        │   └── api/
        │       └── nova-poshta/
        │           ├── cities/
        │           │   └── route.ts    # ✅ POST /api/nova-poshta/cities
        │           └── warehouses/
        │               └── route.ts    # ✅ POST /api/nova-poshta/warehouses
        │
        └── components/
            └── NovaPoshtaSelector.tsx  # ✅ React компонент з debounce
```

---

## 🔧 Правильна логіка API

### ❌ Чому не працювало раніше:

```javascript
// НЕПРАВИЛЬНО:
- Використовувався SettlementName для getWarehouses
- Використовувався SettlementRef замість DeliveryCity
- Передавався Description міста замість Ref
- Довга назва міста з регіоном використовувалась як Ref
```

### ✅ Правильна цепочка:

```
1. searchSettlements (SettlementName: "Київ")
         ↓
2. Отримуємо Addresses[0].DeliveryCity (це і є Ref міста)
         ↓
3. getWarehouses (CityRef: DeliveryCity)
         ↓
4. Отримуємо список відділень
```

---

## 📡 API Endpoints

### 1. POST /api/nova-poshta/cities

**Запит:**
```json
{
  "city": "Київ"
}
```

**Відповідь:**
```json
[
  {
    "label": "Київ",
    "cityRef": "d7a2a697-2a22-44e6-a2a7-7b6e8f3e5c1d",
    "description": "місто Київ",
    "region": "Київська область",
    "area": ""
  }
]
```

**Важливо:**
- `cityRef` = `DeliveryCity` з відповіді API
- Саме це значення потрібно передавати в `/api/nova-poshta/warehouses`

---

### 2. POST /api/nova-poshta/warehouses

**Запит:**
```json
{
  "cityRef": "d7a2a697-2a22-44e6-a2a7-7b6e8f3e5c1d",
  "type": "warehouse"  // або "postomat"
}
```

**Відповідь:**
```json
[
  {
    "id": "Ref відділення",
    "label": "Повний опис відділення",
    "number": "1",
    "shortAddress": "вул. Хрещатик, 1",
    "type": "Відділення",
    "latitude": "50.4501",
    "longitude": "30.5234",
    "schedule": "Пн-Пт: 9:00-20:00"
  }
]
```

---

## 🎨 Компонент NovaPoshtaSelector

### Основні фічі:

1. **Debounce 300ms** для пошуку міст
   - Користувач вводить текст без затримок
   - API запит викликається через 300ms після останнього символу

2. **Типи доставки:**
   - 🏢 Відділення (warehouse)
   - 📦 Почтомат (postomat)
   - 🚚 Кур'єр (courier)

3. **Вибір міста:**
   - Пошук за SettlementName
   - Збереження cityRef (DeliveryCity)
   - Автоматичне завантаження відділень після вибору

4. **Вибір відділення:**
   - Список або карта
   - Збереження обраного відділення в стан

### Використання:

```tsx
<NovaPoshtaSelector
  onCityChange={(city) => console.log('City:', city)}
  onWarehouseChange={(warehouse) => console.log('Warehouse:', warehouse)}
  onDeliveryTypeChange={(type) => console.log('Type:', type)}
  selectedCity={selectedCity}
  selectedWarehouse={selectedWarehouse}
  savedCityName={savedCityName}
/>
```

---

## 🚀 Запуск

### 1. Встановити залежності:

```bash
cd server
npm install

cd ../client
npm install
```

### 2. Налаштувати .env:

```env
NOVA_POSHTA_API_KEY=fd61dad0d97e5d3479d7f3164b54b03f
```

### 3. Запустити розробку:

```bash
# Термінал 1 - Сервер
cd server
npm run dev

# Термінал 2 - Клієнт
cd client
npm run dev
```

### 4. Production збірка:

```bash
# Сервер
cd server
npm run build

# Клієнт
cd client
npm run build
```

---

## 🧪 Тестування

### 1. Пошук міст:

```bash
curl -X POST http://localhost:3000/api/nova-poshta/cities \
  -H "Content-Type: application/json" \
  -d '{"city":"Київ"}'
```

**Очікуваний результат:**
- Список міст з `cityRef` (DeliveryCity)
- Логи в консолі: `[NovaPoshta API] /cities: Found X cities`

### 2. Отримання відділень:

```bash
curl -X POST http://localhost:3000/api/nova-poshta/warehouses \
  -H "Content-Type: application/json" \
  -d '{"cityRef":"<Ref з попереднього запиту>","type":"warehouse"}'
```

**Очікуваний результат:**
- Список відділень з координатами
- Логи в консолі: `[NovaPoshta API] /warehouses: Found X warehouses`

### 3. Форма checkout:

1. Відкрити `/checkout`
2. Ввести "Київ" → зачекати 300ms
3. Обрати місто зі списку
4. Обрати тип доставки (Відділення/Почтомат)
5. Обрати відділення зі списку
6. Заповнити форму (ім'я, телефон, email)
7. Натиснути "Замовити"

---

## 📊 Логи для відладки

### Ключові повідомлення:

**Успішний пошук міст:**
```
[NovaPoshta API] /cities: START, city: Київ
[NovaPoshta API] /cities: Found 5 cities
[NovaPoshta API] /cities: First city: { label: 'Київ', cityRef: '...' }
```

**Успішне отримання відділень:**
```
[NovaPoshta API] /warehouses: START, cityRef: ...
[NovaPoshta API] /warehouses: Found 15 warehouses
[NovaPoshta API] /warehouses: First item: { number: '1', ... }
```

**Помилка "City not found":**
```
[NovaPoshta API] /warehouses: API errors: ['City not found']
[NovaPoshta API] /warehouses: City not found. Check if cityRef is correct DeliveryCity value
```

---

## ⚠️ Відомі проблеми та рішення

### 1. "City not found"

**Причина:** Передано неправильний Ref

**Рішення:**
- Перевірити що `cityRef` = `DeliveryCity` з `searchSettlements`
- Не використовувати `Description` або `Present` як Ref

### 2. Пустий список відділень

**Причина:**
- Місто не має відділень
- Неправильний `cityRef`

**Рішення:**
- Спробувати інше місто (наприклад, Київ)
- Перевірити логи API

### 3. Форма лагає при введенні

**Причина:** Кожна літера викликала API запит

**Рішення:**
- Використовувати debounce 300ms
- Зберігати в localStorage тільки через 500ms

---

## ✅ Чек-лист

- [x] Сервіс `novaPoshtaService.ts` з правильною логікою
- [x] API route `/api/nova-poshta/cities`
- [x] API route `/api/nova-poshta/warehouses`
- [x] Компонент `NovaPoshtaSelector.tsx` з debounce
- [x] Інтеграція в checkout page
- [x] Видалені старі файли (`novaposhta.service.ts`, `novaposhta.routes.ts`)
- [x] Оновлено `server.ts` (видалено імпорт старих routes)
- [x] Збірка без помилок

---

## 📞 Підтримка

Для відладки використовуйте:

1. **Консоль браузера** (F12):
   - Фільтр: `[NP Selector]`
   - Логи компоненту

2. **Консоль сервера**:
   - Фільтр: `[NovaPoshta API]`
   - Логи API routes

3. **Мережеві запити** (Network tab):
   - `/api/nova-poshta/cities`
   - `/api/nova-poshta/warehouses`

**Успішного використання! 🎉**
