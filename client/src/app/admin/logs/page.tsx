'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { adminApi } from '@/lib/api';
import { FileText, RefreshCw, Shield, Package, ShoppingCart, Settings, User, LogIn, LogOut, Trash2, Edit, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

interface AdminLog {
  id: string;
  adminId: string;
  admin?: {
    email: string;
  };
  action: string;
  entity: string | null;
  entityId: string | null;
  details: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

interface LogsResponse {
  logs: AdminLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const actionIcons: Record<string, any> = {
  CREATE: Plus,
  UPDATE: Edit,
  DELETE: Trash2,
  LOGIN: LogIn,
  LOGOUT: LogOut,
  PASSWORD_RESET: Shield,
  SETTINGS_UPDATE: Settings,
};

const entityIcons: Record<string, any> = {
  Product: Package,
  Order: ShoppingCart,
  User: User,
  SiteSettings: Settings,
};

const actionColors: Record<string, string> = {
  CREATE: 'bg-green-500/10 text-green-400 border-green-500/30',
  UPDATE: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  DELETE: 'bg-red-500/10 text-red-400 border-red-500/30',
  LOGIN: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  LOGOUT: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
  PASSWORD_RESET: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  SETTINGS_UPDATE: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
};

const actionLabels: Record<string, string> = {
  CREATE: 'Створення',
  UPDATE: 'Оновлення',
  DELETE: 'Видалення',
  LOGIN: 'Вхід',
  LOGOUT: 'Вихід',
  PASSWORD_RESET: 'Скидання пароля',
  SETTINGS_UPDATE: 'Налаштування',
};

export default function LogsPage() {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<{ page: number; limit: number; total: number; totalPages: number } | null>(null);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getLogs({
        page,
        limit: 50,
        action: actionFilter || undefined,
      });
      setLogs(response.logs || []);
      setPagination(response.pagination);
    } catch (error: any) {
      console.error('Error loading logs:', error);
      toast.error('Помилка завантаження логів: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      loadLogs();
    }, 300);
    return () => clearTimeout(debounce);
  }, [actionFilter, page]);

  // Auto-refresh logs every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        loadLogs();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [loading]);

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

  // Get action icon
  const getActionIcon = (action: string) => {
    const baseAction = action.split('_')[0] as keyof typeof actionIcons;
    return actionIcons[baseAction] || FileText;
  };

  // Get entity icon
  const getEntityIcon = (entity: string | null) => {
    if (!entity) return FileText;
    return entityIcons[entity] || FileText;
  };

  // Get action color
  const getActionColor = (action: string) => {
    const baseAction = action.split('_')[0] as keyof typeof actionColors;
    return actionColors[baseAction] || 'bg-gray-500/10 text-gray-400 border-gray-500/30';
  };

  // Get action label
  const getActionLabel = (action: string) => {
    const baseAction = action.split('_')[0] as keyof typeof actionLabels;
    return actionLabels[baseAction] || action;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-primary">Логи</h1>
            <p className="text-muted mt-1">Журнал дій адміністраторів</p>
          </div>
          <button onClick={loadLogs} className="btn-secondary flex items-center gap-2" disabled={loading}>
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            Оновити
          </button>
        </div>

        {/* Filters */}
        <div className="card p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="input-field max-w-xs"
            >
              <option value="">Всі дії</option>
              <option value="CREATE">Створення</option>
              <option value="UPDATE">Оновлення</option>
              <option value="DELETE">Видалення</option>
              <option value="LOGIN">Вхід</option>
              <option value="LOGOUT">Вихід</option>
              <option value="PASSWORD_RESET">Скидання пароля</option>
              <option value="SETTINGS_UPDATE">Налаштування</option>
            </select>
          </div>
        </div>

        {/* Logs Table */}
        {loading ? (
          <div className="card p-12 flex justify-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="card p-12 text-center text-muted">
            <FileText size={64} className="mx-auto mb-4 opacity-50" />
            <h2 className="text-xl font-semibold text-primary mb-2">Логів ще немає</h2>
            <p>Дії адміністраторів будуть відображені тут</p>
          </div>
        ) : (
          <>
            <div className="card overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surfaceLight">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-muted">
                      Дата
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-muted">
                      Адмін
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-muted">
                      Дія
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-muted">
                      Сутність
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-muted">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-muted">
                      Деталі
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {logs.map((log) => {
                    const ActionIcon = getActionIcon(log.action);
                    const EntityIcon = getEntityIcon(log.entity);
                    const actionColor = getActionColor(log.action);
                    const actionLabel = getActionLabel(log.action);

                    return (
                      <tr key={log.id} className="hover:bg-surfaceLight transition-colors">
                        <td className="px-6 py-4 text-sm text-muted font-mono">
                          {formatDate(log.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Shield size={16} className="text-muted" />
                            <span className="text-primary">
                              {log.admin?.email || log.adminId.slice(0, 8)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-full border ${actionColor}`}>
                            <ActionIcon size={12} />
                            {actionLabel}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <EntityIcon size={16} className="text-muted" />
                            <span className="text-primary">{log.entity || '-'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-sm text-muted">
                          {log.entityId ? `${log.entityId.slice(0, 8)}...` : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted max-w-xs truncate">
                          {log.details || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Попередня
                </button>
                <span className="text-muted px-4">
                  Сторінка {page} з {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                  disabled={page === pagination.totalPages}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Наступна
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
