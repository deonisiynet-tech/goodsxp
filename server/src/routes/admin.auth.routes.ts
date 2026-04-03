import { Router, Request, Response } from 'express';
import prisma from '../prisma/client.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { limitLoginAttempts } from '../middleware/loginAttempts.js';
import { loginLogService } from '../services/login-log.service.js';
import { twoFAService } from '../services/twoFA.service.js';

const router = Router();

interface AdminLoginRequest {
  email: string;
  password: string;
  twoFAToken?: string;
}

/**
 * POST /api/admin/auth/login
 * Admin login with 2FA support, rate limiting, and login attempt tracking
 * 
 * Step 1: Send email + password
 * Response: If 2FA is enabled, returns { requiresTwoFA: true }
 *           If 2FA is disabled, returns full session
 * 
 * Step 2: If requiresTwoFA, send { email, password, twoFAToken }
 * Response: Full session
 */
router.post('/login', limitLoginAttempts, async (req: Request, res: Response) => {
  try {
    const { email, password, twoFAToken } = req.body as AdminLoginRequest;
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'];

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email та пароль обов\'язкові' });
    }

    // Find user with ADMIN role
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        role: true,
        password: true,
        twoFAEnabled: true,
        twoFASecret: true,
      },
    });

    // Generic error message - don't reveal what's wrong
    const genericError = 'Невірний email або пароль';

    if (!user) {
      // Log failed attempt
      await loginLogService.log({
        email,
        success: false,
        ipAddress: ip,
        userAgent,
        failureReason: 'USER_NOT_FOUND',
      });

      return res.status(401).json({ error: genericError });
    }

    // Check if user is admin
    if (user.role !== Role.ADMIN) {
      await loginLogService.log({
        email,
        success: false,
        ipAddress: ip,
        userAgent,
        failureReason: 'NOT_ADMIN',
      });

      return res.status(403).json({ error: 'Доступ дозволено тільки адміністраторам' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      await loginLogService.log({
        userId: user.id,
        email,
        success: false,
        ipAddress: ip,
        userAgent,
        failureReason: 'WRONG_PASSWORD',
      });

      return res.status(401).json({ error: genericError });
    }

    // Check if 2FA is enabled
    if (user.twoFAEnabled && user.twoFASecret) {
      // If no 2FA token provided, ask for it
      if (!twoFAToken) {
        return res.json({
          requiresTwoFA: true,
          message: 'Введіть код з Google Authenticator',
        });
      }

      // Verify 2FA token
      const isTwoFAValid = await twoFAService.verifyToken(user.id, twoFAToken);

      if (!isTwoFAValid) {
        await loginLogService.log({
          userId: user.id,
          email,
          success: false,
          ipAddress: ip,
          userAgent,
          failureReason: 'WRONG_2FA',
        });

        return res.status(401).json({ error: 'Невірний код 2FA' });
      }
    }

    // Generate JWT token
    const secret = process.env.JWT_SECRET || 'default-secret';
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      secret,
      { expiresIn: '7d' }
    );

    // Set secure cookie with improved security settings
    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('admin_session', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict', // Changed from 'lax' to 'strict'
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
      domain: isProduction ? undefined : undefined, // Don't set domain for localhost
    });

    // Reset login attempts on successful login
    const attemptService = (req as any).loginAttemptService;
    if (attemptService) {
      await attemptService.resetAttempts(ip);
    }

    // Log successful login
    await loginLogService.log({
      userId: user.id,
      email,
      success: true,
      ipAddress: ip,
      userAgent,
    });

    // Also log to AdminLog for backwards compatibility
    try {
      await prisma.adminLog.create({
        data: {
          adminId: user.id,
          action: 'LOGIN',
          ipAddress: ip,
          userAgent: userAgent || null,
          details: 'Admin login successful',
        },
      });
    } catch (logError: any) {
      console.warn('⚠️ AdminLog not available:', logError.message);
    }

    res.json({
      success: true,
      requiresTwoFA: false,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        twoFAEnabled: user.twoFAEnabled,
      },
    });
  } catch (error: any) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

/**
 * POST /api/admin/auth/logout
 * Admin logout - clear session cookie
 */
router.post('/logout', async (req: Request, res: Response) => {
  try {
    // Get admin info from token before clearing
    let adminId: string | undefined = undefined;
    const token = req.cookies?.admin_session;
    if (token) {
      try {
        const secret = process.env.JWT_SECRET || 'default-secret';
        const decoded = jwt.verify(token, secret) as { id: string; email: string; role: string };
        adminId = decoded.id;
      } catch (e) {
        // Token invalid, just proceed with logout
      }
    }

    // Clear the cookie with secure settings
    res.clearCookie('admin_session', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    // Log admin action
    if (adminId) {
      try {
        await prisma.adminLog.create({
          data: {
            adminId,
            action: 'LOGOUT',
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            details: 'Admin logout',
          },
        });
      } catch (logError: any) {
        console.warn('⚠️ Failed to log admin logout:', logError.message);
      }
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Admin logout error:', error);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

/**
 * GET /api/admin/auth/me
 * Get current admin user from session cookie
 */
router.get('/me', async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.admin_session;

    if (!token) {
      return res.status(401).json({ authenticated: false });
    }

    const secret = process.env.JWT_SECRET || 'default-secret';
    const decoded = jwt.verify(token, secret) as { id: string; email: string; role: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, twoFAEnabled: true },
    });

    if (!user || user.role !== Role.ADMIN) {
      res.clearCookie('admin_session', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
      });
      return res.status(401).json({ authenticated: false });
    }

    res.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        twoFAEnabled: user.twoFAEnabled,
      },
    });
  } catch (error: any) {
    console.error('Get admin user error:', error);
    res.clearCookie('admin_session', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });
    res.status(401).json({ authenticated: false });
  }
});

/**
 * GET /api/admin/auth/2fa/status
 * Check 2FA status for current admin
 */
router.get('/2fa/status', async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.admin_session;

    if (!token) {
      return res.status(401).json({ error: 'Потрібна авторизація' });
    }

    const secret = process.env.JWT_SECRET || 'default-secret';
    const decoded = jwt.verify(token, secret) as { id: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { twoFAEnabled: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'Користувача не знайдено' });
    }

    res.json({
      twoFAEnabled: user.twoFAEnabled,
    });
  } catch (error: any) {
    console.error('Get 2FA status error:', error);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

/**
 * POST /api/admin/auth/2fa/generate
 * Generate 2FA secret for current admin
 */
router.post('/2fa/generate', async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.admin_session;

    if (!token) {
      return res.status(401).json({ error: 'Потрібна авторизація' });
    }

    const secret = process.env.JWT_SECRET || 'default-secret';
    const decoded = jwt.verify(token, secret) as { id: string };

    const result = await twoFAService.generateSecret(decoded.id);

    res.json({
      secret: result.secret,
      qrCode: result.qrCode,
      otpauthUrl: result.otpauthUrl,
    });
  } catch (error: any) {
    console.error('Generate 2FA secret error:', error);
    if (error.message.includes('вже увімкнено')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

/**
 * POST /api/admin/auth/2fa/enable
 * Enable 2FA for current admin (after verifying token)
 */
router.post('/2fa/enable', async (req: Request, res: Response) => {
  try {
    const { token: twoFAToken } = req.body;

    if (!twoFAToken) {
      return res.status(400).json({ error: 'Потрібен код 2FA' });
    }

    const token = req.cookies?.admin_session;

    if (!token) {
      return res.status(401).json({ error: 'Потрібна авторизація' });
    }

    const secret = process.env.JWT_SECRET || 'default-secret';
    const decoded = jwt.verify(token, secret) as { id: string };

    await twoFAService.enableTwoFA(decoded.id, twoFAToken);

    res.json({ success: true, message: '2FA успішно увімкнено' });
  } catch (error: any) {
    console.error('Enable 2FA error:', error);
    if (error.message.includes('Невірний')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

/**
 * POST /api/admin/auth/2fa/disable
 * Disable 2FA for current admin
 */
router.post('/2fa/disable', async (req: Request, res: Response) => {
  try {
    const { token: twoFAToken } = req.body;

    if (!twoFAToken) {
      return res.status(400).json({ error: 'Потрібен код 2FA' });
    }

    const token = req.cookies?.admin_session;

    if (!token) {
      return res.status(401).json({ error: 'Потрібна авторизація' });
    }

    const secret = process.env.JWT_SECRET || 'default-secret';
    const decoded = jwt.verify(token, secret) as { id: string };

    await twoFAService.disableTwoFA(decoded.id, twoFAToken);

    res.json({ success: true, message: '2FA успішно вимкнено' });
  } catch (error: any) {
    console.error('Disable 2FA error:', error);
    if (error.message.includes('Невірний') || error.message.includes('не увімкнено')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

/**
 * GET /api/admin/auth/logs
 * Get login logs (admin only)
 */
router.get('/logs', async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.admin_session;

    if (!token) {
      return res.status(401).json({ error: 'Потрібна авторизація' });
    }

    const secret = process.env.JWT_SECRET || 'default-secret';
    const decoded = jwt.verify(token, secret) as { id: string; role: string };

    if (decoded.role !== Role.ADMIN) {
      return res.status(403).json({ error: 'Доступ дозволено тільки адміністраторам' });
    }

    const { limit = '50', offset = '0', email, success } = req.query;

    const result = await loginLogService.getLogs({
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
      email: email as string,
      success: success === 'true' ? true : success === 'false' ? false : undefined,
    });

    res.json(result);
  } catch (error: any) {
    console.error('Get login logs error:', error);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

export default router;
