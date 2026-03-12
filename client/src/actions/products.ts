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
  try {
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
  } catch (error) {
    console.error('Error fetching products:', error)
    return []
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
    })

    return product as Product | null
  } catch (error) {
    console.error('Error fetching product:', error)
    return null
  }
}

export async function createProduct(
  data: {
    title: string
    description: string
    price: number
    stock: number
    isActive: boolean
    images: string[]  // Array of Cloudinary URLs
  }
): Promise<{ success: boolean; error?: string; productId?: string }> {
  try {
    console.log('📦 Creating product with data:', {
      ...data,
      imagesCount: data.images?.length || 0,
    })

    const { title, description, price, stock, isActive, images } = data

    // Validate required fields
    if (!title || !title.trim()) {
      console.error('❌ Missing title')
      return { success: false, error: 'Назва обов\'язкова' }
    }
    
    if (!description || !description.trim()) {
      console.error('❌ Missing description')
      return { success: false, error: 'Опис обов\'язковий' }
    }
    
    if (!price || price <= 0) {
      console.error('❌ Invalid price:', price)
      return { success: false, error: 'Ціна має бути додатною' }
    }
    
    if (stock === undefined || stock < 0) {
      console.error('❌ Invalid stock:', stock)
      return { success: false, error: 'Некоректний залишок' }
    }

    // Ensure images is always an array
    const imagesArray = Array.isArray(images) ? images : []
    console.log('📸 Images array:', imagesArray)

    // Use first image as imageUrl for backward compatibility
    const imageUrl = imagesArray.length > 0 ? imagesArray[0] : null
    console.log('🖼️ Image URL:', imageUrl)

    // Create product in database
    console.log('💾 Saving to database...')
    const product = await prisma.product.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        price: Number(price),
        stock: Number(stock),
        isActive: isActive === true,
        imageUrl,
        images: imagesArray,
      },
    })

    console.log('✅ Product created successfully:', product.id)

    revalidatePath('/admin/products')
    return { success: true, productId: product.id }
  } catch (error: any) {
    console.error('❌ Error creating product:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
    })
    return { 
      success: false, 
      error: error.message || 'Помилка при створенні товару' 
    }
  }
}

export async function updateProduct(
  id: string,
  data: {
    title: string
    description: string
    price: number
    stock: number
    isActive: boolean
    images: string[]  // Array of Cloudinary URLs
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { title, description, price, stock, isActive, images } = data

    if (!title || !description || !price || stock === undefined) {
      return { success: false, error: 'Невірні дані' }
    }

    // Ensure images is always an array
    const imagesArray = Array.isArray(images) ? images : []

    // Use first image as imageUrl for backward compatibility
    const imageUrl = imagesArray.length > 0 ? imagesArray[0] : null

    await prisma.product.update({
      where: { id },
      data: {
        title,
        description,
        price,
        stock,
        isActive,
        imageUrl,
        images: imagesArray,
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
