import { Product } from '@/actions/products'

// API client for Express server
const API_BASE = '/api'

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  
  const headers: HeadersInit = {
    ...options.headers,
  }
  
  // Don't set Content-Type for FormData requests
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Request failed')
  }

  return data
}

export const productsApi = {
  // Get all products
  getAll: async (params?: {
    page?: number
    limit?: number
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }) => {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', String(params.page))
    if (params?.limit) queryParams.append('limit', String(params.limit))
    if (params?.search) queryParams.append('search', params.search)
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy)
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder)
    
    return fetchAPI(`/products?${queryParams.toString()}`)
  },

  // Get product by ID
  getById: async (id: string) => {
    return fetchAPI(`/products/${id}`)
  },

  // Create product
  create: async (data: {
    title: string
    description: string
    price: number
    stock: number
    isActive: boolean
    images: string[]
  }) => {
    const formData = new FormData()
    formData.append('title', data.title)
    formData.append('description', data.description)
    formData.append('price', String(data.price))
    formData.append('stock', String(data.stock))
    formData.append('isActive', String(data.isActive))
    formData.append('images', JSON.stringify(data.images))

    return fetchAPI('/products', {
      method: 'POST',
      body: formData,
    })
  },

  // Update product
  update: async (id: string, data: {
    title: string
    description: string
    price: number
    stock: number
    isActive: boolean
    images: string[]
  }) => {
    const formData = new FormData()
    formData.append('title', data.title)
    formData.append('description', data.description)
    formData.append('price', String(data.price))
    formData.append('stock', String(data.stock))
    formData.append('isActive', String(data.isActive))
    formData.append('images', JSON.stringify(data.images))

    return fetchAPI(`/products/${id}`, {
      method: 'PUT',
      body: formData,
    })
  },

  // Delete product
  delete: async (id: string) => {
    return fetchAPI(`/products/${id}`, {
      method: 'DELETE',
    })
  },
}
