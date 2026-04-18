'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import PromoCodeModal from '@/components/admin/PromoCodeModal';
import { getAdminApiFullPath } from '@/lib/admin-paths';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Search, RefreshCw } from 'lucide-react';

interface PromoCode {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  validityType: 'DAYS' | 'HOURS' | 'DATE_RANGE';
  duration?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  maxUsageCount?: number | null;
  currentUsage: number;
  isActive: boolean;
  createdAt: string;
  _count?: {
    orders: number;
  };
}

export default function PromoCodesPage() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPromoCode, setEditingPromoCode] = useState<PromoCode | null>(null);

  const loadPromoCodes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(
        getAdminApiFullPath(`/promo-codes?${params.toString()}`),
        { credentials: 'include' }
      );

      if (!response.ok) {
        throw new Error('Failed to load promo codes');
      }

      const data = await response.json();
      setPromoCodes(data.promoCodes || []);
    } catch (error) {
      console.error('Error loading promo codes:', error);
      toast.error('Помилка завантаження промокодів');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      loadPromoCodes();
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, statusFilter]);

  const handleCreate = () => {
    setEditingPromoCode(null);
    setModalOpen(true);
  };

  const handleEdit = (promoCode: PromoCode) => {
    setEditingPromoCode(promoCode);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Ви впевнені, що хочете видалити цей промокод?')) return;

    try {
      // Get CSRF token from cookies
      const csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrf_token='))
        ?.split('=')[1];

      const response = await fetch(getAdminApiFullPath(`/promo-codes/${id}`), {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'X-CSRF-Token': csrfToken || '',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete promo code');
      }

      toast.success('Промокод видалено');
      loadPromoCodes();
    } catch (error: any) {
      console.error('Error deleting promo code:', error);
      toast.error(error.message || 'Помилка при видаленні');
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingPromoCode(null);
    loadPromoCodes();
  };

  const getExpirationStatus = (promoCode: PromoCode) => {
    const now = new Date();

    if (promoCode.validityType === 'DAYS') {
      const expiryDate = new Date(promoCode.createdAt);
      expiryDate.setDate(expiryDate.getDate() + (promoCode.duration || 0));
      if (now > expiryDate) return { label: 'Прострочений', color: 'text-red-400' };
      return { label: 'Активний', color: 'text-green-400' };
    } else if (promoCode.validityType === 'HOURS') {
      const expiryDate = new Date(promoCode.createdAt);
      expiryDate.setHours(expiryDate.getHours() + (promoCode.duration || 0));
      if (now > expiryDate) return { label: 'Прострочений', color: 'text-red-400' };
      return { label: 'Активний', color: 'text-green-400' };
    } else if (promoCode.validityType === 'DATE_RANGE') {
      if (!promoCode.startDate || !promoCode.endDate) {
        return { label: 'Невірна конфігурація', color: 'text-red-400' };
      }
      if (now < new Date(promoCode.startDate)) {
        return { label: 'Очікується', color: 'text-yellow-400' };
      }
      if (now > new Date(promoCode.endDate)) {
        return { label: 'Прострочений', color: 'text-red-400' };
      }
      return { label: 'Активний', color: 'text-green-400' };
    }

    return { label: 'Невідомо', color: 'text-muted' };
  };

  const formatValidity = (promoCode: PromoCode) => {
    if (promoCode.validityType === 'DAYS') {
      return `${promoCode.duration} днів`;
    } else if (promoCode.validityType === 'HOURS') {
      return `${promoCode.duration} годин`;
    } else if (promoCode.validityType === 'DATE_RANGE') {
      const start = promoCode.startDate ? new Date(promoCode.startDate).toLocaleDateString('uk-UA') : '-';
      const end = promoCode.endDate ? new Date(promoCode.endDate).toLocaleDateString('uk-UA') : '-';
      return `${start} - ${end}`;
    }
    return '-';
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Промокоди</h1>
            <p className="text-muted mt-1">Управління промокодами та знижками</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={loadPromoCodes}
              className="btn-secondary flex items-center gap-2"
              disabled={loading}
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              Оновити
            </button>
            <button onClick={handleCreate} className="btn-primary flex items-center gap-2">
              <Plus size={20} />
              Створити промокод
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={20} />
              <input
                type="text"
                placeholder="Пошук по коду..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface border-b border-border">
                <tr>
                  <th className="text-left p-4 text-sm font-semibold text-white">Код</th>
                  <th className="text-left p-4 text-sm font-semibold text-white">Тип</th>
                  <th className="text-left p-4 text-sm font-semibold text-white">Знижка</th>
                  <th className="text-left p-4 text-sm font-semibold text-white">Дійсність</th>
                  <th className="text-left p-4 text-sm font-semibold text-white">Використання</th>
                  <th className="text-left p-4 text-sm font-semibold text-white">Статус</th>
                  <th className="text-right p-4 text-sm font-semibold text-white">Дії</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted">
                      Завантаження...
                    </td>
                  </tr>
                ) : promoCodes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted">
                      Промокодів не знайдено
                    </td>
                  </tr>
                ) : (
                  promoCodes.map((promoCode) => {
                    const expirationStatus = getExpirationStatus(promoCode);
                    return (
                      <tr key={promoCode.id} className="hover:bg-surfaceLight/50 transition-colors">
                        <td className="p-4">
                          <span className="font-mono font-bold text-white">{promoCode.code}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-muted">
                            {promoCode.type === 'PERCENTAGE' ? 'Відсоток' : 'Фіксована'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="font-semibold text-white">
                            {promoCode.type === 'PERCENTAGE'
                              ? `${promoCode.value}%`
                              : `${promoCode.value} ₴`}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-muted">{formatValidity(promoCode)}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-white">
                            {promoCode.currentUsage}
                            {promoCode.maxUsageCount ? ` / ${promoCode.maxUsageCount}` : ' / ∞'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-1">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                promoCode.isActive
                                  ? 'bg-green-500/10 text-green-400'
                                  : 'bg-red-500/10 text-red-400'
                              }`}
                            >
                              {promoCode.isActive ? 'Активний' : 'Неактивний'}
                            </span>
                            <span className={`text-xs ${expirationStatus.color}`}>
                              {expirationStatus.label}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(promoCode)}
                              className="p-2 text-primary hover:bg-surfaceLight rounded-lg transition-colors"
                              title="Редагувати"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(promoCode.id)}
                              className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Видалити"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modalOpen && <PromoCodeModal promoCode={editingPromoCode} onClose={handleModalClose} />}
    </AdminLayout>
  );
}
