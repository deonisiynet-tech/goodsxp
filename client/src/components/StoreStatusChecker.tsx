'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';

/**
 * Глобальний компонент для перевірки статусу магазину
 * Працює на всіх сторінках крім /maintenance
 * Перевіряє статус кожні 5 секунд
 */
export default function StoreStatusChecker() {
  const router = useRouter();
  const pathname = usePathname();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // ✅ НЕ перевіряємо на сторінці maintenance
    if (pathname === '/maintenance') {
      return;
    }

    // ✅ НЕ перевіряємо на адмінських сторінках
    if (pathname?.startsWith('/admin')) {
      return;
    }

    // ✅ Функція перевірки статусу
    const checkStoreStatus = async () => {
      try {
        const response = await fetch('/api/admin/settings/storeEnabled', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          // ✅ NO CACHE - завжди актуальне значення
          cache: 'no-store',
        });

        if (response.ok) {
          const data = await response.json();
          const storeEnabled = data.value !== 'false';

          if (!storeEnabled) {
            console.log('[StoreStatus] Store is closed, redirecting to maintenance');
            // ✅ Перенаправлення на maintenance
            window.location.href = '/maintenance';
          }
        }
      } catch (error) {
        // ✅ У разі помилки - не блокуємо користувача
        console.error('[StoreStatus] Check failed:', error);
      }
    };

    // ✅ Перевіряємо одразу при завантаженні
    checkStoreStatus();

    // ✅ Перевіряємо кожні 5 секунд
    intervalRef.current = setInterval(checkStoreStatus, 5000);

    // ✅ Очищення при розмонтуванні
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [pathname]);

  return null; // Компонент нічого не рендерить
}
