'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { ordersApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { ShoppingCart, Search, Filter, Eye, Trash2, RefreshCw } from 'lucide-react';
import OrderModal from '@/components/admin/OrderModal';

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product?: {
    id: string;
    title: string;
    imageUrl: string | null;
  };
}

interface Order {
  id: string;
  userId: string | null;
  name: string;
  phone: string;
  email: string;
  address: string;
  totalPrice: number;
  status: string;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

type SortField = 'createdAt' | 'totalPrice' | 'status';
type SortOrder = 'asc' | 'desc';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [searchId, setSearchId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [statusFilter, searchEmail, searchId]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = { limit: '100' };
      if (statusFilter) params.status = statusFilter;
      if (searchEmail) params.email = searchEmail;
      
      const response = await ordersApi.getAllAdmin(params);
      let loadedOrders = response.data.orders;

      // Filter by ID if provided
      if (searchId) {
        loadedOrders = loadedOrders.filter((o: Order) => 
          o.id.toLowerCase().includes(searchId.toLowerCase())
        );
      }

      // Sort orders
      loadedOrders.sort((a: Order, b: Order) => {
        let comparison = 0;
        if (sortField === 'createdAt') {
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        } else if (sortField === 'totalPrice') {
          comparison = a.totalPrice - b.totalPrice;
        } else if (sortField === 'status') {
          comparison = a.status.localeCompare(b.status);
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });

      setOrders(loadedOrders);
    } catch (error) {
      toast.error('Помилка завантаження замовлень');
    } finally {
      setLoading(false);
    }
  };

  const handleView = (order: Order) => {
    setSelectedOrder(order);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Ви впевнені, що хочете видалити це замовлення?')) return;

    try {
      await ordersApi.delete(id);
      toast.success('Замовлення видалено');
      loadOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Помилка при видаленні');
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedOrder(null);
    loadOrders();
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      NEW: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
      PROCESSING: 'bg-purple-500/10 text-purple-500 border-purple-500/30',
      SHIPPED: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
      DELIVERED: 'bg-green-500/10 text-green-500 border-green-500/30',
      CANCELLED: 'bg-red-500/10 text-red-500 border-red-500/30',
    };
    return colors[status] || 'bg-gray-500/10 text-gray-500 border-gray-500/30';
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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '↕';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-primary">Замовлення</h1>
            <p className="text-muted mt-1">Управління замовленнями клієнтів</p>
          </div>
          <button 
            onClick={loadOrders} 
            className="btn-secondary flex items-center gap-2"
            disabled={loading}
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            Оновити
          </button>
        </div>

        {/* Filters */}
        <div className="card p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search by Email */}
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

            {/* Search by ID */}
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

            {/* Status Filter */}
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
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:text-primary"
                    onClick={() => handleSort('createdAt')}
                  >
                    {getSortIcon('createdAt')} № замовлення
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Клієнт
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:text-primary"
                    onClick={() => handleSort('totalPrice')}
                  >
                    {getSortIcon('totalPrice')} Сума
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:text-primary"
                    onClick={() => handleSort('status')}
                  >
                    {getSortIcon('status')} Статус
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
                  <tr key={order.id} className="hover:bg-surfaceLight transition-colors">
                    <td className="px-6 py-4 font-mono text-sm text-primary">
                      {order.id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-primary">{order.name}</div>
                        <div className="text-sm text-muted">{order.email}</div>
                        <div className="text-sm text-muted">{order.phone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-primary">
                      {Number(order.totalPrice).toLocaleString('uk-UA')} ₴
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
                        minute: '2-digit'
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
      </div>

      {modalOpen && selectedOrder && (
        <OrderModal order={selectedOrder} onClose={handleModalClose} />
      )}
    </AdminLayout>
  );
}
