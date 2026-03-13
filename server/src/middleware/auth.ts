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

/**
 * Authenticate user - supports both Bearer token and Cookie
 */
export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;

    // First check Authorization header (Bearer token)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
      console.log('🔑 Auth: Found Bearer token');
    }

    // If no Bearer token, check cookies (for admin session)
    if (!token && req.cookies) {
      token = req.cookies.admin_session;
      if (token) {
        console.log('🔑 Auth: Found admin_session cookie');
      }
    }

    // No token found
    if (!token) {
      console.log('⚠️ Auth: No token found');
      return res.status(401).json({ error: 'Потрібна авторизація' });
    }

    const secret = process.env.JWT_SECRET || 'default-secret';

    const decoded = jwt.verify(token, secret) as { id: string; email: string; role: Role };

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      console.log('⚠️ Auth: User not found');
      return res.status(401).json({ error: 'Користувача не знайдено' });
    }

    req.user = user;
    console.log('✅ Auth: User authenticated:', user.email, user.role);
    next();
  } catch (error: any) {
    console.error('❌ Auth error:', error.message);
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
