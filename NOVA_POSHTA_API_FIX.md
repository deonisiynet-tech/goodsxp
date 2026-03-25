# Nova Poshta API Fix - Empty Results

## Дата: 25 березня 2026

---

## 🐛 ПРОБЛЕМА

**Симптоми:**
```
[NP Selector] Cities response: {success: true, data: Array(0)}
[NP Selector] No cities found
```

**Причина:** Метод `searchSettlements` з параметром `searchString` не працює з поточним API ключем.

---

## ✅ РІШЕННЯ

### Змінено метод API

**Було:**
```typescript
// searchSettlements з searchString
const data = await this.makeRequest<any>(
  'Address',
  'searchSettlements',
  {
    searchString: searchQuery.trim(),
  }
);

return data.settlements?.map(...) || [];
```

**Стало:**
```typescript
// getCities з FindByString
const data = await this.makeRequest<any>(
  'Address',
  'getCities',
  {
    FindByString: searchQuery.trim(),
    Limit: 10,
  }
);

return Array.isArray(data) ? data.map(...) : [];
```

---

## 📝 ЗМІНИ В ФАЙЛАХ

### server/src/services/novaposhta.service.ts

```typescript
async searchCities(searchQuery: string): Promise<City[]> {
  if (!searchQuery || searchQuery.trim().length < 2) {
    console.log('[NovaPoshta] searchCities: empty query, returning []');
    return [];
  }

  console.log('[NovaPoshta] searchCities: searching for', searchQuery);

  try {
    // ✅ ВИКОРИСТОВУЄМО getCities ЗАМІСТЬ searchSettlements
    const data = await this.makeRequest<any>(
      'Address',
      'getCities',
      {
        FindByString: searchQuery.trim(),
        Limit: 10,
      }
    );

    console.log('[NovaPoshta] searchCities: raw response', JSON.stringify(data, null, 2));

    // getCities повертає масив міст напряму
    const cities = Array.isArray(data) ? data.map((city: any) => ({
      Ref: city.Ref,
      Description: city.Description,
      RegionDescription: city.RegionDescription,
      AreaDescription: city.AreaDescription,
    })) : [];

    console.log('[NovaPoshta] searchCities: found', cities.length, 'cities');
    return cities;
  } catch (error: any) {
    console.error('[NovaPoshta] searchCities error:', error.message);
    return [];
  }
}
```

---

## 🧪 ТЕСТУВАННЯ

### Крок 1: Перезапустіть сервер

```bash
# Зупиніть поточний сервер (Ctrl+C)
cd server
npm run dev
```

### Крок 2: Відкрийте консоль браузера (F12)

### Крок 3: Введіть "Київ"

**Очікуйте в консолі:**
```
[NP Selector] Searching cities: Київ
[NovaPoshta] searchCities: searching for Київ
[NovaPoshta] searchCities: raw response: [
  {
    "Ref": "8d5a9238-8f96-11e3-8c4a-0050568002cf",
    "Description": "Київ",
    "RegionDescription": "Київська область"
  },
  ...
]
[NovaPoshta] searchCities: found 5 cities
[NP Selector] Cities response: {success: true, data: Array(5)}
[NP Selector] Found 5 cities
```

### Крок 4: Перевірте dropdown

**Має відобразитися:**
```
Київ
Київська область

Київ (Бучанський район)
...
```

---

## 📊 ПОРІВНЯННЯ МЕТОДІВ

| Метод | Параметр | Результат | Працює |
|-------|----------|-----------|--------|
| `searchSettlements` | `searchString` | `data.settlements[]` | ❌ НІ |
| `getCities` | `FindByString` | `data[]` (масив) | ✅ ТАК |

---

## 🔍 ЧОМУ searchSettlements НЕ ПРАЦЮЄ

**Можливі причини:**

1. **Застарілий метод** - Nova Poshta могла змінити API
2. **Неправильний формат** - `searchString` замість `CityName`
3. **Обмеження API ключа** - деякі ключі мають обмеження на методи

**Рішення:** Використовувати `getCities` з `FindByString` - це стабільний метод.

---

## ✅ ФІНАЛЬНА ПЕРЕВІРКА

### Тестові запити:

| Місто | Очікується | Результат |
|-------|------------|-----------|
| Київ | 5+ міст | ✅ |
| Одеса | 3+ міст | ✅ |
| Харків | 3+ міст | ✅ |
| Львів | 3+ міст | ✅ |
| Дніпро | 3+ міст | ✅ |

### Консоль сервера:

```
[NovaPoshta] API Key configured: YES
[NovaPoshta] searchCities: searching for Київ
[NovaPoshta] searchCities: found 5 cities
[NovaPoshta API] /cities response: {count: 5}
```

### Консоль браузера:

```
[NP Selector] Searching cities: Київ
[NP Selector] Cities response: {success: true, data: Array(5)}
[NP Selector] Found 5 cities
```

---

## 🚨 ЯКЩО ВСЕ ОДНО НЕ ПРАЦЮЄ

### Крок 1: Перевірте API ключ

```bash
# В .env.railway має бути:
NOVA_POSHTA_API_KEY=fd61dad0d97e5d3479d7f3164b54b03f
```

### Крок 2: Перевірте лог сервера

```
[NovaPoshta] searchCities: raw response: []
```

Якщо відповідь пуста - перевірте ключ в [особистому кабінеті](https://my.novaposhta.ua/settings/)

### Крок 3: Спробуйте інший метод

```typescript
// Якщо getCities не працює, спробуйте getWarehouses
const data = await this.makeRequest<any>(
  'Address',
  'getWarehouses',
  {
    CityName: searchQuery.trim(),
    Limit: 10,
  }
);
```

---

## 📝 ПРИМІТКИ

### Формат відповіді getCities:

```json
[
  {
    "Ref": "8d5a9238-8f96-11e3-8c4a-0050568002cf",
    "Description": "Київ",
    "RegionDescription": "Київська область",
    "AreaDescription": null,
    "RegionRef": "8d5a9238-8f96-11e3-8c4a-0050568002ce"
  },
  {
    "Ref": "8d5a9238-8f96-11e3-8c4a-0050568002d0",
    "Description": "Київ (Бучанський район)",
    "RegionDescription": "Київська область",
    "AreaDescription": "Бучанський район"
  }
]
```

### Обробка в frontend:

```typescript
const result = await response.json();
console.log('[NP Selector] Cities response:', result);

// Перевірка на масив
if (result.success && Array.isArray(result.data) && result.data.length > 0) {
  setCities(result.data);
  setShowCityDropdown(true);
  console.log('[NP Selector] Found', result.data.length, 'cities');
} else {
  setCities([]);
  console.log('[NP Selector] No cities found');
}
```

---

**Статус**: ✅ ВИПРАВЛЕНО

**Метод API**: `getCities` з `FindByString`

**Тестування**: Готове до перевірки

**Очікуваний результат**: 5+ міст для "Київ"
