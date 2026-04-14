import { Router } from 'express';
import { ProductController } from '../controllers/product.controller.js';
import { reviewRateLimiter } from '../middleware/rateLimiter.js';
import { uploadMiddleware } from '../middleware/upload.js';

const router = Router();
const controller = new ProductController();

router.post('/', reviewRateLimiter, uploadMiddleware, controller.createReviewFromBody);

export default router;
