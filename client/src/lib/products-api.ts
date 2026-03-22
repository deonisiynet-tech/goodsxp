// API client for Express server
// Product type definition

export interface Product {
  id: string
  slug: string
  title: string
  description: string
  price: number
  originalPrice: number | null
  discountPrice: number | null
  isFeatured: boolean
  isPopular: boolean
  imageUrl: string | null
  images: string[]
  stock: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  averageRating?: number
  reviewCount?: number
}

export interface Review {
  id: string
  productId: string
  name: string
  rating: number
  comment: string | null
  createdAt: string
}

// API client for Express server
const API_BASE = '/api'

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  const headers: Record<string, string> = {}

  // Don't set Content-Type for FormData requests - browser will set it with boundary
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  // Add Authorization header if token exists (for non-cookie auth)
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  console.log('📡 API Request:', {
    endpoint,
    method: options.method || 'GET',
    hasToken: !!token,
    tokenPreview: token ? `${token.substring(0, 20)}...` : 'none',
  })

  // IMPORTANT: Always include credentials for cookie-based auth (admin)
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include', // Include cookies for admin authentication
  })

  console.log('📡 API Response:', {
    status: response.status,
    statusText: response.statusText,
  })

  const data = await response.json()

  if (!response.ok) {
    console.error('❌ API Error:', {
      status: response.status,
      statusText: response.statusText,
      data,
    })
    throw new Error(data.error || data.message || 'Request failed')
  }

  return data
}

export const productsApi = {
  // Get all products (public)
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

  // Get all products (admin)
  getAllAdmin: async (params?: {
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

    return fetchAPI(`/products/admin/all?${queryParams.toString()}`)
  },

  // Get product by ID
  getById: async (id: string) => {
    return fetchAPI(`/products/id/${id}`)
  },

  // Get product by slug
  getBySlug: async (slug: string) => {
    return fetchAPI(`/products/${slug}`)
  },

  // Get product reviews
  getReviews: async (productId: string, sortBy?: 'newest' | 'best' | 'worst') => {
    const params = new URLSearchParams()
    if (sortBy) params.append('sortBy', sortBy)
    return fetchAPI(`/products/${productId}/reviews?${params.toString()}`)
  },

  // Create review
  createReview: async (productId: string, data: { name: string; rating: number; comment?: string }) => {
    return fetchAPI(`/products/${productId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  },

  // Create product
  create: async (data: {
    title: string
    description: string
    price: number
    originalPrice?: number | null
    discountPrice?: number | null
    stock: number
    isActive: boolean
    images: string[]
    isFeatured?: boolean
    isPopular?: boolean
  }) => {
    const formData = new FormData()
    formData.append('title', data.title)
    formData.append('description', data.description)
    formData.append('price', String(data.price))
    if (data.originalPrice) formData.append('originalPrice', String(data.originalPrice))
    if (data.discountPrice) formData.append('discountPrice', String(data.discountPrice))
    formData.append('stock', String(data.stock))
    formData.append('isActive', String(data.isActive))
    formData.append('images', JSON.stringify(data.images))
    if (data.isFeatured) formData.append('isFeatured', String(data.isFeatured))
    if (data.isPopular) formData.append('isPopular', String(data.isPopular))

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    console.log('🔑 Create product - Token exists:', !!token)
    console.log('🔑 Token preview:', token ? `${token.substring(0, 30)}...` : 'none')

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
    originalPrice?: number | null
    discountPrice?: number | null
    stock: number
    isActive: boolean
    images: string[]
    isFeatured?: boolean
    isPopular?: boolean
  }) => {
    const formData = new FormData()
    formData.append('title', data.title)
    formData.append('description', data.description)
    formData.append('price', String(data.price))
    if (data.originalPrice) formData.append('originalPrice', String(data.originalPrice))
    if (data.discountPrice) formData.append('discountPrice', String(data.discountPrice))
    formData.append('stock', String(data.stock))
    formData.append('isActive', String(data.isActive))
    formData.append('images', JSON.stringify(data.images))
    if (data.isFeatured) formData.append('isFeatured', String(data.isFeatured))
    if (data.isPopular) formData.append('isPopular', String(data.isPopular))

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
