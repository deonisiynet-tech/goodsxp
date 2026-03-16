'use client';

import Link from 'next/link';
import { Clock, CheckCircle, Package, Truck } from 'lucide-react';

interface OrderItem {
  quantity: number;
  product: {
    title: string;
    imageUrl: string | null;
  };
}

interface Order {
  id: string;
  name: string;
  email: string;
  totalPrice: number;
  status: string;
  createdAt: string;
  items?: OrderItem[];
}

interface LatestOrdersTableProps {
  orders?: Order[];
  loading?: boolean;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  NEW: { label: 'Нове', color: 'blue', icon: Clock },
  PROCESSING: { label: 'В обробці', color: 'yellow', icon: Package },
  SHIPPED: { label: 'Відправлено', color: 'purple', icon: Truck },
  DELIVERED: { label: 'Виконано', color: 'green', icon: CheckCircle },
  CANCELLED: { label: 'Скасовано', color: 'red', icon: Clock },
};

const statusColors: Record<string, string> = {
  blue: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  green: 'bg-green-500/10 text-green-400 border-green-500/30',
  red: 'bg-red-500/10 text-red-400 border-red-500/30',
};

export default function LatestOrdersTable({ orders = [], loading = false }: LatestOrdersTableProps) {
  // Format date as DD.MM.YYYY HH:mm
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('uk-UA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return `${value.toLocaleString('uk-UA')} ₴`;
  };

  if (loading) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Останні замовлення</h2>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-4">
              <div className="h-10 bg-surfaceLight rounded w-24" />
              <div className="h-10 bg-surfaceLight rounded flex-1" />
              <div className="h-10 bg-surfaceLight rounded w-32" />
              <div className="h-10 bg-surfaceLight rounded w-28" />
              <div className="h-10 bg-surfaceLight rounded w-32" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="card p-12 text-center text-muted">
        <Clock size={48} className="mx-auto mb-4 opacity-50" />
        <p>Останні замовлення відсутні</p>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-white">Останні замовлення</h2>
          <p className="text-sm text-muted mt-1">10 останніх замовлень</p>
        </div>
        <Link
          href="/admin/orders"
          className="text-sm text-white hover:text-primary font-medium"
        >
          Всі замовлення →
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-surfaceLight">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted">
                Замовлення
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted">
                Клієнт
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted">
                Сума
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted">
                Статус
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted">
                Дата
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.map((order) => {
              const statusInfo = statusConfig[order.status] || statusConfig.NEW;
              const StatusIcon = statusInfo.icon;

              return (
                <tr
                  key={order.id}
                  className="hover:bg-surfaceLight transition-colors"
                >
                  <td className="px-4 py-4">
                    <Link
                      href={`/admin/orders`}
                      className="font-mono text-sm text-primary hover:underline"
                    >
                      #{order.id.slice(0, 8).toUpperCase()}
                    </Link>
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-medium text-primary">{order.name}</div>
                    <div className="text-sm text-muted">{order.email}</div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="font-medium text-primary">
                      {formatCurrency(order.totalPrice)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                        statusColors[statusInfo.color]
                      }`}
                    >
                      <StatusIcon size={12} />
                      {statusInfo.label}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-muted">
                    {formatDate(order.createdAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
