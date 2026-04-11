import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import prisma from '../prisma/client.js';
import { ActionType } from '@prisma/client';
import { getJwtSecret } from '../utils/jwt.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: Role;
  };
}

/**
 * Authenticate user - supports both Bearer token and Cookie
 * Enhanced security: validates user exists on every request
 */
export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;
    let tokenSource = 'none';

    // First check Authorization header (Bearer token)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
      tokenSource = 'Bearer';
    }

    // If no Bearer token, check cookies (for admin session)
    if (!token && req.cookies) {
      token = req.cookies.admin_session;
      tokenSource = 'cookie';
    }

    // No token found
    if (!token) {
      console.warn(`⚠️ Auth: No token found (path: ${req.path}, method: ${req.method})`);
      console.warn(`   Cookies present: ${Object.keys(req.cookies || {})}`);
      return res.status(401).json({ error: 'Потрібна авторизація' });
    }

    const secret = getJwtSecret();

    let decoded: { id: string; email: string; role: Role };
    try {
      decoded = jwt.verify(token, secret) as { id: string; email: string; role: Role };
    } catch (jwtError: any) {
      console.warn(`⚠️ Auth: JWT verify failed (${tokenSource}): ${jwtError.message}`);
      // Token expired or invalid - clear cookie if it was from cookie
      if (req.cookies?.admin_session) {
        res.clearCookie('admin_session', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/',
        });
      }
      return res.status(401).json({ error: 'Невірний токен авторизації' });
    }

    // Check if user exists (validate on every request for security)
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      // User deleted but token still valid - clear cookie
      if (req.cookies?.admin_session) {
        res.clearCookie('admin_session', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/',
        });
      }
      return res.status(401).json({ error: 'Користувача не знайдено' });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error: any) {
    console.error('❌ Auth error:', error.message);
    return res.status(401).json({ error: 'Помилка авторизації' });
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
