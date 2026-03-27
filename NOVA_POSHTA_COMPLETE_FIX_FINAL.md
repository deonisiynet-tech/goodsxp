# ✅ Nova Poshta Integration - COMPLETE FIX

**Дата:** 27 березня 2026  
**Статус:** ✅ Повністю виправлено

---

## 🔧 ВИРІШЕНІ ПРОБЛЕМИ

### 1️⃣ Пошук міст не працював
**Було:** `searchSettlements` з `SettlementName` повертав `[]`  
**Стало:** `searchSettlements` з `CityName` - правильний запит

### 2️⃣ Отримання відділень не працювало
**Було:** Передавався `Description` міста замість `Ref`  
**Стало:** Передається `DeliveryCity` (правильний Ref)

### 3️⃣ Форма лагала при введенні
**Було:** Кожна літера викликала API запит  
**Стало:** Debounce 500ms для пошуку, 1000ms для збереження

### 4️⃣ Зайві re-render
**Було:** `watch()` на всій формі  
**Стало:** Оптимізовані dependencies в `useEffect`

---

## 📁 СТРУКТУРА ФАЙЛІВ

```
shop-mvp/
├── server/
│   └── src/
│       └── routes/
│           └── nova-poshta.routes.ts    # ✅ API routes
│
└── client/
    └── src/
        ├── components/
        │   └── NovaPoshtaSelector.tsx   # ✅ Компонент з debounce
        └── app/
            └── checkout/
                └── page.tsx             # ✅ Оптимізована форма
```

---

## 📡 ПРАВИЛЬНІ API ЗАПИТИ

### 1. ПОШУК МІСТ

**Запит:**
```javascript
POST https://api.novaposhta.ua/v2.0/json/

{
  "apiKey": "YOUR_API_KEY",
  "modelName": "Address",
  "calledMethod": "searchSettlements",
  "methodProperties": {
    "CityName": "Од",  // ✅ ВИКОРИСТОВУЄМО CityName (не SettlementName!)
    "Limit": 20
  }
}
```

**Відповідь:**
```json
{
  "success": true,
  "data": [
    {
      "Addresses": [
        {
          "Present": "м. Одеса, Одеська обл.",
          "DeliveryCity": "ref123456",
          "Description": "місто Одеса",
          "RegionDescription": "Одеська область"
        }
      ]
    }
  ]
}
```

**Парсинг:**
```typescript
const addresses = response.data.data?.[0]?.Addresses || [];

const cities = addresses.map(city => ({
  label: city.Present,        // ✅ Для відображення
  ref: city.DeliveryCity,     // ✅ Для getWarehouses
  description: city.Description,
  region: city.RegionDescription
}));
```

---

### 2. ОТРИМАННЯ ВІДДІЛЕНЬ

**Запит:**
```javascript
POST https://api.novaposhta.ua/v2.0/json/

{
  "apiKey": "YOUR_API_KEY",
  "modelName": "Address",
  "calledMethod": "getWarehouses",
  "methodProperties": {
    "CityRef": "ref123456"  // ✅ DeliveryCity з searchSettlements
  }
}
```

**Відповідь:**
```json
{
  "success": true,
  "data": [
    {
      "Ref": "warehouse-ref",
      "Description": "Відділення №1",
      "Number": "1",
      "ShortAddress": "вул. Хрещатик, 1",
      "Latitude": "50.4501",
      "Longitude": "30.5234",
      "Schedule": "Пн-Пт: 9:00-20:00"
    }
  ]
}
```

---

## 🎨 КОМПОНЕНТ NOVA POSHTA SELECTOR

### Основні фічі:

1. **Debounce 500ms** для пошуку міст
```typescript
const debouncedCitySearch = useDebounce(cityInput, 500);

useEffect(() => {
  if (debouncedCitySearch.trim().length >= 2) {
    searchCities(debouncedCitySearch);
  }
}, [debouncedCitySearch]);
```

2. **Controlled inputs** без зайвих ререндерів
```typescript
const handleCityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value;
  setCityInput(value);  // ✅ Миттєве оновлення
  
  // API запит викличе useEffect з debouncedCitySearch через 500ms
};
```

3. **Правильна передача Ref**
```typescript
const handleCitySelect = (city: City) => {
  onCityChange(city);
  setCityInput(city.label);  // ✅ Показуємо Present
  loadWarehouses(city.ref);  // ✅ Передаємо DeliveryCity
};
```

---

## 🚀 ЗАПУСК

### 1. Розробка:

```bash
# Термінал 1 - Сервер
cd server
npm run dev
```

Сервер запуститься на `http://localhost:5000`

### 2. Перевірка API:

```bash
# Пошук міст
curl -X POST http://localhost:5000/api/nova-poshta/cities ^
  -H "Content-Type: application/json" ^
  -d "{\"city\":\"Од\"}"

# Отримання відділень (після вибору міста)
curl -X POST http://localhost:5000/api/nova-poshta/warehouses ^
  -H "Content-Type: application/json" ^
  -d "{\"cityRef\":\"ref123456\"}"
```

---

## 📊 ЛОГИ ДЛЯ ВІДЛАДКИ

### Успішний пошук міст:

```
============================================================
[NovaPoshta] /cities: START
[NovaPoshta] /cities: Query: Од
[NovaPoshta] /cities: Request: {...}
[NovaPoshta] /cities: RAW Response: {...}
[NovaPoshta] /cities: Found 5 addresses
[NovaPoshta] /cities: END - Found 5 cities
[NovaPoshta] /cities: First city: { label: "м. Одеса", ref: "..." }
============================================================
```

### Успішне отримання відділень:

```
============================================================
[NovaPoshta] /warehouses: START
[NovaPoshta] /warehouses: cityRef: ref123456
[NovaPoshta] /warehouses: Request: {...}
[NovaPoshta] /warehouses: RAW Response: {...}
[NovaPoshta] /warehouses: Found 15 warehouses
[NovaPoshta] /warehouses: END - Found 15 warehouses
============================================================
```

---

## ⚠️ ВІДОМІ ОБМЕЖЕННЯ

### Тестовий API ключ

Ключ `fd61dad0d97e5d3479d7f3164b54b03f` може мати обмеження.

**Для повноцінної роботи:**
1. Отримати ключ на https://my.novaposhta.ua/settings/api-key
2. Замінити в `.env`:
   ```
   NOVA_POSHTA_API_KEY=your_real_api_key
   ```

---

## ✅ ЧЕК-ЛИСТ

- [x] Пошук міст з `CityName` (не `SettlementName`)
- [x] Отримання `DeliveryCity` з відповіді
- [x] Передача `DeliveryCity` як `CityRef` в `getWarehouses`
- [x] Debounce 500ms для пошуку міст
- [x] Debounce 1000ms для збереження форми
- [x] Controlled inputs без зайвих ререндерів
- [x] Оптимізовані `useEffect` dependencies
- [x] Повне логування всіх запитів
- [x] Обробка помилок API

---

## 📞 ШВИДКА ВІДЛАДКА

### Якщо пошук не працює:

1. **Перевірити API ключ:**
   ```bash
   cd server
   node -e "console.log(process.env.NOVA_POSHTA_API_KEY)"
   ```

2. **Перевірити відповідь API:**
   ```
   Шукайте в логах:
   [NovaPoshta] /cities: RAW Response: {...}
   ```

3. **Перевірити парсинг:**
   ```
   [NovaPoshta] /cities: Found X addresses
   ```

### Якщо відділення не завантажуються:

1. **Перевірити cityRef:**
   ```
   [NovaPoshta] /warehouses: cityRef: ...
   ```
   Має бути коротким Ref, не довгим описом!

2. **Перевірити відповідь:**
   ```
   [NovaPoshta] /warehouses: RAW Response: {...}
   ```

3. **Якщо "City not found":**
   - Можливо передано `Description` замість `DeliveryCity`
   - Перевірити що `city.ref = DeliveryCity` з searchSettlements

---

**Успішного використання! 🎉**
