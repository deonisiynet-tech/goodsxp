'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import OrderModal from '@/components/admin/OrderModal'
import { getAdminApiFullPath } from '@/lib/admin-paths'
import { formatOrderNumber } from '@/lib/order-utils'
import toast from 'react-hot-toast'
import { ShoppingCart, Search, Filter, Eye, Trash2, RefreshCw } from 'lucide-react'

interface Order {
  id: string
  orderNumber: number
  userId: string | null
  name: string
  phone: string
  email: string
  address: string
  totalPrice: number
  status: string
  comment: string | null
  promoCodeValue?: string | null
  discount?: number | null
  createdAt: string
  updatedAt: string
  items: {
    id: string
    productId: string
    quantity: number
    price: number
    product: {
      id: string
      title: string
      imageUrl: string | null
    }
  }[]
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchEmail, setSearchEmail] = useState('')
  const [searchId, setSearchId] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalOrders, setTotalOrders] = useState(0)
  const ORDERS_PER_PAGE = 20

  const loadOrders = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('page', String(currentPage))
      params.append('limit', String(ORDERS_PER_PAGE))
      if (statusFilter) params.append('status', statusFilter)
      if (searchEmail) params.append('email', searchEmail)
      if (searchId) params.append('searchId', searchId)

      const response = await fetch(getAdminApiFullPath(`/orders?${params.toString()}`), {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to load orders')
      }

      const data = await response.json()
      setOrders(data.orders || [])
      setTotalPages(data.pagination?.totalPages || 1)
      setTotalOrders(data.pagination?.total || 0)
    } catch (error) {
      console.error('Error loading orders:', error)
      toast.error('Помилка завантаження замовлень')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const debounce = setTimeout(() => {
      loadOrders()
    }, 300)
    return () => clearTimeout(debounce)
  }, [searchEmail, searchId, statusFilter, currentPage])

  const handleView = (order: Order) => {
    setSelectedOrder(order)
    setModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Ви впевнені, що хочете видалити це замовлення?')) return

    try {
      // Отримуємо CSRF токен з cookies перед видаленням
      const csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrf_token='))
        ?.split('=')[1]

      const response = await fetch(getAdminApiFullPath(`/orders/${id}`), {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || '',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error || `Failed to delete order (${response.status})`)
      }

      toast.success('Замовлення видалено')
      loadOrders()
    } catch (error: any) {
      console.error('Error deleting order:', error)
      toast.error(error.message || 'Помилка при видаленні')
    }
  }

  const handleModalClose = () => {
    setModalOpen(false)
    setSelectedOrder(null)
    loadOrders()
  }

  const handleStatusChange = async (orderId: string, status: string) => {
    try {
      const response = await fetch(getAdminApiFullPath(`/orders/${orderId}/status`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      toast.success('Статус оновлено')
      loadOrders()
    } catch (error: any) {
      console.error('Error updating status:', error)
      toast.error(error.message || 'Помилка при оновленні статусу')
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      NEW: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
      PROCESSING: 'bg-purple-500/10 text-purple-500 border-purple-500/30',
      SHIPPED: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
      DELIVERED: 'bg-green-500/10 text-green-500 border-green-500/30',
      CANCELLED: 'bg-red-500/10 text-red-500 border-red-500/30',
    }
    return colors[status] || 'bg-gray-500/10 text-gray-500 border-gray-500/30'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      NEW: 'Нове',
      PROCESSING: 'В обробці',
      SHIPPED: 'Відправлено',
      DELIVERED: 'Доставлено',
      CANCELLED: 'Скасовано',
    }
    return labels[status] || status
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Замовлення</h1>
            <p className="text-muted mt-1">Управління замовленнями клієнтів</p>
          </div>
          <button onClick={loadOrders} className="btn-secondary flex items-center gap-2" disabled={loading}>
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            Оновити
          </button>
        </div>

        {/* Filters */}
        <div className="card p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={20} />
              <input
                type="text"
                placeholder="Пошук по email..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                className="input-field pl-12"
              />
            </div>

            <div className="relative max-w-xs">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-sm font-mono">#</span>
              <input
                type="text"
                placeholder="ID замовлення..."
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="input-field pl-8 font-mono"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field max-w-xs"
            >
              <option value="">Всі статуси</option>
              <option value="NEW">Нові</option>
              <option value="PROCESSING">В обробці</option>
              <option value="SHIPPED">Відправлені</option>
              <option value="DELIVERED">Доставлені</option>
              <option value="CANCELLED">Скасовані</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        {loading ? (
          <div className="card p-12 flex justify-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surfaceLight">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">№ замовлення</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Клієнт</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Сума</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Статус</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Дата</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase">Дії</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-surfaceLight transition-colors">
                    <td className="px-6 py-4 font-mono text-sm font-medium text-primary">
                      {formatOrderNumber(order.orderNumber)}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-white">{order.name}</div>
                        <div className="text-sm text-muted">{order.email}</div>
                        <div className="text-sm text-muted">{order.phone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">
                        {Number(order.totalPrice).toLocaleString('uk-UA')} ₴
                      </div>
                      {order.promoCodeValue && order.discount && (
                        <div className="text-xs text-green-400 mt-1">
                          🏷 {order.promoCodeValue} (-{Number(order.discount).toLocaleString('uk-UA')} ₴)
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs rounded-full border ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted">
                      {new Date(order.createdAt).toLocaleDateString('uk-UA', {
                        day: 'numeric',
                        month: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleView(order)}
                          className="p-2 text-primary hover:bg-surfaceLight rounded-lg transition-colors"
                          title="Перегляд"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(order.id)}
                          className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
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

            {orders.length === 0 && (
              <div className="text-center py-20 text-muted">
                <ShoppingCart size={48} className="mx-auto mb-4 opacity-50" />
                <p>Замовлення не знайдені</p>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-muted">
              Всього: {totalOrders} замовлень
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded-lg bg-surface border border-border text-sm text-muted hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ← Назад
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                // Показуємо вікно з 5 сторінок навколо поточної
                let page: number;
                if (totalPages <= 5) {
                  page = i + 1;
                } else if (currentPage <= 3) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i;
                } else {
                  page = currentPage - 2 + i;
                }
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                      currentPage === page
                        ? 'bg-purple-500 text-white'
                        : 'bg-surface border border-border text-muted hover:text-white'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 rounded-lg bg-surface border border-border text-sm text-muted hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Далі →
              </button>
            </div>
          </div>
        )}
      </div>

      {modalOpen && selectedOrder && (
        <OrderModal order={selectedOrder} onClose={handleModalClose} onStatusChange={handleStatusChange} />
      )}
    </AdminLayout>
  )
}
