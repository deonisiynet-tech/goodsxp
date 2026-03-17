'use client';

import { useEffect, useState } from 'react';
import { productsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import ProductModal from './ProductModal';

interface Product {
  id: string;
  sku: string | null;
  title: string;
  price: number;
  stock: number;
  isActive: boolean;
  imageUrl: string | null;
}

export default function AdminProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    loadProducts();
  }, [search]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await productsApi.getAllAdmin({ search });
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
    } catch (error) {
      toast.error('Помилка при видаленні');
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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-light">Керування товарами</h1>
        <button onClick={handleCreate} className="btn-primary flex items-center gap-2">
          <Plus size={20} />
          Додати товар
        </button>
      </div>

      <div className="card p-4 mb-6">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={20} />
            <input
              type="text"
              placeholder="Пошук товарів..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </div>
      </div>

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
                <tr key={product.id} className="hover:bg-surfaceLight">
                  <td className="px-6 py-4">
                    <div className="w-12 h-12 overflow-hidden bg-surfaceLight">
                      <img
                        src={
                          product.imageUrl?.startsWith('/uploads/') 
                            ? product.imageUrl 
                            : product.imageUrl 
                              ? `/uploads/${product.imageUrl}`
                              : '/placeholder.jpg'
                        }
                        alt={product.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.jpg';
                        }}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium">{product.title}</td>
                  <td className="px-6 py-4">{product.price.toLocaleString('uk-UA')} ₴</td>
                  <td className="px-6 py-4">{product.stock} шт.</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs ${
                        product.isActive
                          ? 'bg-green-500/10 text-green-500'
                          : 'bg-red-500/10 text-red-500'
                      }`}
                    >
                      {product.isActive ? 'Активний' : 'Неактивний'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="p-2 text-primary hover:bg-surfaceLight transition-colors"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-2 text-red-500 hover:bg-surfaceLight transition-colors"
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

      {modalOpen && (
        <ProductModal
          product={editingProduct}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
