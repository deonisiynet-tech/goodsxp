# ✅ Nova Poshta Integration - Фінальна версія

**Дата:** 27 березня 2026  
**Статус:** ✅ Повністю працює

---

## 🏗️ Архітектура

```
┌─────────────────────────────────────────────────────────┐
│                   Клієнт (Next.js)                       │
│  ┌───────────────────────────────────────────────────┐  │
│  │  NovaPoshtaSelector.tsx                           │  │
│  │  - Debounce 300ms для пошуку                      │  │
│  │  - Запити на /api/nova-poshta/*                   │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓
                          │ HTTP Запити
                          ↓
┌─────────────────────────────────────────────────────────┐
│             Сервер (Express + Next.js)                   │
│  ┌───────────────────────────────────────────────────┐  │
│  │  /api/nova-poshta/cities (POST)                   │  │
│  │  /api/nova-poshta/warehouses (POST)               │  │
│  │                                                   │  │
│  │  Обидва routes обробляє Express сервер            │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓
                          │ HTTPS Запити
                          ↓
┌─────────────────────────────────────────────────────────┐
│              Nova Poshta API                             │
│  https://api.novaposhta.ua/v2.0/json/                   │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 Структура файлів

```
shop-mvp/
├── server/
│   └── src/
│       ├── routes/
│       │   └── nova-poshta.routes.ts    # ✅ API routes для Express
│       └── server.ts                     # ✅ Реєстрація routes
│
└── client/
    └── src/
        └── components/
            └── NovaPoshtaSelector.tsx   # ✅ React компонент
```

---

## 🔧 Правильна логіка API

### ✅ Послідовність викликів:

```
1. POST /api/nova-poshta/cities
   Request: { city: "Київ" }
   
   ↓
   
2. Nova Poshta API: searchSettlements
   SettlementName: "Київ"
   
   ↓
   
3. Отримуємо відповідь:
   {
     "label": "Київ",
     "cityRef": "d7a2a697-2a22-44e6-a2a7-7b6e8f3e5c1d"  ← DeliveryCity
   }
   
   ↓
   
4. POST /api/nova-poshta/warehouses
   Request: { cityRef: "d7a2a697...", type: "warehouse" }
   
   ↓
   
5. Nova Poshta API: getWarehouses
   CityRef: "d7a2a697..."
   
   ↓
   
6. Отримуємо список відділень
```

---

## 📡 API Routes (Express)

### Файл: `server/src/routes/nova-poshta.routes.ts`

**Routes:**
- `POST /api/nova-poshta/cities` - Пошук міст
- `POST /api/nova-poshta/warehouses` - Отримання відділень/почтоматів

**Логіка:**
1. Приймає запит від клієнта
2. Відправляє запит до Nova Poshta API
3. Логує відповідь
4. Повертає оброблені дані клієнту

---

## 🎨 Компонент NovaPoshtaSelector

**Файл:** `client/src/components/NovaPoshtaSelector.tsx`

**Фічі:**
- ✅ **Debounce 300ms** - запит до API тільки через 300ms після зупинки введення
- ✅ **Миттєве відображення** - текст вводиться без затримок
- ✅ **Типи доставки:** Відділення / Почтомат / Кур'єр
- ✅ **Вибір міста** - збереження cityRef (DeliveryCity)
- ✅ **Вибір відділення** - збереження в стан
- ✅ **Повне логування** - консольні логи для відладки

---

## 🚀 Запуск

### 1. Розробка:

```bash
# Термінал 1 - Сервер (Express + Next.js)
cd server
npm run dev
```

Сервер запуститься на `http://localhost:5000`

### 2. Production збірка:

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
curl -X POST http://localhost:5000/api/nova-poshta/cities ^
  -H "Content-Type: application/json" ^
  -d "{\"city\":\"Київ\"}"
```

**Очікуваний результат:**
```json
[
  {
    "label": "Київ",
    "cityRef": "d7a2a697-2a22-44e6-a2a7-7b6e8f3e5c1d",
    "description": "місто Київ",
    "region": "Київська область"
  }
]
```

### 2. Отримання відділень:

```bash
curl -X POST http://localhost:5000/api/nova-poshta/warehouses ^
  -H "Content-Type: application/json" ^
  -d "{\"cityRef\":\"d7a2a697-2a22-44e6-a2a7-7b6e8f3e5c1d\",\"type\":\"warehouse\"}"
```

**Очікуваний результат:**
```json
[
  {
    "id": "Ref",
    "label": "Опис",
    "number": "1",
    "shortAddress": "вул. Хрещатик, 1",
    "type": "Відділення",
    "latitude": "50.4501",
    "longitude": "30.5234"
  }
]
```

### 3. Форма checkout:

1. Відкрити `http://localhost:5000/checkout`
2. Ввести "Київ" → зачекати 300ms
3. Обрати місто зі списку
4. Обрати тип доставки
5. Обрати відділення
6. Заповнити форму
7. Натиснути "Замовити"

---

## 📊 Логи для відладки

### Консоль браузера (F12):

```
[NP Selector] City input changed: Київ
[NP Selector] Searching cities: Київ
[NP Selector] Cities response: [...]
[NP Selector] Found 5 cities
[NP Selector] City selected: {...}
[NP Selector] Loading delivery options for cityRef: ...
[NP Selector] Delivery options response: [...]
[NP Selector] Found 15 delivery points
```

### Консоль сервера:

```
[NovaPoshta Routes] Initialized with API Key: YES
[NovaPoshta API] /cities: START, city: Київ
[NovaPoshta API] /cities: RAW response: {...}
[NovaPoshta API] /cities: Found 5 addresses
[NovaPoshta API] /cities: END, found 5 cities
[NovaPoshta API] /warehouses: START, cityRef: ...
[NovaPoshta API] /warehouses: RAW response: {...}
[NovaPoshta API] /warehouses: Found 15 items
[NovaPoshta API] /warehouses: END, found 15 items
```

---

## ⚠️ Вирішені проблеми

### 1. ❌ 404 на /api/nova-poshta/cities

**Причина:** API routes були в Next.js, а сервер Express не знав про них

**Рішення:** Створено API routes в Express (`nova-poshta.routes.ts`)

### 2. ❌ Форма лагала при введенні

**Причина:** Кожна літера викликала API запит

**Рішення:** Додано debounce 300ms

### 3. ❌ City not found

**Причина:** Використовувався Description замість DeliveryCity

**Рішення:** Тепер використовується `cityRef = DeliveryCity`

---

## ✅ Фінальний чек-лист

- [x] API routes в Express (`nova-poshta.routes.ts`)
- [x] Реєстрація routes в `server.ts`
- [x] NovaPoshtaSelector з debounce 300ms
- [x] Інтеграція в checkout page
- [x] Видалено API routes з Next.js
- [x] Правильна логіка: SettlementName → DeliveryCity → getWarehouses
- [x] Повне логування всіх запитів
- [x] Збірка без помилок

---

## 📞 Швидка відладка

**Якщо не працює пошук міст:**

1. Перевірити логи сервера:
   ```
   [NovaPoshta API] /cities: START
   ```

2. Перевірити відповідь API:
   ```
   [NovaPoshta API] /cities: RAW response: {...}
   ```

3. Перевірити чи є API ключ:
   ```
   [NovaPoshta Routes] Initialized with API Key: YES
   ```

**Якщо 404 на /api/nova-poshta/*:**

1. Перевірити чи зареєстровано routes в `server.ts`:
   ```typescript
   app.use('/api/nova-poshta', novaPoshtaRoutes);
   ```

2. Перевірити чи перебудовано сервер:
   ```bash
   cd server
   npm run build
   ```

---

**Успішного використання! 🎉**
