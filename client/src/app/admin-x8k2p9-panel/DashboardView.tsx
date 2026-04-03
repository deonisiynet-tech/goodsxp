'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Users, Package, DollarSign, CheckCircle, Clock, Tag } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import ProductModal from '@/components/admin/ProductModal'
import SalesChart from '@/components/admin/SalesChart'
import LatestOrdersTable from '@/components/admin/LatestOrdersTable'
import TopProducts from '@/components/admin/TopProducts'
import VisitorStats from '@/components/admin/VisitorStats'
import toast from 'react-hot-toast'
import { Plus } from 'lucide-react'
import { getAdminApiFullPath, getAdminPagePath } from '@/lib/admin-paths'

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
  topProducts?: {
    productId: string
    product: {
      id: string
      title: string
      price: number
      imageUrl: string | null
    } | null
    _sum: { quantity: number | null }
    _count: number
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
          <p className="text-3xl font-bold text-white">{(value ?? 0).toLocaleString('uk-UA')}</p>
        </div>
        <div className={`p-4 rounded-2xl border ${colorClasses[color]}`}>
          <Icon size={28} />
        </div>
      </div>
    </div>
  )
}

export default function DashboardView() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [salesData, setSalesData] = useState<{ date: string; revenue: number }[]>([])
  const [latestOrders, setLatestOrders] = useState<any[]>([])
  const [topProducts, setTopProducts] = useState<any[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [chartLoading, setChartLoading] = useState(true)
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [productsLoading, setProductsLoading] = useState(true)

  // Fetch all dashboard data
  useEffect(() => {
    console.log('🔍 Dashboard: Checking authentication...')

    const loadDashboardData = async () => {
      try {
        // Check authentication first
        console.log('📡 Fetching auth me...')
        const authRes = await fetch(getAdminApiFullPath('/auth/me'), {
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
          },
        })

        console.log('🔍 Dashboard: Auth response status:', authRes.status)

        if (authRes.status === 401) {
          console.log('⚠️ Dashboard: Not authenticated, redirecting to login')
          setAuthenticated(false)
          router.push(getAdminPagePath('/login') + '?from=' + encodeURIComponent(pathname || getAdminPagePath('')))
          return
        }

        const authData = await authRes.json()
        console.log('🔍 Dashboard: Auth response:', authData)

        if (!authData.authenticated) {
          console.log('⚠️ Dashboard: Not authenticated (no user data)')
          setAuthenticated(false)
          router.push(getAdminPagePath('/login') + '?from=' + encodeURIComponent(pathname || getAdminPagePath('')))
          return
        }

        console.log('✅ Dashboard: Authenticated, fetching stats...')

        // Fetch main stats
        console.log('📡 Fetching stats...')
        const statsRes = await fetch(getAdminApiFullPath('/stats'), {
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
        setStats(data)

        // Fetch sales data for chart (last 30 days)
        console.log('📡 Fetching sales data...')
        const salesRes = await fetch(getAdminApiFullPath('/stats/sales?days=30'), {
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
          },
        })

        if (salesRes.ok) {
          const salesData = await salesRes.json()
          console.log('✅ Dashboard: Sales data loaded:', salesData)
          setSalesData(salesData.dailyRevenue || [])
        } else {
          console.warn('⚠️ Dashboard: Could not fetch sales data, using fallback')
          // Fallback to dailyRevenue from main stats
          setSalesData(data.dailyRevenue || [])
        }
        setChartLoading(false)

        // Fetch latest orders
        console.log('📡 Fetching latest orders...')
        const ordersRes = await fetch(getAdminApiFullPath('/orders?limit=10'), {
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
          },
        })

        if (ordersRes.ok) {
          const ordersData = await ordersRes.json()
          console.log('✅ Dashboard: Orders data loaded:', ordersData)
          setLatestOrders(ordersData.orders || ordersData)
        } else {
          console.warn('⚠️ Dashboard: Could not fetch orders, using fallback')
          // Fallback to recentOrders from main stats
          setLatestOrders(data.recentOrders || [])
        }
        setOrdersLoading(false)

        // Fetch top products
        console.log('📡 Fetching top products...')
        const productsRes = await fetch(getAdminApiFullPath('/products/top?limit=5'), {
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
          },
        })

        if (productsRes.ok) {
          const productsData = await productsRes.json()
          console.log('✅ Dashboard: Top products loaded:', productsData)
          setTopProducts(productsData.products || productsData)
        } else {
          console.warn('⚠️ Dashboard: Could not fetch top products, using fallback')
          // Fallback to topProducts from main stats
          setTopProducts(data.topProducts || [])
        }
        setProductsLoading(false)

        setError(null)
      } catch (err: any) {
        console.error('❌ Dashboard: Error loading data:', err)
        setError(err.message || 'Failed to load dashboard data')
        toast.error('Не вдалося завантажити статистику: ' + (err.message || ''))
        setChartLoading(false)
        setOrdersLoading(false)
        setProductsLoading(false)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [router])

  // Poll for updates every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading && authenticated) {
        // Refresh stats silently
        fetch(getAdminApiFullPath('/stats'), {
          credentials: 'include',
          headers: { 'Accept': 'application/json' },
        })
          .then(res => res.json())
          .then(data => setStats(data))
          .catch(err => console.error('Error refreshing stats:', err))
      }
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [loading, authenticated])

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
            <h2 className="text-2xl font-bold text-white mb-4">Помилка завантаження</h2>
            <p className="text-muted mb-4">{error || 'Не вдалося завантажити дані'}</p>
            <button
              onClick={() => typeof window !== 'undefined' && window.location.reload()}
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

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Ви впевнені, що хочете видалити цей товар?')) return

    try {
      const res = await fetch(getAdminApiFullPath(`/products/${id}`), {
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
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-muted">Огляд статистики магазину</p>
        </div>

        {/* Top Row: Revenue, Orders, Users */}
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

        {/* Visitor Analytics: Online now, Visitors */}
        <VisitorStats period="7days" />

        {/* Middle: Sales Chart */}
        <SalesChart data={salesData} loading={chartLoading} days={30} />

        {/* Bottom Row: Top Products, Latest Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopProducts products={topProducts} loading={productsLoading} />
          <LatestOrdersTable orders={latestOrders} loading={ordersLoading} />
        </div>

        {/* Quick Actions */}
        <section className="mt-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Швидкі дії</h2>
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
