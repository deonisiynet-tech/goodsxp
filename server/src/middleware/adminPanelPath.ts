import { Request, Response, NextFunction } from 'express';

/**
 * Получаем скрытый путь админки из переменных окружения
 */
const getAdminPanelPath = (): string => {
  return process.env.ADMIN_PANEL_PATH || '/admin-x8k2p9-panel';
};

/**
 * Middleware для блокировки сканирования стандартных путей админки
 * Возвращает 404 для всех известных путей админ-панелей
 */
const blockedPaths = [
  '/admin',
  '/admin/',
  '/wp-admin',
  '/wp-admin/',
  '/administrator',
  '/administrator/',
  '/dashboard',
  '/dashboard/',
  '/admin-panel',
  '/admin-panel/',
  '/adminpanel',
  '/adminpanel/',
  '/cpanel',
  '/cpanel/',
  '/manager',
  '/manager/',
  '/backend',
  '/backend/',
  '/control',
  '/control/',
  '/console',
  '/console/',
];

/**
 * Middleware для блокировки сканирования стандартных путей
 * Если кто-то пытается получить доступ к /admin, /wp-admin и т.д. - возвращаем 404
 */
export const blockAdminScanning = (req: Request, res: Response, next: NextFunction) => {
  const pathname = req.path.toLowerCase();

  // Проверяем, не совпадает ли путь с заблокированными
  if (blockedPaths.includes(pathname)) {
    // Логируем попытку сканирования
    console.warn(`🚨 Admin scanning attempt blocked: ${pathname} from ${req.ip}`);

    // Возвращаем 404 - как будто такой страницы не существует
    return res.status(404).json({
      error: 'Not found',
      message: 'The page you are looking for does not exist.',
    });
  }

  next();
};

/**
 * Middleware для проверки скрытого пути админки
 * Должен применяться ко всем маршрутам, которые начинаются с ADMIN_PANEL_PATH
 */
export const verifyAdminPanelPath = (req: Request, res: Response, next: NextFunction) => {
  const adminPanelPath = getAdminPanelPath();
  const pathname = req.path.toLowerCase();

  // Проверяем, что путь начинается с правильного префикса
  if (!pathname.startsWith(adminPanelPath.toLowerCase())) {
    console.warn(`🚨 Invalid admin panel path: ${pathname} (expected: ${adminPanelPath})`);
    return res.status(404).json({
      error: 'Not found',
      message: 'The page you are looking for does not exist.',
    });
  }

  next();
};

/**
 * Helper для получения полного пути к API админки
 * Например: /api/admin/auth -> /api{ADMIN_PANEL_PATH}/auth
 */
export const getAdminApiPath = (subPath: string = ''): string => {
  const adminPanelPath = getAdminPanelPath();
  return `/api${adminPanelPath}${subPath}`;
};

export { getAdminPanelPath, blockedPaths };
