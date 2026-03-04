'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { getUsers, updateUserRole, User as UserType } from '@/actions/users'
import toast from 'react-hot-toast'
import { Users, Search, Shield, UserIcon, RefreshCw } from 'lucide-react'

export default function UsersPage() {
  const [users, setUsers] = useState<UserType[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  const loadUsers = async () => {
    try {
      setLoading(true)
      const loadedUsers = await getUsers({
        role: roleFilter || undefined,
        search: search || undefined,
      })
      setUsers(loadedUsers)
    } catch (error) {
      toast.error('Помилка завантаження користувачів')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const debounce = setTimeout(() => {
      loadUsers()
    }, 300)
    return () => clearTimeout(debounce)
  }, [search, roleFilter])

  const handleRoleChange = async (userId: string, newRole: 'USER' | 'ADMIN') => {
    if (!confirm(`Ви впевнені, що хочете змінити роль на ${newRole === 'ADMIN' ? 'ADMIN' : 'USER'}?`))
      return

    const result = await updateUserRole(userId, newRole)
    if (result.success) {
      toast.success('Роль змінено')
      loadUsers()
    } else {
      toast.error(result.error || 'Помилка при зміні ролі')
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-primary">Користувачі</h1>
            <p className="text-muted mt-1">Управління користувачами та правами доступу</p>
          </div>
          <button onClick={loadUsers} className="btn-secondary flex items-center gap-2" disabled={loading}>
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            Оновити
          </button>
        </div>

        {/* Filters */}
        <div className="card p-4">
          <div className="flex flex-col md:flex-row gap-4">
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
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Роль</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                    Дата реєстрації
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Замовлення</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase">Дії</th>
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
                            <UserIcon size={14} />
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
                      <span className="text-primary font-medium">{user._count.orders}</span>
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
  )
}
