'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { adminApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Users, Search, UserPlus, Shield, User, RefreshCw } from 'lucide-react';

interface User {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  orders?: {
    id: string;
    totalPrice: number;
    createdAt: string;
  }[];
  _count?: {
    orders: number;
  };
}

type SortField = 'email' | 'role' | 'createdAt';
type SortOrder = 'asc' | 'desc';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  useEffect(() => {
    loadUsers();
  }, [search, roleFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = { limit: '100' };
      if (roleFilter) params.role = roleFilter;
      if (search) params.search = search;
      
      const response = await adminApi.getUsers(params);
      let loadedUsers = response.data.users;

      // Sort users
      loadedUsers.sort((a: User, b: User) => {
        let comparison = 0;
        if (sortField === 'email') {
          comparison = a.email.localeCompare(b.email);
        } else if (sortField === 'role') {
          comparison = a.role.localeCompare(b.role);
        } else if (sortField === 'createdAt') {
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });

      setUsers(loadedUsers);
    } catch (error) {
      toast.error('Помилка завантаження користувачів');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'USER' | 'ADMIN') => {
    if (!confirm(`Ви впевнені, що хочете змінити роль на ${newRole === 'ADMIN' ? 'ADMIN' : 'USER'}?`)) return;

    try {
      await adminApi.updateUserRole(userId, newRole);
      toast.success('Роль змінено');
      loadUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Помилка при зміні ролі');
    }
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
            <h1 className="text-3xl font-bold text-primary">Користувачі</h1>
            <p className="text-muted mt-1">Управління користувачами та правами доступу</p>
          </div>
          <button 
            onClick={loadUsers} 
            className="btn-secondary flex items-center gap-2"
            disabled={loading}
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            Оновити
          </button>
        </div>

        {/* Filters */}
        <div className="card p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={20} />
              <input
                type="text"
                placeholder="Пошук по email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-12"
              />
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="input-field max-w-xs"
            >
              <option value="">Всі ролі</option>
              <option value="USER">Користувач</option>
              <option value="ADMIN">Адміністратор</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="card p-12 flex justify-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surfaceLight">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Email
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:text-primary"
                    onClick={() => handleSort('role')}
                  >
                    {getSortIcon('role')} Роль
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:text-primary"
                    onClick={() => handleSort('createdAt')}
                  >
                    {getSortIcon('createdAt')} Дата реєстрації
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Замовлення
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                    Дії
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-surfaceLight transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-primary">{user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {user.role === 'ADMIN' ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30">
                            <Shield size={14} />
                            ADMIN
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                            <User size={14} />
                            USER
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted">
                      {new Date(user.createdAt).toLocaleDateString('uk-UA', {
                        day: 'numeric',
                        month: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="text-primary font-medium">
                        {user._count?.orders || 0}
                      </span>
                      <span className="text-muted"> зам.</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as 'USER' | 'ADMIN')}
                        className="input-field text-sm py-2 px-3 max-w-[140px]"
                      >
                        <option value="USER">USER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {users.length === 0 && (
              <div className="text-center py-20 text-muted">
                <Users size={48} className="mx-auto mb-4 opacity-50" />
                <p>Користувачі не знайдені</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
