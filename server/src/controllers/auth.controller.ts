import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { AuthRequest } from '../middleware/auth.js';
import { loginAttemptService } from '../services/login-attempt.service.js';
import { loginLogService } from '../services/login-log.service.js';

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await authService.register(email, password);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'];

      const result = await authService.login(email, password);

      // ✅ Reset attempts on successful login
      await loginAttemptService.resetAttempts(ip);

      // ✅ Log successful login
      await loginLogService.log({
        email,
        success: true,
        ipAddress: ip,
        userAgent,
        userId: result.user.id,
      });

      res.json(result);
    } catch (error: any) {
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'];
      const { email } = req.body || {};

      // ✅ Record failed attempt
      const { attemptsLeft, blocked } = await loginAttemptService.recordFailedAttempt(ip);

      // ✅ Log failed login
      await loginLogService.log({
        email: email || 'unknown',
        success: false,
        ipAddress: ip,
        userAgent,
        failureReason: error.message?.includes('пароль') ? 'WRONG_PASSWORD' : 'USER_NOT_FOUND',
      });

      // Якщо заблоковано — повертаємо спеціальну відповідь
      if (blocked) {
        return res.status(429).json({
          error: 'Занадто багато невдалих спроб. IP заблоковано на 15 хвилин.',
          blocked: true,
          retryAfterMinutes: 15,
        });
      }

      // Додаємо інформацію про залишок спроб
      if (error.message?.includes('Невірний')) {
        return res.status(401).json({
          error: 'Невірний email або пароль',
          attemptsLeft,
          maxAttempts: 10,
        });
      }

      next(error);
    }
  }

  async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const user = await authService.getProfile(userId);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Запит на скидання пароля — генерує токен
   */
  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Email обов\'язковий' });
      }
      const result = await authService.forgotPassword(email);
      // Завжди повертаємо 200 — не розкриваємо чи існує email
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Скидання пароля з токеном
   */
  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) {
        return res.status(400).json({ error: 'Token і пароль обов\'язкові' });
      }
      const result = await authService.resetPassword(token, newPassword);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}
