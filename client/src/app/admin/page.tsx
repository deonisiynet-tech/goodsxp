'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, productsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Package, Plus, Edit, Trash2, Search, LogOut, Eye, EyeOff } from 'lucide-react';
import Header from '@/components/Header';
import ProductModal from '@/components/admin/ProductModal';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string | null;
  images: string[];
  stock: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Login form state
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadProducts();
    }
  }, [isAuthenticated, search]);

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      const userData = JSON.parse(user);
      if (userData.role === 'ADMIN') {
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);

    try {
      const response = await authApi.login(loginForm.email, loginForm.password);
      
      if (response.data.user.role !== 'ADMIN') {
        toast.error('Недостатньо прав для доступу до адмін-панелі');
        return;
      }

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setIsAuthenticated(true);
      toast.success('Вхід виконано успішно!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Помилка при вході');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    toast.success('Вихід виконано');
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await productsApi.getAllAdmin({ search, limit: 100 });
      setProducts(response.data.products);
    } catch (error) {
      toast.error('Помилка завантаження товарів');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Ви впевнені, що хочете видалити цей товар?')) return;

    try {
      await productsApi.delete(id);
      toast.success('Товар видалено');
      loadProducts();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Помилка при видаленні');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setModalOpen(true);
  };

  const handleCreate = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingProduct(null);
    loadProducts();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface px-4">
        <div className="max-w-md w-full">
          <div className="card p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 flex items-center justify-center">
                <Package size={32} className="text-primary" strokeWidth={1.5} />
              </div>
              <h1 className="text-2xl font-light text-center mb-2">Адмін-панель</h1>
              <p className="text-muted text-sm">GoodsXP</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  className="input-field"
                  placeholder="admin@goodsxp.store"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Пароль</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="input-field pr-10"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="btn-primary w-full py-3 disabled:opacity-50"
              >
                {loginLoading ? 'Вхід...' : 'Увійти'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 pt-20">
        {/* Hero */}
        <section className="relative py-12 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/10" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-2">Панель керування</h1>
                <p className="text-muted">Управління товарами магазину</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 border border-border rounded-xl hover:bg-surface transition-colors"
              >
                <LogOut size={18} />
                <span className="hidden md:inline">Вийти</span>
              </button>
            </div>
          </div>
        </section>

        {/* Products Section */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            {/* Actions Bar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={20} />
                <input
                  type="text"
                  placeholder="Пошук товарів..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input-field pl-12"
                />
              </div>
              <button onClick={handleCreate} className="btn-primary flex items-center gap-2">
                <Plus size={20} />
                Додати товар
              </button>
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="card overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-surfaceLight">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Фото</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Назва</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Ціна</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Залишок</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Статус</th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Дії</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-surfaceLight transition-colors">
                        <td className="px-6 py-4">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-surfaceLight">
                            <img
                              src={product.imageUrl || '/placeholder.jpg'}
                              alt={product.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium">{product.title}</td>
                        <td className="px-6 py-4">{product.price.toLocaleString('uk-UA')} ₴</td>
                        <td className="px-6 py-4">{product.stock} шт.</td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              product.isActive
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}
                          >
                            {product.isActive ? 'Активний' : 'Неактивний'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEdit(product)}
                              className="p-2 text-primary hover:bg-surfaceLight rounded-lg transition-colors"
                              title="Редагувати"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Видалити"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {products.length === 0 && (
                  <div className="text-center py-20 text-muted">
                    Товари не знайдені
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Product Modal */}
      {modalOpen && (
        <ProductModal
          product={editingProduct}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
