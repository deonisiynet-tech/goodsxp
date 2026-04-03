import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma/client.js';
import { getAdminApiPrefix } from '../utils/adminPaths.js';

/**
 * Middleware для перевірки статусу магазину
 * Якщо магазин вимкнений (storeEnabled = false):
 * - Блокує публічні API маршрути
 * - Дозволяє адмінські маршрути (з динамічним префіксом)
 * - Дозволяє auth маршрути
 * - Додає заголовок X-Store-Status для клієнта
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

    // ✅ ЯКЩО МАГАЗИН ВКЛЮЧЕНИЙ - ПРОДОВЖУЄМО
    if (isStoreEnabled) {
      return next();
    }

    // ✅ ЯКЩО МАГАЗИН ВИМКНЕНИЙ - ПЕРЕВІРЯЄМО МАРШРУТ

    // Отримуємо динамічний префікс адмінки
    const adminApiPrefix = getAdminApiPrefix();

    // Адмінські маршрути - завжди дозволені (з динамічним префіксом)
    const isAdminRoute = req.path.startsWith(adminApiPrefix);
    if (isAdminRoute) {
      return next();
    }

    // Auth маршрути - завжди дозволені (для перевірки ролі)
    const isAuthRoute = req.path.startsWith('/api/auth') || req.path.startsWith(`${adminApiPrefix}/auth`);
    if (isAuthRoute) {
      return next();
    }

    // Health check - завжди дозволений
    const isHealthRoute = req.path.startsWith('/health');
    if (isHealthRoute) {
      return next();
    }

    // Для інших API маршрутів - повертаємо помилку
    if (req.path.startsWith('/api')) {
      return res.status(503).json({
        success: false,
        error: 'STORE_DISABLED',
        message: 'Магазин тимчасово недоступний через технічні причини',
      });
    }

    // ✅ ДЛЯ ВЕБ-МАРШРУТІВ - ПРОПУСКАЄМО ДАЛІ
    // Next.js обробить і StoreClosedBanner покаже сторінку для не-адмінів
    // Адміни мають доступ до всіх сторінок
    return next();
  } catch (error) {
    console.error('[StoreStatus] Error:', error);
    // У разі помилки - пропускаємо запит (fail-safe)
    return next();
  }
}

