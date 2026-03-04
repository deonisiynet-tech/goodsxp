'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export interface DashboardStats {
  totalUsers: number
  totalOrders: number
  totalRevenue: number
  totalProducts: number
  ordersToday: number
  new: number
  processing: number
  delivered: number
  dailyOrders: { date: string; orders: number }[]
  recentOrders: OrderPreview[]
}

interface OrderPreview {
  id: string
  name: string
  email: string
  totalPrice: number
  status: string
  createdAt: string
  items: {
    quantity: number
    product: {
      title: string
      imageUrl: string | null
    }
  }[]
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  const [
    totalUsers,
    totalOrders,
    totalRevenue,
    totalProducts,
    ordersToday,
    newOrders,
    processingOrders,
    deliveredOrders,
    dailyOrdersResult,
    recentOrders,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.order.count(),
    prisma.order.aggregate({ _sum: { totalPrice: true } }),
    prisma.product.count(),
    prisma.order.count({
      where: {
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    }),
    prisma.order.count({ where: { status: 'NEW' } }),
    prisma.order.count({ where: { status: 'PROCESSING' } }),
    prisma.order.count({ where: { status: 'DELIVERED' } }),
    prisma.$queryRaw<
      { date: string; orders: number }[]
    >`
      SELECT
        DATE("createdAt") as date,
        COUNT(*)::int as orders
      FROM "Order"
      WHERE "createdAt" >= NOW() - INTERVAL '7 days'
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
      LIMIT 7
    `,
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: {
              select: {
                title: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    }),
  ])

  return {
    totalUsers,
    totalOrders,
    totalRevenue: Number(totalRevenue._sum.totalPrice || 0),
    totalProducts,
    ordersToday,
    new: newOrders,
    processing: processingOrders,
    delivered: deliveredOrders,
    dailyOrders: dailyOrdersResult,
    recentOrders: recentOrders as OrderPreview[],
  }
}
