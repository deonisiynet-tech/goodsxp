import prisma from '../prisma/client.js';
import { AppError } from '../middleware/errorHandler.js';
import { orderSchema, orderStatusSchema } from '../utils/validators.js';

interface OrderFilters {
  page?: number;
  limit?: number;
  status?: string;
  email?: string;
}

export class OrderService {
  async create(data: {
    name: string;
    phone: string;
    email: string;
    address: string;
    comment?: string;
    items: { productId: string; quantity: number }[];
  }) {
    const validated = orderSchema.parse(data);

    // Fetch products and calculate total
    const products = await prisma.product.findMany({
      where: {
        id: { in: validated.items.map((item) => item.productId) },
        isActive: true,
      },
    });

    if (products.length !== validated.items.length) {
      throw new AppError('Деякі товари недоступні', 400);
    }

    // Check stock availability
    for (const item of validated.items) {
      const product = products.find((p: { id: string; stock: number; title: string }) => p.id === item.productId);
      if (!product || product.stock < item.quantity) {
        throw new AppError(`Товар "${product?.title}" недоступний у кількості ${item.quantity}`, 400);
      }
    }

    // Calculate total price
    let totalPrice = 0;
    for (const item of validated.items) {
      const product = products.find((p: { id: string; price: any }) => p.id === item.productId)!;
      totalPrice += Number(product.price) * item.quantity;
    }

    // Create order with transaction
    const order = await prisma.$transaction(async (tx: any) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          name: validated.name,
          phone: validated.phone,
          email: validated.email,
          address: validated.address,
          comment: validated.comment,
          totalPrice,
          items: {
            create: validated.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: products.find((p) => p.id === item.productId)!.price,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  title: true,
                  imageUrl: true,
                },
              },
            },
          },
        },
      });

      // Update stock
      for (const item of validated.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      return newOrder;
    });

    return order;
  }

  async getById(id: string) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new AppError('Замовлення не знайдено', 404);
    }

    return order;
  }

  async getAll(filters: OrderFilters) {
    const { page = 1, limit = 20, status, email } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (email) where.email = { contains: email, mode: 'insensitive' };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  title: true,
                  imageUrl: true,
                },
              },
            },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateStatus(id: string, status: string) {
    const validated = orderStatusSchema.parse({ status });

    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Замовлення не знайдено', 404);
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status: validated.status },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });

    return order;
  }

  async delete(id: string) {
    const existing = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existing) {
      throw new AppError('Замовлення не знайдено', 404);
    }

    // Return stock if order is cancelled or new
    if (existing.status === 'NEW' || existing.status === 'PROCESSING') {
      await prisma.$transaction(async (tx: any) => {
        for (const item of existing.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                increment: item.quantity,
              },
            },
          });
        }
        await tx.order.delete({ where: { id } });
      });
    } else {
      await prisma.order.delete({ where: { id } });
    }

    return { message: 'Замовлення видалено' };
  }

  async getStats() {
    const stats = await prisma.$transaction([
      prisma.order.count(),
      prisma.order.count({ where: { status: 'NEW' } }),
      prisma.order.count({ where: { status: 'PROCESSING' } }),
      prisma.order.count({ where: { status: 'SHIPPED' } }),
      prisma.order.count({ where: { status: 'DELIVERED' } }),
      prisma.order.aggregate({
        _sum: { totalPrice: true },
      }),
    ]);

    return {
      total: stats[0],
      new: stats[1],
      processing: stats[2],
      shipped: stats[3],
      delivered: stats[4],
      revenue: Number(stats[5]._sum.totalPrice || 0),
    };
  }
}
