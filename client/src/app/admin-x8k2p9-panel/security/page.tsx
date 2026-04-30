'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import TwoFAVerifyModal from '@/components/admin/TwoFAVerifyModal';
import toast from 'react-hot-toast';
import {
  Shield,
  Smartphone,
  MapPin,
  Clock,
  Trash2,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import { getAdminApiFullPath } from '@/lib/admin-paths';

interface Session {
  id: string;
  device: string | null;
  ipAddress: string | null;
  location: string | null;
  lastActive: string;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

export default function SecurityPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: 'delete' | 'deleteAll';
    sessionId?: string;
  } | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const response = await fetch(getAdminApiFullPath('/sessions'), {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Помилка завантаження сесій');
      }

      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (error: any) {
      console.error('Error loading sessions:', error);
      toast.error(error.message || 'Помилка завантаження сесій');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = (sessionId: string) => {
    setPendingAction({ type: 'delete', sessionId });
    setShowVerifyModal(true);
  };

  const handleDeleteAllSessions = () => {
    setPendingAction({ type: 'deleteAll' });
    setShowVerifyModal(true);
  };

  const executeAction = async (twoFAToken: string) => {
    if (!pendingAction) return;

    const csrfToken = document.cookie
      .split('; ')
      .find((row) => row.startsWith('csrf_token='))
      ?.split('=')[1];

    try {
      if (pendingAction.type === 'delete' && pendingAction.sessionId) {
        setActionLoading(pendingAction.sessionId);

        const response = await fetch(
          getAdminApiFullPath(`/sessions/${pendingAction.sessionId}`),
          {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-Token': csrfToken || '',
            },
            body: JSON.stringify({ twoFAToken }),
            credentials: 'include',
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Помилка видалення сесії');
        }

        setSessions((prev) =>
          prev.filter((s) => s.id !== pendingAction.sessionId)
        );
        toast.success('Сесію видалено');
      } else if (pendingAction.type === 'deleteAll') {
        setActionLoading('all');

        const response = await fetch(getAdminApiFullPath('/sessions'), {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken || '',
          },
          body: JSON.stringify({ twoFAToken }),
          credentials: 'include',
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Помилка видалення сесій');
        }

        const data = await response.json();
        setSessions((prev) => prev.filter((s) => s.isCurrent));
        toast.success(data.message || 'Сесії видалено');
      }
    } catch (error: any) {
      console.error('Action error:', error);
      throw error;
    } finally {
      setActionLoading(null);
      setPendingAction(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'щойно';
    if (diffMins < 60) return `${diffMins} хв тому`;
    if (diffHours < 24) return `${diffHours} год тому`;
    if (diffDays < 7) return `${diffDays} дн тому`;

    return date.toLocaleDateString('uk-UA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  const otherSessions = sessions.filter((s) => !s.isCurrent);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Безпека</h1>
            <p className="text-muted mt-1">Управління активними сесіями</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={loadSessions}
              className="btn-secondary flex items-center gap-2"
              disabled={loading}
            >
              <RefreshCw size={20} />
              Оновити
            </button>
            {otherSessions.length > 0 && (
              <button
                onClick={handleDeleteAllSessions}
                className="btn-danger flex items-center gap-2"
                disabled={actionLoading === 'all'}
              >
                <LogOut size={20} />
                {actionLoading === 'all'
                  ? 'Видалення...'
                  : 'Вийти з усіх пристроїв'}
              </button>
            )}
          </div>
        </div>

        {/* Current Session */}
        <div className="card p-6 border-2 border-primary/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/30">
              <Shield className="text-primary" size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-white text-lg">
                Поточна сесія
              </h3>
              <p className="text-sm text-muted">Це ваш поточний пристрій</p>
            </div>
          </div>

          {sessions
            .filter((s) => s.isCurrent)
            .map((session) => (
              <div
                key={session.id}
                className="bg-surface rounded-xl p-4 border border-primary/20"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-2">
                      <Smartphone size={18} className="text-primary" />
                      <span className="text-white font-medium">
                        {session.device || 'Unknown Device'}
                      </span>
                      <span className="px-2 py-0.5 bg-primary/20 border border-primary/30 rounded-full text-primary text-xs font-medium">
                        Це ви
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-muted">
                      {session.ipAddress && (
                        <div className="flex items-center gap-2">
                          <MapPin size={16} />
                          <span>{session.ipAddress}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Clock size={16} />
                        <span>
                          Остання активність: {formatDate(session.lastActive)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>

        {/* Other Sessions */}
        {otherSessions.length > 0 ? (
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                <Smartphone className="text-yellow-400" size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-white text-lg">
                  Інші пристрої
                </h3>
                <p className="text-sm text-muted">
                  {otherSessions.length}{' '}
                  {otherSessions.length === 1
                    ? 'активна сесія'
                    : 'активних сесій'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {otherSessions.map((session) => (
                <div
                  key={session.id}
                  className="bg-surface rounded-xl p-4 border border-border hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-2">
                        <Smartphone size={18} className="text-slate-400" />
                        <span className="text-white font-medium">
                          {session.device || 'Unknown Device'}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-muted">
                        {session.ipAddress && (
                          <div className="flex items-center gap-2">
                            <MapPin size={16} />
                            <span>{session.ipAddress}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Clock size={16} />
                          <span>
                            Остання активність:{' '}
                            {formatDate(session.lastActive)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteSession(session.id)}
                      disabled={actionLoading === session.id}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                      title="Вийти з пристрою"
                    >
                      {actionLoading === session.id ? (
                        <RefreshCw size={20} className="animate-spin" />
                      ) : (
                        <Trash2 size={20} />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="card p-8 text-center">
            <div className="inline-flex p-4 rounded-full bg-green-500/10 border border-green-500/30 mb-4">
              <Shield className="text-green-400" size={32} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Немає інших активних сесій
            </h3>
            <p className="text-muted">
              Ви увійшли тільки на цьому пристрої
            </p>
          </div>
        )}

        {/* 2FA Verify Modal */}
        <TwoFAVerifyModal
          isOpen={showVerifyModal}
          onClose={() => {
            setShowVerifyModal(false);
            setPendingAction(null);
          }}
          onVerify={executeAction}
          title="Підтвердження дії"
          description="Введіть код з Google Authenticator для підтвердження"
        />
      </div>
    </AdminLayout>
  );
}
