import { Router } from 'express';
import { ProductController } from '../controllers/product.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { uploadMiddleware } from '../middleware/upload.js';
import { reviewRateLimiter } from '../middleware/rateLimiter.js';
import { Role } from '@prisma/client';

const router = Router();
const controller = new ProductController();

// Public routes
router.get('/categories', controller.getAllCategories);
router.get('/related/:productId', controller.getRelated);
router.get('/', controller.getAll);
router.post('/batch', controller.getBatch); // Batch fetch by IDs — MUST be before /:slug
router.get('/id/:id', controller.getById);

// Search autocomplete — MUST be before /:slug
router.get('/search', controller.searchSuggestions);

// Variant routes (public) — MUST be before /:slug to avoid conflicts
router.get('/:productId/variants', controller.getVariants);
router.post('/:productId/variants/find', controller.findVariant);
router.get('/:id/specifications', controller.getSpecifications);

// Slug-based routes — MUST be after specific routes
router.get('/:slug', controller.getBySlug);

// Review routes (by product ID) — ✅ rate limited to prevent spam
router.get('/:id/reviews', controller.getReviews);
router.post('/:id/reviews', reviewRateLimiter, uploadMiddleware, controller.createReview);

// Review routes (by product slug) - for frontend convenience — ✅ rate limited
router.get('/slug/:slug/reviews', controller.getReviewsBySlug);
router.post('/slug/:slug/reviews', reviewRateLimiter, uploadMiddleware, controller.createReviewBySlug);

// Admin routes
router.use(authenticate, authorize(Role.ADMIN));
router.get('/admin/all', controller.getAllAdmin);
router.post('/', uploadMiddleware, controller.create);
router.post('/:id/specifications', controller.saveSpecification);

// Variant routes (admin only — MUST be before /:id to avoid conflicts)
router.post('/:productId/options', controller.createOption);
router.put('/options/:optionId', controller.updateOption);
router.delete('/options/:optionId', controller.deleteOption);
router.post('/options/:optionId/values', controller.createOptionValue);
router.delete('/option-values/:valueId', controller.deleteOptionValue);
router.post('/:productId/variants', controller.createVariant);
router.put('/variants/:variantId', controller.updateVariant);
router.delete('/variants/:variantId', controller.deleteVariant);

// Review delete (admin only — MUST be before /:id to avoid conflicts)
router.delete('/reviews/:reviewId', controller.deleteReview);

// Product CRUD — MUST be after variant routes to avoid conflicts
router.put('/:id', uploadMiddleware, controller.update);
router.delete('/:id', controller.delete);

export default router;
