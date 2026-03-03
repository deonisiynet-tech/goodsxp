'use client';

import AdminLayout from '@/components/admin/AdminLayout';
import { ShoppingCart, Search, Filter } from 'lucide-react';
import { useState } from 'react';

export default function OrdersPage() {
  const [search, setSearch] = useState('');

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-primary">Замовлення</h1>
            <p className="text-muted mt-1">Управління замовленнями клієнтів</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={20} />
            <input
              type="text"
              placeholder="Пошук замовлень..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-12"
            />
          </div>
          <button className="btn-secondary flex items-center gap-2">
            <Filter size={20} />
            Фільтри
          </button>
        </div>

        {/* Content Placeholder */}
        <div className="card p-12 text-center">
          <ShoppingCart size={64} className="mx-auto text-muted mb-4 opacity-50" />
          <h2 className="text-xl font-semibold text-primary mb-2">Список замовлень</h2>
          <p className="text-muted">
            Тут буде відображено список всіх замовлень зі статусами та можливістю управління
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
