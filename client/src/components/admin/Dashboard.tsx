'use client';

import { ShoppingCart, Users, Package, DollarSign, TrendingUp, CheckCircle, Clock, AlertCircle, Tag } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'purple' | 'yellow' | 'red' | 'cyan';
  trend?: string;
}

function StatCard({ title, value, icon: Icon, color, trend }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    green: 'bg-green-500/10 border-green-500/30 text-green-400',
    purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
    yellow: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    red: 'bg-red-500/10 border-red-500/30 text-red-400',
    cyan: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
  };

  return (
    <div className="card p-4 sm:p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs sm:text-sm text-muted mb-1">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-white">{value}</p>
          {trend && (
            <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
              <TrendingUp size={12} />
              {trend}
            </p>
          )}
        </div>
        <div className={`p-3 sm:p-4 rounded-2xl border ${colorClasses[color]}`}>
          <Icon size={24} className="sm:w-7 sm:h-7" />
        </div>
      </div>
    </div>
  );
}

interface DailyOrder {
  date: string;
  orders: number;
}

interface DashboardStats {
  total?: number;
  revenue?: number;
  new?: number;
  processing?: number;
  shipped?: number;
  delivered?: number;
  totalUsers?: number;
  totalOrders?: number;
  totalRevenue?: number;
  totalProducts?: number;
  ordersToday?: number;
  dailyOrders?: DailyOrder[];
}

interface DashboardProps {
  stats?: DashboardStats;
  loading?: boolean;
}

export default function Dashboard({ stats, loading }: DashboardProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-4 sm:p-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-4 bg-surfaceLight rounded w-24 mb-3" />
                <div className="h-8 bg-surfaceLight rounded w-16" />
              </div>
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-surfaceLight rounded-2xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const defaultStats = {
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    ordersToday: 0,
    new: 0,
    processing: 0,
    delivered: 0,
    shipped: 0,
    dailyOrders: [],
  };

  const data = { ...defaultStats, ...stats };

  // Prepare chart data - last 7 days
  const chartData = Array.isArray(data.dailyOrders) 
    ? data.dailyOrders.slice(0, 7).reverse()
    : [];
  
  const maxOrders = chartData.length > 0 
    ? Math.max(...chartData.map(d => d.orders), 1) 
    : 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-sm sm:text-base text-muted">Огляд статистики магазину</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Всього користувачів"
          value={data.totalUsers.toLocaleString('uk-UA')}
          icon={Users}
          color="blue"
        />

        <StatCard
          title="Всього товарів"
          value={data.totalProducts.toLocaleString('uk-UA')}
          icon={Tag}
          color="cyan"
        />

        <StatCard
          title="Всього замовлень"
          value={data.totalOrders.toLocaleString('uk-UA')}
          icon={ShoppingCart}
          color="green"
        />

        <StatCard
          title="Дохід"
          value={`${data.totalRevenue.toLocaleString('uk-UA')} ₴`}
          icon={DollarSign}
          color="purple"
        />
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="card p-4 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2.5 sm:p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
              <Clock className="text-yellow-400" size={20} />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted">Замовлень сьогодні</p>
              <p className="text-xl sm:text-2xl font-bold text-white">{data.ordersToday}</p>
            </div>
          </div>
        </div>

        <div className="card p-4 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2.5 sm:p-3 rounded-xl bg-blue-500/10 border border-blue-500/30">
              <Clock className="text-blue-400" size={20} />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted">В обробці</p>
              <p className="text-xl sm:text-2xl font-bold text-white">{data.processing}</p>
            </div>
          </div>
        </div>

        <div className="card p-4 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2.5 sm:p-3 rounded-xl bg-green-500/10 border border-green-500/30">
              <CheckCircle className="text-green-400" size={20} />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted">Виконані</p>
              <p className="text-xl sm:text-2xl font-bold text-white">{data.delivered}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="card p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-white mb-4 sm:mb-6">Замовлення по дням (останні 7 днів)</h2>
        {chartData.length > 0 ? (
          <div className="flex items-end justify-between gap-1 sm:gap-2 h-40 sm:h-48">
            {chartData.map((day, index) => {
              const height = (day.orders / maxOrders) * 100;
              const date = new Date(day.date);
              const dayName = date.toLocaleDateString('uk-UA', { weekday: 'short' });
              const dayDate = date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'numeric' });

              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full relative flex items-end justify-center h-full">
                    <div
                      className="w-full max-w-[40px] sm:max-w-[60px] bg-gradient-to-t from-primary/80 to-primary/40 rounded-t-lg transition-all duration-300 hover:from-primary hover:to-primary/60"
                      style={{ height: `${height}%`, minHeight: height > 0 ? '8px' : '0' }}
                    />
                    {day.orders > 0 && (
                      <span className="absolute -top-5 sm:-top-6 text-xs font-medium text-primary">
                        {day.orders}
                      </span>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] sm:text-xs text-muted font-medium">{dayName}</p>
                    <p className="text-[10px] sm:text-xs text-muted hidden sm:block">{dayDate}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-muted">
            <ShoppingCart size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-sm sm:text-base">Немає даних про замовлення</p>
          </div>
        )}
      </div>
    </div>
  );
}
