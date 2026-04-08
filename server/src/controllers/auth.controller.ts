import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { AuthRequest } from '../middleware/auth.js';

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
      const result = await authService.login(email, password);
      res.json(result);
    } catch (error) {
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
      const { token, password } = req.body;
      if (!token || !password) {
        return res.status(400).json({ error: 'Token і пароль обов\'язкові' });
      }
      const result = await authService.resetPassword(token, password);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}
