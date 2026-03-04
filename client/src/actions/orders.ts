'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export interface Order {
  id: string
  userId: string | null
  name: string
  phone: string
  email: string
  address: string
  totalPrice: number
  status: string
  comment: string | null
  createdAt: string
  updatedAt: string
  items: {
    id: string
    productId: string
    quantity: number
    price: number
    product: {
      id: string
      title: string
      imageUrl: string | null
    }
  }[]
}

export interface OrdersFilter {
  status?: string
  email?: string
  searchId?: string
  sortField?: 'createdAt' | 'totalPrice' | 'status'
  sortOrder?: 'asc' | 'desc'
}

export async function getOrders(filter: OrdersFilter = {}): Promise<Order[]> {
  const { status, email, searchId, sortField = 'createdAt', sortOrder = 'desc' } = filter

  const where: any = {}
  if (status) where.status = status
  if (email) where.email = { contains: email, mode: 'insensitive' }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { [sortField]: sortOrder },
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
  })

  // Filter by ID if provided (client-side filtering for partial match)
  let filteredOrders = orders
  if (searchId) {
    filteredOrders = orders.filter((o) =>
      o.id.toLowerCase().includes(searchId.toLowerCase())
    )
  }

  return filteredOrders as Order[]
}

export async function getOrderById(id: string): Promise<Order | null> {
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
  })

  return order as Order | null
}

export async function updateOrderStatus(
  orderId: string,
  status: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const validStatuses = ['NEW', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']
    if (!validStatuses.includes(status)) {
      return { success: false, error: 'Невірний статус' }
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { status },
    })

    revalidatePath('/admin/orders')
    return { success: true }
  } catch (error) {
    console.error('Error updating order status:', error)
    return { success: false, error: 'Помилка при оновленні статусу' }
  }
}

export async function deleteOrder(orderId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    })

    if (!order) {
      return { success: false, error: 'Замовлення не знайдено' }
    }

    // Return stock if order is NEW or PROCESSING
    if (order.status === 'NEW' || order.status === 'PROCESSING') {
      await prisma.$transaction(async (tx) => {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                increment: item.quantity,
              },
            },
          })
        }
        await tx.order.delete({ where: { id: orderId } })
      })
    } else {
      await prisma.order.delete({ where: { id: orderId } })
    }

    revalidatePath('/admin/orders')
    return { success: true }
  } catch (error) {
    console.error('Error deleting order:', error)
    return { success: false, error: 'Помилка при видаленні замовлення' }
  }
}
