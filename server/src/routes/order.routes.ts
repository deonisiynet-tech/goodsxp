import { Router } from 'express';
import { OrderController } from '../controllers/order.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { strictRateLimiter, apiRateLimiter } from '../middleware/rateLimiter.js';
import { Role } from '@prisma/client';

const router = Router();
const controller = new OrderController();

// Public routes — ✅ rate limited, але з достатнім лімітом для retry
// 5 запитів/хвилину для створення замовлення (дозволяє 1-2 retry)
router.post('/', apiRateLimiter, controller.create);

// Admin routes — MUST be before /:id to avoid route conflict
router.use(authenticate, authorize(Role.ADMIN));
router.get('/admin/all', controller.getAll);
router.get('/admin/stats', controller.getStats);
router.patch('/:id/status', controller.updateStatus);
router.delete('/:id', controller.delete);

// ✅ Protected: only admin or order owner can view
router.get('/:id', authenticate, controller.getById);

export default router;
