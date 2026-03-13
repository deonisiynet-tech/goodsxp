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
  ordersByStatus?: { status: string; count: number }[]
  dailyRevenue?: { date: string; revenue: number }[]
  recentOrders?: {
    id: string
    name: string
    email: string
    totalPrice: number
    status: string
    createdAt: string
    items?: {
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
  value: number | undefined
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
          <p className="text-3xl font-bold text-primary">{(value ?? 0).toLocaleString('uk-UA')}</p>
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
  const [authenticated, setAuthenticated] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = typeof window !== 'undefined' ? (require('next/navigation').useRouter() as ReturnType<typeof import('next/navigation').useRouter>) : null

  useEffect(() => {
    console.log('🔍 Dashboard: Checking authentication...')

    const loadDashboardData = async () => {
      try {
        // Check authentication first
        console.log('📡 Fetching /api/admin/auth/me...')
        const authRes = await fetch('/api/admin/auth/me', {
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
          },
        })

        console.log('🔍 Dashboard: Auth response status:', authRes.status)

        if (authRes.status === 401) {
          console.log('⚠️ Dashboard: Not authenticated, redirecting to login')
          setAuthenticated(false)
          if (router) router.push('/admin/login?from=/admin')
          return
        }

        const authData = await authRes.json()
        console.log('🔍 Dashboard: Auth response:', authData)

        if (!authData.authenticated) {
          console.log('⚠️ Dashboard: Not authenticated (no user data)')
          setAuthenticated(false)
          if (router) router.push('/admin/login?from=/admin')
          return
        }

        console.log('✅ Dashboard: Authenticated, fetching stats...')

        // Fetch stats
        console.log('📡 Fetching /api/admin/stats...')
        const statsRes = await fetch('/api/admin/stats', {
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
          },
        })

        console.log('📊 Dashboard: Stats response status:', statsRes.status)

        if (!statsRes.ok) {
          const errorText = await statsRes.text()
          console.error('❌ Dashboard: Stats error:', statsRes.status, errorText)
          throw new Error(`Failed to fetch stats: ${statsRes.status} ${errorText}`)
        }

        const data = await statsRes.json()
        console.log('✅ Dashboard: Stats loaded:', data)
        console.log('📊 Dashboard: Data keys:', Object.keys(data))

        // Validate data structure
        if (!data.totalUsers && !data.totalOrders && !data.totalRevenue) {
          console.warn('⚠️ Dashboard: Stats data may be incomplete')
        }

        setStats(data)
        setError(null)
      } catch (err: any) {
        console.error('❌ Dashboard: Error loading data:', err)
        setError(err.message || 'Failed to load dashboard data')
        toast.error('Не вдалося завантажити статистику: ' + (err.message || ''))
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  // Not authenticated - redirecting
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-muted">Перенаправлення на сторінку входу...</div>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted">Завантаження статистики...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !stats) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-surface flex items-center justify-center">
          <div className="text-center max-w-md p-6">
            <h2 className="text-2xl font-bold text-primary mb-4">Помилка завантаження</h2>
            <p className="text-muted mb-4">{error || 'Не вдалося завантажити дані'}</p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              Спробувати знову
            </button>
          </div>
        </div>
      </AdminLayout>
    )
  }

  // Safe data access with defaults
  const safeStats = {
    totalUsers: stats.totalUsers ?? 0,
    totalOrders: stats.totalOrders ?? 0,
    totalRevenue: stats.totalRevenue ?? 0,
    totalProducts: stats.totalProducts ?? 0,
    ordersToday: stats.ordersToday ?? 0,
    new: stats.new ?? 0,
    processing: stats.processing ?? 0,
    delivered: stats.delivered ?? 0,
    dailyOrders: Array.isArray(stats.dailyOrders) ? stats.dailyOrders : [],
    recentOrders: Array.isArray(stats.recentOrders) ? stats.recentOrders : [],
  }

  const chartData = safeStats.dailyOrders.slice(0, 7)
  const maxOrders = chartData.length > 0 ? Math.max(...chartData.map((d) => d.orders ?? 0), 1) : 1

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Ви впевнені, що хочете видалити цей товар?')) return

    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to delete product')
      }

      toast.success('Товар видалено')
    } catch (error: any) {
      console.error('Error deleting product:', error)
      toast.error(error.message || 'Помилка при видаленні')
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
            value={safeStats.totalUsers}
            icon={Users}
            color="blue"
          />
          <StatCard
            title="Всього товарів"
            value={safeStats.totalProducts}
            icon={Tag}
            color="cyan"
          />
          <StatCard
            title="Всього замовлень"
            value={safeStats.totalOrders}
            icon={ShoppingCart}
            color="green"
          />
          <StatCard
            title="Дохід"
            value={safeStats.totalRevenue}
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
                <p className="text-2xl font-bold text-primary">{safeStats.ordersToday}</p>
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
                <p className="text-2xl font-bold text-primary">{safeStats.processing}</p>
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
                <p className="text-2xl font-bold text-primary">{safeStats.delivered}</p>
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
                const height = ((day.orders ?? 0) / maxOrders) * 100
                const date = day.date ? new Date(day.date) : new Date()
                const dayName = date.toLocaleDateString('uk-UA', { weekday: 'short' })
                const dayDate = date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'numeric' })

                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full relative flex items-end justify-center h-full">
                      <div
                        className="w-full max-w-[60px] bg-gradient-to-t from-primary/80 to-primary/40 rounded-t-lg transition-all duration-300 hover:from-primary hover:to-primary/60"
                        style={{ height: `${height}%`, minHeight: height > 0 ? '8px' : '0' }}
                      />
                      {(day.orders ?? 0) > 0 && (
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

        {/* Recent Orders - Only render if data exists */}
        {safeStats.recentOrders && safeStats.recentOrders.length > 0 ? (
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
                  {safeStats.recentOrders.map((order) => (
                    <tr key={order?.id || Math.random()} className="hover:bg-surfaceLight">
                      <td className="px-4 py-3 font-mono text-sm text-primary">
                        {order?.id?.slice(0, 8)}...
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-primary">{order?.name || 'N/A'}</div>
                        <div className="text-sm text-muted">{order?.email || 'N/A'}</div>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {Number(order?.totalPrice ?? 0).toLocaleString('uk-UA')} ₴
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/30">
                          {order?.status || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted">
                        {order?.createdAt ? new Date(order.createdAt).toLocaleDateString('uk-UA') : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="card p-12 text-center text-muted">
            <ShoppingCart size={48} className="mx-auto mb-4 opacity-50" />
            <p>Останні замовлення відсутні</p>
          </div>
        )}

        {/* Recent Products Section - Simplified to avoid errors */}
        <section className="mt-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-primary">Швидкі дії</h2>
            <button onClick={handleCreate} className="btn-primary flex items-center gap-2">
              <Plus size={20} />
              Додати товар
            </button>
          </div>

          <div className="card p-6 text-center">
            <p className="text-muted">
              Використовуйте меню зліва для управління товарами, замовленнями та користувачами
            </p>
          </div>
        </section>
      </div>

      {modalOpen && <ProductModal product={editingProduct} onClose={handleModalClose} />}
    </AdminLayout>
  )
}
