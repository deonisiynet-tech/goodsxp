import { Request, Response, NextFunction } from 'express';
import { loginAttemptService } from '../services/login-attempt.service.js';

/**
 * Middleware для ограничения попыток входа
 * Блокирует IP после неудачных попыток
 *
 * 🔒 SECURITY: Fail-closed — при помилці блокуємо запит, а не пропускаємо.
 * Це запобігає brute-force під час Redis outage.
 */
export const limitLoginAttempts = async (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';

  try {
    const { blocked, remainingTime } = await loginAttemptService.isBlocked(ip);

    if (blocked) {
      const minutes = Math.ceil((remainingTime || 0) / 60000);
      return res.status(429).json({
        error: 'Занадто багато спроб входу. IP заблоковано.',
        blocked: true,
        retryAfter: minutes,
        retryAfterMinutes: minutes,
      });
    }

    // Attach service to request for later use
    (req as any).loginAttemptService = loginAttemptService;
    next();
  } catch (error) {
    // 🔒 SECURITY: Fail-closed — при помилці перевірки блокуємо запит
    // Краще заблокувати легітимного користувача ніж допустити brute-force
    console.error('Login attempt check error (fail-closed):', error);
    return res.status(503).json({
      error: 'Сервіс тимчасово недоступний. Спробуйте пізніше.',
      retryAfterMinutes: 15,
    });
  }
};
