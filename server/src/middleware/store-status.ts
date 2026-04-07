import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma/client.js';
import { getAdminApiPrefix } from '../utils/adminPaths.js';

/**
 * Кеш статусу магазину з TTL 10 секунд
 * Запобігає запиту БД на кожному запиті
 */
let storeStatusCache: { value: boolean; expiresAt: number } | null = null;
const STORE_STATUS_TTL_MS = 10_000; // 10 секунд

async function getStoreStatus(): Promise<boolean> {
  const now = Date.now();

  // Перевіряємо кеш
  if (storeStatusCache && storeStatusCache.expiresAt > now) {
    return storeStatusCache.value;
  }

  // Запитуємо БД
  try {
    const storeEnabledSetting = await prisma.siteSettings.findUnique({
      where: { key: 'storeEnabled' },
    });

    const isEnabled = storeEnabledSetting?.value !== 'false';

    // Зберігаємо в кеш
    storeStatusCache = {
      value: isEnabled,
      expiresAt: now + STORE_STATUS_TTL_MS,
    };

    return isEnabled;
  } catch (error) {
    // У разі помилки — повертаємо true (fail-safe)
    console.error('[StoreStatus] DB error:', error);
    return true;
  }
}

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
    const isStoreEnabled = await getStoreStatus();

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

