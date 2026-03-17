import { Router } from 'express';
import { ProductController } from '../controllers/product.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { uploadMiddleware } from '../middleware/upload.js';
import { Role } from '@prisma/client';

const router = Router();
const controller = new ProductController();

// Public routes
router.get('/', controller.getAll);
router.get('/:id', controller.getById);

// Review routes
router.get('/:id/reviews', controller.getReviews);
router.post('/:id/reviews', controller.createReview);

// Admin routes
router.use(authenticate, authorize(Role.ADMIN));
router.get('/admin/all', controller.getAllAdmin);
router.post('/', uploadMiddleware, controller.create);
router.put('/:id', uploadMiddleware, controller.update);
router.delete('/:id', controller.delete);

export default router;
