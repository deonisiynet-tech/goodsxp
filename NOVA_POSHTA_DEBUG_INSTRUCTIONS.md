# Nova Poshta Debug Instructions

## Проблема: API повертає пусті результати

```
[NP Selector] Cities response: {success: true, data: Array(0)}
[NP Selector] No cities found
```

---

## 🔍 ІНСТРУКЦІЯ ДЛЯ ВІДЛАДКИ

### Крок 1: Відкрийте логи Railway

1. Зайдіть на [railway.app](https://railway.app)
2. Оберіть ваш проект
3. Перейдіть в **Deployments**
4. Відкрийте **View Logs** для поточного деплою

### Крок 2: Введіть "Київ" в полі міста

### Крок 3: Шукайте в логах наступне:

```
[NovaPoshta] searchCities: searching for Київ
[NovaPoshta] API Key: fd61dad0...
[NovaPoshta] Request body: {...}
[NovaPoshta] Full API response: {...}
```

### Крок 4: Скопіюйте відповідь API

**Шукайте:**
```
[NovaPoshta] Full API response: {
  "success": true/false,
  "data": [...],
  "errors": [...]
}
```

---

## 📊 МОЖЛИВІ ВАРИАНТИ

### Варіант 1: API повертає помилку

```json
{
  "success": false,
  "data": [],
  "errors": ["API key is invalid"]
}
```

**Рішення:** Оновіть API ключ в .env.railway

---

### Варіант 2: API повертає пусту відповідь

```json
{
  "success": true,
  "data": [],
  "errors": []
}
```

**Рішення:** API ключ не дійсний або закінчився термін дії

---

### Варіант 3: API повертає дані в іншому форматі

```json
{
  "success": true,
  "data": [
    {
      "settlements": [...]
    }
  ]
}
```

**Рішення:** Перевірте структуру відповіді

---

### Варіант 4: settlementsData має іншу структуру

```
[NovaPoshta] settlementsData: {...}
[NovaPoshta] Available keys: ["Ref", "Description", ...]
```

**Рішення:** API змінив формат відповіді

---

## 🧪 ТЕСТ API ВРУЧНУ

### Curl запит:

```bash
curl -X POST https://api.novaposhta.ua/v2.0/json/ \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "fd61dad0d97e5d3479d7f3164b54b03f",
    "modelName": "Address",
    "calledMethod": "searchSettlements",
    "methodProperties": {
      "searchString": "Київ"
    }
  }'
```

### Очікувана відповідь:

```json
{
  "success": true,
  "data": [
    {
      "settlements": [
        {
          "Ref": "8d5a9238-8f96-11e3-8c4a-0050568002cf",
          "Description": "Київ",
          "RegionDescription": "Київська область"
        }
      ]
    }
  ],
  "errors": [],
  "warnings": [],
  "info": []
}
```

---

## 🔑 ПЕРЕВІРКА API КЛЮЧА

### Крок 1: Зайдіть в особистий кабінет

https://my.novaposhta.ua/settings/

### Крок 2: Перевірте ключ

- Ключ має бути активним
- Термін дії не має бути прострочений
- Ключ має мати доступ до API Address

### Крок 3: Оновіть ключ в Railway

```bash
# В .env.railway або через Railway UI
NOVA_POSHTA_API_KEY=ваш_новий_ключ
```

---

## 📝 ЩО КОПІЮВАТИ

### Скопіюйте з логів Railway:

1. `[NovaPoshta] API Key: ...` (перші 8 символів)
2. `[NovaPoshta] Request body: ...`
3. `[NovaPoshta] Full API response: ...`
4. `[NovaPoshta] settlementsData: ...`
5. `[NovaPoshta] Available keys: ...`

### Вставте в чат для аналізу

---

## 🚨 ШВИДКЕ РІШЕННЯ

Якщо API ключ не працює, спробуйте альтернативний метод:

### Отримання міст через getWarehouses:

```typescript
// Тимчасове рішення
const response = await axios.post(
  NOVA_POSHTA_API_URL,
  {
    apiKey: NOVA_POSHTA_API_KEY,
    modelName: 'Address',
    calledMethod: 'getWarehouses',
    methodProperties: {
      CityName: searchQuery.trim(),
      Limit: 10,
    },
  }
);

// Повертає масив відділень, але може містити інформацію про місто
```

---

**Статус**: Очікування логів для аналізу
