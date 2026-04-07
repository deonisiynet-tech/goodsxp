import { Router } from 'express';
import { OrderController } from '../controllers/order.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { strictRateLimiter } from '../middleware/rateLimiter.js';
import { Role } from '@prisma/client';

const router = Router();
const controller = new OrderController();

// Public routes — rate limited to prevent spam
router.post('/', strictRateLimiter, controller.create);
// ✅ Protected: only admin or order owner can view
router.get('/:id', controller.getById);

// Admin routes
router.use(authenticate, authorize(Role.ADMIN));
router.get('/admin/all', controller.getAll);
router.patch('/:id/status', controller.updateStatus);
router.delete('/:id', controller.delete);
router.get('/admin/stats', controller.getStats);

export default router;
