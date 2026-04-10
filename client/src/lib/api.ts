import axios from 'axios';
import { getAdminApiPath } from './admin-paths';

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
  // Тільки на клієнті додаємо токен
  if (typeof window !== 'undefined') {
    // Спочатку пробуємо токен з localStorage (для звичайних користувачів)
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Для адмін-запитів cookie admin_session додається автоматично через credentials: 'include'
  }
  return config;
});

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Тільки на клієнті робимо редірект
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
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
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, newPassword: string) =>
    api.post('/auth/reset-password', { token, newPassword }),
};

// Products API
export const productsApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/products', { params }),
  getById: (id: string) => api.get(`/products/${id}`),
  getAllAdmin: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get(getAdminApiPath('/products'), { params }),
  create: (data: FormData) =>
    api.post(getAdminApiPath('/products'), data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  update: (id: string, data: FormData) =>
    api.put(getAdminApiPath(`/products/${id}`), data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  delete: (id: string) => api.delete(getAdminApiPath(`/products/${id}`)),
};

// Categories API
export const categoriesApi = {
  getAll: (params?: { parentId?: string }) =>
    api.get(getAdminApiPath('/categories'), { params }),
  getAllTree: () => api.get(getAdminApiPath('/categories/tree')),
  getById: (id: string) => api.get(getAdminApiPath(`/categories/${id}`)),
  create: (data: FormData) =>
    api.post(getAdminApiPath('/categories'), data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  update: (id: string, data: FormData) =>
    api.put(getAdminApiPath(`/categories/${id}`), data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  delete: (id: string) => api.delete(getAdminApiPath(`/categories/${id}`)),
};

// Orders API
export const ordersApi = {
  create: (data: any) => api.post('/orders', data),
  getById: (id: string) => api.get(`/orders/${id}`),
  getAll: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get('/orders', { params }),
  getAllAdmin: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get(getAdminApiPath('/orders'), { params }),
  updateStatus: (id: string, status: string) =>
    api.patch(getAdminApiPath(`/orders/${id}/status`), { status }),
  delete: (id: string) => api.delete(getAdminApiPath(`/orders/${id}`)),
  getStats: () => api.get(getAdminApiPath('/orders/stats')),
};

// Admin API
export const adminApi = {
  // Dashboard Stats
  getDashboardStats: (days?: number) =>
    api.get(getAdminApiPath('/stats'), { params: { days } }),

  // Users
  getUsers: (params?: { page?: number; limit?: number; role?: string; search?: string }) =>
    api.get(getAdminApiPath('/users'), { params }),
  getUserById: (id: string) => api.get(getAdminApiPath(`/users/${id}`)),
  updateUserRole: (id: string, role: 'USER' | 'ADMIN') =>
    api.patch(getAdminApiPath(`/users/${id}/role`), { role }),
  resetUserPassword: (id: string, password: string) =>
    api.post(getAdminApiPath(`/users/${id}/reset-password`), { password }),
  deleteUser: (id: string) => api.delete(getAdminApiPath(`/users/${id}`)),

  // Logs
  getLogs: (params?: { page?: number; limit?: number; adminId?: string; action?: string }) =>
    api.get(getAdminApiPath('/logs'), {
      params,
      // Для адмін-запитів використовуємо cookie для автентифікації
      ...(typeof window !== 'undefined' ? { credentials: 'include' as const } : {}),
    }),

  // Settings
  getSettings: () => api.get(getAdminApiPath('/settings')),
  getSetting: (key: string) => api.get(getAdminApiPath(`/settings/${key}`)),
  updateSetting: (key: string, value: string, description?: string) =>
    api.put(getAdminApiPath(`/settings/${key}`), { value, description }),
};
