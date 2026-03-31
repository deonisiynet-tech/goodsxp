'use client';

import { useEffect, useRef } from 'react';

/**
 * Компонент для відстеження активності відвідувача
 * Відправляє heartbeat кожні 30 секунд
 */
export default function AnalyticsTracker() {
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);
  const visitorIdRef = useRef<string>('');

  useEffect(() => {
    // ✅ Отримуємо або створюємо visitor_id
    const getVisitorId = () => {
      let visitorId = localStorage.getItem('visitor_id');
      
      if (!visitorId) {
        visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem('visitor_id', visitorId);
      }
      
      return visitorId;
    };

    visitorIdRef.current = getVisitorId();

    // ✅ Функція відправки heartbeat
    const sendHeartbeat = async () => {
      try {
        await fetch('/api/analytics/heartbeat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            visitorId: visitorIdRef.current,
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
