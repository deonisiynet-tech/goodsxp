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
 * Strategy:
 * 1. Try Bearer token if present
 * 2. If Bearer fails but cookie exists → try cookie as fallback
 * 3. If no tokens at all → 401
 * This handles stale localStorage tokens gracefully while keeping cookie sessions alive.
 */
export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const secret = getJwtSecret();

    // Collect available tokens
    const authHeader = req.headers.authorization;
    const bearerToken = (authHeader && authHeader.startsWith('Bearer '))
      ? authHeader.split(' ')[1]
      : undefined;
    const cookieToken = req.cookies?.admin_session;

    // No tokens at all
    if (!bearerToken && !cookieToken) {
      console.warn(`⚠️ Auth: No token found (path: ${req.path}, method: ${req.method})`);
      return res.status(401).json({ error: 'Потрібна авторизація' });
    }

    /** Try to verify a token, return decoded or null */
    const tryVerify = (t: string | undefined): { id: string; email: string; role: Role } | null => {
      if (!t) return null;
      try {
        return jwt.verify(t, secret) as { id: string; email: string; role: Role };
      } catch {
        return null;
      }
    };

    let decoded: { id: string; email: string; role: Role } | null = null;

    // Step 1: Try Bearer token
    if (bearerToken) {
      decoded = tryVerify(bearerToken);
      if (!decoded) {
        console.warn(`⚠️ Auth: JWT Bearer token invalid, trying cookie fallback...`);
      }
    }

    // Step 2: If Bearer failed, try cookie
    if (!decoded && cookieToken) {
      decoded = tryVerify(cookieToken);
    }

    // Step 3: All tokens invalid
    if (!decoded) {
      // Clear stale cookie if present
      if (cookieToken) {
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
      if (cookieToken) {
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
