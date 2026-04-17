'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { productsApi } from '@/lib/products-api'
import ProductModal from '@/components/admin/ProductModal'
import toast from 'react-hot-toast'
import { Package, Plus, Search, Edit, Trash2, RefreshCw, CheckCircle, XCircle } from 'lucide-react'

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)

  const loadProducts = async () => {
    try {
      setLoading(true)
      // ✅ FIX: Use getAllAdmin instead of getAll to include margin
      const response = await productsApi.getAllAdmin({
        search: search || undefined,
        limit: 100,
      })
      let loadedProducts = response.products || response

      // Filter by status
      if (statusFilter === 'active') {
        loadedProducts = loadedProducts.filter((p: any) => p.isActive)
      } else if (statusFilter === 'inactive') {
        loadedProducts = loadedProducts.filter((p: any) => !p.isActive)
      } else if (statusFilter === 'instock') {
        loadedProducts = loadedProducts.filter((p: any) => p.stock > 0)
      } else if (statusFilter === 'outofstock') {
        loadedProducts = loadedProducts.filter((p: any) => p.stock === 0)
      }

      setProducts(loadedProducts)
    } catch (error: any) {
      console.error('Error loading products:', error)
      toast.error('Помилка завантаження товарів: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const debounce = setTimeout(() => {
      loadProducts()
    }, 300)
    return () => clearTimeout(debounce)
  }, [search, statusFilter])

  const handleDelete = async (id: string) => {
    if (!confirm('Ви впевнені, що хочете видалити цей товар?')) return

    try {
      await productsApi.delete(id)
      toast.success('Товар видалено')
      loadProducts()
    } catch (error: any) {
      toast.error('Помилка: ' + error.message)
    }
  }

  const handleEdit = (product: any) => {
    setEditingProduct(product)
    setModalOpen(true)
  }

  const handleCreate = () => {
    setEditingProduct(null)
    setModalOpen(true)
  }

  const handleModalClose = () => {
    setModalOpen(false)
    setEditingProduct(null)
    loadProducts()
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Товари</h1>
            <p className="text-muted mt-1">Управління асортиментом магазину</p>
          </div>
          <div className="flex gap-2">
            <button onClick={loadProducts} className="btn-secondary flex items-center gap-2" disabled={loading}>
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              Оновити
            </button>
            <button onClick={handleCreate} className="btn-primary flex items-center gap-2">
              <Plus size={20} />
              Додати товар
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-4">
          <div className="flex flex-col md:flex-row gap-4">
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

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field max-w-xs"
            >
              <option value="">Всі статуси</option>
              <option value="active">Активні</option>
              <option value="inactive">Неактивні</option>
              <option value="instock">В наявності</option>
              <option value="outofstock">Немає в наявності</option>
            </select>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-48 bg-surfaceLight" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-surfaceLight rounded w-3/4" />
                  <div className="h-4 bg-surfaceLight rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div key={product.id} className="card overflow-hidden group hover:shadow-lg transition-all duration-300">
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={product.imageUrl || '/placeholder.jpg'}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute top-2 right-2 flex gap-2">
                    {!product.isActive && (
                      <span className="px-2 py-1 bg-red-500/90 rounded-lg text-xs text-white">
                        Неактивний
                      </span>
                    )}
                    {product.stock === 0 && product.isActive && (
                      <span className="px-2 py-1 bg-yellow-500/90 rounded-lg text-xs text-white">
                        Немає в наявності
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-white mb-2 truncate">{product.title}</h3>
                  <p className="text-sm text-muted mb-3 line-clamp-2">{product.description}</p>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-2xl font-bold text-white">
                      {product.price.toLocaleString('uk-UA')} ₴
                    </p>
                    <div className="flex items-center gap-2">
                      {product.stock > 0 ? (
                        <CheckCircle size={16} className="text-green-500" />
                      ) : (
                        <XCircle size={16} className="text-red-500" />
                      )}
                      <span className={`text-sm ${product.stock > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {product.stock} шт.
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <span className={`text-xs px-2 py-1 rounded ${product.isActive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                      {product.isActive ? 'Активний' : 'Неактивний'}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="p-2 text-primary hover:bg-surfaceLight rounded-lg transition-colors"
                        title="Редагувати"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Видалити"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {products.length === 0 && !loading && (
          <div className="text-center py-20 text-muted">
            <Package size={48} className="mx-auto mb-4 opacity-50" />
            <p>Товари не знайдені</p>
          </div>
        )}
      </div>

      {modalOpen && <ProductModal product={editingProduct} onClose={handleModalClose} />}
    </AdminLayout>
  )
}
