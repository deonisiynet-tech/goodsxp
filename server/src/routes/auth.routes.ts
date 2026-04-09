import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { strictRateLimiter, apiRateLimiter } from '../middleware/rateLimiter.js';
import { limitLoginAttempts } from '../middleware/loginAttempts.js';
import { Role } from '@prisma/client';

const router = Router();
const controller = new AuthController();

// ✅ Rate limiting + login attempt tracking
router.post('/register', strictRateLimiter, controller.register);
router.post('/login', limitLoginAttempts, strictRateLimiter, controller.login);
router.post('/forgot-password', apiRateLimiter, controller.forgotPassword);
router.post('/reset-password', apiRateLimiter, controller.resetPassword);
router.get('/profile', authenticate, controller.getProfile);

export default router;
