// Server Actions are deprecated in this project
// All API calls should go through Express API endpoints
// Use productsApi from '@/lib/products-api' instead

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

// Placeholder functions - should not be used
// Use productsApi instead
export async function getProducts(_filter: ProductsFilter = {}): Promise<Product[]> {
  throw new Error('Deprecated: Use productsApi.getAll() instead')
}

export async function getProductById(_id: string): Promise<Product | null> {
  throw new Error('Deprecated: Use productsApi.getById() instead')
}

export async function createProduct(_data: any): Promise<{ success: boolean; error?: string; productId?: string }> {
  throw new Error('Deprecated: Use productsApi.create() instead')
}

export async function updateProduct(_id: string, _data: any): Promise<{ success: boolean; error?: string }> {
  throw new Error('Deprecated: Use productsApi.update() instead')
}

export async function deleteProduct(_id: string): Promise<{ success: boolean; error?: string }> {
  throw new Error('Deprecated: Use productsApi.delete() instead')
}
