import { Router } from 'express';
import { Request, Response } from 'express';
import { prisma } from '../prisma/config.js';

const router = Router();

/**
 * POST /api/analytics/heartbeat
 * Оновлення статусу відвідувача (heartbeat кожні 30 секунд)
 */
router.post('/heartbeat', async (req: Request, res: Response) => {
  try {
    const { visitorId, page, referrer } = req.body;
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = req.ip || req.socket.remoteAddress || '';

    if (!visitorId) {
      return res.status(400).json({ error: 'visitorId is required' });
    }

    console.log('[Analytics] Heartbeat from:', visitorId, 'page:', page);

    // ✅ Оновлюємо або створюємо відвідувача
    await prisma.visitor.upsert({
      where: { visitorId },
      update: {
        lastSeenAt: new Date(),
        isOnline: true,
        userAgent: userAgent || undefined,
        ipAddress: ipAddress || undefined,
      },
      create: {
        visitorId,
        lastSeenAt: new Date(),
        isOnline: true,
        userAgent: userAgent || undefined,
        ipAddress: ipAddress || undefined,
      },
    });

    // ✅ Створюємо новий візит (без foreign key)
    await prisma.siteVisit.create({
      data: {
        visitorId,
        page: page || undefined,
        referrer: referrer || undefined,
      },
    });

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
 * Query params: days (1, 3, 7)
 */
router.get('/visitors', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // ✅ Унікальні відвідувачі за період (по lastSeenAt)
    const uniqueVisitors = await prisma.visitor.findMany({
      where: {
        lastSeenAt: {
          gte: startDate,
        },
      },
      select: {
        visitorId: true,
      },
    });

    const count = uniqueVisitors.length;
    console.log('[Analytics] Visitors count:', count, 'days:', days);
    res.json({ count, days, period: `${days} днів` });
  } catch (error) {
    console.error('[Analytics] Visitors count error:', error);
    res.status(500).json({ error: 'Failed to get visitors count' });
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
