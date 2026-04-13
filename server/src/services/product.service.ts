import prisma from '../prisma/client.js';
import { AppError } from '../middleware/errorHandler.js';
import { productSchema, productUpdateSchema, paginationSchema, sanitizeHtmlText } from '../utils/validators.js';
import { Prisma } from '@prisma/client';

/**
 * Обчислює відсоток знижки
 * discountPercent = ((originalPrice - discountPrice) / originalPrice) * 100
 * Повертає null якщо знижки немає
 */
function calculateDiscountPercent(
  originalPrice: number | null | undefined,
  discountPrice: number | null | undefined
): number | null {
  if (!originalPrice || !discountPrice || originalPrice <= 0 || discountPrice >= originalPrice) {
    return null;
  }
  return Math.round(((originalPrice - discountPrice) / originalPrice) * 100);
}

/**
 * Додає discountPercent до продукту
 */
function withDiscountPercent(product: any): any {
  const discountPercent = calculateDiscountPercent(
    product.originalPrice,
    product.discountPrice
  );
  return {
    ...product,
    discountPercent,
  };
}

interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'createdAt' | 'price' | 'title';
  sortOrder?: 'asc' | 'desc';
  category?: string;
  featured?: string;
  minPrice?: number;
  maxPrice?: number;
}

interface ProductCreateInput {
  title: string;
  description: string;
  price: number;
  margin?: number;
  categoryId?: string | null;
  rating?: number | null;
  originalPrice?: number | null;
  discountPrice?: number | null;
  isFeatured?: boolean;
  isPopular?: boolean;
  imageUrl?: string | null;
  images?: string[];
  stock?: number;
  isActive?: boolean;
}

interface ProductUpdateInput {
  title?: string;
  description?: string;
  price?: number;
  margin?: number;
  categoryId?: string | null;
  rating?: number | null;
  originalPrice?: number | null;
  discountPrice?: number | null;
  isFeatured?: boolean;
  isPopular?: boolean;
  imageUrl?: string | null;
  images?: string[];
  stock?: number;
  isActive?: boolean;
}

interface ReviewSortOptions {
  sortBy?: 'newest' | 'best' | 'worst';
}

interface ReviewPaginationOptions {
  sortBy?: 'newest' | 'best' | 'worst';
  page?: number;
  limit?: number;
}

interface ReviewImageInput {
  imageUrl: string;
}

export class ProductService {
  async getAllCategories() {
    return prisma.category.findMany({
      where: { parentId: null },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
  }

  async getByCategory(categoryId: string, limit: number = 4, excludeId?: string) {
    // 🔒 SECURITY: Explicit select — exclude `margin` from public API
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        categoryId,
        ...(excludeId && { id: { not: excludeId } }),
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        price: true,
        originalPrice: true,
        discountPrice: true,
        imageUrl: true,
        slug: true,
        stock: true,
        isFeatured: true,
        isPopular: true,
        rating: true,
      },
    });

    return products;
  }

  async getAll(filters: ProductFilters) {
    const validated = paginationSchema.parse(filters);
    const { page, limit, search, sortBy, sortOrder } = validated;

    const skip = (page - 1) * limit;

    const where: any = {
      isActive: true,
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...(filters.featured && { isFeatured: true }),
      ...(!filters.featured && filters.category && { categoryId: filters.category }),
      ...(filters.minPrice && { price: { gte: filters.minPrice } }),
      ...(filters.maxPrice && { price: { lte: filters.maxPrice } }),
    };

    // 🔒 SECURITY: Explicit select — exclude `margin` (business secret) from public API
    const products = await prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        categoryId: true,
        rating: true,
        originalPrice: true,
        discountPrice: true,
        isFeatured: true,
        isPopular: true,
        imageUrl: true,
        images: true,
        stock: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        slug: true,
        variants: {
          select: {
            id: true,
            price: true,
            stock: true,
            image: true,
            options: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        _count: {
          select: { variants: true, reviews: true },
        },
      },
    }) as any[];

    const total = await prisma.product.count({ where });

    // Обчислюємо середній рейтинг через aggregate — без завантаження всіх відгуків
    const productIds = products.map(p => p.id);
    const ratingStats = await prisma.review.groupBy({
      by: ['productId'],
      where: { productId: { in: productIds } },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const ratingMap = new Map(ratingStats.map(s => [s.productId, { avg: s._avg.rating ?? 0, count: s._count.rating }]));

    const productsWithRating = products.map((product: any) => {
      const stats = ratingMap.get(product.id);
      const hasVariants = product._count?.variants > 0;
      return {
        ...product,
        averageRating: stats ? Math.round((stats.avg as number) * 10) / 10 : 0,
        reviewCount: stats ? (stats.count as number) : 0,
        hasVariants,
      };
    });

    return {
      products: productsWithRating.map(withDiscountPercent),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id: string) {
    // 🔒 SECURITY: Explicit select — exclude `margin` (business secret) from public API
    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        categoryId: true,
        rating: true,
        originalPrice: true,
        discountPrice: true,
        isFeatured: true,
        isPopular: true,
        imageUrl: true,
        images: true,
        stock: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        slug: true,
        variants: {
          select: {
            id: true,
            price: true,
            stock: true,
            image: true,
            options: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        reviews: {
          select: {
            id: true,
            name: true,
            rating: true,
            comment: true,
            pros: true,
            cons: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { variants: true },
        },
      },
    }) as any;

    if (!product) {
      throw new AppError('Товар не знайдено', 404);
    }

    // Обчислюємо середній рейтинг через aggregate
    const stats = await prisma.review.aggregate({
      where: { productId: id },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const averageRating = stats._avg.rating ? Math.round(stats._avg.rating * 10) / 10 : 0;
    const reviewCount = stats._count.rating;

    return {
      ...product,
      averageRating,
      reviewCount,
      ...withDiscountPercent(product),
    };
  }

  async getBySlug(slug: string): Promise<{ product: any; redirectedFrom?: string }> {
    // 🔒 SECURITY: Explicit select — exclude `margin` (business secret) from public API
    const productSelect = {
      id: true,
      title: true,
      description: true,
      price: true,
      categoryId: true,
      rating: true,
      originalPrice: true,
      discountPrice: true,
      isFeatured: true,
      isPopular: true,
      imageUrl: true,
      images: true,
      stock: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      slug: true,
      variants: {
        select: {
          id: true,
          price: true,
          stock: true,
          image: true,
          options: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    };

    // Спочатку шукаємо по поточному slug
    let product = await prisma.product.findFirst({
      where: { slug },
      select: productSelect,
    }) as any;

    // ✅ Якщо не знайдено — шукаємо в редіректах
    if (!product) {
      try {
        const redirect = await prisma.productSlugRedirect.findUnique({
          where: { oldSlug: slug },
        });

        if (redirect) {
          // Знайшли редірект — отримуємо товар по новому slug
          product = await prisma.product.findFirst({
            where: { slug: redirect.newSlug },
            select: productSelect,
          }) as any;

          if (!product) {
            throw new AppError('Товар не знайдено', 404);
          }

          return {
            product: {
              ...product,
              ...withDiscountPercent(product),
              ...(await this.getProductRating(product.id)),
            },
            redirectedFrom: slug,
          };
        }
      } catch (err: any) {
        // Таблиця ProductSlugRedirect ще не існує — пропускаємо редіректи
        if (err.code === 'P2021' || err.code === 'P2022') {
          // continue — таблиці немає, просто шукаємо по slug
        } else {
          throw err;
        }
      }

      throw new AppError('Товар не знайдено', 404);
    }

    return {
      product: {
        ...product,
        ...withDiscountPercent(product),
        ...(await this.getProductRating(product.id)),
      },
    };
  }

  private async getProductRating(productId: string) {
    const stats = await prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    return {
      averageRating: stats._avg.rating ? Math.round(stats._avg.rating * 10) / 10 : 0,
      reviewCount: stats._count.rating,
    };
  }

  async create(data: ProductCreateInput) {
    // Generate slug from title
    let slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9\u0400-\u04FF-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    // Check if slug exists and add random suffix
    const existing = await prisma.product.findFirst({
      where: { slug },
      select: { id: true },
    });

    if (existing) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 8)}`;
    }

    // Create product using Prisma Client
    const result = await prisma.product.create({
      data: {
        title: data.title,
        slug,
        description: data.description,
        price: data.price,
        margin: data.margin ?? 0,
        categoryId: data.categoryId,
        rating: data.rating ?? null,
        originalPrice: data.originalPrice ?? null,
        discountPrice: data.discountPrice ?? null,
        isFeatured: data.isFeatured ?? false,
        isPopular: data.isPopular ?? false,
        imageUrl: data.imageUrl ?? null,
        images: data.images ?? [],
        stock: data.stock ?? 0,
        isActive: data.isActive ?? true,
      },
    });

    return result;
  }

  async update(id: string, data: ProductUpdateInput) {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Товар не знайдено', 404);
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.title !== undefined) {
      updateData.title = data.title;
      // Генеруємо новий slug з перевіркою унікальності
      let newSlug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9\u0400-\u04FF-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      // Перевіряємо чи slug вже зайнятий ІНШИМ товаром
      const slugConflict = await prisma.product.findFirst({
        where: {
          slug: newSlug,
          id: { not: id }, // Виключаємо поточний товар
        },
        select: { id: true },
      });

      if (slugConflict) {
        // Додаємо унікальний суфікс
        newSlug = `${newSlug}-${Math.random().toString(36).substring(2, 8)}`;
      }

      // ✅ Якщо slug змінився — зберігаємо редірект
      if (existing.slug !== newSlug) {
        try {
          await prisma.productSlugRedirect.upsert({
            where: { oldSlug: existing.slug },
            update: { newSlug },
            create: {
              oldSlug: existing.slug,
              newSlug,
              productId: id,
            },
          });
        } catch (err: any) {
          // Таблиця ProductSlugRedirect ще не існує — просто оновлюємо slug
          if (err.code !== 'P2021' && err.code !== 'P2022') {
            throw err;
          }
        }

        updateData.slug = newSlug;
      }
    }
    if (data.description !== undefined) updateData.description = data.description;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.margin !== undefined) updateData.margin = data.margin;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.rating !== undefined) updateData.rating = data.rating;
    if (data.originalPrice !== undefined) updateData.originalPrice = data.originalPrice;
    if (data.discountPrice !== undefined) updateData.discountPrice = data.discountPrice;
    if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured;
    if (data.isPopular !== undefined) updateData.isPopular = data.isPopular;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.images !== undefined) updateData.images = data.images;
    if (data.stock !== undefined) updateData.stock = data.stock;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const result = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    return result;
  }

  async delete(id: string) {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Товар не знайдено', 404);
    }

    await prisma.product.delete({ where: { id } });
    return { message: 'Товар видалено' };
  }

  async getAllAdmin(filters: ProductFilters) {
    const validated = paginationSchema.parse(filters);
    const { page, limit, search, sortBy, sortOrder } = validated;

    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          margin: true,
          categoryId: true,
          rating: true,
          originalPrice: true,
          discountPrice: true,
          isFeatured: true,
          isPopular: true,
          imageUrl: true,
          images: true,
          stock: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }) as Promise<any[]>,
      prisma.product.count({ where }),
    ]);

    return {
      products: products.map(withDiscountPercent),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getReviews(productId: string, options: ReviewPaginationOptions = {}) {
    const { sortBy = 'newest', page, limit } = options;

    let orderBy: Prisma.ReviewOrderByWithRelationInput;

    switch (sortBy) {
      case 'best':
        orderBy = { rating: 'desc' };
        break;
      case 'worst':
        orderBy = { rating: 'asc' };
        break;
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    // If pagination is requested
    if (page && limit) {
      const skip = (page - 1) * limit;
      const [reviews, total] = await Promise.all([
        prisma.review.findMany({
          where: { productId },
          orderBy,
          skip,
          take: limit,
          include: {
            images: {
              orderBy: { createdAt: 'asc' },
            },
          },
        }),
        prisma.review.count({ where: { productId } }),
      ]);

      return { reviews, total };
    }

    // No pagination — return all (backward compatibility)
    const reviews = await prisma.review.findMany({
      where: { productId },
      orderBy,
      include: {
        images: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    const total = reviews.length;
    return { reviews, total };
  }

  async createReview(productId: string, data: { name: string; rating: number; comment?: string; pros?: string; cons?: string; images?: ReviewImageInput[] }) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new Error('Товар не знайдено');
    }

    // ✅ Validate rating
    if (data.rating < 1 || data.rating > 5) {
      throw new Error('Рейтинг має бути від 1 до 5');
    }

    // ✅ Validate and sanitize name — XSS protection
    if (!data.name || typeof data.name !== 'string') {
      throw new Error("Ім'я обов'язкове");
    }
    const sanitizedName = sanitizeHtmlText(data.name.trim()).slice(0, 100);
    if (sanitizedName.length < 1) {
      throw new Error("Ім'я занадто коротке");
    }

    // ✅ Validate and sanitize comment — XSS protection
    let sanitizedComment: string | undefined = undefined;
    if (data.comment) {
      sanitizedComment = sanitizeHtmlText(data.comment.trim()).slice(0, 2000);
    }

    // ✅ Validate and sanitize pros/cons — XSS protection
    let sanitizedPros: string | undefined = undefined;
    if (data.pros) {
      sanitizedPros = sanitizeHtmlText(data.pros.trim()).slice(0, 1000) || undefined;
    }
    let sanitizedCons: string | undefined = undefined;
    if (data.cons) {
      sanitizedCons = sanitizeHtmlText(data.cons.trim()).slice(0, 1000) || undefined;
    }

    const review = await prisma.review.create({
      data: {
        productId,
        name: sanitizedName,
        rating: data.rating,
        comment: sanitizedComment,
        pros: sanitizedPros,
        cons: sanitizedCons,
        images: data.images && data.images.length > 0
          ? {
              create: data.images.map((img) => ({
                imageUrl: img.imageUrl,
              })),
            }
          : undefined,
      },
      include: {
        images: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    // Update product average rating
    const stats = await prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    // Update the product rating with proper null handling
    const avgRating = stats._avg.rating ?? 0;
    await prisma.product.update({
      where: { id: productId },
      data: { rating: Math.round(avgRating * 100) / 100 },
    });

    return review;
  }

  async deleteReview(reviewId: string) {
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new AppError('Відгук не знайдено', 404);

    await prisma.review.delete({ where: { id: reviewId } });

    // Recalculate product rating
    const stats = await prisma.review.aggregate({
      where: { productId: review.productId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const avgRating = stats._avg.rating ?? 0;
    await prisma.product.update({
      where: { id: review.productId },
      data: { rating: Math.round(avgRating * 100) / 100 },
    });

    return { message: 'Відгук видалено' };
  }
}
