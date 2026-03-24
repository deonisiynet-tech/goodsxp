# Styled-JSX Fix / Виправлення помилки useContext

## Проблема
```
TypeError: Cannot read properties of null (reading 'useContext')
    at exports.useContext (/app/node_modules/react/cjs/react.production.min.js:24:495)
    at StyleRegistry (/app/node_modules/styled-jsx/dist/index/index.js:450:30)
```

## Причина
Конфлікт між styled-jsx (вбудований в Next.js) та Tailwind CSS. Styled-jsx намагається використати React context під час SSR, але React ще не ініціалізований.

## Вирішення

### 1. Оновлено версії в `client/package.json`:
```json
"next": "^14.2.0",
"react": "^18.3.1",
"react-dom": "^18.3.1"
```

### 2. Створено `client/babel.config.js`:
```javascript
module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['next/babel'],
    plugins: [],
  }
}
```

### 3. Оновлено `client/next.config.mjs`:
```javascript
const nextConfig = {
  // ...
  compiler: {
    styledComponents: false,
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'react-hot-toast'],
  },
}
```

## Деплой на Railway

Після пушу змін Railway автоматично:
1. Видалить старі `node_modules`
2. Встановить нові версії
3. Перезбере проект

### Команди для локального тестування:
```bash
cd client
npm run clean:all
npm install
npm run build
npm run start
```

## Перевірка

Після деплою перевірте:
1. ✅ Головна сторінка завантажується
2. ✅ `/catalog` працює
3. ✅ `/catalog/[slug]` відкривається
4. ✅ Немає помилок в логах Railway

## Альтернативне рішення (якщо не допоможе)

Якщо помилка залишиться, спробуйте:

### Варіант A: Повне видалення styled-jsx
```bash
cd client
npm install --save-dev @babel/core
# Додати до babel.config.js:
plugins: [['styled-jsx/babel', { optimizeForSpeed: true }]]
```

### Варіант B: Вимкнути SSR для проблемних компонентів
```javascript
// В component files
'use client'
import dynamic from 'next/dynamic'
const Component = dynamic(() => import('./Component'), { ssr: false })
```

## Примітки

- styled-jsx вбудований в Next.js, тому не видаляється
- Tailwind CSS не використовує styled-jsx
- Конфлікт виникає тільки при SSR
