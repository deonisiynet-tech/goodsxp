'use client';

import { useEffect, useState } from 'react';
import { ordersApi } from '@/lib/api';
import { formatOrderNumber } from '@/lib/order-utils';
import toast from 'react-hot-toast';
import { Eye, Trash2 } from 'lucide-react';
import OrderModal from './OrderModal';

interface Order {
  id: string;
  orderNumber: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  totalPrice: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  items: any[];
  userId?: string | null;
  comment?: string | null;
  updatedAt: string;
}

export default function OrderList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await ordersApi.getAllAdmin({ status: statusFilter || undefined });
      setOrders(response.data.orders);
    } catch (error) {
      toast.error('Помилка завантаження замовлень');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Ви впевнені, що хочете видалити це замовлення?')) return;

    try {
      await ordersApi.delete(id);
      toast.success('Замовлення видалено');
      loadOrders();
    } catch (error) {
      toast.error('Помилка при видаленні');
    }
  };

  const handleView = (order: Order) => {
    setSelectedOrder(order);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedOrder(null);
    loadOrders();
  };

  const handleStatusChange = async (orderId: string, status: string) => {
    try {
      await ordersApi.updateStatus(orderId, status);
      toast.success('Статус замовлення оновлено');
      loadOrders();
    } catch (error) {
      toast.error('Помилка оновлення статусу');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      NEW: 'bg-yellow-500/10 text-yellow-500',
      PROCESSING: 'bg-purple-500/10 text-purple-500',
      SHIPPED: 'bg-blue-500/10 text-blue-500',
      DELIVERED: 'bg-green-500/10 text-green-500',
      CANCELLED: 'bg-red-500/10 text-red-500',
    };
    return colors[status] || 'bg-gray-500/10 text-gray-500';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      NEW: 'Нове',
      PROCESSING: 'В обробці',
      SHIPPED: 'Відправлено',
      DELIVERED: 'Доставлено',
      CANCELLED: 'Скасовано',
    };
    return labels[status] || status;
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      COD: 'Накладений платіж',
      CARD: 'Передоплата',
    };
    return labels[method] || method;
  };

  const getPaymentMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      COD: 'bg-yellow-500/10 text-yellow-500',
      CARD: 'bg-green-500/10 text-green-500',
    };
    return colors[method] || 'bg-gray-500/10 text-gray-500';
  };

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-light mb-6">Керування замовленнями</h1>

      <div className="card p-4 mb-6">
        <div className="flex gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field w-full sm:max-w-xs"
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

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Desktop table view */}
          <div className="hidden lg:block card overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surfaceLight">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    № замовлення
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Клієнт
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Сума
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Оплата
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Дата
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                    Дії
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-surfaceLight">
                    <td className="px-6 py-4 font-mono text-sm font-medium text-primary">
                      {formatOrderNumber(order.orderNumber)}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium">{order.name}</div>
                        <div className="text-sm text-muted">{order.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {Number(order.totalPrice).toLocaleString('uk-UA')} ₴
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded ${getPaymentMethodColor(order.paymentMethod)}`}>
                        {getPaymentMethodLabel(order.paymentMethod)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted">
                      {new Date(order.createdAt).toLocaleDateString('uk-UA')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleView(order)}
                          className="p-2 text-primary hover:bg-surfaceLight transition-colors rounded"
                          title="Перегляд"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(order.id)}
                          className="p-2 text-red-500 hover:bg-surfaceLight transition-colors rounded"
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
                Замовлення не знайдені
              </div>
            )}
          </div>

          {/* Mobile card view */}
          <div className="lg:hidden space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="card p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-mono text-sm font-medium text-primary">
                      {formatOrderNumber(order.orderNumber)}
                    </div>
                    <div className="text-sm text-muted mt-1">
                      {new Date(order.createdAt).toLocaleDateString('uk-UA')}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleView(order)}
                      className="p-2 text-primary hover:bg-surfaceLight transition-colors rounded min-w-[44px] min-h-[44px] flex items-center justify-center"
                      title="Перегляд"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(order.id)}
                      className="p-2 text-red-500 hover:bg-surfaceLight transition-colors rounded min-w-[44px] min-h-[44px] flex items-center justify-center"
                      title="Видалити"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <div className="font-medium">{order.name}</div>
                    <div className="text-sm text-muted">{order.email}</div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-sm text-muted">Сума:</span>
                    <span className="font-medium">{Number(order.totalPrice).toLocaleString('uk-UA')} ₴</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted">Статус:</span>
                    <span className={`px-2 py-1 text-xs rounded ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted">Оплата:</span>
                    <span className={`px-2 py-1 text-xs rounded ${getPaymentMethodColor(order.paymentMethod)}`}>
                      {getPaymentMethodLabel(order.paymentMethod)}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {orders.length === 0 && (
              <div className="card p-12 text-center text-muted">
                Замовлення не знайдені
              </div>
            )}
          </div>
        </>
      )}

      {modalOpen && selectedOrder && (
        <OrderModal order={selectedOrder} onClose={handleModalClose} onStatusChange={handleStatusChange} />
      )}
    </div>
  );
}
