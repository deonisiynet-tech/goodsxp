'use client';

import AdminLayout from '@/components/admin/AdminLayout';
import { Package, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function ProductsPage() {
  const [search, setSearch] = useState('');

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-primary">Товари</h1>
            <p className="text-muted mt-1">Управління асортиментом магазину</p>
          </div>
          <button className="btn-primary flex items-center gap-2">
            <Plus size={20} />
            Додати товар
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={20} />
          <input
            type="text"
            placeholder="Пошук товарів..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-12"
          />
        </div>

        {/* Content Placeholder */}
        <div className="card p-12 text-center">
          <Package size={64} className="mx-auto text-muted mb-4 opacity-50" />
          <h2 className="text-xl font-semibold text-primary mb-2">Список товарів</h2>
          <p className="text-muted">
            Тут буде відображено список всіх товарів з можливістю редагування та видалення
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
