'use client';

import { useEffect, useState } from 'react';
import { Bell, X, Download } from 'lucide-react';

/**
 * PWA Install Prompt + Push Notification Permission
 * Показує користувачу пропозицію встановити додаток та підписатися на сповіщення
 */
export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed
    const dismissedAt = localStorage.getItem('pwa_install_dismissed');
    if (dismissedAt) {
      const hoursSince = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60);
      if (hoursSince < 72) return; // Don't show again for 72 hours
    }

    // PWA Install
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show after 30 seconds
      setTimeout(() => setShowInstallPrompt(true), 30000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Notification permission — ask after 60 seconds if not already granted
    if ('Notification' in window && Notification.permission === 'default') {
      setTimeout(() => {
        if (!dismissed) setShowNotificationPrompt(true);
      }, 60000);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [dismissed]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    setShowNotificationPrompt(false);
    setDismissed(true);
    localStorage.setItem('pwa_install_dismissed', Date.now().toString());
  };

  const handleNotificationAllow = async () => {
    if (!('Notification' in window)) return;
    const permission = await Notification.requestPermission();
    setShowNotificationPrompt(false);
    if (permission === 'granted') {
      // Subscribe to push notifications (placeholder — needs server-side VAPID keys)
      console.log('Push notification permission granted');
    }
  };

  const handleNotificationDeny = () => {
    setShowNotificationPrompt(false);
  };

  if (!showInstallPrompt && !showNotificationPrompt) return null;

  return (
    <>
      {/* Install Prompt */}
      {showInstallPrompt && (
        <div className="fixed bottom-24 left-4 right-4 md:left-auto md:right-6 md:w-80 z-50 animate-slide-up">
          <div className="bg-[#18181c] border border-purple-500/20 rounded-2xl p-5 shadow-2xl shadow-purple-500/10">
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 text-[#9ca3af] hover:text-white"
            >
              <X size={16} />
            </button>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                <Download size={20} className="text-purple-400" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">Встановити GoodsXP</p>
                <p className="text-xs text-muted mt-1">
                  Додай на головний екран для швидкого доступу
                </p>
              </div>
            </div>
            <button
              onClick={handleInstall}
              className="btn-primary w-full text-sm py-3"
            >
              Встановити
            </button>
          </div>
        </div>
      )}

      {/* Notification Prompt */}
      {showNotificationPrompt && (
        <div className="fixed bottom-24 left-4 right-4 md:left-auto md:right-6 md:w-80 z-50 animate-slide-up">
          <div className="bg-[#18181c] border border-purple-500/20 rounded-2xl p-5 shadow-2xl shadow-purple-500/10">
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 text-[#9ca3af] hover:text-white"
            >
              <X size={16} />
            </button>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                <Bell size={20} className="text-purple-400" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">Сповіщення про акції</p>
                <p className="text-xs text-muted mt-1">
                  Дізнавайся про знижки та новинки першим
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleNotificationAllow}
                className="btn-primary flex-1 text-sm py-3"
              >
                Підписатися
              </button>
              <button
                onClick={handleNotificationDeny}
                className="btn-secondary flex-1 text-sm py-3"
              >
                Ні
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
