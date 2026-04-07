import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * CSRF middleware для cookie-based auth (admin_session).
 * Генерує токен при GET запитах, перевіряє при POST/PUT/PATCH/DELETE.
 * Bearer token requests пропускають CSRF перевірку.
 */

const CSRF_EXEMPT_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/orders',
  '/health',
  '/healthz',
];

function isCsrfExempt(path: string): boolean {
  return CSRF_EXEMPT_PATHS.some((p) => path.startsWith(p));
}

function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Middleware для генерації та перевірки CSRF токенів
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  // Пропускаємо якщо є Bearer token — це API виклик, не браузерна форма
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return next();
  }

  // Перевіряємо чи є admin_session cookie — CSRF потрібен тільки для auth'd запитів
  const hasAdminSession = req.cookies?.admin_session !== undefined;
  if (!hasAdminSession) {
    return next();
  }

  // Пропускаємо exempt paths
  if (isCsrfExempt(req.path)) {
    return next();
  }

  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    // Генерація токена для безпечних методів
    let token = req.cookies?.csrf_token;
    if (!token) {
      token = generateCsrfToken();
      res.cookie('csrf_token', token, {
        httpOnly: false, // Потрібен доступ з JavaScript
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3600000, // 1 год
      });
    }
    res.setHeader('X-CSRF-Token', token);
    return next();
  }

  // Перевірка токена для небезпечних методів
  const csrfToken =
    req.headers['x-csrf-token'] ||
    req.body?._csrf ||
    req.headers['x-xsrf-token'];

  const storedToken = req.cookies?.csrf_token;

  if (!csrfToken || !storedToken || csrfToken !== storedToken) {
    return res.status(403).json({
      error: 'CSRF token validation failed',
      message: 'Недійсний CSRF токен. Оновіть сторінку та спробуйте знову.',
    });
  }

  next();
}

/**
 * Helper: витягнути CSRF токен з cookies для клієнта
 */
export function getCsrfToken(req: Request): string | undefined {
  return req.cookies?.csrf_token;
}