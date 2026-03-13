import { Router } from 'express';
import prisma from '../prisma/client.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';

const router = Router();

/**
 * POST /api/admin/auth/login
 * Admin login with session cookie
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email та пароль обов\'язкові' });
    }

    // Find user with ADMIN role
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, role: true, password: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Невірний email або пароль' });
    }

    // Check if user is admin
    if (user.role !== Role.ADMIN) {
      return res.status(403).json({ error: 'Доступ дозволено тільки адміністраторам' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Невірний email або пароль' });
    }

    // Generate JWT token
    const secret = process.env.JWT_SECRET || 'default-secret';
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      secret,
      { expiresIn: '7d' }
    );

    // Set secure cookie
    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('admin_session', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    // Log admin action (optional - don't fail if table doesn't exist)
    try {
      await prisma.adminLog.create({
        data: {
          adminId: user.id,
          action: 'LOGIN',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          details: 'Admin login successful',
        },
      });
    } catch (logError: any) {
      // Silently ignore if AdminLog table doesn't exist
      console.warn('⚠️ AdminLog not available:', logError.message);
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Помилка сервера: ' + error.message });
  }
});

/**
 * POST /api/admin/auth/logout
 * Admin logout - clear session cookie
 */
router.post('/logout', async (req, res) => {
  try {
    // Clear the cookie
    res.clearCookie('admin_session', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('Admin logout error:', error);
    res.status(500).json({ error: 'Помилка сервера: ' + error.message });
  }
});

/**
 * GET /api/admin/auth/me
 * Get current admin user from session cookie
 */
router.get('/me', async (req, res) => {
  try {
    const token = req.cookies?.admin_session;

    if (!token) {
      return res.status(401).json({ authenticated: false });
    }

    const secret = process.env.JWT_SECRET || 'default-secret';
    const decoded = jwt.verify(token, secret) as { id: string; email: string; role: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true },
    });

    if (!user || user.role !== Role.ADMIN) {
      res.clearCookie('admin_session', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
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
      },
    });
  } catch (error: any) {
    console.error('Get admin user error:', error);
    res.clearCookie('admin_session', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    res.status(401).json({ authenticated: false });
  }
});

export default router;
