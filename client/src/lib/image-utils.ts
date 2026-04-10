/**
 * Універсальна функція нормалізації URL зображень
 * 
 * Перетворює будь-який формат URL у валідний src для Next.js Image:
 * - Cloudinary URL (https://res.cloudinary.com/...) → як є
 * - Повні URL (https://...) → як є
 * - Відносні шляхи (/uploads/...) → повний URL через SITE_URL
 * - "uploads/..." (без /) → /uploads/...
 * - null/undefined/порожній → placeholder
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://goodsxp.store';

export function normalizeImageUrl(url: string | null | undefined): string {
  // Порожній або null/undefined → placeholder
  if (!url || url.trim() === '') {
    return '/placeholder.svg';
  }

  // Вже повний URL → повертаємо як є
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // Відносний шлях без / на початку (наприклад "uploads/photo.jpg")
  if (!url.startsWith('/')) {
    url = `/${url}`;
  }

  // Відносний шлях (/uploads/...) → робимо абсолютний URL
  // Next.js Image з відносними шляхами шукає файл в public/
  // А uploads знаходиться на сервері, тому потрібен повний URL
  return `${SITE_URL}${url}`;
}
