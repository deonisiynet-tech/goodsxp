import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import prisma from '../prisma/client.js';
import { ActionType } from '@prisma/client';
import { getJwtSecret, JWT_ALGORITHM, getTokenVersion } from '../utils/jwt.js';
import { sessionService } from '../services/session.service.js';
import { getClientIp } from '../utils/getClientIp.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: Role;
  };
}

interface JWTPayload {
  id: string;
  email: string;
  role: Role;
  v?: number;
  sid?: string;  // sessionId
}

/**
 * Authenticate user - supports both Bearer token and Cookie
 * Strategy:
 * 1. Try Bearer token if present
 * 2. If Bearer fails but cookie exists → try cookie as fallback
 * 3. If no tokens at all → 401
 * This handles stale localStorage tokens gracefully while keeping cookie sessions alive.
 *
 * 🔒 SECURITY:
 * - Enforces HS256 algorithm (prevents JWT algorithm confusion attacks)
 * - Validates token version (allows server-side token revocation)
 * - Checks user exists on every request
 */
export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const secret = getJwtSecret();
    const serverTokenVersion = getTokenVersion();

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

    /**
     * 🔒 Try to verify a token with enforced HS256 algorithm and token version check.
     */
    const tryVerify = (t: string | undefined): JWTPayload | null => {
      if (!t) return null;
      try {
        // 🔒 Enforce HS256 — prevents algorithm confusion / "none" algorithm attacks
        const decoded = jwt.verify(t, secret, { algorithms: [JWT_ALGORITHM] }) as JWTPayload;

        // 🔒 Token version check — if server version > token version, token is revoked
        if (decoded.v !== undefined && decoded.v < serverTokenVersion) {
          console.warn(`⚠️ Auth: Token version ${decoded.v} < server version ${serverTokenVersion} — token revoked`);
          return null;
        }

        return decoded;
      } catch {
        return null;
      }
    };

    let decoded: JWTPayload | null = null;

    // Step 1: Try Bearer token
    if (bearerToken) {
      decoded = tryVerify(bearerToken);
      if (!decoded && process.env.NODE_ENV !== 'production') {
        console.debug(`Auth: JWT Bearer token invalid, trying cookie fallback...`);
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

    // 🔒 SECURITY: Check if session exists in DB (for admin sessions with sessionId)
    if (decoded.sid) {
      try {
        const session = await prisma.adminSession.findUnique({
          where: { id: decoded.sid },
          select: { id: true, expiresAt: true },
        });

        if (!session) {
          console.warn(`⚠️ Auth: Session ${decoded.sid} not found — token invalidated`);

          // Clear cookie
          if (cookieToken) {
            res.clearCookie('admin_session', {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'strict',
              path: '/',
            });
          }

          return res.status(401).json({
            error: 'Session expired',
            code: 'SESSION_DELETED'
          });
        }

        // Check if session expired
        if (session.expiresAt < new Date()) {
          console.warn(`⚠️ Auth: Session ${decoded.sid} expired`);

          // Delete expired session
          await prisma.adminSession.delete({
            where: { id: decoded.sid },
          }).catch(() => {});

          // Clear cookie
          if (cookieToken) {
            res.clearCookie('admin_session', {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'strict',
              path: '/',
            });
          }

          return res.status(401).json({
            error: 'Session expired',
            code: 'SESSION_EXPIRED'
          });
        }
      } catch (sessionError: any) {
        console.error('❌ Session check error:', sessionError.message);
        // Don't block request on session check error (DB might be down)
        // But log it for monitoring
      }
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

    // Update session activity (async, don't block request)
    const activeToken = cookieToken || bearerToken;
    if (activeToken) {
      sessionService.updateLastActive(activeToken).catch((err) => {
        console.debug('Failed to update session activity:', err.message);
      });
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
              ipAddress: getClientIp(req),
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
