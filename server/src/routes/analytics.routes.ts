import { Router } from 'express';
import { Request, Response } from 'express';
import { prisma } from '../prisma/config.js';

const router = Router();

/**
 * Сесія вважається активною, якщо остання активність була менше 30 хв тому.
 * Це запобігає дублюванню при оновленні сторінки або кількох вкладках.
 */
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 хвилин

/**
 * Cleanup старих записів Visitor (>90 днів неактивності)
 * Викликається автоматично при heartbeat (0.1% шанс)
 * Зберігаємо історію 90 днів для аналізу трафіку
 */
async function cleanupOldVisitors() {
  try {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const deleted = await prisma.visitor.deleteMany({
      where: {
        lastSeenAt: {
          lt: ninetyDaysAgo,
        },
      },
    });

    if (deleted.count > 0) {
      console.log(`[Analytics] Cleaned up ${deleted.count} old visitors (>90 days)`);
    }
  } catch (error) {
    console.error('[Analytics] Cleanup error:', error);
  }
}

/**
 * POST /api/analytics/heartbeat
 * Оновлення статусу відвідувача (heartbeat кожні 30 секунд)
 *
 * Логіка захисту від дублювання:
 * - Visitor (онлайн) — upsert, оновлює lastSeenAt. Безпечно, один запис на visitorId.
 * - SiteVisit (сесія) — створюється ТІЛЬКИ якщо немає активної сесії
 *   (останній візит > 30 хв тому або взагалі немає візитів).
 *   Це означає:
 *     • Оновлення сторінки → НЕ створює новий візит
 *     • Кілька вкладок → НЕ створює новий візит (той самий visitorId)
 *     • Повернення через >30 хв → нова сесія (новий візит)
 */
router.post('/heartbeat', async (req: Request, res: Response) => {
  try {
    const { visitorId, fingerprint, page, referrer } = req.body;
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = req.ip || req.socket.remoteAddress || '';

    if (!visitorId) {
      return res.status(400).json({ error: 'visitorId is required' });
    }

    console.log('[Analytics] Heartbeat from:', visitorId, 'page:', page);

    // ✅ Оновлюємо або створюємо відвідувача (upsert — безпечно)
    await prisma.visitor.upsert({
      where: { visitorId },
      update: {
        lastSeenAt: new Date(),
        isOnline: true,
        fingerprint: fingerprint || undefined,
        userAgent: userAgent || undefined,
        ipAddress: ipAddress || undefined,
      },
      create: {
        visitorId,
        fingerprint: fingerprint || undefined,
        lastSeenAt: new Date(),
        isOnline: true,
        userAgent: userAgent || undefined,
        ipAddress: ipAddress || undefined,
      },
    });

    // ✅ Перевіряємо, чи є активна сесія
    const sessionThreshold = new Date(Date.now() - SESSION_TIMEOUT_MS);

    const latestVisit = await prisma.siteVisit.findFirst({
      where: { visitorId },
      orderBy: { sessionStart: 'desc' },
      select: { id: true, sessionStart: true },
    });

    // Створюємо новий візит ТІЛЬКИ якщо:
    // - немає жодного візиту, АБО
    // - останній візит був > 30 хв тому (сесія закінчилась)
    const shouldCreateVisit = !latestVisit || latestVisit.sessionStart < sessionThreshold;

    if (shouldCreateVisit) {
      await prisma.siteVisit.create({
        data: {
          visitorId,
          page: page || undefined,
          referrer: referrer || undefined,
          sessionStart: new Date(),
        },
      });
      console.log('[Analytics] New session created for:', visitorId);
    } else {
      // Оновлюємо існуючу сесію — не створюємо дублікат
      console.log('[Analytics] Session continued for:', visitorId);
    }

    // ✅ Cleanup старих відвідувачів (0.1% шанс при кожному heartbeat)
    // Зменшено частоту для економії ресурсів
    if (Math.random() < 0.001) {
      cleanupOldVisitors().catch(err => console.error('[Analytics] Cleanup failed:', err));
    }

    res.json({ success: true, visitorId });
  } catch (error) {
    console.error('[Analytics] Heartbeat error:', error);
    res.status(500).json({ error: 'Heartbeat failed' });
  }
});

/**
 * GET /api/analytics/online
 * Отримати кількість відвідувачів онлайн (за останні 60 секунд)
 */
router.get('/online', async (req: Request, res: Response) => {
  try {
    // ✅ Відвідувачі, які були активні за останні 60 секунд
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);

    const onlineCount = await prisma.visitor.count({
      where: {
        lastSeenAt: {
          gte: oneMinuteAgo,
        },
      },
    });

    console.log('[Analytics] Online count:', onlineCount);
    res.json({ count: onlineCount });
  } catch (error) {
    console.error('[Analytics] Online count error:', error);
    res.status(500).json({ error: 'Failed to get online count' });
  }
});

/**
 * GET /api/analytics/visitors
 * Отримати кількість унікальних відвідувачів за період
 * Query params: days (1, 3, 7, 30)
 *
 * Рахує по firstSeenAt — коли відвідувач вперше зайшов на сайт
 */
router.get('/visitors', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // ✅ Унікальні відвідувачі за період (по firstSeenAt — перший візит)
    const count = await prisma.visitor.count({
      where: {
        firstSeenAt: {
          gte: startDate,
        },
      },
    });

    console.log('[Analytics] Visitors count:', count, 'days:', days);
    res.json({ count, days, period: `${days} днів` });
  } catch (error) {
    console.error('[Analytics] Visitors count error:', error);
    res.status(500).json({ error: 'Failed to get visitors count' });
  }
});

/**
 * GET /api/analytics/visitors/total
 * Отримати загальну кількість унікальних відвідувачів (за весь час)
 */
router.get('/visitors/total', async (req: Request, res: Response) => {
  try {
    const totalCount = await prisma.visitor.count();

    console.log('[Analytics] Total visitors:', totalCount);
    res.json({ count: totalCount });
  } catch (error) {
    console.error('[Analytics] Total visitors error:', error);
    res.status(500).json({ error: 'Failed to get total visitors' });
  }
});

/**
 * POST /api/analytics/offline
 * Позначити відвідувача як офлайн (при закритті вкладки)
 */
router.post('/offline', async (req: Request, res: Response) => {
  try {
    const { visitorId } = req.body;

    if (!visitorId) {
      return res.status(400).json({ error: 'visitorId is required' });
    }

    await prisma.visitor.updateMany({
      where: { visitorId },
      data: { isOnline: false },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('[Analytics] Offline error:', error);
    res.status(500).json({ error: 'Offline failed' });
  }
});

export default router;
