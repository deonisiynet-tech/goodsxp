'use client'

import { useState, useEffect } from 'react'
import { ShoppingCart, Users, Package, DollarSign, CheckCircle, Clock, Tag } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import ProductModal from '@/components/admin/ProductModal'
import toast from 'react-hot-toast'
import { Edit, Trash2, Plus } from 'lucide-react'

interface DashboardStats {
  totalUsers: number
  totalOrders: number
  totalRevenue: number
  totalProducts: number
  ordersToday: number
  new: number
  processing: number
  delivered: number
  dailyOrders: { date: string; orders: number }[]
  recentOrders: {
    id: string
    name: string
    email: string
    totalPrice: number
    status: string
    createdAt: string
    items: {
      quantity: number
      product: {
        title: string
        imageUrl: string | null
      }
    }[]
  }[]
}

interface StatCardProps {
  title: string
  value: number
  icon: React.ElementType
  color: 'blue' | 'green' | 'purple' | 'yellow' | 'cyan'
}

function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    green: 'bg-green-500/10 border-green-500/30 text-green-400',
    purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
    yellow: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    cyan: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
  }

  return (
    <div className="card p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted mb-1">{title}</p>
          <p className="text-3xl font-bold text-primary">{value.toLocaleString('uk-UA')}</p>
        </div>
        <div className={`p-4 rounded-2xl border ${colorClasses[color]}`}>
          <Icon size={28} />
        </div>
      </div>
    </div>
  )
}

export default function DashboardView() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch stats')
        return res.json()
      })
      .then((data) => {
        setStats(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error fetching stats:', err)
        toast.error('Не вдалося завантажити статистику')
        setLoading(false)
      })
  }, [])

  if (loading || !stats) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const chartData = stats.dailyOrders.slice(0, 7)
  const maxOrders = chartData.length > 0 ? Math.max(...chartData.map((d) => d.orders), 1) : 1

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Ви впевнені, що хочете видалити цей товар?')) return

    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('Failed to delete product')
      }

      toast.success('Товар видалено')
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error('Помилка при видаленні')
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
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Dashboard</h1>
          <p className="text-muted">Огляд статистики магазину</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Всього користувачів"
            value={stats.totalUsers}
            icon={Users}
            color="blue"
          />
          <StatCard
            title="Всього товарів"
            value={stats.totalProducts}
            icon={Tag}
            color="cyan"
          />
          <StatCard
            title="Всього замовлень"
            value={stats.totalOrders}
            icon={ShoppingCart}
            color="green"
          />
          <StatCard
            title="Дохід"
            value={stats.totalRevenue}
            icon={DollarSign}
            color="purple"
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                <Clock className="text-yellow-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-muted">Замовлень сьогодні</p>
                <p className="text-2xl font-bold text-primary">{stats.ordersToday}</p>
              </div>
            </div>
          </div>
          <div className="card p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30">
                <Clock className="text-blue-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-muted">В обробці</p>
                <p className="text-2xl font-bold text-primary">{stats.processing}</p>
              </div>
            </div>
          </div>
          <div className="card p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30">
                <CheckCircle className="text-green-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-muted">Виконані</p>
                <p className="text-2xl font-bold text-primary">{stats.delivered}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-primary mb-6">
            Замовлення по дням (останні 7 днів)
          </h2>
          {chartData.length > 0 ? (
            <div className="flex items-end justify-between gap-2 h-48">
              {chartData.map((day, index) => {
                const height = (day.orders / maxOrders) * 100
                const date = new Date(day.date)
                const dayName = date.toLocaleDateString('uk-UA', { weekday: 'short' })
                const dayDate = date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'numeric' })

                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full relative flex items-end justify-center h-full">
                      <div
                        className="w-full max-w-[60px] bg-gradient-to-t from-primary/80 to-primary/40 rounded-t-lg transition-all duration-300 hover:from-primary hover:to-primary/60"
                        style={{ height: `${height}%`, minHeight: height > 0 ? '8px' : '0' }}
                      />
                      {day.orders > 0 && (
                        <span className="absolute -top-6 text-xs font-medium text-primary">
                          {day.orders}
                        </span>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted font-medium">{dayName}</p>
                      <p className="text-xs text-muted">{dayDate}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted">
              <ShoppingCart size={48} className="mx-auto mb-4 opacity-50" />
              <p>Немає даних про замовлення</p>
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-primary">Останні замовлення</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surfaceLight">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase">Замовлення</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase">Клієнт</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase">Сума</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase">Статус</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase">Дата</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stats.recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-surfaceLight">
                    <td className="px-4 py-3 font-mono text-sm text-primary">
                      {order.id.slice(0, 8)}...
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-primary">{order.name}</div>
                      <div className="text-sm text-muted">{order.email}</div>
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {Number(order.totalPrice).toLocaleString('uk-UA')} ₴
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/30">
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted">
                      {new Date(order.createdAt).toLocaleDateString('uk-UA')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Products */}
        <section className="mt-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-primary">Останні товари</h2>
            <button onClick={handleCreate} className="btn-primary flex items-center gap-2">
              <Plus size={20} />
              Додати товар
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stats.recentOrders.slice(0, 3).map((order) =>
              order.items.map((item, idx) => (
                <div
                  key={`${order.id}-${idx}`}
                  className="card overflow-hidden group hover:shadow-lg transition-all duration-300"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={item.product.imageUrl || '/placeholder.jpg'}
                      alt={item.product.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-primary mb-2 truncate">
                      {item.product.title}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted">{item.quantity} шт. замовлено</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit({ id: order.id })}
                          className="p-2 text-primary hover:bg-surfaceLight rounded-lg transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(order.id)}
                          className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {modalOpen && <ProductModal product={editingProduct} onClose={handleModalClose} />}
    </AdminLayout>
  )
}
