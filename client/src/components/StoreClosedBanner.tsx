'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Clock, RefreshCw } from 'lucide-react';

export default function StoreClosedBanner() {
  const [isClosed, setIsClosed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkStoreStatus();
    // Перевіряємо статус кожні 30 секунд
    const interval = setInterval(checkStoreStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkStoreStatus = async () => {
    try {
      const response = await fetch('/api/admin/settings/storeEnabled', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        // Магазин закритий, якщо storeEnabled = 'false'
        setIsClosed(data.value === 'false');
      }
    } catch (error) {
      console.error('Error checking store status:', error);
      // У разі помилки - не блокуємо доступ
      setIsClosed(false);
    } finally {
      setLoading(false);
    }
  };

  // Під час завантаження не показуємо нічого
  if (loading) return null;
  
  // Якщо магазин відкритий - не показуємо банер
  if (!isClosed) return null;

  // Якщо магазин закритий - показуємо повноекранне повідомлення
  return (
    <div className="fixed inset-0 z-[9999] min-h-screen bg-[#0a0a0c] flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-[128px]" />
      </div>

      {/* Main Card */}
      <div className="relative z-10 max-w-lg w-full">
        <div className="bg-[#1f1f23] border border-yellow-500/30 rounded-3xl shadow-2xl shadow-yellow-500/10 overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-yellow-500/20 px-8 py-6 border-b border-yellow-500/20">
            <div className="flex items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center animate-pulse">
                <AlertTriangle className="text-yellow-400" size={32} />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-8 py-10 text-center space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                Магазин тимчасово недоступний
              </h1>
              <p className="text-muted text-lg leading-relaxed">
                Через технічні причини
              </p>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-center gap-3 text-yellow-400">
                <Clock size={20} />
                <span className="font-medium">Ми вже працюємо над вирішенням</span>
              </div>
              <p className="text-sm text-muted">
                Будь ласка, спробуйте пізніше або зв'яжіться з нами за контактами, вказаними внизу сторінки.
              </p>
            </div>

            {/* Refresh button */}
            <button
              onClick={checkStoreStatus}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400 font-medium hover:bg-purple-500/30 transition-all duration-200"
            >
              <RefreshCw size={18} />
              Перевірити доступність
            </button>
          </div>

          {/* Footer */}
          <div className="px-8 py-6 border-t border-yellow-500/20 bg-yellow-500/5">
            <p className="text-sm text-muted text-center">
              GoodsXP — повернеться найближчим часом
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
