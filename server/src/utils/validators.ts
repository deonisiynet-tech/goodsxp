import { z } from 'zod';

/**
 * ✅ БЕЗПЕЧНА санітизація HTML — замість regex використовує proper escaping
 *
 * Попередня версія `input.replace(/<[^>]*>/g, '')` була вразлива:
 * - `<<script>alert(1)<</script>` → `<script>alert(1)</script>` (проходить!)
 * - `<scr<script>ipt>alert(1)</script>` → `<script>alert(1)</script>` (проходить!)
 * - `%3Cscript%3E` — encoded теги не видалялись
 *
 * Нова версія:
 * 1. Декодує URL-encoded символи
 * 2. Видаляє ВСЕ що виглядає як HTML тег (рекурсивно)
 * 3. Екейпить залишки спеціальних символів
 */
function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') return '';

  // 1. Декодуємо URL-encoded символи (наприклад %3Cscript%3E)
  let decoded = input;
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    // Якщо не вдається декодувати — використовуємо оригінал
  }

  // 2. Видаляємо HTML теги рекурсивно (до 10 разів для nested тегів)
  let result = decoded;
  for (let i = 0; i < 10; i++) {
    const prev = result;
    result = result.replace(/<[^>]*>/g, '');
    if (result === prev) break; // Більше тегів немає
  }

  // 3. Екейпимо залишки спеціальних символів для безпеки
  result = result
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

  return result.trim();
}

/**
 * Проста санітизація — тільки видалення тегів без escaping
 * Використовується коли треба зберегти читабельний текст
 * ✅ Рекурсивна — видаляє nested теги
 * ✅ Зберігає переноси рядків
 */
function sanitizeHtmlText(input: string): string {
  if (!input || typeof input !== 'string') return '';

  let result = input;
  for (let i = 0; i < 10; i++) {
    const prev = result;
    result = result.replace(/<[^>]*>/g, '');
    if (result === prev) break;
  }

  return result.trim();
}

/**
 * Санітизація опису товару — дозволяє безпечні HTML теги для форматування.
 * Підтримує жирний текст, курсив, списки, заголовки тощо.
 */
function sanitizeProductDescription(input: string): string {
  if (!input || typeof input !== 'string') return '';

  // Список дозволених тегів для форматування
  const allowedTags = [
    'p', 'br', 'strong', 'b', 'em', 'i', 'u',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'blockquote', 'pre', 'code',
  ];

  // Створюємо regex для дозволених тегів
  const allowedPattern = allowedTags.join('|');
  const allowedRegex = new RegExp(`</?(?:${allowedPattern})(?:\\s[^>]*)?>`, 'gi');

  // Видаляємо всі теги, крім дозволених
  let result = input;

  // Спочатку зберігаємо дозволені теги, замінюючи їх на плейсхолдери
  const savedTags: string[] = [];
  result = result.replace(allowedRegex, (match) => {
    const index = savedTags.length;
    savedTags.push(match);
    return `__TAG_${index}__`;
  });

  // Видаляємо всі інші HTML теги (потенційно небезпечні)
  for (let i = 0; i < 10; i++) {
    const prev = result;
    result = result.replace(/<[^>]*>/g, '');
    if (result === prev) break;
  }

  // Повертаємо дозволені теги назад
  savedTags.forEach((tag, index) => {
    result = result.replace(`__TAG_${index}__`, tag);
  });

  return result.trim();
}

/**
 * Санітизація спеціальних символів для Telegram HTML
 * Екранує < > & щоб унеможливити XSS через Telegram повідомлення
 */
function escapeForTelegramHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export { sanitizeHtml, sanitizeHtmlText, sanitizeProductDescription, escapeForTelegramHtml };

export const registerSchema = z.object({
  email: z.string().email('Некоректний email'),
  password: z.string().min(6, 'Пароль має містити мінімум 6 символів'),
});

export const loginSchema = z.object({
  email: z.string().email('Некоректний email'),
  password: z.string().min(1, 'Пароль обов\'язковий'),
});

export const productSchema = z.object({
  title: z.string().min(1, 'Назва обов\'язкова').max(200).transform(sanitizeHtml),
  description: z.string().min(1, 'Опис обов\'язковий').max(5000).transform(sanitizeProductDescription),
  price: z.coerce.number().positive('Ціна має бути додатною'),
  margin: z.coerce.number().min(0, 'Маржа не може бути менше 0').optional().default(0),
  categoryId: z.string().uuid().optional().nullable(),
  rating: z.coerce.number().min(0).max(5).optional().nullable(),
  originalPrice: z.coerce.number().positive().optional().nullable(),
  discountPrice: z.coerce.number().positive().optional().nullable(),
  isFeatured: z.boolean().optional().default(false),
  isPopular: z.boolean().optional().default(false),
  imageUrl: z.string().optional().nullable(),
  images: z.array(z.string()).optional().default([]),
  stock: z.coerce.number().int().nonnegative().optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export const productUpdateSchema = productSchema.partial();

export const orderSchema = z.object({
  name: z.string().min(1, 'Ім\'я обов\'язкове').max(100).transform(sanitizeHtml),
  phone: z.string().min(5, 'Некоректний телефон').max(20),
  email: z.string().email('Некоректний email').optional().nullable(),
  address: z.string().min(1, 'Адреса обов\'язкова').max(500).optional().nullable().transform((val) => val ? sanitizeHtml(val) : val),
  city: z.string().min(1, 'Місто обов\'язкове').max(200).optional().nullable().transform((val) => val ? sanitizeHtml(val) : val),
  warehouse: z.string().min(1, 'Відділення обов\'язкове').max(200).optional().nullable().transform((val) => val ? sanitizeHtml(val) : val),
  warehouseAddress: z.string().min(1, 'Адреса відділення обов\'язкова').max(500).optional().nullable().transform((val) => val ? sanitizeHtml(val) : val),
  comment: z.string().max(1000).optional().transform((val) => val ? sanitizeHtml(val) : val),
  paymentMethod: z.enum(['COD', 'CARD']).optional().default('COD'),
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      // 🔒 SECURITY: quantity must be positive AND capped at 999 per item
      // Prevents extremely stock-depletion attacks and integer overflow
      quantity: z.number().int().min(1).max(999, 'Кількість не може перевищувати 999'),
      variantId: z.string().uuid().optional().nullable(),
      variantOptions: z.array(
        z.object({
          name: z.string(),
          value: z.string(),
        })
      ).optional().nullable(),
    })
  ).min(1, 'Кошик порожній').max(50, 'Занадто багато товарів в одному замовленні'),
}).refine((data) => {
  // Перевірка: або address, або city+warehouse мають бути заповнені
  return (data.address && data.address.length > 0) ||
         (data.city && data.warehouse);
}, {
  message: 'Вкажіть адресу доставки або оберіть відділення Нової Пошти',
  path: ['address'],
});

export const orderStatusSchema = z.object({
  status: z.enum(['NEW', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
});

export const paginationSchema = z.object({
  page: z.coerce.number().positive().int().optional().default(1),
  limit: z.coerce.number().positive().int().max(1000).optional().default(20),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'price', 'title', 'popularity']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  category: z.string().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
});
