import { Router } from 'express';
import { ProductController } from '../controllers/product.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { uploadMiddleware } from '../middleware/upload.js';
import { reviewRateLimiter } from '../middleware/rateLimiter.js';
import { validateUuid } from '../middleware/validateUuid.js';
import { Role } from '@prisma/client';

const router = Router();
const controller = new ProductController();

// Public routes
router.get('/categories', controller.getAllCategories);
router.get('/related/:productId', validateUuid('productId'), controller.getRelated);
router.get('/', controller.getAll);
router.post('/batch', controller.getBatch); // Batch fetch by IDs — MUST be before /:slug
router.get('/id/:id', validateUuid('id'), controller.getById);

// Search autocomplete — MUST be before /:slug
router.get('/search', controller.searchSuggestions);

// Variant routes (public) — MUST be before /:slug to avoid conflicts
router.get('/:productId/variants', validateUuid('productId'), controller.getVariants);
router.post('/:productId/variants/find', validateUuid('productId'), controller.findVariant);
router.get('/:id/specifications', validateUuid('id'), controller.getSpecifications);

// Slug-based routes — MUST be after specific routes
router.get('/:slug', controller.getBySlug);

// Review routes (by product ID) — ✅ rate limited to prevent spam
router.get('/:id/reviews', validateUuid('id'), controller.getReviews);
router.post('/:id/reviews', validateUuid('id'), reviewRateLimiter, uploadMiddleware, controller.createReview);

// Review routes (by product slug) - for frontend convenience — ✅ rate limited
router.get('/slug/:slug/reviews', controller.getReviewsBySlug);
router.post('/slug/:slug/reviews', reviewRateLimiter, uploadMiddleware, controller.createReviewBySlug);

// Review delete (admin only) — ✅ MUST be before admin middleware to avoid conflicts
router.delete('/reviews/:reviewId', authenticate, authorize(Role.ADMIN), validateUuid('reviewId'), controller.deleteReview);

// Admin routes
router.use(authenticate, authorize(Role.ADMIN));
router.get('/admin/all', controller.getAllAdmin);
router.post('/', uploadMiddleware, controller.create);
router.post('/:id/specifications', validateUuid('id'), controller.saveSpecification);

// Variant routes (admin only — MUST be before /:id to avoid conflicts)
router.post('/:productId/options', validateUuid('productId'), controller.createOption);
router.put('/options/:optionId', validateUuid('optionId'), controller.updateOption);
router.delete('/options/:optionId', validateUuid('optionId'), controller.deleteOption);
router.post('/options/:optionId/values', validateUuid('optionId'), controller.createOptionValue);
router.delete('/option-values/:valueId', validateUuid('valueId'), controller.deleteOptionValue);
router.post('/:productId/variants', validateUuid('productId'), controller.createVariant);
router.put('/variants/:variantId', validateUuid('variantId'), controller.updateVariant);
router.delete('/variants/:variantId', validateUuid('variantId'), controller.deleteVariant);

// Product CRUD — MUST be after variant routes to avoid conflicts
router.put('/:id', validateUuid('id'), uploadMiddleware, controller.update);
router.delete('/:id', validateUuid('id'), controller.delete);

export default router;
