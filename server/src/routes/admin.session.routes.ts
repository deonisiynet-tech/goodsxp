import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { csrfProtection } from '../middleware/csrf.js';
import { sessionService } from '../services/session.service.js';
import { twoFAService } from '../services/twoFA.service.js';
import { geoService } from '../services/geo.service.js';

const router = Router();

/**
 * GET /api/admin/sessions
 * Get all active sessions for current user
 */
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const currentToken = req.cookies?.admin_session;

    const sessions = await sessionService.getSessions(userId, currentToken);

    res.json({
      success: true,
      sessions,
    });
  } catch (error: any) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

/**
 * DELETE /api/admin/sessions/:id
 * Logout from specific device (requires 2FA)
 */
router.delete('/:id', authenticate, csrfProtection, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { twoFAToken } = req.body;
    const userId = req.user!.id;

    // Check if user has 2FA enabled
    const user = await twoFAService.isTwoFAEnabled(userId);

    if (user) {
      // 2FA is enabled - require verification
      if (!twoFAToken) {
        return res.status(400).json({
          error: 'Потрібен код 2FA',
          requiresTwoFA: true,
        });
      }

      // Verify 2FA token
      const isValid = await twoFAService.verifyToken(userId, twoFAToken);

      if (!isValid) {
        return res.status(401).json({
          error: 'Невірний код 2FA',
          requiresTwoFA: true,
        });
      }
    }

    // Delete the session
    await sessionService.deleteSession(id, userId);

    res.json({
      success: true,
      message: 'Сесію успішно видалено',
    });
  } catch (error: any) {
    console.error('Delete session error:', error);

    if (error.statusCode === 404) {
      return res.status(404).json({ error: error.message });
    }

    if (error.statusCode === 403) {
      return res.status(403).json({ error: error.message });
    }

    res.status(500).json({ error: 'Помилка сервера' });
  }
});

/**
 * DELETE /api/admin/sessions
 * Logout from all devices except current (requires 2FA)
 */
router.delete('/', authenticate, csrfProtection, async (req: AuthRequest, res: Response) => {
  try {
    const { twoFAToken } = req.body;
    const userId = req.user!.id;
    const currentToken = req.cookies?.admin_session;

    if (!currentToken) {
      return res.status(400).json({ error: 'Поточна сесія не знайдена' });
    }

    // Check if user has 2FA enabled
    const user = await twoFAService.isTwoFAEnabled(userId);

    if (user) {
      // 2FA is enabled - require verification
      if (!twoFAToken) {
        return res.status(400).json({
          error: 'Потрібен код 2FA',
          requiresTwoFA: true,
        });
      }

      // Verify 2FA token
      const isValid = await twoFAService.verifyToken(userId, twoFAToken);

      if (!isValid) {
        return res.status(401).json({
          error: 'Невірний код 2FA',
          requiresTwoFA: true,
        });
      }
    }

    // Delete all sessions except current
    const deletedCount = await sessionService.deleteAllExceptCurrent(userId, currentToken);

    res.json({
      success: true,
      message: `Видалено ${deletedCount} сесій`,
      deletedCount,
    });
  } catch (error: any) {
    console.error('Delete all sessions error:', error);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

/**
 * GET /api/admin/sessions/geo/:ip
 * Get geolocation for IP (для тестування та перевірки)
 */
router.get('/geo/:ip', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { ip } = req.params;
    const geo = await geoService.getLocation(ip);
    const formatted = geoService.formatLocation(geo);

    res.json({
      success: true,
      ip,
      geo,
      formatted,
    });
  } catch (error: any) {
    console.error('Geo lookup error:', error);
    res.status(500).json({ error: 'Помилка геолокації' });
  }
});

export default router;
