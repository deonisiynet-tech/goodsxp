'use client';

import { useState } from 'react';

interface StoreDisableConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const CORRECT_CODE = '8118'; // Секретний код для підтвердження

export default function StoreDisableConfirmModal({
  isOpen,
  onClose,
  onConfirm,
}: StoreDisableConfirmModalProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (code === CORRECT_CODE) {
      setError('');
      onConfirm();
      setCode('');
    } else {
      setError('Неправильний код підтвердження');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-[#1f1f23] border border-red-500/30 rounded-2xl shadow-2xl shadow-red-500/20 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-red-500/20 bg-red-500/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">Підтвердження вимкнення</h3>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4">
            <p className="text-muted text-sm leading-relaxed">
              Ви впевнені, що хочете тимчасово вимкнути магазин?
            </p>
            
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
              <p className="text-sm text-yellow-400">
                ⚠️ Для підтвердження введіть код доступу
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-white">
                Код підтвердження
              </label>
              <input
                type="password"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError('');
                }}
                onKeyDown={handleKeyDown}
                placeholder="Введіть код..."
                className="w-full px-4 py-3 bg-[#18181c] border border-red-500/30 rounded-xl text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent transition-all"
                autoFocus
              />
              {error && (
                <p className="text-red-400 text-sm mt-2 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-red-500/20 bg-red-500/5 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-red-500/30 text-white font-medium hover:bg-red-500/10 transition-all duration-200"
            >
              Скасувати
            </button>
            <button
              onClick={handleSubmit}
              disabled={!code}
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Вимкнути магазин
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
