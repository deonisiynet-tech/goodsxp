'use client';

import { ShoppingCart, Users, Package, DollarSign, TrendingUp, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'purple' | 'yellow' | 'red';
  trend?: string;
}

function StatCard({ title, value, icon: Icon, color, trend }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    green: 'bg-green-500/10 border-green-500/30 text-green-400',
    purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
    yellow: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    red: 'bg-red-500/10 border-red-500/30 text-red-400',
  };

  return (
    <div className="card p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted mb-1">{title}</p>
          <p className="text-3xl font-bold text-primary">{value}</p>
          {trend && (
            <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
              <TrendingUp size={12} />
              {trend}
            </p>
          )}
        </div>
        <div className={`p-4 rounded-2xl border ${colorClasses[color]}`}>
          <Icon size={28} />
        </div>
      </div>
    </div>
  );
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
}

interface DashboardProps {
  stats?: DashboardStats;
  loading?: boolean;
}

export default function Dashboard({ stats, loading }: DashboardProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-4 bg-surfaceLight rounded w-24 mb-3" />
                <div className="h-8 bg-surfaceLight rounded w-16" />
              </div>
              <div className="w-16 h-16 bg-surfaceLight rounded-2xl" />
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
    new: 0,
    processing: 0,
  };

  const data = { ...defaultStats, ...stats };

  return (
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
          value={data.totalUsers.toLocaleString('uk-UA')}
          icon={Users}
          color="blue"
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
          trend="+12% цього місяця"
        />

        <StatCard
          title="Нових замовлень"
          value={data.new.toLocaleString('uk-UA')}
          icon={Package}
          color="yellow"
        />
      </div>

      {/* Order Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30">
              <Clock className="text-blue-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-muted">В обробці</p>
              <p className="text-2xl font-bold text-primary">{data.processing}</p>
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
              <p className="text-2xl font-bold text-primary">{data.delivered || 0}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30">
              <AlertCircle className="text-red-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-muted">Скасовані</p>
              <p className="text-2xl font-bold text-primary">{data.shipped || 0}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
