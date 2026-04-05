import prisma from '../prisma/client.js';
import { AppError } from '../middleware/errorHandler.js';
import { orderSchema, orderStatusSchema } from '../utils/validators.js';
import { notifyNewOrder, notifyOrderStatusChanged } from './telegram.service.js';

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
    email?: string | null;
    address?: string | null;
    city?: string | null;
    warehouse?: string | null;
    warehouseAddress?: string | null;
    comment?: string;
    paymentMethod?: 'COD' | 'CARD';
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

    // Calculate total price and total profit
    // Якщо є discountPrice і вона менша за price — використовуємо її
    let totalPrice = 0;
    let totalProfit = 0;
    for (const item of validated.items) {
      const product = products.find((p: { id: string; price: any; margin?: number; discountPrice?: any }) => p.id === item.productId)!;
      // Використовуємо discountPrice якщо вона є і менша за звичайну ціну
      const effectivePrice = (product.discountPrice && Number(product.discountPrice) < Number(product.price))
        ? Number(product.discountPrice)
        : Number(product.price);
      totalPrice += effectivePrice * item.quantity;
      totalProfit += Number(product.margin ?? 0) * item.quantity;
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
          city: validated.city,
          warehouse: validated.warehouse,
          warehouseAddress: validated.warehouseAddress,
          comment: validated.comment,
          paymentMethod: validated.paymentMethod || 'COD',
          totalPrice,
          items: {
            create: validated.items.map((item) => {
              const product = products.find((p: { id: string; price: any; discountPrice?: any }) => p.id === item.productId)!;
              // Зберігаємо фактичну ціну (зі знижкою якщо є)
              const effectivePrice = (product.discountPrice && Number(product.discountPrice) < Number(product.price))
                ? Number(product.discountPrice)
                : Number(product.price);
              return {
                productId: item.productId,
                quantity: item.quantity,
                price: effectivePrice,
                margin: (product as any).margin ?? 0,
              };
            }),
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

    // Відправляємо повідомлення в Telegram (не блокуюче)
    // Помилка Telegram не впливає на створення замовлення
    notifyNewOrder({
      id: order.id,
      orderNumber: order.id.slice(0, 8).toUpperCase(),
      items: order.items,
      totalPrice: order.totalPrice,
      name: order.name,
      phone: order.phone,
      email: order.email,
      city: order.city,
      warehouse: order.warehouse,
      paymentMethod: order.paymentMethod,
      status: order.status,
      createdAt: order.createdAt,
    }).catch((error) => {
      console.error('❌ Failed to send Telegram notification:', error);
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

    const oldStatus = existing.status;

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

    // Відправляємо повідомлення про зміну статусу (не блокуюче)
    if (oldStatus !== validated.status) {
      notifyOrderStatusChanged(
        {
          id: order.id,
          orderNumber: order.id.slice(0, 8).toUpperCase(),
          items: order.items,
          totalPrice: order.totalPrice,
          name: order.name,
          phone: order.phone,
          email: order.email,
          city: order.city,
          warehouse: order.warehouse,
          status: order.status,
          createdAt: order.createdAt,
        },
        oldStatus,
        validated.status
      ).catch((error) => {
        console.error('❌ Failed to send Telegram status notification:', error);
      });
    }

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

  /**
   * Розрахунок прибутку через OrderItem.margin × quantity
   */
  async getProfitStats() {
    // Загальний прибуток: SUM(margin * quantity) по всім OrderItem
    const profitResult = await prisma.orderItem.aggregate({
      _sum: {
        margin: true,
        quantity: true,
      },
    });

    // Прибуток не можна просто рахувати як margin * quantity aggregate,
    // треба рахувати для кожного item margin * quantity, потім SUM
    // Простіше: сума всіх (margin × quantity) через raw SQL
    const profitRaw = await prisma.$queryRaw`
      SELECT SUM("margin"::FLOAT * "quantity"::FLOAT) as "totalProfit"
      FROM "OrderItem"
    `;

    const totalProfit = (profitRaw as any[])?.[0]?.totalProfit || 0;

    return {
      totalProfit: Number(totalProfit),
    };
  }
}
