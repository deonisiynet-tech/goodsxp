import prisma from '../prisma/client.js';
import { AppError } from '../middleware/errorHandler.js';

interface CategoryFilters {
  page?: number;
  limit?: number;
  parentId?: string;
}

export class CategoryService {
  async getAll(filters: CategoryFilters) {
    const { page = 1, limit = 100, parentId } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (parentId) where.parentId = parentId;
    else where.parentId = null; // Тільки кореневі категорії

    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              products: true,
              children: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.category.count({ where }),
    ]);

    return {
      categories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAllTree() {
    const categories = await prisma.category.findMany({
      where: { parentId: null },
      include: {
        children: {
          include: {
            children: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return categories;
  }

  async getById(id: string) {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        products: {
          select: {
            id: true,
            title: true,
            price: true,
            isActive: true,
          },
        },
        children: true,
        parent: true,
      },
    });

    if (!category) {
      throw new AppError('Категорію не знайдено', 404);
    }

    return category;
  }

  async create(data: {
    name: string;
    slug: string;
    description?: string;
    imageUrl?: string;
    parentId?: string;
  }) {
    const existing = await prisma.category.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      throw new AppError('Категорія з таким slug вже існує', 400);
    }

    return prisma.category.create({
      data,
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      slug?: string;
      description?: string;
      imageUrl?: string;
      parentId?: string;
    }
  ) {
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Категорію не знайдено', 404);
    }

    // Перевірка на уникнення циклічної посилання
    if (data.parentId === id) {
      throw new AppError('Категорія не може бути власним батьком', 400);
    }

    return prisma.category.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    const existing = await prisma.category.findUnique({
      where: { id },
      include: {
        products: true,
        children: true,
      },
    });

    if (!existing) {
      throw new AppError('Категорію не знайдено', 404);
    }

    if (existing.products.length > 0) {
      throw new AppError(
        'Неможливо видалити категорію з товарами. Спочатку видаліть або перемістіть товари.',
        400
      );
    }

    return prisma.category.delete({
      where: { id },
    });
  }
}
