import axios from 'axios';

// Використовуємо відносний шлях '/api' для інтеграції з Express
// На Railway всі запити до /api/* проксіруються на Express API
const API_BASE_URL = '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (email: string, password: string) =>
    api.post('/auth/register', { email, password }),
  getProfile: () => api.get('/auth/profile'),
};

// Products API
export const productsApi = {
  getAll: (params?: { 
    page?: number; 
    limit?: number; 
    search?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) =>
    api.get('/products', { params }),
  search: (q: string, limit?: number) =>
    api.get('/products/search', { params: { q, limit } }),
  getSimilar: (id: string, limit?: number) =>
    api.get(`/products/${id}/similar`, { params: { limit } }),
  getById: (id: string) => api.get(`/products/${id}`),
  getReviews: (id: string, sort?: 'date' | 'rating') =>
    api.get(`/products/${id}/reviews`, { params: { sort } }),
  createReview: (id: string, data: { name: string; rating: number; comment?: string }) =>
    api.post(`/products/${id}/reviews`, data),
  getAllAdmin: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/admin/products', { params }),
  create: (data: FormData) =>
    api.post('/admin/products', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  update: (id: string, data: FormData) =>
    api.put(`/admin/products/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  delete: (id: string) => api.delete(`/admin/products/${id}`),
};

// Categories API
export const categoriesApi = {
  getAll: (params?: { parentId?: string }) =>
    api.get('/admin/categories', { params }),
  getAllTree: () => api.get('/admin/categories/tree'),
  getById: (id: string) => api.get(`/admin/categories/${id}`),
  create: (data: FormData) =>
    api.post('/admin/categories', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  update: (id: string, data: FormData) =>
    api.put(`/admin/categories/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  delete: (id: string) => api.delete(`/admin/categories/${id}`),
};

// Orders API
export const ordersApi = {
  create: (data: any) => api.post('/orders', data),
  getById: (id: string) => api.get(`/orders/${id}`),
  getAll: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get('/orders', { params }),
  getAllAdmin: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get('/admin/orders', { params }),
  updateStatus: (id: string, status: string) =>
    api.patch(`/admin/orders/${id}/status`, { status }),
  delete: (id: string) => api.delete(`/admin/orders/${id}`),
  getStats: () => api.get('/admin/orders/stats'),
};

// Admin API
export const adminApi = {
  // Dashboard Stats
  getDashboardStats: (days?: number) =>
    api.get('/admin/stats', { params: { days } }),
  
  // Users
  getUsers: (params?: { page?: number; limit?: number; role?: string; search?: string }) =>
    api.get('/admin/users', { params }),
  getUserById: (id: string) => api.get(`/admin/users/${id}`),
  updateUserRole: (id: string, role: 'USER' | 'ADMIN') =>
    api.patch(`/admin/users/${id}/role`, { role }),
  resetUserPassword: (id: string, password: string) =>
    api.post(`/admin/users/${id}/reset-password`, { password }),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  
  // Logs
  getLogs: (params?: { page?: number; limit?: number; adminId?: string; action?: string }) =>
    api.get('/admin/logs', { params }),
  
  // Settings
  getSettings: () => api.get('/admin/settings'),
  getSetting: (key: string) => api.get(`/admin/settings/${key}`),
  updateSetting: (key: string, value: string, description?: string) =>
    api.put(`/admin/settings/${key}`, { value, description }),
};
