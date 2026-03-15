import { Request, Response, NextFunction } from 'express';
import { ReviewService } from '../services/review.service.js';

const reviewService = new ReviewService();

export class ReviewController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: productId } = req.params;
      const { name, rating, comment } = req.body;

      const review = await reviewService.create({
        productId,
        name,
        rating: Number(rating),
        comment,
      });

      res.status(201).json(review);
    } catch (error) {
      next(error);
    }
  }

  async getReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: productId } = req.params;
      const { sort } = req.query;

      const result = await reviewService.getReviews(productId, {
        sort: sort as 'date' | 'rating',
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getProductStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: productId } = req.params;

      const stats = await reviewService.getProductStats(productId);

      res.json(stats);
    } catch (error) {
      next(error);
    }
  }
}
