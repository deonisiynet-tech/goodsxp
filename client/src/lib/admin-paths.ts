/**
 * Утиліта для отримання правильних шляхів до API адмінки
 * Всі API виклики повинні використовувати цю утилиту
 */

const ADMIN_PANEL_PATH = process.env.NEXT_PUBLIC_ADMIN_PANEL_PATH || '/admin-x8k2p9-panel';

/**
 * Отримати повний шлях до API адмінки
 * Наприклад: getAdminApiPath('/products') => '/api/admin-x8k2p9-panel/products'
 */
export function getAdminApiPath(path: string): string {
  // Видаляємо leading slash якщо є
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
