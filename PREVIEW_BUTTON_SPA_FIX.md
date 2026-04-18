# Preview Button Fix - SPA Navigation

## Проблема
Кнопка Preview (👁) в адмінці товарів відкривала новий таб через `window.open()`, що створювало багато вкладок і погіршувало UX.

## Рішення
Замінено `window.open()` на Next.js `router.push()` для SPA-навігації в тому ж вікні.

## Зміни

### 1. ProductGridView.tsx
- Додано `import { useRouter } from 'next/navigation'`
- Додано `const router = useRouter()` в компонент
- Замінено `window.open()` на `router.push(/catalog/${product.slug}?preview=true)`

### 2. ProductListView.tsx
- Додано `import { useRouter } from 'next/navigation'`
- Додано `const router = useRouter()` в компонент
- Замінено `window.open()` на `router.push(/catalog/${product.slug}?preview=true)`

### 3. ProductClient.tsx (вже було готово)
- Preview режим вже підтримується через `searchParams.get('preview') === 'true'`
- Банер з кнопкою "Назад в адмінку" вже реалізований через `<Link href="/admin-x8k2p9-panel/products">`
- Використовує Next.js Link компонент (не window.open)

## Поведінка після фіксу

### Адмінка → Preview
1. Користувач натискає 👁 Preview
2. Той самий таб переходить на `/catalog/{slug}?preview=true`
3. Показується банер "Режим перегляду (Preview)" зверху
4. Відображається кнопка "Назад в адмінку"

### Preview → Адмінка
1. Користувач натискає "Назад в адмінку"
2. Той самий таб повертається на `/admin-x8k2p9-panel/products`
3. Жодних нових вкладок не створюється

## Результат
✅ Preview відкривається в тому ж вікні (SPA navigation)
✅ Не створюються нові вкладки браузера
✅ Зберігається layout адмінки
✅ Кнопка "Назад в адмінку" працює коректно
✅ Заборонено використання window.open

Дата: 2026-04-18
