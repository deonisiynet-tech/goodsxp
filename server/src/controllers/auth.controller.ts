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
      console.error('Register error:', error);
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      console.log('Login attempt:', { email, passwordLength: password?.length });
      const result = await authService.login(email, password);
      console.log('Login successful:', { email, role: result.user.role });
      res.json(result);
    } catch (error) {
      console.error('Login error:', error);
      next(error);
    }
  }

  async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const user = await authService.getProfile(userId);
      res.json(user);
    } catch (error) {
      console.error('Get profile error:', error);
      next(error);
    }
  }
}
