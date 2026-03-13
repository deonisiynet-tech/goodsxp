import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import prisma from '../prisma/client.js';
import { ActionType } from '@prisma/client';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: Role;
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Потрібна авторизація' });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'default-secret';

    const decoded = jwt.verify(token, secret) as { id: string; email: string; role: Role };
    
    // Перевіряємо чи існує користувач
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Користувача не знайдено' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Невірний токен авторизації' });
  }
};

export const authorize = (...roles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Потрібна авторизація' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Недостатньо прав' });
    }

    next();
  };
};

// Middleware для логування дій адмінів
export const logAdminAction = (action: ActionType, entity: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.role === Role.ADMIN) {
      // Логуємо після відповіді
      res.on('finish', async () => {
        try {
          await prisma.adminLog.create({
            data: {
              adminId: req.user!.id,
              action,
              entity,
              entityId: req.params.id,
              details: `${req.method} ${req.path}`,
              ipAddress: req.ip,
              userAgent: req.headers['user-agent'],
            },
          });
        } catch (error: any) {
          // Silently ignore if AdminLog table doesn't exist or any other error
          console.warn('⚠️ AdminLog not available:', error.message);
        }
      });
    }
    next();
  };
};
