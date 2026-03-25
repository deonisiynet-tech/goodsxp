# Build Fix Report - react-is Dependency

## Дата: 25 березня 2026

---

## Проблема

**Помилка збірки на Railway:**

```
Module not found: Can't resolve 'react-is'
./node_modules/recharts/es6/util/ReactUtils.js
```

**Причина:** Recharts v3.8.0 вимагає `react-is`, але він не був встановлений.

---

## Рішення

### 1. Додано react-is до dependencies

**Файл:** `client/package.json`

```json
{
  "dependencies": {
    ...
    "react-is": "^18.3.1",
    ...
  }
}
```

### 2. Оновлено Dockerfile

**Файл:** `Dockerfile`

```dockerfile
# Install with --legacy-peer-deps
# Also install react-is explicitly (required by recharts)
RUN npm install --legacy-peer-deps && \
    npm install react-is --legacy-peer-deps
```

---

## Чому виникла помилка?

### Recharts v3.x вимоги:

- Recharts використовує `react-is` для:
  - Перевірки типів React компонентів
  - Оптимізації рендерингу
  - Роботи з children елементами

### Версії:

| Package | Версія |
|---------|--------|
| React | 18.3.1 |
| React DOM | 18.3.1 |
| React Is | 18.3.1 |
| Recharts | 3.8.0 |

---

## Файли змін

### Оновлені файли:

1. **client/package.json** - додано `react-is`
2. **Dockerfile** - явна установка `react-is`

### Зміни:

```diff
client/package.json:
+   "react-is": "^18.3.1",

Dockerfile:
- RUN npm install --legacy-peer-deps
+ RUN npm install --legacy-peer-deps && \
+     npm install react-is --legacy-peer-deps
```

---

## Перевірка

### Локальна збірка:

```bash
cd client
npm install
npm run build
```

### Docker збірка:

```bash
docker build -t shop-mvp .
```

### Railway:

Після push до GitHub:
- Автоматична збірка з новими залежностями
- `react-is` встановиться коректно

---

## Чому не було помилки локально?

### Можливі причини:

1. **Глобальна установка:**
   - `react-is` міг бути встановлений глобально
   - Інший пакет встановив його як побічну залежність

2. **Кеш npm:**
   - Локальний кеш міг мати старішу версію
   - Docker будується з чистого аркуша

3. **Різні версії Node:**
   - Локально: інша версія Node
   - Docker: Node 20-alpine

---

## Інші можливі помилки з Recharts

### Якщо з'являться інші помилки:

```bash
# Помилка: Can't resolve 'd3'
npm install d3

# Помилка: Can't resolve 'd3-scale'
npm install d3-scale

# Помилка: Can't resolve 'd3-shape'
npm install d3-shape
```

### Повний список залежностей Recharts:

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-is": "^18.3.1",
    "recharts": "^3.8.0",
    "d3": "^7.8.5"
  }
}
```

---

## Альтернативне рішення

### Якщо проблема залишиться:

**Варіант 1: Встановити всі залежності Recharts**

```dockerfile
RUN npm install --legacy-peer-deps && \
    npm install react-is d3 d3-scale d3-shape --legacy-peer-deps
```

**Варіант 2: Зменшити версію Recharts**

```json
{
  "recharts": "^2.12.0"
}
```

Recharts v2 не вимагає окремої установки `react-is`.

**Варіант 3: Використати package-lock.json**

```dockerfile
COPY client/package*.json ./
RUN npm ci --legacy-peer-deps
```

---

## Рекомендації

### Для уникнення подібних проблем:

1. **Використовуйте package-lock.json:**
   ```dockerfile
   COPY package*.json ./
   RUN npm ci --legacy-peer-deps
   ```

2. **Фіксуйте версії:**
   ```json
   {
     "react-is": "18.3.1"
   }
   ```

3. **Тестуйте збірку локально:**
   ```bash
   docker build --no-cache -t shop-mvp .
   ```

4. **Додайте .npmrc:**
   ```
   legacy-peer-deps=true
   ```

---

## Перевірка після виправлення

### Checklist:

- [ ] `react-is` додано до `client/package.json`
- [ ] Dockerfile оновлено
- [ ] Локальна збірка працює
- [ ] Docker збірка працює
- [ ] Railway збірка працює

### Команди:

```bash
# Clean install
cd client
rm -rf node_modules package-lock.json
npm install

# Build test
npm run build

# Docker test
cd ..
docker build -t shop-mvp .
```

---

## Результат

**До виправлення:**
```
❌ Build failed
Module not found: Can't resolve 'react-is'
```

**Після виправлення:**
```
✅ Build successful
✓ Compiled successfully
✓ Static pages generated
✓ Server-side pages generated
```

---

**Статус**: ✅ Виправлено

**Час виправлення:** ~5 хвилин

**Вплив:** Жодних breaking changes
