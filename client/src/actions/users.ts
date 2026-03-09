'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export interface User {
  id: string
  email: string
  role: 'USER' | 'ADMIN'
  createdAt: string
  _count: {
    orders: number
  }
}

export interface UsersFilter {
  role?: string
  search?: string
  sortField?: 'email' | 'role' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

export async function getUsers(filter: UsersFilter = {}): Promise<User[]> {
  try {
    const { role, search, sortField = 'createdAt', sortOrder = 'desc' } = filter

    const where: any = {}
    if (role) where.role = role
    if (search) where.email = { contains: search, mode: 'insensitive' }

    const users = await prisma.user.findMany({
      where,
      orderBy: { [sortField]: sortOrder },
      include: {
        _count: {
          select: { orders: true },
        },
      },
    })

    return users as User[]
  } catch (error) {
    console.error('Error fetching users:', error)
    return []
  }
}

export async function updateUserRole(
  userId: string,
  role: 'USER' | 'ADMIN'
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return { success: false, error: 'Користувача не знайдено' }
    }

    await prisma.user.update({
      where: { id: userId },
      data: { role },
    })

    revalidatePath('/admin/users')
    return { success: true }
  } catch (error) {
    console.error('Error updating user role:', error)
    return { success: false, error: 'Помилка при зміні ролі' }
  }
}

export async function deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { orders: true },
    })

    if (!user) {
      return { success: false, error: 'Користувача не знайдено' }
    }

    if (user.orders.length > 0) {
      return { success: false, error: 'Неможливо видалити користувача з замовленнями' }
    }

    await prisma.user.delete({ where: { id: userId } })

    revalidatePath('/admin/users')
    return { success: true }
  } catch (error) {
    console.error('Error deleting user:', error)
    return { success: false, error: 'Помилка при видаленні користувача' }
  }
}
