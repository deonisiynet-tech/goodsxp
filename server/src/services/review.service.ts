import prisma from '../prisma/client.js';
import { AppError } from '../middleware/errorHandler.js';

interface CreateReviewData {
  productId: string;
  name: string;
  rating: number;
  comment?: string;
}

interface GetReviewsFilters {
  sort?: 'date' | 'rating';
}

export class ReviewService {
  async create(data: CreateReviewData) {
    const { productId, name, rating, comment } = data;

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new AppError('Товар не знайдено', 404);
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      throw new AppError('Рейтинг має бути від 1 до 5', 400);
    }

    const review = await prisma.review.create({
      data: {
        productId,
        name,
        rating,
        comment,
      },
      include: {
        product: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return review;
  }

  async getReviews(productId: string, filters: GetReviewsFilters = {}) {
    const { sort = 'date' } = filters;

    const orderBy: any = {};
    if (sort === 'rating') {
      orderBy.rating = 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const reviews = await prisma.review.findMany({
      where: { productId },
      orderBy,
      select: {
        id: true,
        name: true,
        rating: true,
        comment: true,
        createdAt: true,
      },
    });

    // Calculate average rating
    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    return {
      reviews,
      averageRating: parseFloat(averageRating.toFixed(2)),
      totalReviews: reviews.length,
    };
  }

  async getProductStats(productId: string) {
    const reviews = await prisma.review.findMany({
      where: { productId },
      select: { rating: true },
    });

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

    // Rating distribution
    const distribution = {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length,
    };

    return {
      averageRating: parseFloat(averageRating.toFixed(2)),
      totalReviews,
      distribution,
    };
  }
}
