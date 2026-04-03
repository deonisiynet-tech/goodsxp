import { Request, Response, NextFunction } from 'express';
import { loginAttemptService } from '../services/login-attempt.service.js';

/**
 * Middleware для ограничения попыток входа
 * Блокирует IP после 3 неудачных попыток на 10 минут
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
    console.error('Login attempt check error:', error);
    // On error, allow the request to proceed
    (req as any).loginAttemptService = loginAttemptService;
    next();
  }
};
