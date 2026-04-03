/**
 * Утиліта для отримання правильних шляхів до API адмінки на бэкенді
 */

const ADMIN_PANEL_PATH = process.env.ADMIN_PANEL_PATH || '/admin-x8k2p9-panel';

/**
 * Отримати префікс для API адмінки
 * Наприклад: '/api/admin-x8k2p9-panel'
 */
export function getAdminApiPrefix(): string {
  return `/api${ADMIN_PANEL_PATH}`;
}

/**
 * Перевірити, чи є шлях шляхом API адмінки
 */
export function isAdminApiPath(path: string): boolean {
  return path.startsWith(getAdminApiPrefix());
}

/**
 * Отримати базовий шлях адмінки
 */
export function getAdminPanelPath(): string {
  return ADMIN_PANEL_PATH;
}

export { ADMIN_PANEL_PATH };
