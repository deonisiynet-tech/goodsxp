import { Router } from 'express';
import { ReviewController } from '../controllers/review.controller.js';

const router = Router();
const reviewController = new ReviewController();

// POST /api/products/:id/reviews - Create review
router.post('/:id/reviews', reviewController.create.bind(reviewController));

// GET /api/products/:id/reviews - Get all reviews for a product
router.get('/:id/reviews', reviewController.getReviews.bind(reviewController));

// GET /api/products/:id/reviews/stats - Get review statistics
router.get('/:id/reviews/stats', reviewController.getProductStats.bind(reviewController));

export default router;
