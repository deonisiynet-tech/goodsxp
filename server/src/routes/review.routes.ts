import { Router } from 'express';
import { ProductController } from '../controllers/product.controller.js';
import { reviewRateLimiter } from '../middleware/rateLimiter.js';
import { uploadMiddleware } from '../middleware/upload.js';

const router = Router();
const controller = new ProductController();

// ✅ Public route — anyone can leave a review (rate limited to prevent spam)
router.post('/', reviewRateLimiter, uploadMiddleware, controller.createReviewFromBody);

export default router;
