/**
 * Утиліта для отримання правильних шляхів до API адмінки
 *
 * УВАГА: api.ts вже має baseURL: '/api', тому getAdminApiPath повертає
 * шлях БЕЗ /api — axios підставить його автоматично.
 * Для прямого fetch використовуйте getAdminApiFullPath.
 */

const ADMIN_PANEL_PATH = process.env.NEXT_PUBLIC_ADMIN_PANEL_PATH || '/admin-x8k2p9-panel';

/**
 * Шлях для axios (БЕЗ /api — axios baseURL підставить його сам)
 * Наприклад: getAdminApiPath('/products') => '/admin-x8k2p9-panel/products'
 * axios baseURL='/api' → фактичний URL: /api/admin-x8k2p9-panel/products
 */
export function getAdminApiPath(path: string): string {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${ADMIN_PANEL_PATH}/${cleanPath}`;
}

/**
 * Повний шлях для прямого fetch (З /api)
 * Наприклад: getAdminApiFullPath('/settings/storeEnabled') => '/api/admin-x8k2p9-panel/settings/storeEnabled'
 */
export function getAdminApiFullPath(path: string): string {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `/api${ADMIN_PANEL_PATH}/${cleanPath}`;
}

/**
 * Отримати шлях до сторінки адмінки
 * Наприклад: getAdminPagePath('/products') => '/admin-x8k2p9-panel/products'
 */
export function getAdminPagePath(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${ADMIN_PANEL_PATH}${cleanPath}`;
}

/**
 * Перевірити, чи є шлях шляхом адмінки
 */
export function isAdminPath(path: string): boolean {
  return path.startsWith(ADMIN_PANEL_PATH);
}

/**
 * Отримати базовий шлях адмінки
 */
export function getAdminBasePath(): string {
  return ADMIN_PANEL_PATH;
}

/**
 * Редірект на сторінку логіну адмінки
 */
export function getAdminLoginUrl(from?: string): string {
  const loginPath = getAdminPagePath('/login');
  if (from) {
    return `${loginPath}?from=${encodeURIComponent(from)}`;
  }
  return loginPath;
}

export { ADMIN_PANEL_PATH };
