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
  specifications?: ProductSpecification[]
}

export interface ReviewImage {
  id: string
  reviewId: string
  imageUrl: string
  createdAt: string
}

export interface Review {
  id: string
  productId: string
  name: string
  rating: number
  comment: string | null
  pros: string | null
  cons: string | null
  createdAt: string
  images?: ReviewImage[]
}

export interface ProductSpecification {
  id?: string
  productId?: string
  key: string
  value: string
}

export interface ReviewsResponse {
  reviews: Review[]
  total: number
}

export interface ReviewCreateInput {
  productId: string
  name: string
  rating: number
  comment?: string
  pros?: string
  cons?: string
  images?: File[]
}

// API client for Express server
const API_BASE = '/api'

// Helper function to get token safely (SSR compatible)
const getToken = (): string | null => {
  if (typeof window === 'undefined') {
    return null
  }
  return localStorage.getItem('token')
}

/**
 * Retry з exponential backoff для критичних запитів
 * 3 спроби: 1s → 2s → 4s
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries = 3
): Promise<Response> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options)

      // Не retry-ємо клієнтські помилки (4xx)
      if (response.status >= 400 && response.status < 500) {
        return response
      }

      // Серверна помилка — retry
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      return response
    } catch (error) {
      lastError = error as Error

      // Остання спроба — кидаємо помилку
      if (attempt === maxRetries) {
        throw lastError
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, attempt) * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const token = getToken()

  const headers: Record<string, string> = {}

  // Don't set Content-Type for FormData requests - browser will set it with boundary
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  // Add Authorization header if token exists (for non-cookie auth)
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // ✅ FIX: Disable cache for admin endpoints to get fresh data immediately
  const isAdminEndpoint = endpoint.includes('/admin') || endpoint.includes('/products/')

  // IMPORTANT: Always include credentials for cookie-based auth (admin)
  const response = await fetchWithRetry(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
    // ✅ Disable cache for admin to always get fresh data
    cache: isAdminEndpoint ? 'no-store' : options.cache,
  })

  const data = await response.json()

  if (!response.ok) {
    // ✅ FIX: More detailed error messages based on status code
    let errorMessage = data.error || data.message || 'Request failed'

    if (response.status === 401) {
      errorMessage = 'Необхідна авторизація. Будь ласка, увійдіть в систему.'
    } else if (response.status === 403) {
      errorMessage = 'Доступ заборонено. У вас немає прав для цієї операції.'
    } else if (response.status === 404) {
      errorMessage = data.error || 'Ресурс не знайдено.'
    } else if (response.status === 400) {
      errorMessage = data.error || data.message || 'Невірні дані запиту.'
    } else if (response.status >= 500) {
      errorMessage = 'Помилка сервера. Спробуйте пізніше.'
    }

    throw new Error(errorMessage)
  }

  return data
}

export const productsApi = {
  // Get all categories
  getCategories: async () => {
    return fetchAPI('/products/categories');
  },

  // Search autocomplete suggestions
  searchSuggestions: async (query: string) => {
    return fetchAPI(`/products/search?q=${encodeURIComponent(query)}`);
  },

  // Get all products (public)
  getAll: async (params?: {
    page?: number
    limit?: number
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    category?: string
    featured?: string
    minPrice?: number
    maxPrice?: number
  }) => {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', String(params.page))
    if (params?.limit) queryParams.append('limit', String(params.limit))
    if (params?.search) queryParams.append('search', params.search)
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy)
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder)
    if (params?.category) queryParams.append('category', params.category)
    if (params?.featured) queryParams.append('featured', params.featured)
    if (params?.minPrice) queryParams.append('minPrice', String(params.minPrice))
    if (params?.maxPrice) queryParams.append('maxPrice', String(params.maxPrice))

    return fetchAPI(`/products?${queryParams.toString()}`)
  },

  // Get related products (same category)
  getRelated: async (productId: string, limit: number = 4) => {
    return fetchAPI(`/products/related/${productId}?limit=${limit}`);
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

  // ✅ FIX: Get product by ID for admin (includes margin)
  getByIdAdmin: async (id: string) => {
    return fetchAPI(`/admin/products/${id}`)
  },

  // Batch fetch products by IDs — 1 request instead of N
  getBatch: async (ids: string[]) => {
    return fetchAPI('/products/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    })
  },

  // Get product by slug
  getBySlug: async (slug: string) => {
    return fetchAPI(`/products/${slug}`)
  },

  // Get product reviews (by product ID)
  getReviews: async (productId: string, sortBy?: 'newest' | 'best' | 'worst', page?: number, limit?: number): Promise<ReviewsResponse> => {
    const params = new URLSearchParams()
    if (sortBy) params.append('sortBy', sortBy)
    if (page) params.append('page', String(page))
    if (limit) params.append('limit', String(limit))
    return fetchAPI(`/products/${productId}/reviews?${params.toString()}`)
  },

  // Get product reviews by slug
  getReviewsBySlug: async (slug: string, sortBy?: 'newest' | 'best' | 'worst', page?: number, limit?: number): Promise<ReviewsResponse> => {
    const params = new URLSearchParams()
    if (sortBy) params.append('sortBy', sortBy)
    if (page) params.append('page', String(page))
    if (limit) params.append('limit', String(limit))
    return fetchAPI(`/products/slug/${slug}/reviews?${params.toString()}`)
  },

  // Product specifications
  getSpecifications: async (productId: string): Promise<{ specifications: ProductSpecification[] }> =>
    fetchAPI(`/products/${productId}/specifications`),

  saveSpecification: async (productId: string, data: ProductSpecification): Promise<ProductSpecification> =>
    fetchAPI(`/products/${productId}/specifications`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteSpecification: async (specificationId: string) =>
    fetchAPI(`/specifications/${specificationId}`, { method: 'DELETE' }),

  // Create review (by product ID) — supports FormData for image uploads
  createReview: async (data: ReviewCreateInput) => {
    // Use FormData if images are present
    if (data.images && data.images.length > 0) {
      const formData = new FormData()
      formData.append('productId', data.productId)
      formData.append('name', data.name)
      formData.append('rating', String(data.rating))
      if (data.comment) formData.append('text', data.comment)
      if (data.pros) formData.append('pros', data.pros)
      if (data.cons) formData.append('cons', data.cons)
      data.images.forEach((file) => formData.append('images[]', file))

      return fetchAPI('/reviews', {
        method: 'POST',
        body: formData,
      })
    }

    // No images — use JSON
    return fetchAPI('/reviews', {
      method: 'POST',
      body: JSON.stringify({
        productId: data.productId,
        name: data.name,
        rating: data.rating,
        text: data.comment,
        pros: data.pros,
        cons: data.cons,
      }),
    })
  },

  // Create review by slug — supports FormData for image uploads
  createReviewBySlug: async (slug: string, data: { name: string; rating: number; comment?: string; pros?: string; cons?: string; images?: File[] }) => {
    // Use FormData if images are present
    if (data.images && data.images.length > 0) {
      const formData = new FormData()
      formData.append('name', data.name)
      formData.append('rating', String(data.rating))
      if (data.comment) formData.append('text', data.comment)
      if (data.pros) formData.append('pros', data.pros)
      if (data.cons) formData.append('cons', data.cons)
      data.images.forEach((file) => formData.append('images[]', file))

      return fetchAPI(`/products/slug/${slug}/reviews`, {
        method: 'POST',
        body: formData,
      })
    }

    // No images — use JSON
    return fetchAPI(`/products/slug/${slug}/reviews`, {
      method: 'POST',
      body: JSON.stringify({
        name: data.name,
        rating: data.rating,
        text: data.comment,
        pros: data.pros,
        cons: data.cons,
      }),
    })
  },

  // Create product
  create: async (data: {
    title: string
    description: string
    price: number
    margin?: number
    originalPrice?: number | null
    discountPrice?: number | null
    stock: number
    isActive: boolean
    images: string[]
    isFeatured?: boolean
    isPopular?: boolean
    categoryId?: string | null
  }) => {
    const formData = new FormData()
    formData.append('title', data.title)
    formData.append('description', data.description)
    formData.append('price', String(data.price))
    // ✅ FIX: Ensure margin is always a valid number, not empty string or NaN
    const marginValue = typeof data.margin === 'number' && !isNaN(data.margin) ? data.margin : 0
    formData.append('margin', String(marginValue))
    if (data.originalPrice !== undefined && data.originalPrice !== null) formData.append('originalPrice', String(data.originalPrice))
    if (data.discountPrice !== undefined && data.discountPrice !== null) formData.append('discountPrice', String(data.discountPrice))
    formData.append('stock', String(data.stock))
    formData.append('isActive', String(data.isActive))
    formData.append('images', JSON.stringify(data.images))
    formData.append('isFeatured', String(data.isFeatured))
    formData.append('isPopular', String(data.isPopular))
    formData.append('categoryId', data.categoryId || '')

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
    margin?: number
    originalPrice?: number | null
    discountPrice?: number | null
    stock: number
    isActive: boolean
    images: string[]
    isFeatured?: boolean
    isPopular?: boolean
    categoryId?: string | null
  }) => {
    const formData = new FormData()
    formData.append('title', data.title)
    formData.append('description', data.description)
    formData.append('price', String(data.price))
    // ✅ FIX: Ensure margin is always a valid number, not empty string or NaN
    const marginValue = typeof data.margin === 'number' && !isNaN(data.margin) ? data.margin : 0
    formData.append('margin', String(marginValue))
    if (data.originalPrice !== undefined && data.originalPrice !== null) formData.append('originalPrice', String(data.originalPrice))
    if (data.discountPrice !== undefined && data.discountPrice !== null) formData.append('discountPrice', String(data.discountPrice))
    formData.append('stock', String(data.stock))
    formData.append('isActive', String(data.isActive))
    formData.append('images', JSON.stringify(data.images))
    formData.append('isFeatured', String(data.isFeatured))
    formData.append('isPopular', String(data.isPopular))
    formData.append('categoryId', data.categoryId || '')

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

  // Delete review (admin)
  deleteReview: async (reviewId: string) =>
    fetchAPI(`/products/reviews/${reviewId}`, { method: 'DELETE' }),
}

// ===== Variant API =====

export const variantsApi = {
  // Public
  getVariants: async (productId: string) =>
    fetchAPI(`/products/${productId}/variants`),

  findVariant: async (productId: string, optionValueIds: string[]) =>
    fetchAPI(`/products/${productId}/variants/find`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ optionValueIds }),
    }),

  // Admin
  createOption: async (productId: string, name: string) =>
    fetchAPI(`/products/${productId}/options`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    }),

  updateOption: async (optionId: string, name: string) =>
    fetchAPI(`/products/options/${optionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    }),

  deleteOption: async (optionId: string) =>
    fetchAPI(`/products/options/${optionId}`, { method: 'DELETE' }),

  createOptionValue: async (optionId: string, value: string) =>
    fetchAPI(`/products/options/${optionId}/values`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    }),

  deleteOptionValue: async (valueId: string) =>
    fetchAPI(`/products/option-values/${valueId}`, { method: 'DELETE' }),

  createVariant: async (productId: string, data: { price: number; stock: number; image?: string | null; options: any[] }) =>
    fetchAPI(`/products/${productId}/variants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  updateVariant: async (variantId: string, data: any) =>
    fetchAPI(`/products/variants/${variantId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  deleteVariant: async (variantId: string) =>
    fetchAPI(`/products/variants/${variantId}`, { method: 'DELETE' }),
};
