'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

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

// Helper function to ensure uploads directory exists
async function ensureUploadsDir() {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
  try {
    await mkdir(uploadsDir, { recursive: true })
  } catch (err) {
    console.error('Error creating uploads directory:', err)
  }
  return uploadsDir
}

// Helper function to save file to uploads directory
async function saveFile(file: File): Promise<string> {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  
  // Generate unique filename
  const ext = path.extname(file.name)
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`
  
  const uploadsDir = await ensureUploadsDir()
  const filePath = path.join(uploadsDir, fileName)
  
  await writeFile(filePath, buffer)
  
  // Return the URL path (relative to public/)
  return `/uploads/${fileName}`
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
  formData: FormData
): Promise<{ success: boolean; error?: string; productId?: string }> {
  try {
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const price = parseFloat(formData.get('price') as string)
    const stock = parseInt(formData.get('stock') as string, 10)
    const isActive = formData.get('isActive') === 'on'
    const imagesJson = formData.get('images') as string

    if (!title || !description || isNaN(price) || isNaN(stock)) {
      return { success: false, error: 'Невірні дані' }
    }

    // Parse images array from JSON (contains file paths like /uploads/filename.png)
    let images: string[] = []
    if (imagesJson) {
      try {
        images = JSON.parse(imagesJson)
      } catch {
        images = []
      }
    }

    // Use first image as imageUrl for backward compatibility
    const imageUrl = images.length > 0 ? images[0] : null

    const product = await prisma.product.create({
      data: {
        title,
        description,
        price,
        stock,
        isActive,
        imageUrl,
        images,
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
    const imagesJson = formData.get('images') as string

    if (!title || !description || isNaN(price) || isNaN(stock)) {
      return { success: false, error: 'Невірні дані' }
    }

    // Parse images array from JSON
    let images: string[] = []
    if (imagesJson) {
      try {
        images = JSON.parse(imagesJson)
      } catch {
        images = []
      }
    }

    // Use first image as imageUrl for backward compatibility
    const imageUrl = images.length > 0 ? images[0] : null

    await prisma.product.update({
      where: { id },
      data: {
        title,
        description,
        price,
        stock,
        isActive,
        imageUrl,
        images,
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

// New action to handle file upload
export async function uploadImage(file: File): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    if (!file || file.size === 0) {
      return { success: false, error: 'Файл не обрано' }
    }

    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'Файл не є зображенням' }
    }

    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: 'Файл завеликий (макс. 5MB)' }
    }

    const url = await saveFile(file)
    return { success: true, url }
  } catch (error) {
    console.error('Error uploading image:', error)
    return { success: false, error: 'Помилка завантаження зображення' }
  }
}
