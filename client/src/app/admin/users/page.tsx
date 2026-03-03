'use client';

import AdminLayout from '@/components/admin/AdminLayout';
import { Users, Search, UserPlus } from 'lucide-react';
import { useState } from 'react';

export default function UsersPage() {
  const [search, setSearch] = useState('');

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-primary">Користувачі</h1>
            <p className="text-muted mt-1">Управління користувачами та правами доступу</p>
          </div>
          <button className="btn-primary flex items-center gap-2">
            <UserPlus size={20} />
            Додати користувача
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={20} />
          <input
            type="text"
            placeholder="Пошук користувачів..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-12"
          />
        </div>

        {/* Content Placeholder */}
        <div className="card p-12 text-center">
          <Users size={64} className="mx-auto text-muted mb-4 opacity-50" />
          <h2 className="text-xl font-semibold text-primary mb-2">Список користувачів</h2>
          <p className="text-muted">
            Тут буде відображено список всіх користувачів з можливістю редагування ролей
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
