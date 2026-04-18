import { Router } from 'express';
import { ProductController } from '../controllers/product.controller.js';
import { reviewRateLimiter } from '../middleware/rateLimiter.js';
import { uploadMiddleware } from '../middleware/upload.js';
import { csrfProtection } from '../middleware/csrf.js';

const router = Router();
const controller = new ProductController();

// 🔒 CSRF protection for review creation to prevent cross-site request forgery
router.post('/', csrfProtection, reviewRateLimiter, uploadMiddleware, controller.createReviewFromBody);

export default router;
