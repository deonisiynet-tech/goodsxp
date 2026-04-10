/**
 * Форматує order number у комерційний формат GX-XXXX
 * 
 * Приклади:
 *   1     → GX-1001
 *   42    → GX-1042
 *   1000  → GX-2000
 * 
 * Базове зміщення: 1000 — щоб перший замовлення не було #1
 */
const BASE_OFFSET = 1000;

export function formatOrderNumber(value: number | string | undefined | null): string {
  if (!value) return 'GX-----';

  // Якщо це число (або рядок-число)
  const num = typeof value === 'string' ? parseInt(value, 10) : value;

  if (!isNaN(num) && num > 0) {
    return `GX-${num + BASE_OFFSET}`;
  }

  // Fallback для UUID або інших рядків
  if (typeof value === 'string') {
    return `GX-${value.slice(0, 8).toUpperCase()}`;
  }

  return 'GX-----';
}
