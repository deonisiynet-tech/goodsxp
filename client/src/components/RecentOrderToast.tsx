'use client';

import { useEffect, useState } from 'react';
import { Package } from 'lucide-react';

/**
 * Спливаюче повідомлення "Хтось щойно замовив" — соціальне доказательство
 * Показує фейкові (але реалістичні) повідомлення для створення відчуття активності
 */

const CITIES = [
  'Київ', 'Львів', 'Одеса', 'Харків', 'Дніпро', 'Запоріжжя',
  'Вінниця', 'Полтава', 'Черкаси', 'Житомир', 'Рівне', 'Івано-Франківськ',
  'Тернопіль', 'Чернівці', 'Луцьк', 'Ужгород', 'Хмельницький', 'Суми',
];

const PRODUCTS = [
  'Смарт-годинник', 'Бездротові навушники', 'Павербанк 20000mAh',
  'Bluetooth колонка', 'USB-C хаб', 'Бездротова зарядка',
  'Навушники TWS', 'Фітнес-браслет', 'Автомобільний тримач',
];

interface ToastData {
  id: number;
  city: string;
  product: string;
  timeAgo: string;
}

export default function RecentOrderToast() {
  const [toast, setToast] = useState<ToastData | null>(null);

  useEffect(() => {
    const showToast = () => {
      const city = CITIES[Math.floor(Math.random() * CITIES.length)];
      const product = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
      const minutes = Math.floor(Math.random() * 15) + 1;
      setToast({
        id: Date.now(),
        city,
        product,
        timeAgo: `${minutes} хв тому`,
      });

      // Hide after 5 seconds
      setTimeout(() => setToast(null), 5000);
    };

    // First toast after 8-15 seconds
    const firstTimeout = setTimeout(showToast, Math.random() * 7000 + 8000);

    // Then repeat every 25-45 seconds
    const interval = setInterval(showToast, Math.random() * 20000 + 25000);

    return () => {
      clearTimeout(firstTimeout);
      clearInterval(interval);
    };
  }, []);

  if (!toast) return null;

  return (
    <div
      className="fixed bottom-6 left-6 z-50 animate-slide-up"
      style={{
        animation: 'slideUp 0.4s ease-out',
      }}
    >
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#18181c]/95 backdrop-blur-md border border-purple-500/20 shadow-2xl shadow-purple-500/10 max-w-xs">
        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
          <Package size={20} className="text-purple-400" />
        </div>
        <div>
          <p className="text-white text-sm font-medium">
            Хтось з {toast.city} щойно замовив
          </p>
          <p className="text-[#9ca3af] text-xs">{toast.product} · {toast.timeAgo}</p>
        </div>
      </div>
    </div>
  );
}
