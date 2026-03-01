import { Router } from 'express';
import { OrderController } from '../controllers/order.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { Role } from '@prisma/client';

const router = Router();
const controller = new OrderController();

// Public routes
router.post('/', controller.create);
router.get('/:id', controller.getById);

// Admin routes
router.use(authenticate, authorize(Role.ADMIN));
router.get('/admin/all', controller.getAll);
router.patch('/:id/status', controller.updateStatus);
router.delete('/:id', controller.delete);
router.get('/admin/stats', controller.getStats);

export default router;
