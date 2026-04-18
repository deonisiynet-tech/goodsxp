import { Router } from 'express';
import { OrderController } from '../controllers/order.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { orderRateLimiter } from '../middleware/rateLimiter.js';
import { csrfProtection } from '../middleware/csrf.js';
import { Role } from '@prisma/client';

const router = Router();
const controller = new OrderController();

// Public routes — ✅ спеціальний rate limiter для замовлень (5 за 5 хв)
// 🔒 CSRF protection for order creation to prevent cross-site request forgery
router.post('/', csrfProtection, orderRateLimiter, controller.create);

// ✅ Protected: звичайний користувач бачить свої замовлення
router.get('/my', authenticate, controller.getMyOrders);

// ✅ Protected: only admin or order owner can view single order
router.get('/:id', authenticate, controller.getById);

// Admin routes — MUST be before /:id to avoid route conflict
router.use(authenticate, authorize(Role.ADMIN));
router.get('/admin/all', controller.getAll);
router.get('/admin/stats', controller.getStats);
router.patch('/:id/status', controller.updateStatus);
router.delete('/:id', controller.delete);

export default router;
