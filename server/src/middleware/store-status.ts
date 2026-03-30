import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma/client.js';

/**
 * Middleware для перевірки статусу магазину
 * Якщо магазин вимкнений (storeEnabled = false), додає заголовок X-Store-Status
 * і повертає спеціальну відповідь для публічних маршрутів
 */
export async function checkStoreStatus(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Перевіряємо статус магазину
    const storeEnabledSetting = await prisma.siteSettings.findUnique({
      where: { key: 'storeEnabled' },
    });

    const isStoreEnabled = storeEnabledSetting?.value !== 'false'; // За замовчуванням true

    // Додаємо заголовок для Next.js
    res.setHeader('X-Store-Status', isStoreEnabled ? 'enabled' : 'disabled');

    // Якщо магазин включений - продовжуємо
    if (isStoreEnabled) {
      return next();
    }

    // Якщо магазин вимкнений - перевіряємо, чи це адмінський маршрут
    const isAdminRoute = req.path.startsWith('/api/admin');
    const isAuthRoute = req.path.startsWith('/api/auth') || req.path.startsWith('/api/admin/auth');
    const isHealthRoute = req.path.startsWith('/health');

    // Адмінські та auth маршрути дозволені навіть коли магазин вимкнений
    if (isAdminRoute || isAuthRoute || isHealthRoute) {
      return next();
    }

    // Для API маршрутів повертаємо помилку
    if (req.path.startsWith('/api')) {
      return res.status(503).json({
        success: false,
        error: 'STORE_DISABLED',
        message: 'Магазин тимчасово недоступний через технічні причини',
      });
    }

    // Для веб-маршрутів - пропускаємо далі (Next.js обробить)
    // Але додаємо заголовок, щоб клієнт знав про статус
    return next();
  } catch (error) {
    console.error('[StoreStatus] Error:', error);
    // У разі помилки - пропускаємо запит (fail-safe)
    return next();
  }
}

