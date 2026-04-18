'use client';

import { useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

/**
 * Компонент для відстеження активності відвідувача
 * Відправляє heartbeat кожні 30 секунд
 *
 * Гібридна система ідентифікації:
 * 1. localStorage (основний) — UUID
 * 2. sessionStorage (fallback для incognito) — UUID
 * 3. fingerprint (fallback якщо storage недоступний) — hash
 */
export default function AnalyticsTracker() {
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);
  const visitorIdRef = useRef<string>('');

  useEffect(() => {
    /**
     * Генерує fingerprint браузера для fallback ідентифікації
     */
    const generateFingerprint = (): string => {
      const data = [
        navigator.userAgent,
        navigator.language,
        screen.width,
        screen.height,
        screen.colorDepth,
        new Date().getTimezoneOffset(),
      ].join('|');

      // Base64 hash для стабільного fingerprint
      return btoa(data).substring(0, 64);
    };

    /**
     * Отримує або створює visitor_id з гібридною системою
     * Пріоритет: localStorage → sessionStorage → fingerprint
     */
    const getVisitorId = (): string => {
      // Спроба 1: localStorage (основний спосіб)
      try {
        let visitorId = localStorage.getItem('visitor_id');
        if (visitorId) {
          return visitorId;
        }

        // Створюємо новий UUID
        visitorId = uuidv4();
        localStorage.setItem('visitor_id', visitorId);
        return visitorId;
      } catch (e) {
        console.warn('[Analytics] localStorage unavailable:', e);
      }

      // Спроба 2: sessionStorage (fallback для incognito)
      try {
        let visitorId = sessionStorage.getItem('visitor_id');
        if (visitorId) {
          return visitorId;
        }

        // Створюємо новий UUID для сесії
        visitorId = uuidv4();
        sessionStorage.setItem('visitor_id', visitorId);
        return visitorId;
      } catch (e) {
        console.warn('[Analytics] sessionStorage unavailable:', e);
      }

      // Спроба 3: fingerprint (останній fallback)
      return `fp_${generateFingerprint()}`;
    };

    visitorIdRef.current = getVisitorId();

    /**
     * Відправка heartbeat з fingerprint
     */
    const sendHeartbeat = async () => {
      try {
        const fingerprint = generateFingerprint();

        await fetch('/api/analytics/heartbeat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            visitorId: visitorIdRef.current,
            fingerprint,
            page: window.location.pathname,
            referrer: document.referrer,
          }),
        });
      } catch (error) {
        console.error('[Analytics] Heartbeat failed:', error);
      }
    };

    // ✅ Відправляємо перший heartbeat одразу
    sendHeartbeat();

    // ✅ Відправляємо heartbeat кожні 30 секунд
    heartbeatInterval.current = setInterval(sendHeartbeat, 30000);

    // ✅ Відправляємо offline при закритті вкладки
    const handleBeforeUnload = () => {
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
      
      // Відправляємо offline сигнал
      navigator.sendBeacon(
        '/api/analytics/offline',
        JSON.stringify({ visitorId: visitorIdRef.current })
      );
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return null; // Компонент нічого не рендерить
}
