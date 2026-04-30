'use client';

import { useState } from 'react';
import { X, ShieldCheck } from 'lucide-react';

interface TwoFAVerifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (token: string) => Promise<void>;
  title?: string;
  description?: string;
}

export default function TwoFAVerifyModal({
  isOpen,
  onClose,
  onVerify,
  title = 'Підтвердження дії',
  description = 'Введіть код з Google Authenticator для підтвердження',
}: TwoFAVerifyModalProps) {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (token.length !== 6) {
      setError('Код має містити 6 цифр');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onVerify(token);
      setToken('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Невірний код');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setToken('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-surfaceLight border border-border rounded-2xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/30">
              <ShieldCheck className="text-primary" size={20} />
            </div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-muted hover:text-white transition-colors"
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-slate-300 text-sm">{description}</p>

          <div>
            <input
              type="text"
              value={token}
              onChange={(e) => {
                setToken(e.target.value.replace(/\D/g, '').slice(0, 6));
                setError('');
              }}
              placeholder="000000"
              maxLength={6}
              autoFocus
              className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-white text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/50"
              disabled={loading}
            />
            {error && (
              <p className="text-red-400 text-sm mt-2 text-center">{error}</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 bg-surface border border-border rounded-xl text-white hover:bg-surface/80 transition-colors"
              disabled={loading}
            >
              Скасувати
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-primary hover:bg-primary/90 rounded-xl text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || token.length !== 6}
            >
              {loading ? 'Перевірка...' : 'Підтвердити'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
