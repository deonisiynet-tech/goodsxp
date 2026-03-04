'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export interface Product {
  id: string
  title: string
  description: string
  price: number
  imageUrl: string | null
  images: string[]
  stock: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ProductsFilter {
  search?: string
  status?: 'active' | 'inactive' | 'instock' | 'outofstock'
  sortField?: 'title' | 'price' | 'stock' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

export async function getProducts(filter: ProductsFilter = {}): Promise<Product[]> {
  const { search, status, sortField = 'createdAt', sortOrder = 'desc' } = filter

  const where: any = {}
  if (search) where.title = { contains: search, mode: 'insensitive' }

  const products = await prisma.product.findMany({
    where,
    orderBy: { [sortField]: sortOrder },
  })

  // Filter by status
  let filteredProducts = products
  if (status === 'active') {
    filteredProducts = products.filter((p) => p.isActive)
  } else if (status === 'inactive') {
    filteredProducts = products.filter((p) => !p.isActive)
  } else if (status === 'instock') {
    filteredProducts = products.filter((p) => p.stock > 0)
  } else if (status === 'outofstock') {
    filteredProducts = products.filter((p) => p.stock === 0)
  }

  return filteredProducts as Product[]
}

export async function getProductById(id: string): Promise<Product | null> {
  const product = await prisma.product.findUnique({
    where: { id },
  })

  return product as Product | null
}

export async function createProduct(
  formData: FormData
): Promise<{ success: boolean; error?: string; productId?: string }> {
  try {
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const price = parseFloat(formData.get('price') as string)
    const stock = parseInt(formData.get('stock') as string, 10)
    const isActive = formData.get('isActive') === 'on'

    if (!title || !description || isNaN(price) || isNaN(stock)) {
      return { success: false, error: 'Невірні дані' }
    }

    const product = await prisma.product.create({
      data: {
        title,
        description,
        price,
        stock,
        isActive,
        imageUrl: null,
        images: [],
      },
    })

    revalidatePath('/admin/products')
    return { success: true, productId: product.id }
  } catch (error) {
    console.error('Error creating product:', error)
    return { success: false, error: 'Помилка при створенні товару' }
  }
}

export async function updateProduct(
  id: string,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  try {
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const price = parseFloat(formData.get('price') as string)
    const stock = parseInt(formData.get('stock') as string, 10)
    const isActive = formData.get('isActive') === 'on'

    if (!title || !description || isNaN(price) || isNaN(stock)) {
      return { success: false, error: 'Невірні дані' }
    }

    await prisma.product.update({
      where: { id },
      data: {
        title,
        description,
        price,
        stock,
        isActive,
      },
    })

    revalidatePath('/admin/products')
    return { success: true }
  } catch (error) {
    console.error('Error updating product:', error)
    return { success: false, error: 'Помилка при оновленні товару' }
  }
}

export async function deleteProduct(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.product.delete({
      where: { id },
    })

    revalidatePath('/admin/products')
    return { success: true }
  } catch (error) {
    console.error('Error deleting product:', error)
    return { success: false, error: 'Помилка при видаленні товару' }
  }
}
